/* Real touch victories/defeats and transactional reward rendering, including a reward-triggered level-up. */
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const base = process.env.NYMERIA_TEST_URL || "http://127.0.0.1:8000";
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.NYMERIA_CHROMIUM || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    for (const width of [320, 390, 430]) {
      const context = await browser.newContext({
        viewport: { width, height: 844 },
        hasTouch: true,
        isMobile: true,
      });
      const page = await context.newPage(),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.clock.install({ time: new Date("2026-10-06T12:00:00Z") });
      await page.clock.pauseAt(new Date("2026-10-06T12:00:01Z"));
      await page.goto(base);
      const state = () => page.evaluate(() => ProgressionStore.state);
      const overflow = async () =>
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
      const tab = async (id) => {
        await page.locator("#tab-" + id).tap();
        assert.ok(await page.locator("#panel-" + id).isVisible());
        await overflow();
      };
      const settle = () =>
        page.evaluate(async () => {
          await CombatUI.settleRewards();
          if (navigator.locks)
            await navigator.locks.request("nymeria-progression", () => {});
        });
      const configure = async (cls, xp = 0, bare = false) => {
        await page.evaluate(
          async ({ cls, xp, bare }) => {
            await ProgressionStore.transact((s) => {
              s.totalXP = xp;
              s.crowns = 0;
              return { ok: true };
            });
            ClassSystem.selectClass(cls);
            ClassSystem.selectBuild(cls === "hunter" ? "predator" : "bulwark");
            Equipment.reset();
            Equipment.equip(cls === "hunter" ? "bow" : "sword", "mainHand");
            Equipment.equip(cls === "hunter" ? "quiver" : "shield", "support");
            if (bare)
              for (const slot of GearData.slots)
                if (!["mainHand", "support"].includes(slot.id))
                  Equipment.unequip(slot.id);
          },
          { cls, xp, bare },
        );
        await tab("combat");
        await page.locator('[data-combat-mode="auto"]').tap();
        await page.locator('[data-combat-speed="4"]').tap();
      };
      const run = async (seed = 1) => {
        assert.ok(
          await page.evaluate((seed) => CombatUI.start({ seed }), seed),
        );
        await page.clock.runFor(20000);
        await settle();
        assert.equal(
          await page.evaluate(() => CombatUI.engine.status),
          "finished",
        );
        assert.ok(await page.locator("#combat-result").isVisible());
        await overflow();
      };
      for (const cls of ["hunter", "warden"])
        for (const mode of ["auto", "custom"]) {
          await configure(cls, 70);
          await page.locator(`[data-combat-mode="${mode}"]`).tap();
          await run();
          assert.equal((await state()).totalXP, 105);
          assert.equal((await state()).crowns, 4);
          assert.equal((await state()).level, 2);
          assert.equal(
            await page.locator("#combat-result-heading").innerText(),
            "VITTORIA",
          );
          assert.match(
            await page.locator("#combat-reward-values").innerText(),
            /\+35 XP.*\+4 Corone/,
          );
          assert.equal(
            await page.locator("#combat-reward-level").innerText(),
            cls === "hunter"
              ? "LIVELLO 2 RAGGIUNTO · +3 Agilità · +1 Vigor · +0,5% Critico"
              : "LIVELLO 2 RAGGIUNTO · +2 Forza · +3 Vigor · +1 Spirito",
          );
          assert.equal(
            await page.evaluate(() => Equipment.state.character.level),
            2,
          );
          const saved = await state();
          await page.evaluate(() =>
            Promise.all([CombatUI.settleRewards(), CombatUI.settleRewards()]),
          );
          assert.deepEqual(await state(), saved);
          await tab("character");
          assert.equal(
            await page.locator("#character-xp-value").innerText(),
            "25 / 204 XP",
          );
          assert.equal(
            await page
              .locator("#character-xp-bar")
              .getAttribute("aria-valuenow"),
            "25",
          );
          await tab("expeditions");
          assert.equal(
            await page.locator("#expedition-xp-value").innerText(),
            "25 / 204 XP",
          );
          await page.reload();
          assert.deepEqual(await state(), saved);
          await tab("combat");
          assert.equal(
            await page.evaluate(() => CombatUI.engine.status),
            "idle",
          );
          await settle();
          assert.deepEqual(await state(), saved);
        }
      for (const cls of ["hunter", "warden"])
        for (const mode of ["auto", "custom"]) {
          await configure(cls, 0, true);
          await page.locator(`[data-combat-mode="${mode}"]`).tap();

          // AUTO uses real under-equipped class stats; custom conditions are changed through actual UI inputs.
          if (mode === "custom")
            for (const id of await page
              .locator("[data-condition]")
              .evaluateAll((rows) => rows.map((r) => r.dataset.condition))) {
              await page
                .locator(`[data-condition="${id}"]`)
                .selectOption("playerHpBelow");
              await page.locator(`[data-threshold="${id}"]`).fill("1");
              await page.locator(`[data-threshold="${id}"]`).press("Tab");
            }
          await run(cls === "warden" ? 3 : 1);
          assert.equal(
            await page.locator("#combat-result-heading").innerText(),
            "SCONFITTA",
          );
          assert.equal((await state()).totalXP, 0);
          assert.equal((await state()).crowns, 0);
          assert.match(
            await page.locator("#combat-reward-values").innerText(),
            /\+0 XP.*\+0 Corone/,
          );
        }
      await configure("hunter");
      await page.evaluate(() => {
        CombatData.enemies.guardian.level = 30;
      });
      await run();
      assert.equal((await state()).level, 4);
      assert.equal((await state()).totalXP, 1050);
      assert.match(
        await page.locator("#combat-reward-level").innerText(),
        /LIVELLO 4 RAGGIUNTO/,
      );
      await page.reload();
      await configure(
        "warden",
        await page.evaluate(() => ProgressionData.thresholds[19] - 10),
      );
      await run();
      assert.equal((await state()).level, 20);
      assert.equal((await state()).overflowXP, 25);
      assert.match(
        await page.locator("#combat-reward-level").innerText(),
        /LIVELLO 20 RAGGIUNTO/,
      );
      await tab("character");
      assert.match(
        await page.locator("#character-xp-value").innerText(),
        /MAX/,
      );
      if (width === 390) {
        await tab("combat");
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({
          path: "/tmp/nymeria-manual-rewards-390.png",
          fullPage: true,
        });
      }
      await configure("hunter");
      assert.ok(await page.evaluate(() => CombatUI.start({ seed: 1 })));
      await page.evaluate(async () => {
        if (navigator.locks)
          await navigator.locks.request("nymeria-progression", () => {});
        window.restoreRewardStorage = Storage.prototype.setItem;
        Storage.prototype.setItem = function (key, value) {
          if (key === ProgressionStorage.KEY)
            throw new Error("Injected quota failure");
          return window.restoreRewardStorage.call(this, key, value);
        };
      });
      await page.clock.runFor(20000);
      await settle();
      assert.equal((await state()).totalXP, 0);
      assert.ok(await page.locator("#combat-reward-retry").isVisible());
      assert.match(
        await page.locator("#combat-reward-status").innerText(),
        /non salvata/,
      );
      await page.evaluate(() => {
        Storage.prototype.setItem = window.restoreRewardStorage;
      });
      await page.locator("#combat-reward-retry").tap();
      await settle();
      assert.equal((await state()).totalXP, 35);
      assert.equal((await state()).crowns, 4);
      assert.ok(await page.locator("#combat-reward-retry").isHidden());
      assert.deepEqual(errors, []);
      await context.close();
      console.log(
        `PASS manual rewards ${width}px: Custode/Cacciatore AUTO/custom victory/defeat, reward report retained at level-up, both XP bars, multi-level/cap, refresh/double reward, failed write/retry, touch/no JS errors/overflow`,
      );
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
