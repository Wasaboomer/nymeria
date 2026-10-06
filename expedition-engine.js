/* Bounded headless combat: cost depends on planned encounters, never on offline minutes. */
const ExpeditionEngine = (() => {
  const data =
    typeof module !== "undefined" && module.exports
      ? require("./expedition-data.js")
      : ExpeditionData;
  const combat =
    typeof module !== "undefined" && module.exports
      ? require("./combat-data.js")
      : CombatData;
  const engine =
    typeof module !== "undefined" && module.exports
      ? require("./combat-engine.js")
      : CombatEngine;
  const personal =
    typeof module !== "undefined" && module.exports
      ? require("./personal-loot.js")
      : PersonalLoot;
  function resolve(active) {
    const lootPolicy = personal.forActive(active);
    const lootTable = lootPolicy.lootIds;
    const activity = active.activity;
    const rng = engine.seededRng(active.seed ^ 0x91ab21);
    const plan = [];
    for (let i = 0; i < activity.encounters; i++) {
      const event =
        rng() < activity.eventChance
          ? (active.eventDefinitions || data.events)[
              Math.floor(
                rng() * (active.eventDefinitions || data.events).length,
              )
            ]
          : null;
      plan.push({
        event,
        multiplier: event?.extraEncounter
          ? 1
          : event?.difficultyMultiplier || 1,
        seed: Math.floor(rng() * 4294967296),
        lootRoll: rng(),
        lootIndex: Math.floor(rng() * lootTable.length),
      });
      if (event?.extraEncounter)
        plan.push({
          event: null,
          multiplier: event.difficultyMultiplier,
          seed: Math.floor(rng() * 4294967296),
          lootRoll: rng(),
          lootIndex: Math.floor(rng() * lootTable.length),
        });
    }
    const rewards = {
      xp: 0,
      crowns: 0,
      materials: { iron: 0, fiber: 0, ether: 0 },
      lootIds: [],
    };
    const encounters = [],
      events = [];
    let hp = null,
      maxHp = 0,
      completed = 0;
    for (const [index, row] of plan.entries()) {
      if (row.event)
        events.push({
          id: row.event.id,
          name: row.event.name,
          description: row.event.description,
        });
      const template = combat.copy(combat.enemies.guardian);
      template.maxHp = Math.round(
        template.maxHp * activity.enemy.hp * row.multiplier,
      );
      template.armor = Math.round(
        template.armor * activity.enemy.armor * row.multiplier,
      );
      template.attacks.forEach(
        (a) =>
          (a.damage = Math.round(
            a.damage * activity.enemy.damage * row.multiplier,
          )),
      );
      const fight = engine.create({
        ...active.snapshot,
        seed: row.seed,
        enemyTemplate: template,
        captureLog: false,
      });
      if (hp !== null)
        fight.player.hp = Math.min(
          fight.player.maxHp,
          hp + fight.player.maxHp * activity.rest,
        );
      fight.start();
      fight.advance(data.maxEncounterSeconds);
      const won = fight.result?.outcome === "victory";
      hp = fight.player.hp;
      maxHp = fight.player.maxHp;
      encounters.push({
        index: index + 1,
        won,
        duration: fight.time,
        damage: fight.metrics.damage,
        damageTaken: fight.metrics.damageTaken,
        hpRemaining: Math.round(hp),
        maxHp,
        outcome: fight.result?.outcome || "timeout",
      });
      if (!won) break;
      completed++;
      rewards.xp += Math.round(
        activity.xpPerEncounter * (row.event?.xpMultiplier || 1),
      );
      rewards.crowns += activity.crownsPerEncounter + (row.event?.crowns || 0);
      const material = ["iron", "fiber", "ether"][index % 3];
      rewards.materials[material] += activity.materialQuantity;
      for (const [key, value] of Object.entries(row.event?.materials || {}))
        rewards.materials[key] += value;
      if (row.lootRoll < activity.lootChance + (row.event?.lootBonus || 0))
        rewards.lootIds.push(lootTable[row.lootIndex]);
    }
    const success = completed === plan.length;
    if (success) {
      rewards.xp += activity.completionXP;
      rewards.crowns += activity.completionCrowns;
      if (rng() < activity.finalLootChance)
        rewards.lootIds.push(lootTable[Math.floor(rng() * lootTable.length)]);
    }
    return {
      id: active.id,
      activityId: activity.id,
      activityName: activity.name,
      success,
      durationMs: active.endsAt - active.startedAt,
      completed,
      total: plan.length,
      encounters,
      events,
      rewards,
      lootPolicy,
      classId: active.snapshot.profile.classId,
      className: active.snapshot.profile.className,
      buildName: active.snapshot.profile.buildName,
      level: active.snapshot.level,
      hpFraction: maxHp ? hp / maxHp : 0,
      testMode: active.testMode,
    };
  }
  function estimate(activity, snapshot) {
    const probes = data.previewSeeds.map((seed) =>
      resolve({
        id: "preview",
        activity,
        snapshot,
        seed,
        startedAt: 0,
        endsAt: activity.durationMs,
      }),
    );
    const wins = probes.filter((p) => p.success).length;
    const health =
      probes.reduce((sum, p) => sum + p.hpFraction, 0) / probes.length;
    return wins === probes.length
      ? health >= 0.5
        ? "Facile"
        : "Adeguata"
      : wins > 0
        ? "Difficile"
        : "Pericolosa";
  }
  return { resolve, estimate };
})();
if (typeof module !== "undefined" && module.exports)
  module.exports = ExpeditionEngine;
