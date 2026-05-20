const { z } = require("zod");
const { InventoryItemType } = require("../../models/inventory-item/inventory-item-types");

exports.createInventoryItemSchema = z.object({
  body: z.object({
    category_id: z.string().uuid({ message: "Invalid category UUID" }),
    name: z.string().min(1, { message: "Item name is required" }),
    brand: z.string().min(1, { message: "Brand name is required" }),
    item_type: z.enum(Object.values(InventoryItemType.ENUM)).optional().default(InventoryItemType.ENUM.PRODUCT),
    logo: z.string().nullable().optional(),
    variant_name: z.string().nullable().optional(),
    unit: z.string().nullable().optional(),
    unit_price: z.number().positive({ message: "Unit price must be positive" }).optional(),
    min_stock_level: z.number().min(0).optional(),
  }),
});
