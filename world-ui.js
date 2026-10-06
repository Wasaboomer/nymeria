/* Mobile adapter: presentation clock only; durable actions remain in World/Quest engines. */
const WorldUI = (() => {
  const node = id => document.getElementById(id), escape = QuestUI.escape;
  let view = "places", busy = false, engine = null, ticketId = null;
  let frameId = null, lastTime = null, renderingAt = 0, settling = false;
  let estimateKey = "", estimates = {};
  const marks = {
    haven: "M12 31 30 10 48 31M18 27V48H42V27M25 48V34H35V48M8 48H52",
    path: "M12 49 23 33 19 25 32 11M28 49 36 35 31 28 42 11M7 18H17M43 41H53",
    wood: "M14 49V19M7 30 14 20 23 29M14 20 22 10M32 49V12M23 24 32 13 43 24M46 49V25M38 36 46 26 54 35",
    ruins: "M10 49V24H21V49M36 49V17H48V49M6 24H25M32 17H52M21 32H36M28 12 32 4M6 49H54",
    ford: "M8 32Q19 18 30 32T52 32M7 43Q19 29 30 43T53 43M17 22V9M43 22V9M17 14H43",
    tower: "M18 49 20 17H40L42 49M17 17V8H24V13H28V8H35V13H42V17M27 49V35H34V49M28 23H33",
  };
  function mark(id) {
    return `<svg viewBox="0 0 60 60" aria-hidden="true" class="world-mark"><path d="${marks[id]}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  function selectView(value) {
    if (!["places", "journal", "discoveries"].includes(value)) return;
    view = value;
    render();
  }
  async function action(work) {
    if (busy) return;
    busy = true; render();
    try {
      const result = await work();
      node("world-message").textContent = result?.message || "";
      return result;
    } catch (error) {
      node("world-message").textContent = `Operazione non applicata: ${error.message}`;
      return { ok: false };
    } finally { busy = false; render(); }
  }
  function render() {
    const state = ProgressionStore.state, frontier = state.frontier;
    node("panel-world").setAttribute("aria-busy", String(busy));
    node("world-zone-name").textContent = WorldData.zone.name;
    node("world-zone-story").textContent = WorldData.zone.description;
    const main = QuestData.quests.filter(q => q.type === "main");
    node("world-summary").innerHTML = `<span>Livello <b>${state.level}</b> · ${state.currentXP}/${state.requiredXP || "MAX"} XP</span><span><b>${state.crowns}</b> Corone</span><small>Storia ${main.filter(q => frontier.quests[q.id].status === "claimed").length}/${main.length}</small>`;
    node("world-storage").textContent = ProgressionStore.error;
    for (const b of document.querySelectorAll("[data-world-view]")) b.setAttribute("aria-pressed", String(b.dataset.worldView === view));
    for (const [id, value] of [["world-places", "places"], ["world-journal", "journal"], ["world-discoveries", "discoveries"]]) node(id).hidden = view !== value;
    node("world-tracked").innerHTML = QuestUI.tracker(state);
    node("world-tracked").hidden = !frontier.trackedQuest;
    node("world-locations").innerHTML = WorldData.locations.map(location => {
      const unlocked = state.unlockedContent.includes(`world:${location.id}`), current = location.id === frontier.location;
      return `<button class="world-node ${current ? "world-node-current" : ""}" data-world-enter="${location.id}" aria-pressed="${current}" ${!unlocked || frontier.activeEncounter || busy ? "disabled" : ""}>${mark(location.mark)}<span><strong>${escape(location.name)}</strong><small>${unlocked ? current ? "Ti trovi qui" : `Esplora · Liv. indicativo ${location.level}` : escape(location.unlockHint)}</small></span><b aria-hidden="true">${unlocked ? '<svg viewBox="0 0 12 12" width="12" height="12"><path d="M3 9 9 3M3 3H9V9" fill="none" stroke="currentColor"/></svg>' : '<svg viewBox="0 0 12 12" width="12" height="12"><path d="M6 1 11 6 6 11 1 6Z" fill="none" stroke="currentColor"/></svg>'}</b></button>`;
    }).join("");
    const location = WorldData.location(frontier.location);
    const key = JSON.stringify([location.id, Equipment.state.resultingStats, ClassSystem.state, Object.values(Equipment.state.equipment).map(e => e.equippedItem)]);
    if (key !== estimateKey) {
      estimateKey = key;
      estimates = Object.fromEntries(location.enemies.map(id => [id, WorldSystem.estimate(id)]));
    }
    node("world-location-detail").innerHTML = `<div class="world-place-heading">${mark(location.mark)}<div><span class="world-eyebrow">LUOGO · LIV. ${location.level}</span><h3>${escape(location.name)}</h3></div></div><p>${escape(location.description)}</p>${WorldData.npcs.filter(n => n.location === location.id).map(npc => {
      const dialogue = npc.dialogues.filter(d => !d.after || frontier.quests[d.after]?.status === "claimed").pop();
      return `<article class="world-npc"><div class="npc-heading"><span class="npc-seal" aria-hidden="true">${npc.name.split(" ")[0][0]}</span><div><h4>${escape(npc.name)}</h4><small>${escape(npc.role)}</small></div><button data-world-talk="${npc.id}">Parla</button></div><p>«${escape(dialogue.text)}»</p>${QuestUI.offers(npc.id, state)}</article>`;
    }).join("")}${location.points.length ? '<h4>Da esplorare</h4>' : ""}${location.points.map(point => `<button class="world-point" data-world-explore="${point.id}" ${point.requiresDefeat && !frontier.defeatedEnemies.includes(point.requiresDefeat) ? "disabled" : ""}><strong>${escape(point.name)}</strong><small>${point.requiresDefeat && !frontier.defeatedEnemies.includes(point.requiresDefeat) ? "Passaggio controllato dal comandante" : point.discovery ? "Segreto professionale · esamina" : point.collect ? "Esplorazione · trova un campione" : "Esamina →"}</small></button>`).join("")}${location.enemies.length ? '<h4>Incontri</h4><p class="hint">La valutazione considera livello, kit e build. Ogni vittoria avanza le missioni accettate.</p>' : ""}<div class="world-enemies">${location.enemies.map(id => {
      const enemy = WorldData.enemy(id);
      return `<article class="world-enemy enemy-${enemy.kind}"><div><small>${enemy.kind === "boss" ? "BOSS" : enemy.kind === "miniboss" ? "MINIBOSS" : "INCONTRO"} · LIV. ${enemy.level}</small><h4>${escape(enemy.name)}</h4><p>${estimates[id]} · ${enemy.rewards.xp} XP · ${enemy.rewards.crowns} Corone</p><small>${enemy.drops.map(id => escape(WorldData.supplyNames[id])).join(" · ") || "Nessun oggetto di missione"}</small></div><button data-world-fight="${id}" ${frontier.activeEncounter ? "disabled" : ""}>Affronta</button></article>`;
    }).join("")}</div>${!ClassSystem.kitRequirement(Equipment.equipped("mainHand"), Equipment.equipped("support")) ? '<p class="compatibility">Prepara il kit della classe prima degli incontri.</p><button data-world-equipment>Prepara equipaggiamento</button>' : ""}`;
    node("quest-journal").innerHTML = QuestUI.journal(state);
    node("world-discovery-list").innerHTML = frontier.discoveries.length ? frontier.discoveries.map(id => {
      const d = WorldData.discoveries.find(x => x.id === id);
      return `<article class="discovery-card"><span class="world-eyebrow">SEGRETO PROFESSIONALE</span><h4>${escape(d.name)}</h4><p>${escape(d.description)}</p><strong>${escape(d.status)}</strong><small>${escape(d.requirement)}</small></article>`;
    }).join("") : '<p class="hint">Nessuna scoperta ancora registrata. Elar conserva ricordi inesplorati.</p>';
    node("world-achievements").innerHTML = frontier.achievements.length ? frontier.achievements.map(id => `<article class="discovery-card"><span class="world-eyebrow">TITOLO OTTENUTO</span><h4>${escape(WorldData.achievements.find(x => x.id === id).name)}</h4><p>${escape(WorldData.zone.epilogue)}</p></article>`).join("") : '<p class="hint">La Frontiera deve ancora conoscere il tuo nome.</p>';
    node("world-debug").hidden = !WorldSystem.testMode;
    for (const button of node("world-debug").querySelectorAll("button")) button.disabled = busy;
    node("world-battle").hidden = !frontier.activeEncounter;
    const result = frontier.lastEncounter;
    node("world-result").hidden = !result || !!frontier.activeEncounter;
    if (result) node("world-result").innerHTML = `<span class="world-eyebrow">${escape(result.enemyName)}</span><h3>${result.outcome === "victory" ? "VITTORIA" : "SCONFITTA"}</h3><p>+${result.rewards.xp} XP · +${result.rewards.crowns} Corone</p><p class="level-up-feedback">${escape(ProgressionData.levelUpSummary(result))}</p>${result.drops.length ? `<small>${result.drops.map(id => escape(WorldData.supplyNames[id])).join(" · ")}</small>` : ""}${result.outcome === "defeat" ? '<p class="hint">Ritorno a Veyra. Nessuna perdita di livello o equipaggiamento. Nessuna penalità permanente.</p>' : ""}${WorldData.enemy(result.enemyId)?.kind === "boss" && result.outcome === "victory" ? `<p>${escape(WorldData.zone.epilogue)}</p><button data-world-view="journal">Apri il Diario · riscuoti la missione</button>` : ""}`;
    const reward = frontier.lastQuestClaim;
    node("world-quest-reward").hidden = !reward;
    if (reward) node("world-quest-reward").innerHTML = `<span class="world-eyebrow">RICOMPENSA SALVATA</span><h4>${escape(reward.title)}</h4><p>${QuestUI.rewards(reward.rewards)}</p>${reward.loot.map(row => `<small>${escape(GearData.items.find(x => x.id === row.itemId)?.name || row.itemId)}${row.duplicate ? " · duplicato convertito in 2 Ferro" : " · aggiunto all'inventario"}</small>`).join("")}<p class="level-up-feedback">${escape(ProgressionData.levelUpSummary(reward))}</p>`;
    if (frontier.activeEncounter) {
      if (ticketId !== frontier.activeEncounter.id) {
        stopClock(); engine = null; ticketId = frontier.activeEncounter.id;
      }
      renderBattle();
    } else if (engine && !settling) { stopClock(); engine = null; ticketId = null; }
    node("world-battle-abandon").disabled = settling || busy;
    if (busy || frontier.activeEncounter) {
      for (const b of node("world-location-detail").querySelectorAll("button")) b.disabled = true;
    }
    if (busy) for (const b of node("panel-world").querySelectorAll("[data-quest-accept], [data-quest-claim], [data-quest-track]")) b.disabled = true;
  }
  function stopClock() {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null; lastTime = null;
  }
  function resume() {
    const ticket = ProgressionStore.state.frontier.activeEncounter;
    if (!ticket || settling) return;
    if (!engine || ticketId !== ticket.id) {
      ticketId = ticket.id;
      engine = CombatEngine.create({ ...ticket.snapshot, enemyTemplate: ticket.template, seed: ticket.seed });
      engine.start();
    } else engine.resume();
    if (engine.result || engine.time >= 180) { settle(); return; }
    stopClock(); renderBattle(); frameId = requestAnimationFrame(frame);
  }
  function renderBattle() {
    const ticket = ProgressionStore.state.frontier.activeEncounter;
    if (!ticket) return;
    node("world-battle-name").textContent = ticket.template.name;
    node("world-battle-profile").textContent = `${ticket.snapshot.profile.className} · ${ticket.snapshot.profile.buildName} · Livello ${ticket.snapshot.level}`;
    node("world-player-name").textContent = "Iria";
    node("world-enemy-name").textContent = ticket.template.name;
    const hp = engine?.player.hp ?? CombatData.formulas.maxHp(ticket.snapshot.stats) * (ticket.snapshot.profile.modifiers.hpMultiplier || 1);
    const max = engine?.player.maxHp ?? Math.round(hp);
    node("world-player-hp").textContent = `${Math.round(hp)} / ${max} HP`;
    node("world-player-bar").style.width = `${100 * hp / max}%`;
    node("world-enemy-hp").textContent = `${engine?.enemy.hp ?? ticket.template.maxHp} / ${ticket.template.maxHp} HP`;
    node("world-enemy-bar").style.width = `${100 * (engine?.enemy.hp ?? ticket.template.maxHp) / ticket.template.maxHp}%`;
    node("world-battle-clock").textContent = `${(engine?.time || 0).toFixed(1)}s`;
    node("world-battle-resume").hidden = engine?.status === "running";
    node("world-battle-resume").textContent = engine?.result || engine?.time >= 180 ? "Salva risultato · riprova" : "Riprendi incontro";
    node("world-battle-resume").disabled = settling;
    node("world-battle-pause").disabled = engine?.status !== "running" || settling;
    node("world-battle-log").innerHTML = engine ? engine.log.slice(-5).reverse().map(event => `<li>${event.time.toFixed(1)}s · ${event.type === "enemyAction" ? ticket.template.name : event.type === "playerAction" ? ticket.snapshot.profile.abilities.find(a => a.id === event.abilityId)?.name : event.type === "result" ? "Scontro concluso" : event.type === "dodge" ? "Schivata" : "Effetto"}${event.damage !== undefined ? ` · ${event.damage} danni` : ""}</li>`).join("") : '<li class="hint">Incontro salvato. Riprendi quando vuoi.</li>';
  }
  async function settle() {
    if (settling || !ticketId) return;
    stopClock(); settling = true; renderBattle();
    await action(() => WorldSystem.finishEncounter(ticketId));
    settling = false;
    if (!ProgressionStore.state.frontier.activeEncounter) { engine = null; ticketId = null; }
    render();
  }
  function frame(time) {
    frameId = null;
    if (!engine || engine.status !== "running") return;
    if (lastTime !== null) engine.advance(Math.min(0.25, Math.max(0, (time - lastTime) / 1000)) * CombatUI.settings.speed);
    lastTime = time;
    if (time - renderingAt > 100) { renderingAt = time; renderBattle(); }
    if (engine.result || engine.time >= 180) settle();
    else frameId = requestAnimationFrame(frame);
  }
  node("panel-world").addEventListener("click", async event => {
    const b = event.target.closest("button");
    if (!b || b.disabled) return;
    if (b.dataset.worldView) { selectView(b.dataset.worldView); return; }
    if (b.hasAttribute("data-world-equipment")) { NymeriaNavigation.showScreen("equipment"); return; }
    if (b.dataset.worldEnter) return action(() => WorldSystem.enter(b.dataset.worldEnter));
    if (b.dataset.worldTalk) return action(() => WorldSystem.talk(b.dataset.worldTalk));
    if (b.dataset.worldExplore) return action(() => WorldSystem.explore(b.dataset.worldExplore));
    if (b.dataset.questAccept) return action(() => QuestSystem.accept(b.dataset.questAccept));
    if (b.dataset.questClaim) return action(() => QuestSystem.claim(b.dataset.questClaim));
    if (b.dataset.questTrack) return action(() => QuestSystem.track(b.dataset.questTrack));
    if (b.dataset.questGiver) {
      selectView("places"); return action(() => WorldSystem.enter(QuestData.get(b.dataset.questGiver).location));
    }
    if (b.dataset.worldFight) {
      const result = await action(() => WorldSystem.startEncounter(b.dataset.worldFight));
      if (result?.ok) { resume(); node("world-battle").scrollIntoView({ block: "nearest" }); }
      return;
    }
    if (b.dataset.questDebug) return action(() => QuestSystem.debug(node("world-debug-quest").value, b.dataset.questDebug));
  });
  node("world-battle-resume").addEventListener("click", resume);
  node("world-battle-pause").addEventListener("click", () => { engine?.pause(); stopClock(); renderBattle(); });
  node("world-battle-abandon").addEventListener("click", () => action(() => WorldSystem.abandonEncounter()));
  node("world-debug-quest").innerHTML = QuestData.quests.map(q => `<option value="${q.id}">${escape(q.title)}</option>`).join("");
  node("world-debug-location").innerHTML = WorldData.locations.map(x => `<option value="${x.id}">${escape(x.name)}</option>`).join("");
  node("world-debug-unlock").addEventListener("click", () => action(() => WorldSystem.debug("unlock", node("world-debug-location").value)));
  node("world-debug-xp").addEventListener("click", () => action(() => WorldSystem.debug("xp", 500)));
  node("world-debug-boss").addEventListener("click", async () => {
    const result = await action(async () => {
      const unlocked = await WorldSystem.debug("unlock", "silent-tower");
      if (!unlocked.ok) return unlocked;
      const entered = await WorldSystem.enter("silent-tower");
      return entered.ok ? WorldSystem.startEncounter("silence-keeper") : entered;
    });
    if (result?.ok) resume();
  });
  ProgressionStore.subscribe(render); Equipment.subscribe(render); ClassSystem.subscribe(render);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && engine?.status === "running") { engine.pause(); stopClock(); renderBattle(); }
  });
  render();
  return { selectView, render, resume, settle, get engine() { return engine; } };
})();
