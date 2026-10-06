/* Real creator confirmation, locked UI, legacy M5 migration and process restart. */
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path");
const { chromium } = require("playwright");
const base = process.env.NYMERIA_TEST_URL || "http://127.0.0.1:8000";
const launch = {
  executablePath: process.env.NYMERIA_CHROMIUM || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
};
const frozen = new Date("2026-10-06T12:00:00Z");
(async () => {
  const browser = await chromium.launch(launch);
  try {
    for (const width of [320, 390, 430]) {
      const context = await browser.newContext({
        viewport: { width, height: 844 },
        hasTouch: true,
        isMobile: true,
      });
      let page = await context.newPage();
      const errors = [];
      async function prepare(p) {
        p.on("pageerror", (e) => errors.push(e.message));
        await p.clock.install({ time: frozen });
        await p.clock.pauseAt(new Date(frozen.getTime() + 1000));
      }
      await prepare(page);
      await page.goto(base);
      const model = () =>
        page.evaluate(() => JSON.parse(JSON.stringify(Equipment.state)));
      const progress = () => page.evaluate(() => ProgressionStore.state);
      const overflow = async () =>
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${width}px overflow`,
        );
      const tab = async (id) => {
        await page.locator("#tab-" + id).tap();
        assert.ok(await page.locator("#panel-" + id).isVisible());
        await overflow();
      };
      const settle = () =>
        page.evaluate(async () => {
          await ProgressionSystem.refresh();
          if (navigator.locks)
            await navigator.locks.request("nymeria-progression", () => {});
        });
      const assertLocked = async () => {
        assert.equal((await model()).characterCreated, true);
        assert.ok(await page.locator("#character-creator").isHidden());
        assert.ok(await page.locator("#creator-actions").isHidden());
        assert.equal(
          await page.locator("#character-appearance-options button").count(),
          0,
        );
        assert.equal(
          await page.locator('[data-category="appearance"]').count(),
          0,
        );
      };
      assert.equal((await model()).characterCreated, false);
      assert.ok(await page.locator("#character-creator").isVisible());
      assert.match(await page.locator("#save").innerText(), /Crea personaggio/);
      assert.ok(await page.locator("#creator-debug").isHidden());
      assert.ok(await page.locator("#reset-demo").isHidden());
      await page.locator('[data-key="hair"][data-id="crest"]').tap();
      await page.locator('[data-key="hairColor"][data-id="copper"]').tap();
      await page.locator('[data-key="eyes"][data-id="sage"]').tap();
      await page.reload();
      assert.equal((await model()).characterCreated, false);
      assert.ok(await page.locator("#character-creator").isVisible());
      assert.equal((await model()).character.hair, "crest");
      if (width === 390) {
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({
          path: "/tmp/nymeria-creator-draft-390.png",
          fullPage: true,
        });
      }
      await page.locator("#save").tap();
      await assertLocked();
      const created = await model();
      assert.equal(created.character.hair, "crest");
      assert.equal(created.character.hairColor, "copper");
      assert.equal(created.character.eyes, "sage");
      assert.ok(!Object.hasOwn(created.character, "dye"));
      assert.deepEqual(
        await page.evaluate(() =>
          JSON.parse(localStorage.getItem(Equipment.SAVE_KEY)),
        ),
        created,
      );
      assert.equal(
        await page.evaluate(() => Equipment.setCharacter("hair", "veil")),
        false,
      );
      assert.equal(
        await page.evaluate(() => Equipment.randomizeCharacter()),
        false,
      );
      await page.reload();
      await assertLocked();
      assert.deepEqual(await model(), created);
      await page.close();
      page = await context.newPage();
      await prepare(page);
      await page.goto(base);
      await assertLocked();
      assert.deepEqual(await model(), created);
      // Equipment tint/slots continue to function with the personal creator locked.
      await page.locator('#categories [data-category="dye"]').tap();
      await page.locator('[data-equipment-dye="wine"]').tap();
      assert.equal((await model()).equipmentAppearance.dye, "wine");
      assert.deepEqual((await model()).character, created.character);
      await assertLocked();
      await page.evaluate(() => {
        Equipment.equip("bow", "mainHand");
        Equipment.equip("quiver", "support");
        Equipment.equip("cloak-pilgrim", "cloak");
      });
      assert.equal(
        (await model()).equipment.cloak.equippedItem,
        "cloak-pilgrim",
      );
      assert.equal(
        await page
          .locator('#rig [data-layer="cloak"]')
          .getAttribute("data-item"),
        "cloak-pilgrim",
      );
      await assertLocked();
      await tab("class");
      await page.locator('[data-build-id="lacerator"]').tap();
      assert.equal(
        await page.evaluate(() => ClassSystem.build().id),
        "lacerator",
      );
      await tab("combat");
      assert.ok(await page.evaluate(() => CombatUI.start({ seed: 1 })));
      await page.evaluate(async () => {
        CombatUI.engine.advance(180);
        await CombatUI.settleRewards();
      });
      assert.equal((await progress()).totalXP, 35);
      assert.equal((await progress()).crowns, 4);
      await assertLocked();
      await tab("expeditions");
      await page.locator('[data-start-expedition="patrol"]').tap();
      await settle();
      const active = (await progress()).activeExpedition;
      assert.ok(active);
      await page.clock.runFor(61000);
      await settle();
      const report = (await progress()).pendingExpeditionResult;
      assert.ok(report.success);
      await page.locator("#expedition-claim").tap();
      await settle();
      assert.equal((await progress()).totalXP, 35 + report.rewards.xp);
      await assertLocked();
      if (width === 390) {
        await tab("character");
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({
          path: "/tmp/nymeria-creator-locked-390.png",
          fullPage: true,
        });
      }
      // Reopening is DEBUG only and never persists an uncreated marker for an existing character.
      const beforeDebug = await progress();
      await page.goto(base + "/?test=1");
      await assertLocked();
      assert.ok(await page.locator("#creator-debug").isVisible());
      assert.match(await page.locator("#creator-debug").innerText(), /DEBUG/);
      await page.locator("#creator-debug").tap();
      assert.ok(await page.locator("#character-creator").isVisible());
      assert.match(await page.locator("#creator-heading").innerText(), /DEBUG/);
      assert.equal((await model()).characterCreated, true);
      await page.locator('[data-key="hair"][data-id="veil"]').tap();
      assert.equal(
        await page.evaluate(
          () =>
            JSON.parse(localStorage.getItem(Equipment.SAVE_KEY))
              .characterCreated,
        ),
        true,
      );
      assert.deepEqual(await progress(), beforeDebug);
      await page.goto(base);
      await assertLocked();
      assert.equal((await model()).character.hair, "veil");
      assert.ok(await page.locator("#creator-debug").isHidden());
      assert.equal(
        await page.evaluate(() => Equipment.debugReopenCreator()),
        false,
      );
      await page.goto(base + "/?test=1");
      await page.locator("#creator-debug").tap();
      await page.locator("#save").tap();
      await assertLocked();
      const personal = (await model()).character;
      await page.locator("#reset-demo").tap();
      await assertLocked();
      assert.deepEqual((await model()).character, personal);
      assert.deepEqual(await progress(), beforeDebug);
      await overflow();
      assert.deepEqual(errors, []);
      await context.close();
      // Build an authentic old-format M5 save with a running expedition and migrate in the browser.
      const migration = await browser.newContext({
        viewport: { width, height: 844 },
        hasTouch: true,
        isMobile: true,
      });
      const m = await migration.newPage();
      const migrationErrors = [];
      m.on("pageerror", (e) => migrationErrors.push(e.message));
      await m.clock.install({ time: frozen });
      await m.clock.pauseAt(new Date(frozen.getTime() + 1000));
      await m.goto(base);
      const old = await m.evaluate(async () => {
        ClassSystem.selectClass("hunter");
        ClassSystem.selectBuild("explorer");
        Equipment.equip("bow", "mainHand");
        Equipment.equip("quiver", "support");
        Equipment.equip("ring-dusk", "ringLeft");
        Equipment.setCharacter("hair", "crest");
        Equipment.setCharacter("eyes", "sage");
        Equipment.setEquipmentDye("wine");
        await ProgressionStore.transact((s) => {
          s.totalXP = ProgressionData.thresholds[6];
          s.crowns = 77;
          s.materials = { iron: 5, fiber: 6, ether: 7 };
          return { ok: true };
        });
        await ProgressionSystem.start("patrol", { seed: 1 });
        const equipment = JSON.parse(JSON.stringify(Equipment.state));
        delete equipment.characterCreated;
        equipment.character.dye = equipment.equipmentAppearance.dye;
        delete equipment.equipmentAppearance;
        localStorage.setItem(Equipment.SAVE_KEY, JSON.stringify(equipment));
        return {
          equipment,
          progression: ProgressionStore.state,
          classes: ClassSystem.state,
        };
      });
      await m.reload();
      assert.ok(await m.locator("#character-creator").isHidden());
      const migrated = await m.evaluate(() =>
        JSON.parse(JSON.stringify(Equipment.state)),
      );
      assert.equal(migrated.characterCreated, true);
      assert.equal(migrated.character.hair, "crest");
      assert.equal(migrated.character.eyes, "sage");
      assert.equal(migrated.equipmentAppearance.dye, "wine");
      assert.deepEqual(migrated.equipment, old.equipment.equipment);
      assert.deepEqual(migrated.inventory, old.equipment.inventory);
      assert.deepEqual(migrated.resultingStats, old.equipment.resultingStats);
      assert.deepEqual(
        await m.evaluate(() => ProgressionStore.state),
        old.progression,
      );
      assert.deepEqual(await m.evaluate(() => ClassSystem.state), old.classes);
      assert.equal(
        await m.evaluate(
          () =>
            JSON.parse(localStorage.getItem(Equipment.SAVE_KEY))
              .characterCreated,
        ),
        true,
      );
      assert.deepEqual(migrationErrors, []);
      await migration.close();
      console.log(
        `PASS creator ${width}px: draft/create/lock/reload/close, saved personal appearance, separate gear/dye, Equipment/Class/manual XP/Expeditions, safe old-M5 migration, DEBUG reopening/confirmation/reset, no JS errors/overflow`,
      );
    }
    // Failed persistence must never hide the creator or claim successful creation.
    const p = await browser.newPage();
    const failures = [];
    p.on("pageerror", (e) => failures.push(e.message));
    await p.goto(base);
    await p.locator('[data-key="hair"][data-id="crest"]').click();
    await p.evaluate(() => {
      window.creatorStorageWrite = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === Equipment.SAVE_KEY)
          throw new Error("Injected quota failure");
        return window.creatorStorageWrite.call(this, key, value);
      };
    });
    await p.locator("#save").click();
    assert.ok(await p.locator("#character-creator").isVisible());
    assert.equal(
      await p.evaluate(() => Equipment.state.characterCreated),
      false,
    );
    assert.match(await p.locator("#notice").innerText(), /non disponibile/);
    await p.evaluate(() => {
      Storage.prototype.setItem = window.creatorStorageWrite;
    });
    await p.locator("#save").click();
    assert.ok(await p.locator("#character-creator").isHidden());
    assert.equal(
      await p.evaluate(() => Equipment.state.character.hair),
      "crest",
    );
    assert.deepEqual(failures, []);
    await p.close();
    console.log(
      "PASS failed creation write: draft stays open; retry saves appearance and locks",
    );
    const shared = await browser.newContext();
    const first = await shared.newPage(),
      stale = await shared.newPage();
    await first.goto(base);
    await stale.goto(base);
    await first.locator('[data-key="hair"][data-id="crest"]').click();
    await first.locator("#save").click();
    await stale.waitForFunction(
      () => Equipment.state.characterCreated === true,
    );
    assert.ok(await stale.locator("#character-creator").isHidden());
    assert.equal(
      await stale.evaluate(() => Equipment.setCharacter("hair", "veil")),
      false,
    );
    await stale.evaluate(() => Equipment.equip("bow", "mainHand"));
    assert.equal(
      await first.evaluate(
        () =>
          JSON.parse(localStorage.getItem(Equipment.SAVE_KEY)).characterCreated,
      ),
      true,
    );
    assert.equal(
      await first.evaluate(
        () =>
          JSON.parse(localStorage.getItem(Equipment.SAVE_KEY)).character.hair,
      ),
      "crest",
    );
    await shared.close();
    console.log(
      "PASS two real tabs: creation locks stale draft and protects saved personal appearance",
    );
  } finally {
    await browser.close();
  }
  // Close the entire browser process; existing character and manual rewards remain persisted.
  const profile = fs.mkdtempSync(
    path.join(os.tmpdir(), "nymeria-creator-profile-"),
  );
  let persistent = null;
  try {
    persistent = await chromium.launchPersistentContext(profile, {
      ...launch,
      viewport: { width: 390, height: 844 },
    });
    let p = await persistent.newPage();
    await p.goto(base);
    await p.locator('[data-key="hair"][data-id="crest"]').click();
    await p.locator("#save").click();
    await p.evaluate(async () => {
      Equipment.equip("bow", "mainHand");
      Equipment.equip("quiver", "support");
      CombatUI.start({ seed: 1 });
      CombatUI.engine.advance(180);
      await CombatUI.settleRewards();
    });
    const before = await p.evaluate(() => ({
      equipment: JSON.parse(JSON.stringify(Equipment.state)),
      progression: ProgressionStore.state,
    }));
    await persistent.close();
    persistent = null;
    persistent = await chromium.launchPersistentContext(profile, {
      ...launch,
      viewport: { width: 390, height: 844 },
    });
    p = await persistent.newPage();
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(base);
    assert.ok(await p.locator("#character-creator").isHidden());
    assert.ok(await p.locator("#creator-actions").isHidden());
    assert.deepEqual(
      await p.evaluate(() => JSON.parse(JSON.stringify(Equipment.state))),
      before.equipment,
    );
    assert.deepEqual(
      await p.evaluate(() => ProgressionStore.state),
      before.progression,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS full browser process restart: created character locked, appearance and M5/manual rewards intact",
    );
  } finally {
    if (persistent) await persistent.close();
    fs.rmSync(profile, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
