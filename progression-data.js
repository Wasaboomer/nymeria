/* M5 progression curve and growth. Equipment owns the level-1 stat constants. */
const ProgressionData = (() => {
  const levelCap = 20;
  const xpCurve = { base: 80, exponent: 1.35 };
  const growth = {
    force: 2,
    agility: 2,
    vigor: 2,
    spirit: 1,
    critical: 0,
    speed: 0,
    armor: 0,
  };
  const materialNames = {
    iron: "Ferro del Vespro",
    fiber: "Fibra Lunare",
    ether: "Polvere d’Etere",
  };
  const requiredXP = (level) =>
    level >= levelCap
      ? 0
      : Math.round(
          xpCurve.base * Math.pow(Math.max(1, level), xpCurve.exponent),
        );
  const thresholds = [0];
  for (let level = 1; level < levelCap; level++)
    thresholds.push(thresholds[level - 1] + requiredXP(level));
  const amount = (value) =>
    Math.max(0, Math.min(1e9, Math.floor(Number(value) || 0)));
  function fromTotal(total) {
    const totalXP = amount(total);
    let level = 1;
    while (level < levelCap && totalXP >= thresholds[level]) level++;
    return {
      level,
      totalXP,
      currentXP: level === levelCap ? 0 : totalXP - thresholds[level - 1],
      requiredXP: requiredXP(level),
      overflowXP: level === levelCap ? totalXP - thresholds[levelCap - 1] : 0,
    };
  }
  function baseStats(level, initial) {
    const steps = Math.min(levelCap, Math.max(1, Math.floor(level))) - 1;
    return Object.fromEntries(
      Object.entries(initial).map(([key, value]) => [
        key,
        value + steps * (growth[key] || 0),
      ]),
    );
  }
  return {
    levelCap,
    xpCurve,
    growth,
    materialNames,
    requiredXP,
    thresholds,
    amount,
    fromTotal,
    baseStats,
    schemaVersion: 1,
  };
})();
if (typeof module !== "undefined" && module.exports)
  module.exports = ProgressionData;
