/* Shared journal, NPC offers and compact tracked quest presentation. */
const QuestUI = (() => {
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const statusNames = { locked: "Bloccata", available: "Disponibile", active: "Attiva", completed: "Completata", claimed: "Riscossa" };
  function rewards(reward) {
    const parts = [`${reward.xp || 0} XP`, `${reward.crowns || 0} Corone`];
    for (const [id, count] of Object.entries(reward.materials || {})) parts.push(`${count} ${ProgressionData.materialNames[id]}`);
    for (const id of reward.items || []) parts.push(GearData.items.find(x => x.id === id)?.name || id);
    if (reward.personalLoot?.length) parts.push("Equipaggiamento personale · compatibile con la classe all'accettazione");
    if (reward.achievements?.length) parts.push("Titolo: Conquistatore della Frontiera");
    return parts.map(escape).join(" · ");
  }
  function actions(quest, entry, state) {
    if (entry.status === "available") return state.frontier.location === quest.location
      ? `<button data-quest-accept="${quest.id}">Accetta missione</button>`
      : `<button data-quest-giver="${quest.id}">Incontra ${escape(WorldData.npcs.find(n => n.id === quest.giver).name)}</button>`;
    if (entry.status === "completed") return `<button data-quest-claim="${quest.id}" class="quest-primary">Riscuoti ricompense</button>`;
    if (entry.status === "active") return `<button data-quest-track="${quest.id}" aria-pressed="${state.frontier.trackedQuest === quest.id}">${state.frontier.trackedQuest === quest.id ? "Tracciata" : "Traccia missione"}</button>`;
    return "";
  }
  function card(quest, state) {
    const entry = state.frontier.quests[quest.id];
    const npc = WorldData.npcs.find(x => x.id === quest.giver);
    const unlocks = quest.contentUnlocks.map(id => WorldData.location(id).name);
    return `<details class="quest-card quest-${entry.status}" data-quest-card="${quest.id}" ${["available", "active", "completed"].includes(entry.status) ? "open" : ""}><summary><span><small>${quest.id.toUpperCase()} · LIV. ${quest.minimumLevel}</small><strong>${escape(quest.title)}</strong></span><b>${statusNames[entry.status]}</b></summary><p>${escape(quest.description)}</p><small>${escape(npc.name)} · ${escape(WorldData.location(quest.location).name)}</small><ul class="quest-objectives">${quest.objectives.map((o, i) => `<li class="${entry.progress[i] >= o.count ? "objective-done" : ""}"><span>${escape(o.label)}</span><b>${entry.progress[i]} / ${o.count}</b></li>`).join("")}</ul><p class="quest-rewards">${rewards(quest.rewards)}</p>${unlocks.length ? `<small>Sblocca: ${unlocks.map(escape).join(", ")}</small>` : ""}${entry.status === "locked" ? `<p class="hint">Richiede livello ${quest.minimumLevel}${quest.prerequisites.length ? ` e ${quest.prerequisites.map(id => escape(QuestData.get(id).title)).join(", ")}` : ""}.</p>` : ""}<div class="quest-actions">${actions(quest, entry, state)}</div></details>`;
  }
  function journal(state) {
    return [["main", "Principale"], ["side", "Secondarie"]].map(([type, title]) =>
      `<section class="journal-group"><h4>${title}</h4>${QuestData.quests.filter(q => q.type === type).map(q => card(q, state)).join("")}</section>`).join("");
  }
  function offers(npcId, state) {
    return QuestData.quests.filter(q => q.giver === npcId && ["available", "active", "completed"].includes(state.frontier.quests[q.id].status))
      .map(q => `<div class="npc-offer"><strong>${escape(q.title)}</strong><small>${statusNames[state.frontier.quests[q.id].status]}</small>${actions(q, state.frontier.quests[q.id], state)}</div>`).join("");
  }
  function tracker(state) {
    const quest = QuestData.get(state.frontier.trackedQuest);
    if (!quest) return "";
    const entry = state.frontier.quests[quest.id];
    return `<span class="world-eyebrow">MISSIONE TRACCIATA · ${statusNames[entry.status]}</span><strong>${escape(quest.title)}</strong><ul>${quest.objectives.map((o,i) => `<li><span>${escape(o.label)}</span><b>${entry.progress[i]}/${o.count}</b></li>`).join("")}</ul>${entry.status === "completed" ? actions(quest, entry, state) : ""}`;
  }
  return { escape, rewards, journal, offers, tracker };
})();
