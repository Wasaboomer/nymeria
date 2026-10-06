/* Single source of truth for compatibility, stats and equipped/appearance separation. */
const Equipment = (() => {
  const SAVE_KEY = "nymeria.equipment.v1";
  const baseStats = {
    force: 12,
    agility: 15,
    vigor: 14,
    spirit: 11,
    critical: 0,
    speed: 0,
    armor: 0,
  };
  const defaultCharacter = {
    hair: "veil",
    hairColor: "ink",
    eyes: "amber",
    dye: "sea",
    level: 1,
  };
  const slotById = Object.fromEntries(GearData.slots.map((s) => [s.id, s]));
  const itemById = Object.fromEntries(GearData.items.map((i) => [i.id, i]));
  const appearanceAllowed = {
    hair: ITEMS.hair.map((x) => x.id),
    hairColor: PALETTES.hair.map((x) => x.id),
    eyes: PALETTES.eyes.map((x) => x.id),
    dye: PALETTES.dye.map((x) => x.id),
  };
  const listeners = new Set();
  let storageIssue = false;
  const clone = (x) => JSON.parse(JSON.stringify(x));
  function calculateStats(model) {
    const totals =
      typeof ProgressionData !== "undefined"
        ? ProgressionData.baseStats(model.character.level, baseStats)
        : { ...baseStats };
    for (const entry of Object.values(model.equipment)) {
      const item = model.inventory.find((i) => i.id === entry.equippedItem);
      if (item) for (const [k, v] of Object.entries(item.stats)) totals[k] += v;
    }
    return totals;
  }
  // Prototype power weights; all call sites use this formula.
  function calculatePower(s) {
    return Math.round(
      s.force * 2 +
        s.agility * 2 +
        s.vigor +
        s.spirit * 2 +
        s.critical * 3 +
        s.speed * 2 +
        s.armor,
    );
  }
  function progressionState() {
    return typeof ProgressionStore !== "undefined" && ProgressionStore
      ? ProgressionStore.state
      : { level: 1, ownedLootIds: [] };
  }
  function currentClass() {
    return typeof ClassSystem !== "undefined" ? ClassSystem.selected() : null;
  }
  function armorError(item) {
    const cls = currentClass();
    return cls ? ArmorRules.reason(item, cls) : null;
  }
  function sync(model) {
    const progression = progressionState();
    model.character.level = progression.level;
    const owned = new Set(progression.ownedLootIds);
    model.inventory = model.inventory.filter(
      (item) => !item.expeditionOnly || owned.has(item.id),
    );
    for (const id of owned)
      if (
        !model.inventory.some((item) => item.id === id) &&
        itemById[id]?.expeditionOnly
      )
        model.inventory.push(clone(itemById[id]));
    for (const entry of Object.values(model.equipment)) {
      const item = model.inventory.find((i) => i.id === entry.equippedItem);
      if (item && armorError(item)) {
        entry.equippedItem = null;
        entry.appearanceItem = null;
      }
    }
    const ids = new Set(
      Object.values(model.equipment).map((x) => x.equippedItem),
    );
    model.inventory.forEach((i) => (i.equipped = ids.has(i.id)));
    model.resultingStats = calculateStats(model);
    model.power = calculatePower(model.resultingStats);
    return model;
  }
  function initial() {
    const equipment = Object.fromEntries(
      GearData.slots.map((s) => [
        s.id,
        { equippedItem: null, appearanceItem: null },
      ]),
    );
    const initialIds = {
      mainHand: "sword",
      torso: "torso-warden",
      legs: "legs-ranger",
      boots: "boots-plate",
      cloak: "cloak-dusk",
    };
    if (currentClass()?.armorProficiency === "mail") {
      initialIds.torso = "torso-chain";
      initialIds.legs = "legs-chain";
      initialIds.boots = "boots-chain";
    } else if (currentClass()?.armorProficiency === "plate")
      initialIds.legs = "legs-sentinel";
    for (const [slot, id] of Object.entries(initialIds))
      equipment[slot] = { equippedItem: id, appearanceItem: id };
    return sync({
      version: 1,
      inventory: clone(GearData.items.filter((item) => !item.expeditionOnly)),
      equipment,
      character: { ...defaultCharacter },
    });
  }
  function compatibleSlots(item) {
    return GearData.slots.filter((s) => s.type === item.slot).map((s) => s.id);
  }
  function supportRule(main, support) {
    if (main?.handedness === "2H")
      return "Arma a due mani: il supporto è bloccato.";
    if (!main) return "Equipaggia prima un’arma principale.";
    if (!main.allowedSupports.includes(support.type))
      return `${main.name} non può usare ${support.name}.`;
    return null;
  }
  function normalize(raw) {
    const fresh = initial();
    if (!raw || raw.version !== 1 || !Array.isArray(raw.inventory))
      return fresh;
    const owned = new Set(
      raw.inventory.map((x) => x?.id).filter((id) => itemById[id]),
    );
    // Add the coherent Mail demo kit to older M2–M5 inventories; retain every owned item.
    for (const item of GearData.items)
      if (item.demoMigration) owned.add(item.id);
    fresh.inventory = clone(GearData.items.filter((i) => owned.has(i.id)));
    for (const [key, values] of Object.entries(appearanceAllowed))
      if (values.includes(raw.character?.[key]))
        fresh.character[key] = raw.character[key];
    const used = new Set();
    for (const slot of GearData.slots) {
      const entry = raw.equipment?.[slot.id];
      const id = entry?.equippedItem;
      const item = fresh.inventory.find((i) => i.id === id);
      if (
        !item ||
        used.has(id) ||
        !compatibleSlots(item).includes(slot.id) ||
        item.requiredLevel > fresh.character.level
      ) {
        fresh.equipment[slot.id] = { equippedItem: null, appearanceItem: null };
        continue;
      }
      used.add(id);
      const appearanceId = entry.appearanceItem;
      const appearance = fresh.inventory.find((i) => i.id === appearanceId);
      fresh.equipment[slot.id] = {
        equippedItem: id,
        appearanceItem:
          appearance && compatibleSlots(appearance).includes(slot.id)
            ? appearanceId
            : id,
      };
    }
    const main = fresh.inventory.find(
        (i) => i.id === fresh.equipment.mainHand.equippedItem,
      ),
      support = fresh.inventory.find(
        (i) => i.id === fresh.equipment.support.equippedItem,
      );
    if (support && supportRule(main, support))
      fresh.equipment.support = { equippedItem: null, appearanceItem: null };
    return sync(fresh);
  }
  let state = initial();
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) state = normalize(JSON.parse(saved));
    else {
      const old = JSON.parse(localStorage.getItem("nymeria.character.v1"));
      for (const [key, values] of Object.entries(appearanceAllowed))
        if (values.includes(old?.[key])) state.character[key] = old[key];
      for (const [slot, legacy] of Object.entries({
        mainHand: "weapon",
        torso: "torso",
        legs: "legs",
        boots: "boots",
        cloak: "cloak",
      })) {
        const item = state.inventory.find(
          (i) =>
            compatibleSlots(i).includes(slot) &&
            i.appearance?.asset === old?.[legacy],
        );
        if (item)
          state.equipment[slot] = {
            equippedItem: item.id,
            appearanceItem: item.id,
          };
      }
      sync(state);
    }
  } catch {
    storageIssue = true;
  }
  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      return true;
    } catch {
      storageIssue = true;
      return false;
    }
  }
  function publish() {
    sync(state);
    const persisted = save();
    listeners.forEach((fn) => fn(state));
    return persisted;
  }
  function equipped(slot) {
    return (
      state.inventory.find(
        (i) => i.id === state.equipment[slot]?.equippedItem,
      ) || null
    );
  }
  function appearance(slot) {
    return (
      state.inventory.find(
        (i) => i.id === state.equipment[slot]?.appearanceItem,
      ) || null
    );
  }
  function canEquip(id, slot) {
    const item = state.inventory.find((i) => i.id === id);
    if (!item) return "Oggetto non disponibile.";
    return canEquipCandidate(item, slot);
  }
  function canEquipCandidate(item, slot) {
    if (!compatibleSlots(item).includes(slot))
      return "Questo oggetto non appartiene allo slot.";
    const proficiencyError = armorError(item);
    if (proficiencyError) return proficiencyError;
    if (item.requiredLevel > state.character.level)
      return `Richiede livello ${item.requiredLevel}.`;
    if (slot === "support") return supportRule(equipped("mainHand"), item);
    return null;
  }
  function equip(id, slot) {
    const error = canEquip(id, slot);
    if (error) return { ok: false, message: error };
    let displaced = null;
    const item = state.inventory.find((i) => i.id === id);
    for (const entry of Object.values(state.equipment))
      if (entry.equippedItem === id) {
        entry.equippedItem = null;
        entry.appearanceItem = null;
      }
    state.equipment[slot] = { equippedItem: id, appearanceItem: id };
    if (slot === "mainHand") {
      const support = equipped("support");
      if (support && supportRule(item, support)) {
        displaced = support.name;
        state.equipment.support = { equippedItem: null, appearanceItem: null };
      }
    }
    const persisted = publish();
    return {
      ok: true,
      message: `${item.name} equipaggiato.${displaced ? ` ${displaced} torna nell’inventario.` : ""}${persisted ? "" : " Salvataggio locale non disponibile."}`,
    };
  }
  function unequip(slot) {
    if (!slotById[slot]) return { ok: false, message: "Slot non valido." };
    const item = equipped(slot);
    if (!item)
      return {
        ok: false,
        message:
          slot === "support" && equipped("mainHand")?.handedness === "2H"
            ? "Rimuovi l’arma principale a due mani."
            : "Lo slot è già vuoto.",
      };
    state.equipment[slot] = { equippedItem: null, appearanceItem: null };
    let extra = "";
    if (slot === "mainHand" && equipped("support")) {
      extra = ` ${equipped("support").name} torna nell’inventario.`;
      state.equipment.support = { equippedItem: null, appearanceItem: null };
    }
    const persisted = publish();
    return {
      ok: true,
      message: `${item.name} rimosso.${extra}${persisted ? "" : " Salvataggio locale non disponibile."}`,
    };
  }
  function comparison(id, slot) {
    const item = state.inventory.find((i) => i.id === id);
    if (!item) return null;
    const projected = clone(state);
    for (const entry of Object.values(projected.equipment))
      if (entry.equippedItem === id) {
        entry.equippedItem = null;
        entry.appearanceItem = null;
      }
    projected.equipment[slot] = { equippedItem: id, appearanceItem: id };
    if (slot === "mainHand") {
      const support = projected.inventory.find(
        (i) => i.id === projected.equipment.support.equippedItem,
      );
      if (support && supportRule(item, support))
        projected.equipment.support = {
          equippedItem: null,
          appearanceItem: null,
        };
    }
    const totals = calculateStats(projected);
    return {
      current: equipped(slot),
      delta: Object.fromEntries(
        Object.keys(baseStats).map((k) => [
          k,
          totals[k] - state.resultingStats[k],
        ]),
      ),
      power: calculatePower(totals) - state.power,
      supportRemoved: !!(
        equipped("support") && !projected.equipment.support.equippedItem
      ),
    };
  }
  function setCharacter(key, value) {
    if (!appearanceAllowed[key]?.includes(value)) return false;
    state.character[key] = value;
    publish();
    return true;
  }
  function randomizeCharacter() {
    for (const [key, values] of Object.entries(appearanceAllowed))
      state.character[key] = values[Math.floor(Math.random() * values.length)];
    publish();
  }
  function reset() {
    state = initial();
    publish();
  }
  return {
    get state() {
      return state;
    },
    get storageIssue() {
      return storageIssue;
    },
    SAVE_KEY,
    baseStats,
    appearanceAllowed,
    slotById,
    compatibleSlots,
    calculateStats,
    calculatePower,
    supportRule,
    canEquip,
    canEquipCandidate,
    equipped,
    appearance,
    equip,
    unequip,
    comparison,
    setCharacter,
    randomizeCharacter,
    reset,
    reconcileProgression: publish,
    save,
    subscribe(fn) {
      listeners.add(fn);
    },
    normalize,
  };
})();
