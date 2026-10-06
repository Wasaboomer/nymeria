/* UI adapter: one animation-frame clock, immutable equipment snapshot per fight. */
const CombatUI = (() => {
  const STORAGE_KEY = "nymeria.combat.v1";
  let settings = CombatData.normalizeSettings(null),
    storageError = false;
  try {
    settings = CombatData.normalizeSettings(
      JSON.parse(localStorage.getItem(STORAGE_KEY)),
    );
  } catch {
    storageError = true;
  }
  let engine = null,
    frameId = null,
    lastWallTime = null,
    lastLogVersion = -1,
    lastRenderAt = -1;
  let gearKey = "",
    lookKey = "";
  const node = (id) => document.getElementById(id);
  const ability = (id) => CombatData.abilities.find((a) => a.id === id);
  const formatTime = (seconds) =>
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
  const text = (id, value) => {
    const element = node(id);
    if (element.textContent !== value) element.textContent = value;
  };
  function equippedEffects() {
    return GearData.slots.reduce((result, slot) => {
      const item = Equipment.equipped(slot.id);
      return result.concat(
        item
          ? item.effects.map((effect) => ({ ...effect, itemId: item.id }))
          : [],
      );
    }, []);
  }
  const rules = () =>
    settings.mode === "auto" ? CombatData.defaultRules : settings.rules;
  const kitReady = () =>
    CombatData.kitRequirement(
      Equipment.equipped("mainHand"),
      Equipment.equipped("support"),
    );
  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      storageError = false;
    } catch {
      storageError = true;
    }
    renderStrategyHint();
  }
  function renderStrategyHint() {
    text(
      "combat-strategy-hint",
      (settings.mode === "auto"
        ? "Priorità predefinite: viene usata la prima abilità valida e disponibile."
        : "Il personaggio segue l’ordine dall’alto. Le modifiche valgono dalla prossima azione.") +
        (storageError ? " Salvataggio preferenze non disponibile." : ""),
    );
  }
  function renderSettings() {
    document
      .querySelectorAll("[data-combat-mode]")
      .forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(b.dataset.combatMode === settings.mode),
        ),
      );
    document
      .querySelectorAll("[data-combat-speed]")
      .forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(Number(b.dataset.combatSpeed) === settings.speed),
        ),
      );
    renderStrategyHint();
    const list = rules(),
      custom = settings.mode === "custom";
    node("combat-priorities").innerHTML = list
      .map((rule, index) => {
        const condition = rule.condition,
          skill = ability(rule.abilityId);
        return `<article class="priority-row" data-priority-id="${rule.abilityId}"><div class="priority-heading"><span class="priority-number">${index + 1}</span><div><strong>${skill.name}</strong><small>${skill.description}</small></div><div class="priority-order"><button data-move="-1" data-rule="${rule.abilityId}" aria-label="Sposta ${skill.name} in alto" ${!custom || index === 0 ? "disabled" : ""}>↑</button><button data-move="1" data-rule="${rule.abilityId}" aria-label="Sposta ${skill.name} in basso" ${!custom || index === list.length - 1 ? "disabled" : ""}>↓</button></div></div><label>Condizione<select data-condition="${rule.abilityId}" ${!custom ? "disabled" : ""}>${CombatData.conditions.map((c) => `<option value="${c.id}" ${c.id === condition.type ? "selected" : ""}>${c.label}</option>`).join("")}</select></label>${condition.type === "enemyHpBelow" || condition.type === "playerHpBelow" ? `<label class="threshold">Soglia HP <input type="number" min="1" max="99" inputmode="numeric" data-threshold="${rule.abilityId}" value="${condition.threshold}" ${!custom ? "disabled" : ""}> %</label>` : condition.type === "debuffAbsent" || condition.type === "buffAbsent" ? `<p class="condition-effect">${CombatData.effects[condition.effectId].name} assente</p>` : ""}</article>`;
      })
      .join("");
    if (engine) engine.setRules(rules());
  }
  function updateConfiguration() {
    settings = CombatData.normalizeSettings(settings);
    saveSettings();
    renderSettings();
  }
  function clonePlayer() {
    const clone = node("character").cloneNode(true),
      ids = new Map();
    clone.querySelectorAll("[id]").forEach((element) => {
      ids.set(element.id, "combat-" + element.id);
      element.id = "combat-" + element.id;
    });
    clone.id = "combat-player-figure";
    clone.removeAttribute("role");
    clone.removeAttribute("aria-label");
    clone.setAttribute("aria-hidden", "true");
    clone.querySelectorAll("*").forEach((element) => {
      for (const attribute of [...element.attributes])
        if (attribute.value.includes("url(#")) {
          let value = attribute.value;
          for (const [from, to] of ids)
            value = value.split(`url(#${from})`).join(`url(#${to})`);
          element.setAttribute(attribute.name, value);
        }
    });
    node("combat-player-avatar").textContent = "";
    node("combat-player-avatar").appendChild(clone);
  }
  function makeEngine(seed) {
    return CombatEngine.create({
      stats: { ...Equipment.state.resultingStats },
      effects: equippedEffects(),
      rules: rules(),
      seed,
      playerName: node("combat-player-name").textContent,
    });
  }
  function stopClock() {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    lastWallTime = null;
  }
  function frame(now) {
    frameId = null;
    if (!engine || engine.status !== "running") return;
    if (lastWallTime !== null)
      engine.advance(
        Math.min(0.25, Math.max(0, (now - lastWallTime) / 1000)) *
          settings.speed,
      );
    lastWallTime = now;
    if (engine.time - lastRenderAt >= 0.1 || engine.status === "finished") {
      renderBattle();
      lastRenderAt = engine.time;
    }
    if (engine.status === "running") frameId = requestAnimationFrame(frame);
    else stopClock();
  }
  function startClock() {
    stopClock();
    lastRenderAt = -1;
    frameId = requestAnimationFrame(frame);
  }
  function start(options = {}) {
    if (!kitReady()) {
      text("combat-status", "Equipaggia Arco + Faretra per iniziare");
      return false;
    }
    stopClock();
    engine = makeEngine(options.seed);
    engine.start();
    lastLogVersion = -1;
    renderBattle();
    startClock();
    return true;
  }
  function pauseToggle() {
    if (!engine) return;
    if (engine.status === "running") {
      engine.pause();
      stopClock();
    } else if (engine.status === "paused") {
      engine.resume();
      startClock();
    }
    renderBattle();
  }
  function reset() {
    stopClock();
    engine = makeEngine();
    lastLogVersion = -1;
    renderBattle();
  }
  function logText(event) {
    const playerName = node("combat-player-name").textContent,
      enemyName = CombatData.enemies.guardian.name;
    if (event.type === "playerAction")
      return `${event.critical ? "CRITICO! " : ""}${playerName} usa ${ability(event.abilityId).name} — ${event.damage} danni`;
    if (event.type === "enemyAction")
      return `${enemyName} usa ${CombatData.enemies.guardian.attacks.find((a) => a.id === event.abilityId).name} — ${event.damage} danni`;
    if (event.type === "dodge")
      return `${playerName} schiva il colpo del Guardiano`;
    if (event.type === "dot")
      return `${CombatData.effects[event.effectId].name} — ${event.damage} danni`;
    if (event.type === "itemProc")
      return `${Equipment.state.inventory.find((i) => i.id === event.itemId)?.name || "Oggetto"} attiva Sanguinamento potenziato`;
    if (event.type === "effectApply" || event.type === "effectRefresh")
      return `${CombatData.effects[event.effectId].name} ${event.type === "effectRefresh" ? "rinnovato" : "applicato"}${event.origin?.abilityId ? ` · ${ability(event.origin.abilityId).name}` : ""}`;
    if (event.type === "effectExpire")
      return `${CombatData.effects[event.effectId].name} terminato`;
    if (event.type === "result")
      return event.outcome === "victory" ? "VITTORIA" : "SCONFITTA";
    return "";
  }
  function effectSource(effect) {
    if (effect.origin.itemId)
      return (
        Equipment.state.inventory.find(
          (item) => item.id === effect.origin.itemId,
        )?.name || "Oggetto equipaggiato"
      );
    return (
      ability(effect.origin.abilityId)?.name ||
      node("combat-player-name").textContent
    );
  }
  function renderEffects(id, effects, time) {
    node(id).innerHTML = effects.length
      ? effects
          .map(
            (effect) =>
              `<span class="effect-chip ${effect.kind}" title="Origine: ${effectSource(effect)} · ${effect.stacks}/${effect.maxStacks} stack">${effect.name} · ${Math.max(0, effect.expiresAt - time).toFixed(1)}s${effect.stacks > 1 ? ` ×${effect.stacks}` : ""}</span>`,
          )
          .join("")
      : '<span class="no-effect">Nessun effetto</span>';
  }
  function renderBattle() {
    const snapshot = engine.snapshot();
    for (const side of ["player", "enemy"]) {
      const actor = snapshot[side];
      text(`combat-${side}-hp`, `${actor.hp} / ${actor.maxHp} HP`);
      const bar = node(`combat-${side}-bar`);
      bar.setAttribute("aria-valuemax", actor.maxHp);
      bar.setAttribute("aria-valuenow", actor.hp);
      bar.firstElementChild.style.width = `${(100 * actor.hp) / actor.maxHp}%`;
      renderEffects(`combat-${side}-effects`, actor.effects, snapshot.time);
      const current =
        side === "player"
          ? ability(actor.lastAbility)
          : CombatData.enemies.guardian.attacks.find(
              (a) => a.id === actor.lastAbility,
            );
      text(`combat-${side}-action`, current ? current.name : "In attesa");
    }
    const special = snapshot.enemy.attacks.find(
      (attack) => attack.cooldown > 0,
    );
    text(
      "combat-enemy-special",
      `Speciale ${Math.max(0, (snapshot.enemy.cooldowns[special.id] || 0) - snapshot.time).toFixed(1)}s`,
    );
    text("combat-time", formatTime(snapshot.time));
    text(
      "combat-status",
      {
        idle: "Pronto",
        running: "In combattimento",
        paused: "In pausa",
        finished:
          snapshot.result?.outcome === "victory" ? "Vittoria" : "Sconfitta",
      }[snapshot.status],
    );
    text(
      "combat-gcd",
      `GCD ${Math.max(0, snapshot.player.nextActionAt - snapshot.time).toFixed(1)}s`,
    );
    node("combat-start").disabled =
      !kitReady() ||
      snapshot.status === "running" ||
      snapshot.status === "paused";
    node("combat-start").textContent =
      snapshot.status === "finished"
        ? "Nuovo combattimento"
        : "Inizia combattimento";
    node("combat-pause").disabled = !["running", "paused"].includes(
      snapshot.status,
    );
    node("combat-pause").textContent =
      snapshot.status === "paused" ? "Riprendi" : "Pausa";
    node("combat-cooldowns").innerHTML = CombatData.abilities
      .map((skill) => {
        const remaining = Math.max(
          0,
          (snapshot.player.cooldowns[skill.id] || 0) - snapshot.time,
        );
        return `<div data-cooldown="${skill.id}"><span>${skill.name}</span><strong>${remaining > 0 ? `${remaining.toFixed(1)}s` : "Pronta"}</strong></div>`;
      })
      .join("");
    if (lastLogVersion !== snapshot.logVersion) {
      node("combat-log").innerHTML =
        [...snapshot.log]
          .reverse()
          .map(
            (event) =>
              `<li><time>${formatTime(event.time)}</time><span>${logText(event)}</span></li>`,
          )
          .join("") ||
        '<li class="hint">Lo scontro non è ancora iniziato.</li>';
      lastLogVersion = snapshot.logVersion;
    }
    node("combat-result").hidden = !snapshot.result;
    if (snapshot.result) {
      text(
        "combat-result-heading",
        snapshot.result.outcome === "victory" ? "VITTORIA" : "SCONFITTA",
      );
      const result = snapshot.result;
      node("combat-result-stats").innerHTML = [
        ["Durata", `${result.duration.toFixed(1)}s`],
        ["Danno totale", result.damage],
        ["DPS medio", result.dps.toFixed(1)],
        ["Danno subito", result.damageTaken],
        ["Critici", result.criticals],
        [
          "Abilità più usata",
          result.mostUsed
            ? `${ability(result.mostUsed.abilityId).name} ×${result.mostUsed.count}`
            : "Nessuna",
        ],
      ]
        .map(
          ([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`,
        )
        .join("");
    }
  }
  function equipmentChanged() {
    const fingerprint = JSON.stringify({
      stats: Equipment.state.resultingStats,
      equipment: Object.values(Equipment.state.equipment).map(
        (entry) => entry.equippedItem,
      ),
    });
    const appearance = JSON.stringify({
      character: Equipment.state.character,
      items: Object.values(Equipment.state.equipment).map(
        (entry) => entry.appearanceItem,
      ),
    });
    if (appearance !== lookKey) {
      lookKey = appearance;
      clonePlayer();
    }
    if (fingerprint === gearKey) return;
    const hadFight = engine && engine.status !== "idle";
    gearKey = fingerprint;
    reset();
    node("combat-requirement").hidden = kitReady();
    if (hadFight)
      text(
        "combat-status",
        "Equipaggiamento aggiornato: avvia un nuovo scontro",
      );
  }
  node("combat-start").addEventListener("click", () => start());
  node("combat-again").addEventListener("click", () => start());
  node("combat-pause").addEventListener("click", pauseToggle);
  node("combat-reset").addEventListener("click", reset);
  node("combat-go-equipment").addEventListener("click", () =>
    window.NymeriaNavigation.showScreen("equipment"),
  );
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.combatMode) {
      settings.mode = button.dataset.combatMode;
      updateConfiguration();
    }
    if (button.dataset.combatSpeed) {
      settings.speed = Number(button.dataset.combatSpeed);
      lastWallTime = null;
      updateConfiguration();
    }
    if (button.dataset.move && settings.mode === "custom") {
      const index = settings.rules.findIndex(
          (rule) => rule.abilityId === button.dataset.rule,
        ),
        other = index + Number(button.dataset.move);
      if (other >= 0 && other < settings.rules.length) {
        [settings.rules[index], settings.rules[other]] = [
          settings.rules[other],
          settings.rules[index],
        ];
        updateConfiguration();
      }
    }
  });
  node("combat-priorities").addEventListener("change", (event) => {
    if (settings.mode !== "custom") return;
    const element = event.target;
    const row = settings.rules.find(
      (rule) =>
        rule.abilityId ===
        (element.dataset.condition || element.dataset.threshold),
    );
    if (!row) return;
    if (element.dataset.condition)
      row.condition = { type: element.value, threshold: 25 };
    if (element.dataset.threshold)
      row.condition.threshold = Number(element.value);
    updateConfiguration();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && engine?.status === "running") {
      engine.pause();
      stopClock();
      renderBattle();
    }
  });
  Equipment.subscribe(equipmentChanged);
  equipmentChanged();
  renderSettings();
  saveSettings();
  return {
    start,
    reset,
    get engine() {
      return engine;
    },
    get settings() {
      return CombatData.copy(settings);
    },
    STORAGE_KEY,
  };
})();
