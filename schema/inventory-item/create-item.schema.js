const { z } = require("zod");
const { InventoryItemType } = require("../../models/inventory-item/inventory-item-types");
const { FIELD_LIMITS } = require("../../common/field-limits");

exports.createInventoryItemSchema = z.object({
  body: z.object({
    category_id: z.string().uuid({ message: "Invalid category UUID" }),
    name: z.string().min(1, { message: "Item name is required" }).max(FIELD_LIMITS.ITEM_NAME, { message: `Item name cannot exceed ${FIELD_LIMITS.ITEM_NAME} characters` }),
    brand: z.string().min(1, { message: "Brand name is required" }).max(FIELD_LIMITS.NAME, { message: `Brand name cannot exceed ${FIELD_LIMITS.NAME} characters` }),
    item_type: z.enum(Object.values(InventoryItemType.ENUM)).optional().default(InventoryItemType.ENUM.PRODUCT),
    logo: z.string().nullable().optional(),
    variant_name: z.string().max(FIELD_LIMITS.CODE, { message: `Variant name cannot exceed ${FIELD_LIMITS.CODE} characters` }).nullable().optional(),
    unit: z.string().nullable().optional(),
    unit_price: z.number().nonnegative({ message: "Unit price cannot be negative" }).max(100000, { message: "Unit price cannot exceed 100,000" }).optional(),
    min_stock_level: z.number().min(0).max(10000, { message: "Minimum stock level cannot exceed 10,000" }).optional(),
  }),
});
