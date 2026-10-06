/* Real Combat/Progression integration; no alternate XP or reward implementation. */
const assert = require("node:assert/strict");
const fixture = require("./character-fixture.cjs");
const Combat = require("../combat-engine");
const Data = require("../combat-data");
const Progression = require("../progression-data");
const Storage = require("../progression-store");
function fight(f, custom = false, seed = 1) {
  if (custom)
    f.setSettings({
      mode: "custom",
      rules: f.system.snapshot().profile.defaultRules,
    });
  const snapshot = f.system.snapshot();
  const engine = Combat.create({
    ...snapshot,
    seed,
    rules: custom
      ? snapshot.profile.defaultRules.map((r) => ({ ...r }))
      : snapshot.rules,
  });
  engine.start();
  engine.advance(180);
  assert.equal(engine.status, "finished");
  return engine;
}
let checks = 0;
async function check(name, test) {
  await test();
  checks++;
  console.log("PASS " + name);
}
(async () => {
  await check(
    "enemy rewards data depend on level/difficulty, Guardian gives 35 XP/4 Corone",
    () => {
      assert.deepEqual(Data.enemyRewards(Data.enemies.guardian), {
        xp: 35,
        crowns: 4,
      });
      assert.deepEqual(
        Data.enemyRewards({
          ...Data.enemies.guardian,
          level: 2,
          difficulty: 3,
        }),
        { xp: 210, crowns: 24 },
      );
    },
  );
  for (const cls of ["warden", "hunter"])
    for (const custom of [false, true]) {
      await check(
        `${cls} ${custom ? "PERSONALIZZATA" : "AUTO"} real victory → persisted XP/Corone exactly once`,
        async () => {
          const f = fixture();
          f.kit(cls);
          const ticket = (await f.system.beginManualCombat("guardian")).ticket;
          const engine = fight(f, custom);
          assert.equal(engine.result.outcome, "victory");
          const result = await f.system.awardManualCombat(
            ticket.id,
            engine.result.outcome,
          );
          assert.ok(result.ok);
          assert.equal(result.receipt.rewards.xp, 35);
          assert.equal(result.receipt.rewards.crowns, 4);
          assert.equal(f.store.state.totalXP, 35);
          assert.equal(f.store.state.crowns, 4);
          const persisted = JSON.parse(f.memory.get(Storage.KEY));
          assert.equal(persisted.totalXP, 35);
          assert.equal(persisted.manualCombatTickets.length, 0);
          assert.equal(
            (await f.system.awardManualCombat(ticket.id, "victory")).ok,
            false,
          );
          const restored = fixture({ memory: f.memory });
          assert.equal(restored.store.state.totalXP, 35);
          assert.equal(restored.store.state.crowns, 4);
          assert.equal(
            (await restored.system.awardManualCombat(ticket.id, "victory")).ok,
            false,
          );
        },
      );
      await check(
        `${cls} ${custom ? "PERSONALIZZATA" : "AUTO"} real defeat → 0 XP/Corone`,
        async () => {
          const f = fixture();
          f.kit(cls);
          for (const slot of Object.keys(f.equipment.state.equipment))
            if (!["mainHand", "support"].includes(slot))
              f.equipment.unequip(slot);
          const snapshot = f.system.snapshot();
          if (custom)
            snapshot.rules = snapshot.profile.abilities.map((a) => ({
              abilityId: a.id,
              condition: { type: "playerHpBelow", threshold: 1 },
            }));
          const engine = Combat.create({
            ...snapshot,
            seed: cls === "warden" ? 3 : 1,
          });
          engine.start();
          engine.advance(180);
          assert.equal(engine.result.outcome, "defeat");
          const ticket = (await f.system.beginManualCombat("guardian")).ticket;
          const result = await f.system.awardManualCombat(
            ticket.id,
            engine.result.outcome,
          );
          assert.ok(result.ok);
          assert.deepEqual(result.receipt.rewards, { xp: 0, crowns: 0 });
          assert.equal(f.store.state.totalXP, 0);
          assert.equal(f.store.state.crowns, 0);
        },
      );
    }
  await check(
    "third Guardian victory reaches level 2; Equipment recalculates immediately",
    async () => {
      const f = fixture();
      f.kit();
      const original = f.equipment.state.resultingStats.agility;
      for (let i = 0; i < 3; i++) {
        const ticket = (await f.system.beginManualCombat("guardian")).ticket;
        const result = await f.system.awardManualCombat(
          ticket.id,
          fight(f).result.outcome,
        );
        assert.deepEqual(result.levelUps, i === 2 ? [2] : []);
      }
      assert.equal(f.store.state.totalXP, 105);
      assert.equal(f.store.state.level, 2);
      assert.equal(f.store.state.currentXP, 25);
      assert.equal(f.store.state.crowns, 12);
      assert.equal(f.equipment.state.resultingStats.agility, original + 3);
    },
  );
  await check(
    "data-driven large reward crosses multiple levels through the existing curve",
    async () => {
      const f = fixture();
      const original = Data.enemies.guardian.level;
      try {
        Data.enemies.guardian.level = 30;
        const ticket = (await f.system.beginManualCombat("guardian")).ticket;
        const result = await f.system.awardManualCombat(ticket.id, "victory");
        assert.deepEqual(result.levelUps, [2, 3, 4]);
        assert.equal(f.store.state.level, 4);
        assert.equal(f.store.state.totalXP, 1050);
      } finally {
        Data.enemies.guardian.level = original;
      }
    },
  );
  await check(
    "cap keeps excess XP without level 21; crowns still awarded",
    async () => {
      const f = fixture();
      await f.store.transact((s) => {
        s.totalXP = Progression.thresholds[19] - 10;
        return { ok: true };
      });
      const ticket = (await f.system.beginManualCombat("guardian")).ticket;
      const result = await f.system.awardManualCombat(ticket.id, "victory");
      assert.deepEqual(result.levelUps, [20]);
      assert.equal(f.store.state.level, 20);
      assert.equal(f.store.state.overflowXP, 25);
      const second = (await f.system.beginManualCombat("guardian")).ticket;
      const capped = await f.system.awardManualCombat(second.id, "victory");
      assert.deepEqual(capped.levelUps, []);
      assert.equal(f.store.state.level, 20);
      assert.equal(f.store.state.overflowXP, 60);
      assert.equal(f.store.state.crowns, 8);
    },
  );
  await check(
    "simultaneous duplicate awards consume one ticket and survive later receipt replacement",
    async () => {
      const f = fixture();
      const ticket = (await f.system.beginManualCombat("guardian")).ticket;
      const results = await Promise.all([
        f.system.awardManualCombat(ticket.id, "victory"),
        f.system.awardManualCombat(ticket.id, "victory"),
      ]);
      assert.equal(results.filter((r) => r.ok).length, 1);
      const other = (await f.system.beginManualCombat("guardian")).ticket;
      await f.system.awardManualCombat(other.id, "defeat");
      assert.equal(
        (await f.system.awardManualCombat(ticket.id, "victory")).ok,
        false,
      );
      assert.equal(f.store.state.totalXP, 35);
    },
  );
  await check(
    "failed write awards nothing; retry commits reward and ticket consumption atomically",
    async () => {
      const f = fixture();
      const ticket = (await f.system.beginManualCombat("guardian")).ticket;
      const blocked = fixture({ memory: f.memory, denyWrite: true });
      assert.equal(
        (await blocked.system.awardManualCombat(ticket.id, "victory")).ok,
        false,
      );
      assert.equal(blocked.store.state.totalXP, 0);
      assert.equal(blocked.store.state.manualCombatTickets.length, 1);
      const restored = fixture({ memory: f.memory });
      assert.ok(
        (await restored.system.awardManualCombat(ticket.id, "victory")).ok,
      );
      assert.equal(restored.store.state.totalXP, 35);
    },
  );
  await check(
    "manual reward preserves active expedition preparation and pending expedition claim",
    async () => {
      const f = fixture();
      f.kit();
      await f.system.start("patrol", { seed: 1 });
      const active = f.store.state.activeExpedition;
      for (let i = 0; i < 3; i++) {
        const ticket = (await f.system.beginManualCombat("guardian")).ticket;
        await f.system.awardManualCombat(ticket.id, "victory");
      }
      assert.deepEqual(f.store.state.activeExpedition, active);
      f.clock.value = active.endsAt;
      await f.system.refresh();
      const report = f.store.state.pendingExpeditionResult;
      const ticket = (await f.system.beginManualCombat("guardian")).ticket;
      await f.system.awardManualCombat(ticket.id, "victory");
      assert.deepEqual(f.store.state.pendingExpeditionResult, report);
      await f.system.claim(report.id);
      assert.equal(f.store.state.totalXP, 140 + report.rewards.xp);
      assert.equal(f.store.state.crowns, 16 + report.rewards.crowns);
    },
  );
  await check(
    "older M5 save migrates additively; unfinished fight never pays on load",
    async () => {
      const f = fixture();
      const old = f.store.state;
      delete old.manualCombatTickets;
      delete old.lastCombatReward;
      old.totalXP = 35;
      old.crowns = 4;
      f.memory.set(Storage.KEY, JSON.stringify(old));
      const restored = fixture({ memory: f.memory });
      assert.equal(restored.store.state.totalXP, 35);
      assert.deepEqual(restored.store.state.manualCombatTickets, []);
      await restored.system.beginManualCombat("guardian");
      const again = fixture({ memory: f.memory });
      assert.equal(again.store.state.totalXP, 35);
      assert.equal(again.store.state.crowns, 4);
    },
  );
  console.log(`${checks} manual combat reward integration checks passed.`);
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
