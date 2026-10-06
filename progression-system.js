/* Lifecycle orchestration. All durable reward changes happen in one store transaction. */
const ProgressionLifecycle = (() => {
  const data =
    typeof module !== "undefined" && module.exports
      ? require("./progression-data.js")
      : ProgressionData;
  const expeditions =
    typeof module !== "undefined" && module.exports
      ? require("./expedition-data.js")
      : ExpeditionData;
  const resolver =
    typeof module !== "undefined" && module.exports
      ? require("./expedition-engine.js")
      : ExpeditionEngine;
  const personal =
    typeof module !== "undefined" && module.exports
      ? require("./personal-loot.js")
      : PersonalLoot;
  const copy = (value) => JSON.parse(JSON.stringify(value));
  function create({
    store,
    equipment,
    classes,
    combatSettings = () => null,
    now = () => Date.now(),
    random = Math.random,
    testMode = false,
    catalogue,
  }) {
    function snapshot() {
      const gear = {
        main: equipment.equipped("mainHand"),
        support: equipment.equipped("support"),
      };
      const profile = classes.combatProfile(undefined, undefined, gear);
      const settings = combatSettings();
      return copy({
        level: store.state.level,
        stats: equipment.state.resultingStats,
        profile,
        rules:
          settings?.mode === "custom" ? settings.rules : profile.defaultRules,
        effects: equipment.state.inventory
          .filter((i) => i.equipped)
          .flatMap((i) =>
            i.effects.map((effect) => ({ ...effect, itemId: i.id })),
          ),
        gearIds: Object.values(equipment.state.equipment).map(
          (entry) => entry.equippedItem,
        ),
      });
    }
    function start(activityId, options = {}) {
      return store.transact((state) => {
        if (state.activeExpedition || state.pendingExpeditionResult)
          return {
            ok: false,
            message:
              "Termina la spedizione o riscuoti il report prima di partire.",
          };
        const activity = expeditions.activity(activityId);
        if (!activity || state.level < activity.requiredLevel)
          return {
            ok: false,
            message: activity
              ? `Si sblocca al livello ${activity.requiredLevel}.`
              : "Attività non disponibile.",
          };
        const character = snapshot();
        if (!character.profile.kitValid)
          return {
            ok: false,
            message: `Equipaggia ${classes.selected().requirement} prima di partire.`,
          };
        const startedAt = now(),
          seed =
            (options.seed === undefined
              ? Math.floor(random() * 4294967296)
              : options.seed) >>> 0;
        state.sequence++;
        state.activeExpedition = {
          id: `exp-${state.sequence}-${startedAt}-${seed}`,
          activityId,
          activity: copy(activity),
          eventDefinitions: copy(expeditions.events),
          startedAt,
          endsAt: startedAt + activity.durationMs,
          seed,
          snapshot: character,
          lootPolicy: personal.create(activity, character.profile),
          rulesVersion: 1,
          testMode,
        };
        state.lastClaim = null;
        return {
          ok: true,
          message: `${activity.name} iniziata. Preparazione salvata per l’intera spedizione.`,
        };
      });
    }
    function finish(at, debug = false) {
      return store.transact((state) => {
        const active = state.activeExpedition;
        if (!active) return { ok: true, unchanged: true };
        if (debug && (!testMode || !active.testMode))
          return {
            ok: false,
            message:
              "Completamento di sviluppo disponibile solo per una spedizione TEST.",
          };
        if (!debug && at < active.endsAt) return { ok: true, unchanged: true };
        try {
          state.pendingExpeditionResult = resolver.resolve(active);
        } catch {
          return {
            ok: false,
            message:
              "Configurazione spedizione non valida; puoi interromperla senza perdere equipaggiamento.",
          };
        }
        state.pendingExpeditionResult.completedAt = debug
          ? now()
          : active.endsAt;
        state.activeExpedition = null;
        return { ok: true, message: "Report pronto. Riscuoti le ricompense." };
      });
    }
    function refresh() {
      const active = store.state.activeExpedition;
      return active && now() >= active.endsAt
        ? finish(now())
        : Promise.resolve({ ok: true, unchanged: true });
    }
    function cancel() {
      return store.transact((state) => {
        if (!state.activeExpedition)
          return { ok: false, message: "Nessuna spedizione in corso." };
        if (now() >= state.activeExpedition.endsAt)
          return {
            ok: false,
            message: "Spedizione già terminata: apri il report e riscuoti.",
          };
        state.activeExpedition = null;
        return {
          ok: true,
          message:
            "Spedizione interrotta: nessuna ricompensa, equipaggiamento conservato.",
        };
      });
    }
    function claim(id) {
      return store.transact((state) => {
        const report = state.pendingExpeditionResult;
        if (!report || report.id !== id || state.lastClaim?.id === id)
          return {
            ok: false,
            message: "Ricompense già riscosse o report non disponibile.",
          };
        const previousLevel = state.level,
          reward = report.rewards;
        state.totalXP = data.amount(state.totalXP + data.amount(reward.xp));
        state.crowns = data.amount(state.crowns + data.amount(reward.crowns));
        for (const key of Object.keys(state.materials))
          state.materials[key] = data.amount(
            state.materials[key] + data.amount(reward.materials[key]),
          );
        const loot = [];
        for (const itemId of reward.lootIds) {
          const item = catalogue.find(
            (item) => item.id === itemId && item.expeditionOnly,
          );
          if (!item) continue;
          const duplicate = state.ownedLootIds.includes(itemId);
          if (duplicate)
            state.materials.iron = data.amount(state.materials.iron + 2);
          else state.ownedLootIds.push(itemId);
          loot.push({ itemId, duplicate });
        }
        const after = data.fromTotal(state.totalXP);
        const levelUps = [];
        for (let level = previousLevel + 1; level <= after.level; level++)
          levelUps.push(level);
        state.lastClaim = {
          ...report,
          loot,
          levelUps,
          previousLevel,
          resultingLevel: after.level,
          claimedAt: now(),
        };
        state.pendingExpeditionResult = null;
        return {
          ok: true,
          message: levelUps.length
            ? `LIVELLO ${after.level} RAGGIUNTO · Ricompense riscosse`
            : "Ricompense riscosse",
          levelUps,
          loot,
        };
      });
    }
    return {
      snapshot,
      start,
      refresh,
      cancel,
      claim,
      testMode,
      debugComplete: () => finish(now(), true),
    };
  }
  return { create };
})();
if (typeof module !== "undefined" && module.exports)
  module.exports = ProgressionLifecycle;
const ProgressionSystem =
  typeof window !== "undefined"
    ? ProgressionLifecycle.create({
        store: ProgressionStore,
        equipment: Equipment,
        classes: ClassSystem,
        combatSettings: () => CombatUI.settings,
        catalogue: GearData.items,
        testMode: new URLSearchParams(location.search).get("test") === "1",
      })
    : null;
if (typeof window !== "undefined") {
  let gearKey = "";
  const reconcile = () => {
    const state = ProgressionStore.state,
      key = JSON.stringify([state.level, state.ownedLootIds]);
    if (key !== gearKey) {
      gearKey = key;
      Equipment.reconcileProgression();
    }
  };
  ProgressionStore.subscribe(reconcile);
  reconcile();
  window.addEventListener("storage", (event) => {
    if (event.key === ProgressionStorage.KEY || event.key === null)
      ProgressionStore.refresh();
  });
}
