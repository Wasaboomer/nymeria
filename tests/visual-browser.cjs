/* M6.5 real browser proof. Outputs are outside Git; production never loads tests. */
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const { chromium } = require("playwright"),
  navigate = require("./mobile-navigation-fixture.cjs"),
  dismiss = require("./notifications-fixture.cjs");
const base = process.env.NYMERIA_TEST_URL || "http://127.0.0.1:8004",
  out = process.env.NYMERIA_PROOF_DIR || "/workspace/nymeria-preview/m65";
fs.mkdirSync(out, { recursive: true });
const A = {
  torso: "torso-warden",
  legs: "legs-sentinel",
  boots: "boots-plate",
  gloves: "gloves-iron",
  head: "head-helm",
  mainHand: "sword",
  support: "shield",
  belt: "belt-gold",
  cloak: "cloak-dusk",
};
const B = {
  torso: "torso-vesper",
  legs: "legs-vesper",
  boots: "boots-vesper",
  gloves: "gloves-vesper",
  head: "head-vesper",
  mainHand: "vesper-sword",
  support: "vesper-shield",
  belt: "belt-rope",
  cloak: "cloak-pilgrim",
};
const H = {
  torso: "torso-chain",
  legs: "legs-chain",
  boots: "boots-chain",
  gloves: "gloves-chain",
  head: "head-chain",
  mainHand: "bow",
  support: "quiver",
  belt: "belt-rope",
  cloak: "cloak-pilgrim",
};
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.NYMERIA_CHROMIUM || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  let checks = 0;
  try {
    for (const width of [320, 390, 430]) {
      const page = await browser.newPage({
          viewport: { width, height: 844 },
          isMobile: true,
          hasTouch: true,
        }),
        errors = [],
        requests = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("request", (r) => requests.push(r.url()));
      await page.goto(base + "/?test=1");
      await page.evaluate(() => VisualRenderer.ready());
      const ready = () => page.evaluate(() => VisualRenderer.ready());
      const shot = async (name) => {
        if (width === 390) {
          await ready();
          await page.screenshot({
            path: path.join(out, name + ".png"),
            fullPage: true,
            animations: "disabled",
          });
        }
      };
      const check = async (name, fn) => {
        await fn();
        checks++;
        console.log(`PASS ${width}px ${name}`);
      };
      const asset = (layer) =>
        page.locator(`#rig [data-layer="${layer}"]`).getAttribute("data-asset");
      const equip = async (set) => {
        await page.evaluate((set) => {
          for (const [slot, id] of Object.entries(set)) {
            const r = Equipment.equip(id, slot);
            if (!r.ok) throw Error(r.message);
          }
        }, set);
        await ready();
      };
      await navigate(page, "character");
      await check(
        "Creator: 3 real hair/skin/hair colors/eyes, 2 faces; touch selection persists without equipment changes",
        async () => {
          const before = await page.evaluate(() => Equipment.state.equipment);
          assert.equal(await page.locator('[data-key="hair"]').count(), 3);
          for (const key of ["skin", "hairColor", "eyes"])
            assert.equal(await page.locator(`[data-key="${key}"]`).count(), 3);
          assert.equal(await page.locator('[data-key="face"]').count(), 2);
          for (const key of ["hair", "skin", "hairColor", "eyes", "face"])
            for (const button of await page
              .locator(`[data-key="${key}"]`)
              .all()) {
              await button.tap();
              assert.equal(await button.getAttribute("aria-pressed"), "true");
              await ready();
            }
          assert.deepEqual(
            await page.evaluate(() => Equipment.state.equipment),
            before,
          );
          await page.locator('[data-key="hair"][data-id="braid"]').tap();
          await page.locator('[data-key="skin"][data-id="warm"]').tap();
          await page.locator('[data-key="hairColor"][data-id="ash"]').tap();
          await page.locator('[data-key="eyes"][data-id="ice"]').tap();
          await page.locator('[data-key="face"][data-id="scar"]').tap();
          await ready();
          await shot("01-creator");
        },
      );
      await check(
        "create, reload: aesthetic data and Creator lock preserved; DEBUG reopening only Test Mode",
        async () => {
          await page.locator("#save").tap();
          assert.ok(await page.locator("#character-creator").isHidden());
          const appearance = await page.evaluate(
            () => Equipment.state.character,
          );
          await page.reload();
          await ready();
          await navigate(page, "character");
          assert.ok(await page.locator("#character-creator").isHidden());
          assert.deepEqual(
            await page.evaluate(() => Equipment.state.character),
            appearance,
          );
          await page.goto(base + "/");
          await ready();
          assert.equal(
            await page.evaluate(() => Equipment.debugReopenCreator()),
            false,
          );
          assert.ok(await page.locator("#creator-debug").isHidden());
          await page.goto(base + "/?test=1");
          await ready();
          assert.equal(
            await page.evaluate(() => Equipment.debugReopenCreator()),
            true,
          );
          await page.evaluate(() => Equipment.createCharacter());
        },
      );
      await page.evaluate(() => ClassSystem.selectClass("warden"));
      await check(
        "unarmed renderer: independently visible body, face, underclothes; empty weapon/support",
        async () => {
          await page.evaluate(() => {
            for (const slot of GearData.slots) Equipment.unequip(slot.id);
          });
          await ready();
          assert.equal(await asset("body / skin"), "body");
          assert.equal(await asset("torso"), "base-torso");
          assert.equal(await asset("legs"), "base-legs");
          assert.equal(await asset("weapon"), "");
          assert.equal(await asset("support"), "");
        },
      );
      await check(
        "Plate A all parts, full helmet hides hair; sword + shield visible",
        async () => {
          await equip(A);
          for (const part of ["torso", "legs", "boots", "gloves", "shoulders"])
            assert.equal(await asset(part), "plate-a-" + part);
          assert.equal(await asset("head"), "plate-a-helmet");
          assert.equal(await asset("weapon"), "sword-a");
          assert.equal(await asset("support"), "shield-a");
          assert.equal(await asset("hair-front"), "");
          await navigate(page, "character");
          await shot("02-custode-plate-a");
        },
      );
      await check(
        "Plate B independent replacements, unaffected weapon node stable; closed helmet hides hair/face/eyes",
        async () => {
          await page.evaluate(
            () =>
              (window.visualOriginalWeapon = document.querySelector(
                '#rig [data-layer="weapon"]',
              ).firstElementChild),
          );
          await equip({ torso: B.torso });
          assert.equal(await asset("torso"), "plate-b-torso");
          assert.ok(
            await page.evaluate(
              () =>
                window.visualOriginalWeapon ===
                document.querySelector('#rig [data-layer="weapon"]')
                  .firstElementChild,
            ),
          );
          await equip(B);
          for (const part of ["torso", "legs", "boots", "gloves", "shoulders"])
            assert.equal(await asset(part), "plate-b-" + part);
          assert.equal(await asset("weapon"), "sword-b");
          assert.equal(await asset("support"), "shield-b");
          for (const part of ["hair-front", "hair-back", "face", "eyes"])
            assert.equal(await asset(part), "");
          await shot("03-custode-plate-b");
        },
      );
      await check(
        "real appearanceItem chooses Plate A while actual Plate B stats and inventory remain intact; dye only torso",
        async () => {
          const stats = await page.evaluate(
            () => Equipment.state.resultingStats,
          );
          await page.evaluate(() => {
            Equipment.state.equipment.torso.appearanceItem = "torso-warden";
            Equipment.save();
            Character.render();
          });
          await ready();
          assert.equal(await asset("torso"), "plate-a-torso");
          assert.deepEqual(
            await page.evaluate(() => Equipment.state.resultingStats),
            stats,
          );
          await page.evaluate(() => Equipment.setEquipmentDye("wine"));
          await ready();
          assert.ok(
            await page.evaluate(() =>
              [...document.querySelectorAll('#rig [fill^="var(--dye"]')].every(
                (x) => x.closest("[data-layer]").dataset.layer === "torso",
              ),
            ),
          );
          assert.equal(
            await page.evaluate(() =>
              document
                .querySelector('#rig [data-layer="torso"]')
                .style.getPropertyValue("--dye"),
            ),
            "#854655",
          );
          await page.reload();
          await ready();
          assert.equal(await asset("torso"), "plate-a-torso");
          assert.equal(
            await page.evaluate(() => Equipment.equipped("torso").id),
            "torso-vesper",
          );
        },
      );
      await check(
        "unequip restores base only; 2H hides support; returning Sword+Shield restores both",
        async () => {
          await page.evaluate(() => Equipment.unequip("torso"));
          await ready();
          assert.equal(await asset("torso"), "base-torso");
          assert.equal(await asset("shoulders"), "");
          await equip({ mainHand: "greatsword" });
          assert.equal(await asset("support"), "");
          await equip({ mainHand: "sword", support: "shield" });
          assert.equal(await asset("support"), "shield-a");
          await equip(B);
        },
      );
      await check(
        "equipment 16 touch slots around shared renderer; filtered inventory and back retain context",
        async () => {
          await navigate(page, "equipment");
          assert.equal(
            await page.locator("#equipment-grid .slot-card").count(),
            16,
          );
          assert.equal(
            await page
              .locator('#equipment-character [data-layer="torso"]')
              .getAttribute("data-asset"),
            "plate-b-torso",
          );
          await shot("05-equipment");
          const torso = page.locator(
            '#equipment-grid [data-open-slot="torso"]',
          );
          const b = await torso.boundingBox();
          assert.ok(b.height >= 44);
          await torso.tap();
          assert.ok(await page.locator("#panel-inventory").isVisible());
          assert.match(
            await page.locator("#slot-filter").innerText(),
            /Armatura superiore/,
          );
          assert.deepEqual(
            (
              await page
                .locator(".inventory-item")
                .evaluateAll((nodes) => nodes.map((n) => n.dataset.itemId))
            ).sort(),
            ["torso-vesper", "torso-warden"],
          );
          await page.locator("#navigation-back").tap();
          assert.ok(await page.locator("#panel-equipment").isVisible());
        },
      );
      await check(
        "hunter Mail / Bow / Quiver on same rig; class switch removes incompatible Plate without inventory loss",
        async () => {
          const owned = await page.evaluate(() =>
            Equipment.state.inventory.map((i) => i.id),
          );
          await page.evaluate(() => ClassSystem.selectClass("hunter"));
          await equip(H);
          for (const part of ["torso", "legs", "boots", "gloves", "shoulders"])
            assert.equal(await asset(part), "mail-a-" + part);
          assert.equal(await asset("weapon"), "bow-a");
          assert.equal(await asset("support"), "quiver-a");
          assert.deepEqual(
            await page.evaluate(() =>
              Equipment.state.inventory.map((i) => i.id),
            ),
            owned,
          );
          await navigate(page, "character");
          await shot("04-cacciatore-mail");
        },
      );
      await check(
        "original six-node map: current, locked, available, real quest objective/novelty and tap travel",
        async () => {
          await navigate(page, "world");
          await page.locator('[data-world-view="overview"]').tap();
          assert.equal(await page.locator(".map-node").count(), 6);
          assert.equal(
            await page.locator('[data-map-state="current"]').count(),
            1,
          );
          assert.equal(
            await page.locator('[data-map-state="locked"]').count(),
            4,
          );
          assert.ok(
            await page
              .locator('[data-world-enter="lantern-wood"]')
              .isDisabled(),
          );
          await shot("06-frontiera-map");
          await page
            .locator('#world-locations [data-world-enter="broken-path"]')
            .tap();
          await page.waitForFunction(
            () => ProgressionStore.state.frontier.location === "broken-path",
          );
          assert.equal(
            await page.evaluate(() => ProgressionStore.state.frontier.location),
            "broken-path",
          );
          assert.ok(await page.locator("#world-location-detail").isVisible());
          await page.evaluate(async () => {
            await WorldSystem.enter("veyra");
            await QuestSystem.accept("mq01");
            await QuestSystem.track("mq01");
            NymeriaNavigation.open("world", { view: "overview" });
          });
          assert.ok(
            (await page.locator("#world-locations .map-objective").count()) > 0,
          );
        },
      );
      await check(
        "world Combat renderer uses frozen preparation, real enemy and live skill feedback without engine changes",
        async () => {
          await page.evaluate(async () => {
            await WorldSystem.enter("broken-path");
            const r = await WorldSystem.startEncounter("vesper-raider", {
              seed: 42,
            });
            if (!r.ok) throw Error(r.message);
            NymeriaNavigation.open("world", { view: "battle" });
          });
          await ready();
          assert.ok(
            await page
              .locator(".visual-battle-arena .visual-character")
              .isVisible(),
          );
          assert.match(
            await page.locator(".visual-enemy").getAttribute("src"),
            /raider.svg/,
          );
          assert.equal(
            await page
              .locator('.visual-battle-arena [data-layer="weapon"]')
              .getAttribute("data-asset"),
            "bow-a",
          );
          await page.evaluate(() => Equipment.unequip("mainHand"));
          await ready();
          assert.equal(
            await page
              .locator('.visual-battle-arena [data-layer="weapon"]')
              .getAttribute("data-asset"),
            "bow-a",
          );
          await page.locator("#world-battle-resume").tap();
          await page.waitForFunction(
            () =>
              WorldUI.engine?.time >= 0.4 &&
              document.querySelector(".visual-skill-feedback").textContent !==
                "Preparazione salvata",
          );
          await shot("07-combat");
          await page
            .locator(".visual-enemy")
            .screenshot({ path: path.join(out, `enemy-raider-${width}.png`) });

          await page.reload();
          await ready();
          assert.equal(
            await page
              .locator('.visual-battle-arena [data-layer="weapon"]')
              .getAttribute("data-asset"),
            "bow-a",
          );
          await page.evaluate(() => WorldSystem.abandonEncounter());
        },
      );
      await check(
        "all four enemy visuals, live skill/attack feedback and new cosmetic snapshot survive refresh",
        async () => {
          await equip(H);
          for (const [location, id, file] of [
            ["broken-path", "vesper-raider", "raider"],
            ["lantern-wood", "corrupt-hound", "hound"],
            ["elar-ruins", "elar-sentinel", "sentinel"],
            ["lantern-wood", "twilight-stag", "stag"],
          ]) {
            await page.evaluate(
              async ({ location, id }) => {
                await WorldSystem.debug("unlock", location);
                await WorldSystem.enter(location);
                const result = await WorldSystem.startEncounter(id, {
                  seed: 42,
                });
                if (!result.ok) throw Error(result.message);
                NymeriaNavigation.open("world", { view: "battle" });
              },
              { location, id },
            );
            await ready();
            assert.match(
              await page.locator(".visual-enemy").getAttribute("src"),
              new RegExp(file + "\\.svg"),
            );
            await page
              .locator(".visual-enemy")
              .evaluate((image) => image.decode());
            assert.equal(
              await page
                .locator(".visual-enemy")
                .evaluate((image) => image.naturalWidth),
              360,
            );
            if (width === 390)
              await page
                .locator(".visual-enemy")
                .screenshot({ path: path.join(out, "enemy-" + file + ".png") });
            if (width === 390 && file === "hound")
              await page.screenshot({
                path: path.join(out, "08-enemy-segugio.png"),
                fullPage: true,
                animations: "disabled",
              });
            await page.evaluate(() => WorldUI.resume());
            await page.waitForFunction(
              () =>
                document.querySelector(".visual-skill-feedback").textContent !==
                "Preparazione salvata",
            );
            await page.evaluate(() => WorldSystem.abandonEncounter());
          }
          await page.evaluate(async () => {
            await WorldSystem.enter("broken-path");
            Equipment.state.equipment.torso.appearanceItem = "torso-warden";
            Equipment.save();
            const result = await WorldSystem.startEncounter("vesper-raider", {
              seed: 42,
            });
            if (!result.ok) throw Error(result.message);
            NymeriaNavigation.open("world", { view: "battle" });
          });
          await ready();
          assert.equal(
            await page
              .locator('.visual-battle-arena [data-layer="torso"]')
              .getAttribute("data-asset"),
            "plate-a-torso",
          );
          const dye = await page
            .locator('.visual-battle-arena [data-layer="torso"]')
            .evaluate((group) => group.style.getPropertyValue("--dye"));
          await page.evaluate(() => {
            Equipment.equip("torso-chain", "torso");
            Equipment.setEquipmentDye("gold");
          });
          await page.reload();
          await ready();
          assert.equal(
            await page
              .locator('.visual-battle-arena [data-layer="torso"]')
              .getAttribute("data-asset"),
            "plate-a-torso",
          );
          assert.equal(
            await page
              .locator('.visual-battle-arena [data-layer="torso"]')
              .evaluate((group) => group.style.getPropertyValue("--dye")),
            dye,
          );
          await page.evaluate(() => WorldSystem.abandonEncounter());
        },
      );
      await check(
        "reduced motion, safe-area reserved nav, no overflow on every screen, zero JS errors; cached assets",
        async () => {
          await page.emulateMedia({ reducedMotion: "reduce" });
          for (const screen of [
            "character",
            "equipment",
            "inventory",
            "class",
            "world",
            "expeditions",
            "menu",
          ]) {
            await navigate(page, screen);
            assert.ok(
              await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth,
              ),
              screen,
            );
          }
          await navigate(page, "character");
          assert.equal(
            await page
              .locator("#rig")
              .evaluate((n) => getComputedStyle(n).animationName),
            "none",
          );
          const nav = await page.locator(".bottom-nav").boundingBox();
          assert.ok(nav.y + nav.height <= 845);
          assert.ok(await page.locator("#character").boundingBox());
          assert.deepEqual(errors, []);
          const priorRequests = requests.filter((x) =>
            x.includes("/assets/character/"),
          ).length;
          await page.evaluate(async () => {
            for (let i = 0; i < 5; i++) await Character.render();
          });
          assert.equal(
            requests.filter((x) => x.includes("/assets/character/")).length,
            priorRequests,
            "Unchanged renders must not refetch assets",
          );
          const assetRequests = requests.filter((x) =>
            x.includes("/assets/character/"),
          );
          assert.ok(assetRequests.length < 220, assetRequests.length);
          console.log(
            "SVG asset network requests including 4 reloads: " +
              assetRequests.length,
          );
        },
      );
      await page.close();
    }
    const p = await browser.newPage({ viewport: { width: 390, height: 844 } }),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.route("**/assets/character/plate-b-torso.svg*", (route) =>
      route.abort(),
    );
    await p.goto(base + "/?test=1");
    await p.evaluate(() => ClassSystem.selectClass("warden"));
    await p.evaluate(() => Equipment.equip("torso-vesper", "torso"));
    await p.evaluate(() => VisualRenderer.ready());
    assert.equal(
      await p.locator('#rig [data-layer="torso"]').getAttribute("data-asset"),
      "base-torso",
    );
    assert.equal(
      await p
        .locator('#rig [data-layer="torso"]')
        .getAttribute("data-fallback"),
      "true",
    );
    assert.match(
      await p.locator("#character").getAttribute("data-visual-debug"),
      /plate-b-torso/,
    );
    assert.equal(
      await p
        .locator('#rig [data-layer="body / skin"]')
        .getAttribute("data-asset"),
      "body",
    );
    assert.deepEqual(errors, []);
    assert.match(
      await p.locator("#visual-diagnostics p").textContent(),
      /plate-b-torso/,
    );
    checks++;
    console.log(
      "PASS missing asset controlled per-layer fallback + DEBUG diagnostics; intact body, no JS error",
    );
    await p.close();
    const racing = await browser.newPage({
        viewport: { width: 390, height: 844 },
      }),
      raceErrors = [];
    racing.on("pageerror", (error) => raceErrors.push(error.message));
    let release;
    const delayed = new Promise((resolve) => (release = resolve));
    await racing.route("**/assets/character/body.svg*", async (route) => {
      await delayed;
      await route.continue();
    });
    await racing.route(
      "**/assets/character/plate-a-torso.svg*",
      async (route) => {
        await delayed;
        await route.continue();
      },
    );
    await racing.goto(base + "/?test=1");
    await racing.evaluate(() => {
      ClassSystem.selectClass("warden");
      Equipment.equip("torso-warden", "torso");
      Equipment.setCharacter("skin", "pale");
      Equipment.setCharacter("hairColor", "copper");
      Equipment.equip("torso-vesper", "torso");
      Equipment.setCharacter("skin", "umber");
      Equipment.setCharacter("hairColor", "ash");
      Equipment.setCharacter("hair", "braid");
      Equipment.setEquipmentDye("wine");
    });
    release();
    await racing.evaluate(() => VisualRenderer.ready());
    assert.equal(
      await racing
        .locator('#rig [data-layer="torso"]')
        .getAttribute("data-asset"),
      "plate-b-torso",
    );
    assert.equal(
      await racing
        .locator("#rig")
        .evaluate((rig) => rig.style.getPropertyValue("--skin")),
      "#795441",
    );
    assert.equal(
      await racing
        .locator("#rig")
        .evaluate((rig) => rig.style.getPropertyValue("--hair")),
      "#bebcb0",
    );
    assert.equal(
      await racing
        .locator('#rig [data-layer="torso"]')
        .evaluate((group) => group.style.getPropertyValue("--dye")),
      "#854655",
    );
    assert.deepEqual(raceErrors, []);
    checks++;
    console.log(
      "PASS delayed asset / rapid selections: stale geometry and palette responses cannot overwrite latest state",
    );
    await racing.close();
    for (const file of [
      "01-creator",
      "02-custode-plate-a",
      "03-custode-plate-b",
      "04-cacciatore-mail",
      "05-equipment",
      "06-frontiera-map",
      "07-combat",
      "08-enemy-segugio",
    ]) {
      const png = fs.readFileSync(path.join(out, file + ".png"));
      assert.equal(png.readUInt32BE(16), 390, file + " proof width");
    }
    console.log(
      `${checks} M6.5 browser scenarios passed; 8 required proofs in ${out}`,
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
