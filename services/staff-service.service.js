const { Op } = require("sequelize");
const { error } = require("../libs");
const { staffServiceRepository, staffRepository, serviceRepository } = require("../repository");
const { assertStaffActive } = require("../utils/staff-status.util");

exports.bulkCreate = async (payload) => {
  return await staffServiceRepository.handleManagedTransaction(async (transaction) => {
    const { body } = payload;

    const serviceUUIDs = [...new Set(body.staff_services.map((i) => i.service_uuid))];
    const staffUUIDs = [...new Set(body.staff_services.map((i) => i.staff_uuid))];

    const services = await serviceRepository.findAll({
      criteria: { uuid: serviceUUIDs },
      attributes: ["id", "uuid"],
      transaction,
    });

    const staff = await staffRepository.findAll({
      criteria: { uuid: staffUUIDs },
      attributes: ["id", "uuid", "end_date"],
      transaction,
    });

    for (const s of staff) {
      assertStaffActive(s, error);
    }

    const serviceMap = new Map(services.map((s) => [s.uuid, s.id]));
    const staffMap = new Map(staff.map((s) => [s.uuid, s.id]));

    const finalData = [];
    
    body.staff_services.forEach((item) => {
      const service_id = serviceMap.get(item.service_uuid);
      const staff_id = staffMap.get(item.staff_uuid);

      if (!service_id || !staff_id) {
        throw new Error(`Invalid service_uuid or staff_uuid in payload`);
      }

      finalData.push({
        service_id,
        staff_id,
        duration: item.duration,
        price_type: item.price_type,
        price: item.price,
        deleted_at: null,
      });
    });

    const staffServices = await staffServiceRepository.createBulk(finalData, {
      conflictAttributes: ["service_id", "staff_id"],
      updateOnDuplicate: ["duration", "price_type", "price", "deleted_at"],
      transaction,
    });

    return {
      staff_services: staffServices,
    };
  });
};

exports.bulkUnassignStaffService = async (payload) => {
  const { body } = payload;
  const { staff_services, cascade } = body;

  if (!Array.isArray(staff_services) || staff_services.length === 0) {
    throw new error.BadRequest("staff_services must be a non-empty array of UUIDs");
  }

  const existing = await staffServiceRepository.findAll({
    criteria: { uuid: staff_services },
    attributes: ["id", "service_id", "staff_id"],
  });

  if (existing.length !== staff_services.length) {
    throw new error.NotFound("One or more staff_service UUIDs not found");
  }

  let idsToDelete = existing.map(e => e.id);

  if (cascade) {
    const parentServiceIds = [...new Set(existing.map(e => e.service_id))];

    const subServices = await serviceRepository.findAll({
      criteria: { parent_id: parentServiceIds },
      attributes: ["id"],
    });

    if (subServices.length > 0) {
      const subServiceIds = subServices.map(s => s.id);
      const staffIds = [...new Set(existing.map(e => e.staff_id))];

      const childStaffServices = await staffServiceRepository.findAll({
        criteria: { service_id: subServiceIds, staff_id: staffIds },
        attributes: ["id"],
      });

      idsToDelete = [...new Set([...idsToDelete, ...childStaffServices.map(c => c.id)])];
    }
  }

  await staffServiceRepository.softDelete({ id: idsToDelete });

  const servicesOfDeleted = await serviceRepository.findAll({
    criteria: { id: existing.map(e => e.service_id) },
    attributes: ["id", "parent_id"],
  });

  const parentChildMap = new Map();
  for (const s of servicesOfDeleted) {
    if (s.parent_id) {
      if (!parentChildMap.has(s.parent_id)) {
        parentChildMap.set(s.parent_id, []);
      }
      parentChildMap.get(s.parent_id).push(s.id);
    }
  }

  if (parentChildMap.size > 0) {
    const parentIds = Array.from(parentChildMap.keys());
    const staffIds = [...new Set(existing.map(e => e.staff_id))];

    const allSiblings = await serviceRepository.findAll({
      criteria: { parent_id: parentIds },
      attributes: ["id", "parent_id"],
    });

    const parentToAllSubIds = new Map();
    for (const sib of allSiblings) {
      if (!parentToAllSubIds.has(sib.parent_id)) {
        parentToAllSubIds.set(sib.parent_id, []);
      }
      parentToAllSubIds.get(sib.parent_id).push(sib.id);
    }

    const remainingStaffServices = await staffServiceRepository.findAll({
      criteria: {
        service_id: allSiblings.map(s => s.id),
        staff_id: staffIds,
      },
      attributes: ["id", "service_id", "staff_id"],
    });

    const parentStaffToDelete = [];
    for (const parentId of parentIds) {
      const subIds = new Set(parentToAllSubIds.get(parentId) || []);
      for (const staffId of staffIds) {
        const hasActiveSub = remainingStaffServices.some(
          rss => rss.staff_id === staffId && subIds.has(rss.service_id)
        );
        if (!hasActiveSub) {
          parentStaffToDelete.push({ service_id: parentId, staff_id: staffId });
        }
      }
    }

    if (parentStaffToDelete.length > 0) {
      const parentStaffRecords = await staffServiceRepository.findAll({
        criteria: {
          [Op.or]: parentStaffToDelete,
        },
        attributes: ["id"],
      });

      if (parentStaffRecords.length > 0) {
        await staffServiceRepository.softDelete({ id: parentStaffRecords.map(p => p.id) });
      }
    }
  }

  return { message: "Staff unassigned from services successfully" };
};
