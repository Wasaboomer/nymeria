/* Pure progress dispatcher. Call within the same transaction as its source event. */
const QuestEvents = (() => {
  const data = typeof module !== "undefined" && module.exports ? require("./quest-data.js") : QuestData;
  function dispatch(state, event) {
    if (!state.frontier || !data.objectiveTypes.includes(event.type)) return [];
    const completed = [];
    for (const quest of data.quests) {
      const entry = state.frontier.quests[quest.id];
      if (entry?.status !== "active") continue;
      quest.objectives.forEach((objective, index) => {
        if (objective.type === event.type && objective.target === event.target)
          entry.progress[index] = Math.min(objective.count,
            entry.progress[index] + Math.max(0, Math.floor(event.quantity ?? 1)));
      });
      if (quest.objectives.every((o, index) => entry.progress[index] >= o.count)) {
        entry.status = "completed";
        completed.push(quest.id);
      }
    }
    return completed;
  }
  return { dispatch };
})();
if (typeof module !== "undefined" && module.exports) module.exports = QuestEvents;
