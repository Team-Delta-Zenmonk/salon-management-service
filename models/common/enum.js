class ENUM {
  static ENUM = {};

  static getValues() {
    return Object.values(this.ENUM);
  }

  static isValidValue(value) {
    return Boolean(this.getValues().includes(value));
  }
}

module.exports = {
  ENUM,
};
