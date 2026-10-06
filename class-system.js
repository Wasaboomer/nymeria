/* Selection persistence is separate from appearance, inventory and combat preferences. */
const ClassSystem = (() => {
  const STORAGE_KEY = "nymeria.classes.v1";
  let state = {
      classId: "hunter",
      builds: { hunter: "predator", warden: "bulwark" },
    },
    storageError = false;
  const listeners = new Set();
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (raw && ClassesData.classes[raw.classId]) state.classId = raw.classId;
    for (const cls of Object.values(ClassesData.classes))
      if (cls.buildIds.includes(raw?.builds?.[cls.id]))
        state.builds[cls.id] = raw.builds[cls.id];
  } catch {
    storageError = true;
  }
  const selected = () => ClassesData.classes[state.classId];
  const build = () =>
    BuildSystem.getBuild(state.classId, state.builds[state.classId]);
  function publish() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      storageError = false;
    } catch {
      storageError = true;
    }
    listeners.forEach((fn) => fn());
  }
  function selectClass(id) {
    if (!ClassesData.classes[id]) return false;
    state.classId = id;
    publish();
    return true;
  }
  function selectBuild(id) {
    if (!selected().buildIds.includes(id)) return false;
    state.builds[state.classId] = id;
    publish();
    return true;
  }
  function kitRequirement(main, support, classId = state.classId) {
    const cls = ClassesData.classes[classId];
    return !!(
      cls &&
      main &&
      support &&
      cls.weaponTypes.includes(main.weaponType) &&
      main.handedness === cls.handedness &&
      cls.supportTypes.includes(support.type)
    );
  }
  function combatProfile(
    classId = state.classId,
    buildId = state.builds[classId],
    gear,
  ) {
    const cls = ClassesData.classes[classId] || ClassesData.classes.hunter;
    const tendency = BuildSystem.getBuild(cls.id, buildId);
    const rules = (
      tendency.priority || cls.defaultRules.map((r) => r.abilityId)
    ).map((id) => {
      const row = CombatData.copy(
        cls.defaultRules.find((r) => r.abilityId === id),
      );
      if (tendency.conditions?.[id])
        row.condition = CombatData.copy(tendency.conditions[id]);
      return row;
    });
    const modifiers = { ...cls.modifiers };
    for (const [key, value] of Object.entries(tendency.modifiers || {}))
      modifiers[key] = (modifiers[key] || 0) + value;
    const kitValid = gear
      ? kitRequirement(gear.main, gear.support, cls.id)
      : true;
    return CombatData.copy({
      classId: cls.id,
      className: cls.name,
      buildId: tendency.id,
      buildName: tendency.name,
      abilities: cls.abilities,
      resource: cls.resource,
      modifiers: kitValid ? modifiers : {},
      abilityModifiers: tendency.abilityModifiers || {},
      effectModifiers: tendency.effectModifiers || {},
      resultMetrics: cls.resultMetrics,
      effects: { ...CombatData.effects, ...ClassesData.effects },
      defaultRules: rules,
      kitValid,
    });
  }
  return {
    STORAGE_KEY,
    get state() {
      return CombatData.copy(state);
    },
    get storageError() {
      return storageError;
    },
    selected,
    build,
    selectClass,
    selectBuild,
    kitRequirement,
    combatProfile,
    subscribe: (fn) => listeners.add(fn),
  };
})();
