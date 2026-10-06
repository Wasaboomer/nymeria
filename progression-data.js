/* M5 XP curve and pure stat helpers. Classes own growth; Equipment owns L1 bases. */
const ProgressionData = (() => {
  const levelCap = 20;
  const xpCurve = { base: 80, exponent: 1.35 };
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
  function baseStats(level, initial, growth = {}) {
    const steps = Math.min(levelCap, Math.max(1, Math.floor(level))) - 1;
    return Object.fromEntries(
      Object.entries(initial).map(([key, value]) => [
        key,
        value + steps * (growth[key] || 0),
      ]),
    );
  }
  // Receipts keep aggregate gains at the time XP is awarded, even after class changes.
  function statGains(growth, levels) {
    return Object.fromEntries(
      Object.entries(growth || {})
        .filter(([, value]) => value > 0)
        .map(([key, value]) => [key, value * levels]),
    );
  }
  function levelUpSummary(receipt) {
    if (!receipt?.levelUps?.length) return "";
    const labels = {
      force: "Forza", agility: "Agilità", vigor: "Vigor",
      spirit: "Spirito", critical: "Critico",
    };
    const gains = Object.entries(receipt.statGains || {}).map(([key, value]) =>
      `+${Number(value).toLocaleString("it-IT")}${key === "critical" ? "%" : ""} ${labels[key] || key}`,
    );
    return [`LIVELLO ${receipt.resultingLevel} RAGGIUNTO`, ...gains].join(" · ");
  }
  return {
    latestLevelUp: (state) => [state.lastClaim, state.lastCombatReward,
      state.frontier?.lastQuestClaim, state.frontier?.lastEncounter]
      .filter(Boolean).sort((a, b) => (b.claimedAt || b.awardedAt || 0) - (a.claimedAt || a.awardedAt || 0))[0],
    statKeys: ["force", "agility", "vigor", "spirit", "critical", "speed", "armor"],
    statGains,
    levelUpSummary,
    levelCap,
    xpCurve,
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
