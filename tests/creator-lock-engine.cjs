/* Creation lock, additive legacy migration and separation from Equipment Appearance. */
const assert = require("node:assert/strict");
const fixture = require("./character-fixture.cjs");
let checks = 0;
async function check(name, test) {
  await test();
  checks++;
  console.log("PASS " + name);
}
(async () => {
  await check(
    "new character is an editable persistent draft until explicit confirmation",
    () => {
      const f = fixture();
      assert.equal(f.equipment.state.characterCreated, false);
      assert.equal(f.equipment.creatorAvailable, true);
      assert.ok(f.equipment.setCharacter("hair", "crest"));
      assert.ok(f.equipment.setCharacter("hairColor", "copper"));
      assert.ok(f.equipment.setCharacter("eyes", "sage"));
      const reload = fixture({ memory: f.memory });
      assert.equal(reload.equipment.state.characterCreated, false);
      assert.equal(reload.equipment.state.character.hair, "crest");
      assert.equal(reload.equipment.creatorAvailable, true);
    },
  );
  await check(
    "create stores true and all personal appearance; reload stays locked and setters cannot bypass",
    () => {
      const f = fixture();
      f.equipment.setCharacter("hair", "crest");
      f.equipment.setCharacter("hairColor", "copper");
      f.equipment.setCharacter("eyes", "sage");
      assert.ok(f.equipment.createCharacter().ok);
      const raw = JSON.parse(f.memory.get(f.equipment.SAVE_KEY));
      assert.equal(raw.characterCreated, true);
      assert.equal(raw.character.hair, "crest");
      assert.equal(raw.character.hairColor, "copper");
      assert.equal(raw.character.eyes, "sage");
      const reload = fixture({ memory: f.memory }),
        before = reload.read("Equipment.state");
      assert.equal(reload.equipment.creatorAvailable, false);
      assert.equal(reload.equipment.setCharacter("hair", "veil"), false);
      assert.equal(reload.equipment.randomizeCharacter(), false);
      assert.equal(reload.equipment.debugReopenCreator(), false);
      assert.equal(reload.equipment.createCharacter().ok, false);
      assert.deepEqual(reload.read("Equipment.state"), before);
    },
  );
  await check(
    "Character Appearance excludes dye; equipment tint remains independent after creation",
    () => {
      const f = fixture();
      f.equipment.setCharacter("hair", "crest");
      assert.equal(f.equipment.setCharacter("dye", "wine"), false);
      assert.ok(f.equipment.createCharacter().ok);
      const before = f.read("Equipment.state.character"),
        stats = f.read("Equipment.state.resultingStats"),
        gear = f.read("Equipment.state.equipment");
      assert.ok(f.equipment.setEquipmentDye("wine"));
      assert.equal(f.equipment.state.equipmentAppearance.dye, "wine");
      assert.ok(!Object.hasOwn(f.equipment.state.character, "dye"));
      assert.deepEqual(f.read("Equipment.state.character"), before);
      assert.deepEqual(f.read("Equipment.state.resultingStats"), stats);
      assert.deepEqual(f.read("Equipment.state.equipment"), gear);
      assert.equal(f.equipment.creatorAvailable, false);
    },
  );
  await check(
    "old M5 character locks without losing XP/class/build/gear/inventory/resources/active expedition",
    async () => {
      const f = fixture();
      f.kit("hunter", "explorer");
      await f.level(7);
      f.equipment.setCharacter("hair", "crest");
      f.equipment.setCharacter("eyes", "sage");
      f.equipment.equip("ring-dusk", "ringLeft");
      await f.store.transact((s) => {
        s.crowns = 77;
        s.materials = { iron: 5, fiber: 6, ether: 7 };
        return { ok: true };
      });
      await f.system.start("patrol", { seed: 1 });
      const old = f.read("Equipment.state");
      delete old.characterCreated;
      delete old.equipmentAppearance;
      old.character.dye = "wine";
      f.memory.set(f.equipment.SAVE_KEY, JSON.stringify(old));
      const progress = f.store.state,
        classes = f.read("ClassSystem.state");
      const restored = fixture({ memory: f.memory });
      assert.equal(restored.equipment.state.characterCreated, true);
      assert.equal(restored.equipment.creatorAvailable, false);
      assert.equal(restored.equipment.state.character.hair, "crest");
      assert.equal(restored.equipment.state.character.eyes, "sage");
      assert.equal(restored.equipment.state.equipmentAppearance.dye, "wine");
      assert.deepEqual(restored.store.state, progress);
      assert.deepEqual(restored.read("ClassSystem.state"), classes);
      assert.deepEqual(
        restored.read("Equipment.state.equipment"),
        old.equipment,
      );
      assert.deepEqual(
        restored.read("Equipment.state.inventory"),
        old.inventory,
      );
      assert.deepEqual(
        restored.read("Equipment.state.resultingStats"),
        old.resultingStats,
      );
    },
  );
  await check(
    "old pending report/manual receipt survive migration and claims still work with creator locked",
    async () => {
      const f = fixture();
      f.kit("warden", "command");
      const ticket = (await f.system.beginManualCombat("guardian")).ticket;
      await f.system.awardManualCombat(ticket.id, "victory");
      const report = await f.finish();
      const old = f.read("Equipment.state");
      delete old.characterCreated;
      old.character.dye = old.equipmentAppearance.dye;
      delete old.equipmentAppearance;
      f.memory.set(f.equipment.SAVE_KEY, JSON.stringify(old));
      const progress = f.store.state;
      const restored = fixture({ memory: f.memory, clock: f.clock });
      assert.equal(restored.equipment.creatorAvailable, false);
      assert.deepEqual(restored.store.state, progress);
      assert.ok((await restored.system.claim(report.id)).ok);
      assert.equal(restored.store.state.totalXP, 35 + report.rewards.xp);
      assert.equal(restored.store.state.crowns, 4 + report.rewards.crowns);
      assert.equal(restored.equipment.state.characterCreated, true);
    },
  );
  await check(
    "old legacy character.v1 imports appearance/dye and is already created",
    () => {
      const memory = new Map([
        [
          "nymeria.character.v1",
          JSON.stringify({
            hair: "crest",
            hairColor: "copper",
            eyes: "sage",
            dye: "wine",
            weapon: "bow",
          }),
        ],
      ]);
      const f = fixture({ memory });
      assert.equal(f.equipment.state.characterCreated, true);
      assert.equal(f.equipment.creatorAvailable, false);
      assert.equal(f.equipment.state.character.hair, "crest");
      assert.equal(f.equipment.state.character.hairColor, "copper");
      assert.equal(f.equipment.state.character.eyes, "sage");
      assert.equal(f.equipment.state.equipmentAppearance.dye, "wine");
      assert.equal(f.equipment.equipped("mainHand").id, "bow");
    },
  );
  await check(
    "failed create write keeps creator/draft editable and does not falsely confirm creation",
    () => {
      const f = fixture({ denyWrite: true });
      f.equipment.setCharacter("hair", "crest");
      const before = f.read("Equipment.state");
      const result = f.equipment.createCharacter();
      assert.equal(result.ok, false);
      assert.match(result.message, /non disponibile/);
      assert.deepEqual(f.read("Equipment.state"), before);
      assert.equal(f.equipment.creatorAvailable, true);
      assert.equal(f.equipment.state.characterCreated, false);
    },
  );
  await check(
    "Test Mode reopening is ephemeral; existing created flag stays true, normal and test reload both locked",
    () => {
      const f = fixture({ testMode: true });
      f.equipment.createCharacter();
      const raw = f.memory.get(f.equipment.SAVE_KEY);
      assert.ok(f.equipment.debugReopenCreator());
      assert.equal(f.equipment.creatorAvailable, true);
      assert.equal(f.equipment.state.characterCreated, true);
      assert.equal(f.memory.get(f.equipment.SAVE_KEY), raw);
      f.equipment.setCharacter("hair", "crest");
      const normal = fixture({ memory: f.memory });
      assert.equal(normal.equipment.state.character.hair, "crest");
      assert.equal(normal.equipment.creatorAvailable, false);
      assert.equal(normal.equipment.debugReopenCreator(), false);
      const test = fixture({ memory: f.memory, testMode: true });
      assert.equal(test.equipment.creatorAvailable, false);
      assert.ok(test.equipment.debugReopenCreator());
      assert.ok(test.equipment.createCharacter().ok);
      assert.equal(test.equipment.creatorAvailable, false);
      assert.equal(test.equipment.state.characterCreated, true);
    },
  );
  await check(
    "demo gear reset cannot unlock created character or change personal appearance",
    () => {
      const f = fixture();
      f.equipment.setCharacter("hair", "crest");
      f.equipment.setCharacter("hairColor", "copper");
      f.equipment.createCharacter();
      const character = f.read("Equipment.state.character");
      f.equipment.reset();
      assert.equal(f.equipment.state.characterCreated, true);
      assert.equal(f.equipment.creatorAvailable, false);
      assert.deepEqual(f.read("Equipment.state.character"), character);
    },
  );
  await check(
    "stale draft in another tab cannot undo creation or overwrite personal appearance",
    () => {
      const memory = new Map();
      const first = fixture({ memory }),
        second = fixture({ memory });
      first.equipment.setCharacter("hair", "crest");
      first.equipment.createCharacter();
      assert.equal(second.equipment.setCharacter("hair", "veil"), false);
      second.equipment.equip("ring-sun", "ringLeft");
      const restored = fixture({ memory });
      assert.equal(restored.equipment.state.characterCreated, true);
      assert.equal(restored.equipment.creatorAvailable, false);
      assert.equal(restored.equipment.state.character.hair, "crest");
    },
  );
  await check(
    "equipment appearanceItem remains separate from stats and creation flag",
    () => {
      const f = fixture();
      f.kit();
      f.equipment.createCharacter();
      const raw = f.read("Equipment.state");
      raw.equipment.torso.appearanceItem = "torso-oracle";
      const normal = f.equipment.normalize(raw);
      assert.equal(normal.characterCreated, true);
      assert.equal(normal.equipment.torso.equippedItem, "torso-chain");
      assert.equal(normal.equipment.torso.appearanceItem, "torso-oracle");
      assert.deepEqual(
        JSON.parse(JSON.stringify(normal.resultingStats)),
        raw.resultingStats,
      );
      assert.deepEqual(
        JSON.parse(JSON.stringify(normal.character)),
        raw.character,
      );
    },
  );
  console.log(`${checks} Character Creator Lock integration checks passed.`);
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
