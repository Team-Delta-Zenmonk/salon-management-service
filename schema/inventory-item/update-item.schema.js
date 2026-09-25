const { z } = require("zod");
const { InventoryItemType } = require("../../models/inventory-item/inventory-item-types");

exports.updateInventoryItemSchema = z.object({
  body: z.object({
    category_id: z.string().uuid().optional(),
    item_type: z.enum(Object.values(InventoryItemType.ENUM)).optional().default(InventoryItemType.ENUM.PRODUCT),
    name: z.string().min(1).optional(),
    brand: z.string().nullable().optional(),
    logo: z.string().nullable().optional(),
    variant_name: z.string().nullable().optional(),
    unit: z.string().nullable().optional(),
    unit_price: z.number().positive().max(100000, { message: "Unit price cannot exceed 100,000" }).nullable().optional(),
    current_stock: z.number().min(0).optional(),
    min_stock_level: z.number().min(0).max(10000, { message: "Minimum stock level cannot exceed 10,000" }).optional(),
  }),
  params: z.object({
    uuid: z.string().uuid(),
  }),
});
