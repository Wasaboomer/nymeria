/* Shared wearable armor rules. Ownership remains unrestricted. */
const ArmorRules = (() => {
  const types = ["cloth", "leather", "mail", "plate"];
  const slots = ["head", "torso", "legs", "gloves", "boots"];
  const labels = {
    cloth: "Cloth",
    leather: "Leather",
    mail: "Mail",
    plate: "Plate",
  };
  const isArmor = (item) => !!item && slots.includes(item.slot);
  const compatible = (item, cls) =>
    !isArmor(item) ||
    (types.includes(item.armorType) &&
      item.armorType === cls?.armorProficiency);
  const reason = (item, cls) =>
    compatible(item, cls)
      ? null
      : `Il ${cls.name} può equipaggiare solamente armature ${labels[cls.armorProficiency]}.`;
  const unavailableLabel = (item, cls) =>
    compatible(item, cls)
      ? ""
      : `Non utilizzabile · ${labels[item.armorType] || "Armatura"}`;
  return {
    types,
    slots,
    labels,
    isArmor,
    compatible,
    reason,
    unavailableLabel,
  };
})();
if (typeof module !== "undefined" && module.exports)
  module.exports = ArmorRules;
