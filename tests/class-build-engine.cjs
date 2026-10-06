/* M4 integration: real Equipment catalogue, class profiles and the shared engine. */
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  vm = require("node:vm"),
  path = require("node:path");
const Engine = require("../combat-engine.js"),
  Data = require("../combat-data.js");
const storage = new Map();
function model() {
  const context = vm.createContext({
    localStorage: {
      getItem: (key) => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value),
    },
  });
  for (const file of [
    "items",
    "equipment-data",
    "equipment",
    "combat-data",
    "classes-data",
    "build-system",
    "class-system",
  ])
    vm.runInContext(
      fs.readFileSync(path.join(__dirname, "..", file + ".js"), "utf8"),
      context,
    );
  return {
    run: (code) => vm.runInContext(code, context),
    read: (expression) =>
      JSON.parse(vm.runInContext(`JSON.stringify(${expression})`, context)),
  };
}
const m = model();
function setup(cls = "hunter", build, bare = false, thorn = false) {
  m.run(
    `Equipment.reset();ClassSystem.selectClass('${cls}');ClassSystem.selectBuild('${build || (cls === "hunter" ? "predator" : "bulwark")}');Equipment.equip('${cls === "hunter" ? "bow" : "sword"}','mainHand');Equipment.equip('${cls === "hunter" ? (thorn ? "thorn-quiver" : "quiver") : "shield"}','support');`,
  );
  if (bare)
    m.run(
      `for(const slot of GearData.slots)if(!['mainHand','support'].includes(slot.id))Equipment.unequip(slot.id)`,
    );
  return {
    stats: m.read("Equipment.state.resultingStats"),
    profile: m.read(
      'ClassSystem.combatProfile(undefined,undefined,{main:Equipment.equipped("mainHand"),support:Equipment.equipped("support")})',
    ),
    effects: m.read(
      "Equipment.state.inventory.filter(i=>i.equipped).flatMap(i=>i.effects.map(e=>({...e,itemId:i.id})))",
    ),
  };
}
const create = (options) => Engine.create({ seed: 1, ...options });
const finish = (options) => {
  const e = create(options);
  e.start();
  e.advance(180);
  assert.equal(e.status, "finished");
  return e;
};
let checks = 0;
function check(name, fn) {
  fn();
  checks++;
  console.log("PASS " + name);
}
check(
  "selection/build persistence, retained tendencies, invalid selections",
  () => {
    m.run(
      `ClassSystem.selectClass('warden');ClassSystem.selectBuild('retaliation');ClassSystem.selectClass('hunter');ClassSystem.selectBuild('lacerator')`,
    );
    const restored = model();
    assert.deepEqual(
      restored.read("ClassSystem.state"),
      m.read("ClassSystem.state"),
    );
    m.run(`ClassSystem.selectClass('warden')`);
    assert.equal(m.read("ClassSystem.build().id"), "retaliation");
    assert.equal(m.run(`ClassSystem.selectBuild('predator')`), false);
    assert.equal(m.run(`ClassSystem.selectClass('fake')`), false);
  },
);
check(
  "real kit validation both classes, refused start, inventory preservation",
  () => {
    for (const cls of ["hunter", "warden"]) {
      const good = setup(cls);
      assert.equal(good.profile.kitValid, true);
      m.run(`Equipment.unequip('support')`);
      const bad = create({
        stats: good.stats,
        profile: m.read(
          'ClassSystem.combatProfile(undefined,undefined,{main:Equipment.equipped("mainHand"),support:Equipment.equipped("support")})',
        ),
      });
      bad.start();
      bad.advance(2);
      assert.equal(bad.status, "idle");
      assert.equal(bad.time, 0);
      assert.equal(m.read("Equipment.state.inventory.length"), 44);
      const other = cls === "hunter" ? "warden" : "hunter";
      assert.equal(
        m.run(
          `ClassSystem.kitRequirement(Equipment.equipped('mainHand'), null,'${other}')`,
        ),
        false,
      );
    }
  },
);
check(
  "Risolutezza hit/block generation, costs, cap and insufficient resource",
  () => {
    const e = create(setup("warden"));
    const retaliation = e.abilities.find((a) => a.id === "retaliation");
    assert.equal(e.player.resource.current, 0);
    assert.equal(e.canAfford("retaliation"), false);
    assert.equal(e.playerAction(retaliation), false);
    e.random = () => 0.5;
    e.enemyAction();
    assert.equal(e.player.resource.current, 10);
    e.random = () => 0.1;
    e.enemyAction();
    assert.equal(e.metrics.blocked, 1);
    assert.equal(e.player.resource.current, 38);
    e.playerAction(retaliation);
    assert.equal(e.player.resource.current, 8);
    assert.equal(e.metrics.resourceUsed, 30);
    assert.ok(e.metrics.damage > 0);
    e.gainResource(1000);
    assert.equal(e.player.resource.current, 100);
    assert.ok(e.conditionMet({ type: "resourceAbove", threshold: 99 }));
    assert.equal(
      e.conditionMet({ type: "resourceAbove", threshold: 100 }),
      false,
    );
  },
);
check(
  "Concentrazione regeneration, actual skill cost/base recovery, pause and decay policy",
  () => {
    const e = create(setup());
    e.player.resource.current = 0;
    assert.equal(e.canAfford("power"), false);
    e.setRules(
      e.abilities.map((a) => ({
        abilityId: a.id,
        condition: { type: "playerHpBelow", threshold: 1 },
      })),
    );
    e.start();
    e.advance(2);
    assert.ok(Math.abs(e.player.resource.current - 12) < 1e-8);
    e.pause();
    e.advance(10);
    assert.ok(Math.abs(e.player.resource.current - 12) < 1e-8);
    e.player.resource.current = 50;
    e.playerAction(e.abilities.find((a) => a.id === "power"));
    assert.ok(Math.abs(e.player.resource.current - 22) < 1e-8);
    e.player.cooldowns.rapid = 0;
    e.playerAction(e.abilities.find((a) => a.id === "rapid"));
    assert.ok(Math.abs(e.player.resource.current - 26) < 1e-8);
    e.player.resource.decay = 8;
    e.resume();
    e.advance(1);
    assert.ok(Math.abs(e.player.resource.current - 24) < 1e-8);
  },
);
check(
  "Baluardo passive and tendency materially improve mitigation/block and guard duration",
  () => {
    const e = create(setup("warden", "bulwark"));
    const neutralProfile = Data.copy(e.profile);
    neutralProfile.modifiers = {};
    neutralProfile.effectModifiers = {};
    const neutral = create({
      ...setup("warden", "bulwark"),
      profile: neutralProfile,
    });
    assert.ok(e.player.maxHp > neutral.player.maxHp);
    e.random = neutral.random = () => 0.99;
    e.enemyAction();
    neutral.enemyAction();
    assert.ok(e.metrics.damageTaken < neutral.metrics.damageTaken * 0.85);
    e.applyEffect(e.player, "iron-guard", {
      actorId: "player",
      abilityId: "iron-guard",
    });
    neutral.applyEffect(neutral.player, "iron-guard", {
      actorId: "player",
      abilityId: "iron-guard",
    });
    assert.equal(e.player.effects[0].expiresAt, 8);
    assert.equal(neutral.player.effects[0].expiresAt, 6);
    assert.ok(
      e.effectiveStats(e.player).modifiers.blockChance >
        neutral.effectiveStats(neutral.player).modifiers.blockChance,
    );
  },
);
check("Ritorsione increases actual event gain and retaliatory damage", () => {
  const boosted = create(setup("warden", "retaliation")),
    base = create(setup("warden", "bulwark"));
  boosted.random = base.random = () => 0.99;
  boosted.enemyAction();
  base.enemyAction();
  assert.equal(boosted.player.resource.current, 15);
  assert.equal(base.player.resource.current, 10);
  for (const e of [boosted, base]) {
    e.player.resource.current = 30;
    e.playerAction(e.abilities.find((a) => a.id === "retaliation"));
  }
  assert.ok(boosted.metrics.damage > base.metrics.damage * 1.3);
});
check(
  "Comando reduces incoming damage with a stronger, longer real debuff",
  () => {
    const command = create(setup("warden", "command")),
      base = create(setup("warden", "retaliation"));
    for (const e of [command, base]) {
      e.random = () => 0.99;
      e.applyEffect(e.enemy, "shaken", {
        actorId: "player",
        abilityId: "shield-strike",
      });
      e.enemyAction();
    }
    assert.equal(command.enemy.effects[0].expiresAt, 6);
    assert.equal(base.enemy.effects[0].expiresAt, 4);
    assert.ok(command.metrics.damageTaken < base.metrics.damageTaken);
  },
);
check("Predatore boosts power damage and critical odds in real casts", () => {
  const predator = create(setup("hunter", "predator")),
    base = create(setup("hunter", "lacerator"));
  predator.random = base.random = () => 0.99;
  for (const e of [predator, base])
    e.playerAction(e.abilities.find((a) => a.id === "power"));
  assert.ok(predator.metrics.damage > base.metrics.damage * 1.13);
  const p = create(setup("hunter", "predator")),
    b = create(setup("hunter", "lacerator"));
  p.random = b.random = () => 0.12;
  for (const e of [p, b])
    e.playerAction(e.abilities.find((a) => a.id === "rapid"));
  assert.equal(p.metrics.criticals, 1);
  assert.equal(b.metrics.criticals, 0);
});
check(
  "Laceratore boosts real bleed tick/expiry; Esploratore improves GCD/regen/wind",
  () => {
    const dot = create(setup("hunter", "lacerator")),
      base = create(setup("hunter", "predator"));
    for (const e of [dot, base])
      e.applyEffect(e.enemy, "bleeding", {
        actorId: "player",
        abilityId: "lacerating",
      });
    assert.ok(
      dot.enemy.effects[0].tickDamage > base.enemy.effects[0].tickDamage * 1.44,
    );
    assert.equal(dot.enemy.effects[0].expiresAt, 8);
    const explorer = create(setup("hunter", "explorer"));
    assert.ok(
      Data.formulas.gcd(explorer.effectiveStats(explorer.player).stats) <
        Data.formulas.gcd(base.effectiveStats(base.player).stats),
    );
    for (const e of [explorer, base]) {
      e.player.resource.current = 0;
      e.setRules(
        e.abilities.map((a) => ({
          abilityId: a.id,
          condition: { type: "playerHpBelow", threshold: 1 },
        })),
      );
      e.start();
      e.advance(1);
      e.applyEffect(e.player, "wind", { actorId: "player", abilityId: "wind" });
    }
    assert.ok(
      explorer.player.resource.current > base.player.resource.current * 1.24,
    );
    assert.equal(explorer.player.effects[0].expiresAt, 9);
  },
);
check(
  "thorn item-ID hook stacks multiplicatively with build, not item name",
  () => {
    const e = create(setup("hunter", "lacerator", false, true));
    e.start();
    for (let i = 0; i < 400 && !e.metrics.itemProcs; i++) e.advance(0.05);
    const bleed = e.enemy.effects.find((x) => x.id === "bleeding");
    assert.ok(e.metrics.itemProcs > 0);
    assert.equal(bleed.origin.itemId, "thorn-quiver");
    assert.ok(bleed.expiresAt - e.time >= 9.9);
    assert.ok(
      bleed.tickDamage >=
        e.baseDamage(e.player.stats) * 0.12 * 1.45 * 1.35 - 1e-8,
    );
    const unknown = create({
      ...setup(),
      effects: [{ id: "unknown", name: "Faretra delle Spine" }],
    });
    unknown.start();
    unknown.advance(10);
    assert.equal(unknown.metrics.itemProcs, 0);
  },
);
check(
  "AUTO differs by class and builds; normalized custom resource/HP/effect conditions",
  () => {
    const orders = ["bulwark", "retaliation", "command"].map((id) =>
      setup("warden", id)
        .profile.defaultRules.map((r) => r.abilityId)
        .join(),
    );
    assert.equal(new Set(orders).size, 3);
    const hunterOrders = ["predator", "lacerator", "explorer"].map((id) =>
      setup("hunter", id)
        .profile.defaultRules.map((r) => r.abilityId)
        .join(),
    );
    assert.equal(new Set(hunterOrders).size, 3);
    const e = create(setup("warden"));
    e.player.resource.current = 40;
    e.setRules([
      {
        abilityId: "retaliation",
        condition: { type: "resourceAbove", threshold: 35 },
      },
    ]);
    assert.equal(e.chooseAbility().id, "retaliation");
    e.player.resource.current = 0;
    assert.equal(e.chooseAbility().id, "slash");
    assert.ok(e.conditionMet({ type: "resourceBelow", threshold: 1 }));
    assert.equal(
      e.conditionMet({ type: "resourceBelow", threshold: 0 }),
      false,
    );
    e.player.hp = e.player.maxHp * 0.2;
    assert.ok(e.conditionMet({ type: "playerHpBelow", threshold: 25 }));
    e.applyEffect(e.player, "iron-guard", { actorId: "player" });
    assert.equal(
      e.conditionMet({ type: "buffAbsent", effectId: "iron-guard" }),
      false,
    );
  },
);
check(
  "real-stat classes have significantly different DPS/incoming damage and class results",
  () => {
    const hunterOptions = setup(),
      wardenOptions = setup("warden");
    const hunter = finish(hunterOptions),
      warden = finish(wardenOptions);
    assert.deepEqual(hunter.player.stats, hunterOptions.stats);
    assert.deepEqual(warden.player.stats, wardenOptions.stats);
    assert.ok(hunter.result.dps > warden.result.dps * 1.6);
    assert.ok(
      warden.result.damageTaken / warden.time <
        (hunter.result.damageTaken / hunter.time) * 0.6,
    );
    assert.equal(warden.result.className, "Custode");
    assert.equal(warden.result.buildName, "Baluardo");
    assert.ok(warden.result.mitigated > 0);
    assert.ok(warden.result.resourceGenerated > 0);
    assert.ok(warden.result.resourceUsed > 0);
    assert.ok(hunter.result.bleedingDamage > 0);
    assert.ok(hunter.result.resourceUsed > 0);
  },
);
check("both classes can win and lose with real poor equipment/strategy", () => {
  assert.equal(finish(setup()).result.outcome, "victory");
  assert.equal(finish(setup("warden")).result.outcome, "victory");
  assert.equal(
    finish({ ...setup("hunter", undefined, true), seed: 1 }).result.outcome,
    "defeat",
  );
  assert.equal(
    finish({ ...setup("warden", undefined, true), seed: 3 }).result.outcome,
    "defeat",
  );
  const poor = setup("warden");
  poor.rules = poor.profile.abilities.map((a) => ({
    abilityId: a.id,
    condition: { type: "playerHpBelow", threshold: 1 },
  }));
  assert.equal(finish(poor).result.outcome, "defeat");
});
check(
  "class simulation remains chunk-deterministic, pause/resume and capped log",
  () => {
    for (const cls of ["hunter", "warden"]) {
      const opts = setup(cls),
        a = create(opts),
        b = create(opts);
      a.start();
      b.start();
      a.advance(80);
      for (let i = 0; i < 8000; i++) b.advance(0.01);
      assert.deepEqual(a.snapshot(), b.snapshot());
      const c = create(opts);
      c.start();
      c.advance(2);
      c.pause();
      const snap = c.snapshot();
      c.advance(4);
      assert.deepEqual(c.snapshot(), snap);
      c.resume();
      c.advance(1);
      assert.equal(c.time, 3);
      const done = a.snapshot();
      a.advance(30);
      assert.deepEqual(a.snapshot(), done);
      assert.ok(a.log.length <= 60);
    }
  },
);
check(
  "Gear Advisor real owned items, class compatibility, weights, improvement and comparison",
  () => {
    setup("warden");
    const gear = m.read("Equipment.state");
    assert.equal(
      m.run(
        `BuildSystem.scoreItemForBuild(Equipment.state.inventory.find(i=>i.id==='bow'),'warden','bulwark')`,
      ),
      null,
    );
    const expected = Object.entries(
      gear.inventory.find((i) => i.id === "shield").stats,
    ).reduce((s, [k, v]) => s + v * ({ vigor: 3.5, armor: 3.5 }[k] || 0), 0);
    assert.equal(
      m.run(
        `BuildSystem.scoreItemForBuild(Equipment.equipped('support'),'warden','bulwark')`,
      ),
      expected,
    );
    const advice = m.read(
      `BuildSystem.advise(Equipment.state.inventory.find(i=>i.id==='sword-dawn'),'mainHand','warden','retaliation',Equipment)`,
    );
    assert.equal(advice.improvement, true);
    assert.equal(advice.bestOwned, true);
    assert.ok(advice.delta > 2);
    const comparison = m.read(`Equipment.comparison('sword-dawn','mainHand')`);
    assert.equal(comparison.current.id, "sword");
    assert.equal(comparison.delta.force, 3);
    setup("hunter", "lacerator");
    const thorn = m.read(
      `BuildSystem.scoreBreakdown(Equipment.state.inventory.find(i=>i.id==='thorn-quiver'),'hunter','lacerator')`,
    );
    assert.equal(thorn.effects, 18);
    assert.ok(
      m.read(
        `BuildSystem.advise(Equipment.state.inventory.find(i=>i.id==='thorn-quiver'),'support','hunter','lacerator',Equipment)`,
      ).improvement,
    );
    assert.ok(
      m.read(
        `BuildSystem.advise(Equipment.state.inventory.find(i=>i.id==='thorn-quiver'),'support','hunter','lacerator',Equipment)`,
      ).bestOwned,
    );
    m.run(`BuildSystem.registerScoreHook(item=>item.id==='quiver'?100:0)`);
    assert.ok(
      m.run(
        `BuildSystem.scoreBreakdown(Equipment.equipped('support'),'hunter','lacerator').synergy`,
      ) > 0,
    );
  },
);
console.log(`${checks} M4 engine/build integration checks passed.`);
