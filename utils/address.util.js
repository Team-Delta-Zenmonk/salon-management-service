const formatAddress = (addr) => {
  if (!addr) return "";
  if (typeof addr === "string") return addr;
  if (typeof addr === "object") {
    return (
      addr.formatted_address ||
      [addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ") ||
      ""
    );
  }
  return "";
};

const normalizeAddress = (addr) => {
  if (!addr) return null;
  if (typeof addr === "object") {
    const street =
      addr.street !== null && addr.street !== undefined && String(addr.street).trim() !== ""
        ? String(addr.street).trim()
        : null;
    const city =
      addr.city !== null && addr.city !== undefined && String(addr.city).trim() !== ""
        ? String(addr.city).trim()
        : null;
    const state =
      addr.state !== null && addr.state !== undefined && String(addr.state).trim() !== ""
        ? String(addr.state).trim()
        : null;
    const pincode =
      addr.pincode !== null && addr.pincode !== undefined && String(addr.pincode).trim() !== ""
        ? String(addr.pincode).trim()
        : null;
    const compiled = [street, city, state, pincode].filter(Boolean).join(", ");
    const formatted =
      addr.formatted_address !== null &&
      addr.formatted_address !== undefined &&
      String(addr.formatted_address).trim() !== ""
        ? String(addr.formatted_address).trim()
        : compiled || null;

    if (!street && !city && !state && !pincode && !formatted) {
      return null;
    }
    return { street, city, state, pincode, formatted_address: formatted };
  }
  if (typeof addr === "string") {
    const str = addr.trim();
    if (!str) return null;
    return {
      street: null,
      city: null,
      state: null,
      pincode: null,
      formatted_address: str,
    };
  }
  return null;
};

module.exports = { formatAddress, normalizeAddress };

