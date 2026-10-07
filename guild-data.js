/* M7.0 prototype catalogue. No player-resource ownership or multiplayer state. */
const GuildData = (() => {
  const roles = {
    leader: "Fondatore / Maestro",
    officer: "Ufficiale",
    member: "Membro",
  };
  const sigils = [
    {
      id: "tower",
      name: "Bastione del Vespro",
      path: "M12 35V17L18 12V7H23V12L29 17V35ZM15 22H26M19 35V28H23V35M20 17V21",
    },
    {
      id: "sun",
      name: "Luce della Soglia",
      path: "M20 6V11M20 31V36M5 21H10M30 21H35M9 10L13 14M27 28L31 32M9 32L13 28M27 14L31 10M20 14L27 21 20 28 13 21Z",
    },
    {
      id: "wolf",
      name: "Lupo delle Brume",
      path: "M10 10L17 16H23L30 10 28 27 20 35 12 27ZM14 21L18 23M26 21L22 23M17 29L20 31 23 29",
    },
  ];
  const simulatedMembers = [
    {
      id: "npc-lyra",
      name: "Lyra Venn",
      role: "officer",
      level: 7,
      contribution: 0,
      simulated: true,
    },
    {
      id: "npc-orren",
      name: "Orren Kael",
      role: "member",
      level: 5,
      contribution: 0,
      simulated: true,
    },
    {
      id: "npc-mira",
      name: "Mira Thal",
      role: "member",
      level: 4,
      contribution: 0,
      simulated: true,
    },
  ];
  const limits = {
    level: 20,
    members: 30,
    contribution: 9999,
    balance: 1e9,
    name: 28,
    motto: 72,
  };
  const xpForLevel = (level) =>
    level >= limits.level ? 0 : 300 + Math.max(0, level - 1) * 250;
  const thresholds = [0];
  for (let level = 1; level < limits.level; level++)
    thresholds.push(thresholds[level - 1] + xpForLevel(level));
  function fromTotal(totalXP) {
    totalXP = Math.max(
      0,
      Math.min(thresholds[limits.level - 1], Math.floor(Number(totalXP) || 0)),
    );
    let level = 1;
    while (level < limits.level && totalXP >= thresholds[level]) level++;
    return {
      totalXP,
      level,
      xp: level === limits.level ? 0 : totalXP - thresholds[level - 1],
    };
  }
  return {
    schemaVersion: 1,
    roles,
    sigils,
    simulatedMembers,
    limits,
    xpForLevel,
    thresholds,
    fromTotal,
  };
})();
if (typeof module !== "undefined" && module.exports) module.exports = GuildData;
