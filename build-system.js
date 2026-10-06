/* Provisional Gear Advisor. Score components can grow to include sets/synergies. */
const BuildSystem = (() => {
  const data =
    typeof module !== "undefined" && module.exports
      ? require("./classes-data.js")
      : ClassesData;
  function getBuild(classId, buildId) {
    const cls = data.classes[classId] || data.classes.hunter;
    return data.builds[
      cls.buildIds.includes(buildId) ? buildId : cls.defaultBuild
    ];
  }
  function compatible(item, classId) {
    const cls = data.classes[classId];
    if (!item || !cls) return false;
    if (item.slot === "weapon")
      return (
        cls.weaponTypes.includes(item.weaponType) &&
        item.handedness === cls.handedness
      );
    if (item.slot === "support") return cls.supportTypes.includes(item.type);
    return true;
  }
  const scoreHooks = [];
  function scoreBreakdown(item, classId, buildId) {
    if (!compatible(item, classId)) return null;
    const build = getBuild(classId, buildId);
    const stats = Object.entries(item.stats).reduce(
      (sum, [key, value]) => sum + value * (build.weights[key] || 0),
      0,
    );
    const effects = (item.effects || []).reduce(
      (sum, effect) => sum + (build.effectWeights?.[effect.id] || 0),
      0,
    );
    const synergy = scoreHooks.reduce(
      (sum, hook) => sum + hook(item, data.classes[classId], build),
      0,
    );
    return { stats, effects, synergy, total: stats + effects + synergy };
  }
  function scoreItemForBuild(item, classId, buildId) {
    return scoreBreakdown(item, classId, buildId)?.total ?? null;
  }
  function advise(item, slot, classId, buildId, equipment) {
    const score = scoreItemForBuild(item, classId, buildId);
    if (score === null || item.requiredLevel > equipment.state.character.level)
      return null;
    const candidates = equipment.state.inventory.filter(
      (candidate) =>
        equipment.compatibleSlots(candidate).includes(slot) &&
        candidate.requiredLevel <= equipment.state.character.level &&
        compatible(candidate, classId),
    );
    const bestScore = Math.max(
      ...candidates.map((candidate) =>
        scoreItemForBuild(candidate, classId, buildId),
      ),
    );
    const current = equipment.equipped(slot);
    const currentScore = scoreItemForBuild(current, classId, buildId) || 0;
    return {
      score,
      currentScore,
      delta: score - currentScore,
      bestOwned: Math.abs(score - bestScore) < 1e-8,
      improvement:
        !item.equipped &&
        item.id !== current?.id &&
        !equipment.canEquip(item.id, slot) &&
        score - currentScore > Math.max(2, Math.abs(currentScore) * 0.05),
    };
  }
  return {
    getBuild,
    compatible,
    scoreBreakdown,
    scoreItemForBuild,
    advise,
    registerScoreHook: (hook) => scoreHooks.push(hook),
  };
})();
if (typeof module !== "undefined" && module.exports)
  module.exports = BuildSystem;
