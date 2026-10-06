const assert = require('node:assert/strict');
const fixture = require('./character-fixture.cjs');
const Data = require('../progression-data.js');
const Combat = require('../combat-engine.js');
const expected = {
  warden: { force: 2, agility: 0, vigor: 3, spirit: 1, critical: 0 },
  hunter: { force: 0, agility: 3, vigor: 1, spirit: 0, critical: 0.5 },
};
(async () => {
  let checks = 0;
  for (const [cls, growth] of Object.entries(expected)) {
    for (const level of [1, 2, 10, 20]) {
      const f = fixture();
      f.kit(cls);
      const initial = { ...f.equipment.state.resultingStats };
      await f.level(level);
      const stats = f.equipment.state.resultingStats;
      for (const key of Object.keys(growth))
        assert.equal(stats[key], initial[key] + (level - 1) * growth[key]);
      const snapshot = f.system.snapshot();
      assert.equal(Combat.create(snapshot).player.maxHp,
        Math.round(Math.round(160 + stats.vigor * 9) * (snapshot.profile.modifiers.hpMultiplier || 1)));
      f.equipment.reconcileProgression();
      assert.deepEqual(f.equipment.state.resultingStats, stats);
      const restored = fixture({ memory: f.memory });
      assert.equal(restored.classes.state.classId, cls);
      assert.deepEqual(restored.read('Equipment.state.resultingStats'), JSON.parse(JSON.stringify(stats)));
      console.log(`PASS ${cls} level ${level}: growth, HP, deterministic recalculation, persistence`);
      checks++;
    }
  }
  const f = fixture();
  await f.level(10);
  // No gear: switching classes must affect only the growth calculation.
  for (const slot of Object.keys(f.equipment.state.equipment)) f.equipment.unequip(slot);
  for (const cls of ['warden', 'hunter', 'warden', 'hunter']) {
    f.classes.selectClass(cls);
    assert.deepEqual(f.read('Equipment.state.resultingStats'),
      Data.baseStats(10, f.read('Equipment.baseStats'), expected[cls]));
  }
  console.log('PASS repeated class changes never accumulate growth'); checks++;
  for (const cls of Object.keys(expected)) {
    const g = fixture(); g.kit(cls);
    await g.store.transact(s => { s.totalXP = 79; return { ok: true }; });
    const ticket = await g.system.beginManualCombat('guardian');
    const result = await g.system.awardManualCombat(ticket.id || ticket.ticket?.id, 'victory');
    assert.ok(result.ok, JSON.stringify(result));
    assert.deepEqual(result.receipt.statGains, Data.statGains(expected[cls], 1));
    assert.equal(result.receipt.growthClassId, cls);
    const restored = fixture({ memory: g.memory });
    restored.classes.selectClass(cls === 'hunter' ? 'warden' : 'hunter');
    assert.deepEqual(restored.store.state.lastCombatReward.statGains, result.receipt.statGains);
    assert.ok(Data.levelUpSummary(result.receipt).includes(cls === 'hunter' ? '+0,5% Critico' : '+3 Vigor'));
    console.log(`PASS ${cls}: combat level-up gains, receipt persistence and class change`); checks++;
  }
  const expedition = fixture({ testMode: true });
  expedition.kit('warden');
  await expedition.finish();
  const pending = expedition.store.state.pendingExpeditionResult;
  await expedition.store.transact(s => { s.totalXP = 79; return { ok: true }; });
  await expedition.system.claim(pending.id);
  const receipt = expedition.store.state.lastClaim;
  assert.ok(receipt.levelUps.length);
  assert.deepEqual(receipt.statGains, Data.statGains(expected.warden, receipt.levelUps.length));
  assert.deepEqual(fixture({memory: expedition.memory}).store.state.lastClaim.statGains, receipt.statGains);
  console.log('PASS expedition claim gains and persisted report'); checks++;
  assert.deepEqual(Data.baseStats(2, {spirit:11, critical:0}, {spirit:4, critical:0.25}), {spirit:15, critical:0.25});
  assert.deepEqual(Data.statGains(expected.hunter, 9), { agility: 27, vigor: 9, critical: 4.5 });
  assert.equal(Data.levelUpSummary({levelUps:[2], resultingLevel:2}), 'LIVELLO 2 RAGGIUNTO');
  console.log(`${checks} stat-growth checks passed; multi-level totals and old receipts verified.`);
})().catch(error => { console.error(error); process.exit(1); });
