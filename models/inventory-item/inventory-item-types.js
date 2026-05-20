const { ENUM } = require("../common/enum");

class InventoryItemType extends ENUM {
  static ENUM = {
    PRODUCT: "product",
    EQUIPMENT: "equipment",
  };
}

exports.InventoryItemType = InventoryItemType;
