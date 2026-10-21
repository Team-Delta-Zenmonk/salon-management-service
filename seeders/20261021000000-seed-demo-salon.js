"use strict";

const crypto = require("crypto");
const bcrypt = require("bcrypt");

module.exports = {
  async up(queryInterface, Sequelize) {
    const salonSlug = "aura-luxury-salon";
    const salonEmail = "aura.salon@example.com";

    const existingSalon = await queryInterface.rawSelect(
      "salons",
      {
        where: { slug: salonSlug },
      },
      ["id"]
    );

    if (existingSalon) {
      console.log(`Salon "${salonSlug}" already exists. Skipping seed.`);
      return;
    }

    const passwordHash = await bcrypt.hash("Password@123", 10);
    const now = new Date();
    const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    const businessHours = {
      monday: { start_time: "09:00", end_time: "21:00" },
      tuesday: { start_time: "09:00", end_time: "21:00" },
      wednesday: { start_time: "09:00", end_time: "21:00" },
      thursday: { start_time: "09:00", end_time: "21:00" },
      friday: { start_time: "09:00", end_time: "21:00" },
      saturday: { start_time: "09:00", end_time: "21:00" },
      sunday: { start_time: "10:00", end_time: "20:00" },
    };

    const allowedPaymentPolicies = ["pay_at_venue", "full_upfront"];

    await queryInterface.bulkInsert("salons", [
      {
        uuid: crypto.randomUUID(),
        name: "Aura Luxury",
        email: salonEmail,
        password: passwordHash,
        phone: "+919876543210",
        address: "Plot 42, Sector 18, Cyber Hub Road",
        owner_name: "Aarav Mehta",
        type: "unisex",
        about: "A sanctuary for bespoke haircare, revitalizing skin rituals, and luxury styling.",
        is_onboarded: true,
        is_active: true,
        slug: salonSlug,
        storefront_theme_id: 1,
        registered_by: "self",
        subscription_plan: "yearly",
        subscription_status: "active",
        subscription_expires_at: oneYearLater,
        trial_ends_at: null,
        business_hours: JSON.stringify(businessHours),
        allowed_payment_policies: JSON.stringify(allowedPaymentPolicies),
        created_at: now,
        updated_at: now,
      },
    ]);

    const salonId = await queryInterface.rawSelect(
      "salons",
      {
        where: { slug: salonSlug },
      },
      ["id"]
    );

    const categoriesData = [
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        name: "Hair Artistry & Styling",
        description: "Precision haircuts, artisanal blowouts, and signature styling.",
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        name: "Color & Highlights",
        description: "Dimensional balayage, gloss treatments, and bespoke color transformations.",
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        name: "Skin & Facial Rituals",
        description: "Hydrating facials, deep cleansing dermabrasion, and anti-aging therapies.",
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        name: "Nail Lounge & Spa",
        description: "Luxury manicures, restorative pedicures, and nail art enhancements.",
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        name: "Massage & Wellness",
        description: "Therapeutic deep pressure, Swedish relaxation, and herbal body rituals.",
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert("categories", categoriesData);

    const categories = await queryInterface.sequelize.query(
      `SELECT id, name FROM "categories" WHERE salon_id = ${salonId} ORDER BY id ASC;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const catMap = {};
    categories.forEach((c) => {
      catMap[c.name] = c.id;
    });

    const servicesData = [
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: catMap["Hair Artistry & Styling"],
        name: "Signature Botanical Hair Spa & Blowout",
        description: "Nourishing botanical hair spa with relaxing scalp massage and sleek blowdry finish.",
        price: 1499,
        duration: 60,
        gender: "unisex",
        price_type: "fixed",
        is_active: true,
        is_popular: true,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: catMap["Color & Highlights"],
        name: "Golden Honey Balayage & Gloss",
        description: "Hand-painted sun-kissed dimensional balayage finished with an illuminating shine glaze.",
        price: 4999,
        duration: 150,
        gender: "female",
        price_type: "fixed",
        is_active: true,
        is_popular: true,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: catMap["Skin & Facial Rituals"],
        name: "Cellular Glow Hydra-Facial",
        description: "Multi-step medical-grade hydra-dermabrasion extraction with deep antioxidant infusion.",
        price: 2899,
        duration: 60,
        gender: "unisex",
        price_type: "fixed",
        is_active: true,
        is_popular: true,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: catMap["Nail Lounge & Spa"],
        name: "Royal Rose & Warm Milk Pedicure",
        description: "Petal-infused warm milk soak followed by gentle exfoliation, mask, and reflex massage.",
        price: 1199,
        duration: 45,
        gender: "unisex",
        price_type: "fixed",
        is_active: true,
        is_popular: false,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: catMap["Massage & Wellness"],
        name: "Aromatherapy Deep Tissue Therapy",
        description: "Therapeutic deep pressure therapy infused with organic lavender and eucalyptus oils.",
        price: 2499,
        duration: 60,
        gender: "unisex",
        price_type: "fixed",
        is_active: true,
        is_popular: true,
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert("services", servicesData);

    const services = await queryInterface.sequelize.query(
      `SELECT id, name, price, duration, price_type FROM "services" WHERE salon_id = ${salonId} ORDER BY id ASC;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const servMap = {};
    services.forEach((s) => {
      servMap[s.name] = s;
    });

    const staffSchedule = {
      monday: { start_time: "09:00", end_time: "20:00" },
      tuesday: { start_time: "09:00", end_time: "20:00" },
      wednesday: { start_time: "09:00", end_time: "20:00" },
      thursday: { start_time: "09:00", end_time: "20:00" },
      friday: { start_time: "09:00", end_time: "20:00" },
      saturday: { start_time: "09:00", end_time: "20:00" },
      sunday: { start_time: "10:00", end_time: "18:00" },
    };

    const staffData = [
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        first_name: "Aarav",
        last_name: "Mehta",
        email: "aarav.stylist@example.com",
        phone_number: "+919876510001",
        dob: "12-05-1992",
        title: "Creative Director & Hair Stylist",
        joining_date: "01-01-2023",
        address: "Sector 14, Gurugram, Haryana",
        gender: "male",
        emergency_contact: JSON.stringify({ name: "Kavita Mehta", phone: "+919876500001", relation: "Spouse" }),
        active_hours: JSON.stringify(staffSchedule),
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        first_name: "Priya",
        last_name: "Sharma",
        email: "priya.skin@example.com",
        phone_number: "+919876510002",
        dob: "18-09-1995",
        title: "Senior Esthetician & Skin Specialist",
        joining_date: "15-03-2023",
        address: "DLF Phase 2, Gurugram, Haryana",
        gender: "female",
        emergency_contact: JSON.stringify({ name: "Ramesh Sharma", phone: "+919876500002", relation: "Father" }),
        active_hours: JSON.stringify(staffSchedule),
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        first_name: "Rohan",
        last_name: "Verma",
        email: "rohan.color@example.com",
        phone_number: "+919876510003",
        dob: "22-11-1993",
        title: "Master Colorist",
        joining_date: "01-06-2023",
        address: "Sushant Lok 1, Gurugram, Haryana",
        gender: "male",
        emergency_contact: JSON.stringify({ name: "Neha Verma", phone: "+919876500003", relation: "Sister" }),
        active_hours: JSON.stringify(staffSchedule),
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        first_name: "Ananya",
        last_name: "Iyer",
        email: "ananya.wellness@example.com",
        phone_number: "+919876510004",
        dob: "08-03-1996",
        title: "Wellness & Nail Therapist",
        joining_date: "10-08-2023",
        address: "Golf Course Road, Gurugram, Haryana",
        gender: "female",
        emergency_contact: JSON.stringify({ name: "Suresh Iyer", phone: "+919876500004", relation: "Brother" }),
        active_hours: JSON.stringify(staffSchedule),
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert("staffs", staffData);

    const staffMembers = await queryInterface.sequelize.query(
      `SELECT id, first_name FROM "staffs" WHERE salon_id = ${salonId} ORDER BY id ASC;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const staffMap = {};
    staffMembers.forEach((st) => {
      staffMap[st.first_name] = st.id;
    });

    const staffServicesData = [
      {
        uuid: crypto.randomUUID(),
        staff_id: staffMap["Aarav"],
        service_id: servMap["Signature Botanical Hair Spa & Blowout"].id,
        duration: servMap["Signature Botanical Hair Spa & Blowout"].duration,
        price_type: servMap["Signature Botanical Hair Spa & Blowout"].price_type,
        price: servMap["Signature Botanical Hair Spa & Blowout"].price,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        staff_id: staffMap["Rohan"],
        service_id: servMap["Golden Honey Balayage & Gloss"].id,
        duration: servMap["Golden Honey Balayage & Gloss"].duration,
        price_type: servMap["Golden Honey Balayage & Gloss"].price_type,
        price: servMap["Golden Honey Balayage & Gloss"].price,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        staff_id: staffMap["Priya"],
        service_id: servMap["Cellular Glow Hydra-Facial"].id,
        duration: servMap["Cellular Glow Hydra-Facial"].duration,
        price_type: servMap["Cellular Glow Hydra-Facial"].price_type,
        price: servMap["Cellular Glow Hydra-Facial"].price,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        staff_id: staffMap["Ananya"],
        service_id: servMap["Royal Rose & Warm Milk Pedicure"].id,
        duration: servMap["Royal Rose & Warm Milk Pedicure"].duration,
        price_type: servMap["Royal Rose & Warm Milk Pedicure"].price_type,
        price: servMap["Royal Rose & Warm Milk Pedicure"].price,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        staff_id: staffMap["Ananya"],
        service_id: servMap["Aromatherapy Deep Tissue Therapy"].id,
        duration: servMap["Aromatherapy Deep Tissue Therapy"].duration,
        price_type: servMap["Aromatherapy Deep Tissue Therapy"].price_type,
        price: servMap["Aromatherapy Deep Tissue Therapy"].price,
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert("staff_services", staffServicesData);

    const itemCategoriesData = [
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        name: "Haircare & Treatments",
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        name: "Professional Colors & Lighteners",
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        name: "Skincare & Facial Formulations",
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        name: "Salon Essentials & Disposables",
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert("items_category", itemCategoriesData);

    const itemCategories = await queryInterface.sequelize.query(
      `SELECT id, name FROM "items_category" WHERE salon_id = ${salonId} ORDER BY id ASC;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const itemCatMap = {};
    itemCategories.forEach((ic) => {
      itemCatMap[ic.name] = ic.id;
    });

    const inventoryItemsData = [
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: itemCatMap["Haircare & Treatments"],
        item_type: "product",
        name: "Olaplex No. 4 Bond Maintenance Shampoo",
        brand: "Olaplex",
        variant_name: "Original 250ml",
        unit: "250ml",
        unit_price: 2850.0,
        current_stock: 24,
        min_stock_level: 5,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: itemCatMap["Haircare & Treatments"],
        item_type: "product",
        name: "Moroccanoil Treatment Original",
        brand: "Moroccanoil",
        variant_name: "Argan Oil 100ml",
        unit: "100ml",
        unit_price: 3150.0,
        current_stock: 18,
        min_stock_level: 4,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: itemCatMap["Professional Colors & Lighteners"],
        item_type: "product",
        name: "Majirel Cool Inforced 6.1 Ash Brown",
        brand: "L'Oreal Professionnel",
        variant_name: "Shade 6.1",
        unit: "50g",
        unit_price: 450.0,
        current_stock: 40,
        min_stock_level: 10,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: itemCatMap["Professional Colors & Lighteners"],
        item_type: "product",
        name: "Blondme Premium Lightener 9+ Dust-Free",
        brand: "Schwarzkopf",
        variant_name: "9+ Lift 450g",
        unit: "450g",
        unit_price: 2400.0,
        current_stock: 12,
        min_stock_level: 3,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: itemCatMap["Skincare & Facial Formulations"],
        item_type: "product",
        name: "Daily Microfoliant Gentle Rice Exfoliator",
        brand: "Dermalogica",
        variant_name: "Powder 74g",
        unit: "74g",
        unit_price: 4200.0,
        current_stock: 15,
        min_stock_level: 3,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: itemCatMap["Skincare & Facial Formulations"],
        item_type: "product",
        name: "Sensibio H2O Soothing Micellar Cleansing Water",
        brand: "Bioderma",
        variant_name: "Sensitive Skin 500ml",
        unit: "500ml",
        unit_price: 1199.0,
        current_stock: 20,
        min_stock_level: 5,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: itemCatMap["Salon Essentials & Disposables"],
        item_type: "product",
        name: "Professional Nitrile Gloves (Black)",
        brand: "SafeTouch",
        variant_name: "Size M (Box of 100)",
        unit: "100 pcs",
        unit_price: 650.0,
        current_stock: 35,
        min_stock_level: 10,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: itemCatMap["Salon Essentials & Disposables"],
        item_type: "product",
        name: "Biodegradable Luxury Salon Towels",
        brand: "EcoSalon",
        variant_name: "White 40x80cm (Pack of 50)",
        unit: "50 pcs",
        unit_price: 450.0,
        current_stock: 50,
        min_stock_level: 15,
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert("inventory_items", inventoryItemsData);

    const insertedItems = await queryInterface.sequelize.query(
      `SELECT id, current_stock FROM "inventory_items" WHERE salon_id = ${salonId};`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const transactionsData = insertedItems.map((item) => ({
      uuid: crypto.randomUUID(),
      salon_id: salonId,
      item_id: item.id,
      ordered_quantity: item.current_stock,
      received_quantity: item.current_stock,
      damaged_quantity: 0,
      created_at: now,
      updated_at: now,
    }));

    if (transactionsData.length > 0) {
      await queryInterface.bulkInsert("inventory_transactions", transactionsData);
    }

    console.log(`Successfully seeded demo salon "Aura Luxury Salon & Spa" (slug: ${salonSlug}) with full categories, services, staff, and inventory.`);
  },

  async down(queryInterface, Sequelize) {
    const salonSlug = "aura-luxury-salon";
    const salon = await queryInterface.rawSelect(
      "salons",
      {
        where: { slug: salonSlug },
      },
      ["id"]
    );

    if (!salon) return;

    await queryInterface.bulkDelete("inventory_transactions", { salon_id: salon }, {});
    await queryInterface.bulkDelete("inventory_items", { salon_id: salon }, {});
    await queryInterface.bulkDelete("items_category", { salon_id: salon }, {});
    const staffRows = await queryInterface.sequelize.query(
      `SELECT id FROM "staffs" WHERE salon_id = ${salon};`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const staffIds = (staffRows || []).map((s) => s.id);
    if (staffIds.length > 0) {
      await queryInterface.bulkDelete(
        "staff_services",
        {
          staff_id: { [Sequelize.Op.in]: staffIds },
        },
        {}
      );
    }
    await queryInterface.bulkDelete("staffs", { salon_id: salon }, {});
    await queryInterface.bulkDelete("services", { salon_id: salon }, {});
    await queryInterface.bulkDelete("categories", { salon_id: salon }, {});
    await queryInterface.bulkDelete("salons", { id: salon }, {});

    console.log(`Successfully removed demo salon "${salonSlug}".`);
  },
};
