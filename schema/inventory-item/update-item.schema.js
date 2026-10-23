const { z } = require("zod");
const { InventoryItemType } = require("../../models/inventory-item/inventory-item-types");
const { FIELD_LIMITS } = require("../../common/field-limits");

exports.updateInventoryItemSchema = z.object({
  body: z.object({
    category_id: z.string().uuid({ message: "Invalid category UUID" }).optional(),
    item_type: z.enum(Object.values(InventoryItemType.ENUM)).optional().default(InventoryItemType.ENUM.PRODUCT),
    name: z.string().min(1, { message: "Item name cannot be empty" }).max(FIELD_LIMITS.ITEM_NAME, { message: `Item name cannot exceed ${FIELD_LIMITS.ITEM_NAME} characters` }).optional(),
    brand: z.string().max(FIELD_LIMITS.NAME, { message: `Brand name cannot exceed ${FIELD_LIMITS.NAME} characters` }).nullable().optional(),
    logo: z.string().nullable().optional(),
    variant_name: z.string().max(FIELD_LIMITS.CODE, { message: `Variant name cannot exceed ${FIELD_LIMITS.CODE} characters` }).nullable().optional(),
    unit: z.string().nullable().optional(),
    unit_price: z.number().min(0, { message: "Unit price cannot be negative" }).max(100000, { message: "Unit price cannot exceed 100,000" }).nullable().optional(),
    current_stock: z.number().min(0, { message: "Current stock cannot be negative" }).optional(),
    min_stock_level: z.number().min(0, { message: "Minimum stock level cannot be negative" }).max(10000, { message: "Minimum stock level cannot exceed 10,000" }).nullable().optional(),
  }),
  params: z.object({
    uuid: z.string().uuid({ message: "Invalid item UUID" }),
  }),
});
