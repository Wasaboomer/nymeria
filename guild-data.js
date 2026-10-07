const GuildData = (() => {
  const roles = { leader: "Maestro di Gilda", officer: "Ufficiale", member: "Membro" };
  const simulatedMembers = [
    { id:"npc-lyra", name:"Lyra Venn", role:"officer", level:7, contribution:420 },
    { id:"npc-orren", name:"Orren Kael", role:"member", level:5, contribution:260 },
    { id:"npc-mira", name:"Mira Thal", role:"member", level:4, contribution:180 }
  ];
  function xpForLevel(level){ return 300 + Math.max(0, level-1)*250; }
  return { schemaVersion:1, roles, simulatedMembers, xpForLevel };
})();
if (typeof module !== "undefined" && module.exports) module.exports = GuildData;
