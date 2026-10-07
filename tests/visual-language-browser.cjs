/* M6.5.1: actual modular renderer, isolated comparisons and monochrome geometry. */
const assert = require("node:assert/strict"),
  fs = require("node:fs");
const { chromium } = require("playwright"),
  navigate = require("./mobile-navigation-fixture.cjs");
const base = process.env.NYMERIA_TEST_URL || "http://127.0.0.1:8009/nymeria";
const out = process.env.NYMERIA_PROOF_DIR || "/workspace/nymeria-preview/m651";
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  let count = 0;
  try {
    for (const width of [320, 390, 430, 800]) {
      const page = await browser.newPage({
          viewport: { width, height: 844 },
          hasTouch: true,
          isMobile: width < 700,
          reducedMotion: "reduce",
        }),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("response", (r) => {
        if (r.status() >= 400) errors.push(r.status() + " " + r.url());
      });
      await page.goto(base + "/?test=1");
      await navigate(page, "debug");
      await page.locator("#visual-showcase>summary").tap();
      const ready = () => page.evaluate(() => VisualRenderer.ready());
      await page.waitForFunction(
        () =>
          document.querySelector('#showcase-character [data-layer="head"]')
            ?.dataset.asset === "plate-a-helmet",
      );
      await ready();
      const proof = async (name) => {
        await page
          .locator(".showcase-stage")
          .evaluate((n) => n.scrollIntoView({ block: "center" }));
        await page
          .locator(".showcase-stage")
          .screenshot({ path: out + "/" + name });
      };
      const press = async (s) => {
        await page.locator("#visual-showcase " + s).tap();
        await ready();
      };
      const state = () =>
        page.evaluate(() =>
          JSON.stringify({
            equipment: Equipment.state,
            progression: ProgressionStore.state,
            storage: { ...localStorage },
          }),
        );
      const before = await state();
      const assets = (id = "showcase-character") =>
        page.evaluate(
          (id) =>
            Object.fromEntries(
              [...document.querySelectorAll("#" + id + " [data-layer]")].map(
                (n) => [
                  n.dataset.layer,
                  { asset: n.dataset.asset, html: n.innerHTML },
                ],
              ),
            ),
          id,
        );
      const swaps = [
        [
          '[data-showcase-armor="plateB"]',
          ["torso", "shoulders", "legs", "boots", "gloves", "belt"],
        ],
        ['[data-showcase-item="head-vesper"]', ["head"]],
        [
          '[data-showcase-item="none"]',
          ["head", "hair-front", "hair-back", "face", "eyes", "ears"],
        ],
        [
          '[data-showcase-item="head-helm"]',
          ["head", "hair-front", "hair-back", "face", "eyes", "ears"],
        ],
        ['[data-showcase-item="vesper-sword"]', ["weapon"]],
        ['[data-showcase-item="vesper-shield"]', ["support"]],
        [
          '[data-showcase-armor="plateA"]',
          ["torso", "shoulders", "legs", "boots", "gloves", "belt"],
        ],
      ];
      for (const [selector, allowed] of swaps) {
        const prior = await assets();
        const rect = await page
          .locator("#showcase-character")
          .evaluate((n) => ({
            x: n.offsetLeft,
            y: n.offsetTop,
            width: n.clientWidth,
            height: n.clientHeight,
          }));
        await press(selector);
        const next = await assets();
        for (const key of Object.keys(prior))
          if (!allowed.includes(key))
            assert.deepEqual(
              next[key],
              prior[key],
              selector + " changed " + key,
            );
        assert.deepEqual(
          await page.locator("#showcase-character").evaluate((n) => ({
            x: n.offsetLeft,
            y: n.offsetTop,
            width: n.clientWidth,
            height: n.clientHeight,
          })),
          rect,
        );
        count++;
      }
      // The six required mix-and-match configurations use ordinary single-slot controls.
      for (const [armor, helmet, sword, shield] of [
        ["plateA", "head-helm", "sword", "shield"],
        ["plateA", "head-vesper", "sword", "shield"],
        ["plateA", "head-helm", "vesper-sword", "shield"],
        ["plateA", "head-helm", "sword", "vesper-shield"],
        ["plateB", "head-helm", "vesper-sword", "vesper-shield"],
        ["plateB", "head-vesper", "sword", "shield"],
      ]) {
        await press('[data-showcase-armor="' + armor + '"]');
        for (const item of [helmet, sword, shield])
          await press('[data-showcase-item="' + item + '"]');
        const current = await assets();
        assert.equal(
          current.torso.asset,
          armor === "plateA" ? "plate-a-torso" : "plate-b-torso",
        );
        assert.equal(
          current.head.asset,
          helmet === "head-helm" ? "plate-a-helmet" : "plate-b-helmet",
        );
        assert.equal(
          current.weapon.asset,
          sword === "sword" ? "sword-a" : "sword-b",
        );
        assert.equal(
          current.support.asset,
          shield === "shield" ? "shield-a" : "shield-b",
        );
        count++;
      }
      await press('[data-showcase-armor="plateA"]');
      await press('[data-showcase-item="head-helm"]');
      await press('[data-showcase-item="sword"]');
      await press('[data-showcase-item="shield"]');
      await press("[data-compare-toggle]");
      for (const [part, allowed] of [
        ["armor", ["torso", "shoulders", "legs", "boots", "gloves", "belt"]],
        ["head", ["head"]],
        ["mainHand", ["weapon"]],
        ["support", ["support"]],
      ]) {
        await page.locator("#showcase-compare-part").selectOption(part);
        await ready();
        const a = await assets(),
          b = await assets("showcase-character-b");
        for (const key of Object.keys(a))
          if (!allowed.includes(key))
            assert.equal(
              a[key].asset,
              b[key].asset,
              part + " comparison changed " + key,
            );
        assert.ok(allowed.some((key) => a[key].asset !== b[key].asset));
        await press('[data-compare-side="a"]');
        const rect = await page
          .locator("#showcase-character")
          .evaluate((n) => ({
            x: n.offsetLeft,
            y: n.offsetTop,
            width: n.clientWidth,
            height: n.clientHeight,
          }));
        if (width === 390) {
          await proof(part + "-a-390.png");
        }
        await press('[data-compare-side="b"]');
        assert.ok(await page.locator("#showcase-character-b").isVisible());
        if (width < 700) {
          assert.equal(
            await page.locator("#showcase-character").isVisible(),
            false,
          );
          assert.deepEqual(
            await page.locator("#showcase-character-b").evaluate((n) => ({
              x: n.offsetLeft,
              y: n.offsetTop,
              width: n.clientWidth,
              height: n.clientHeight,
            })),
            rect,
          );
        } else assert.ok(await page.locator("#showcase-character").isVisible());
        if (width === 390) await proof(part + "-b-390.png");
        count++;
      }
      await press("[data-compare-silhouette]");
      assert.ok(
        await page
          .locator(".showcase-stage")
          .evaluate((n) => n.classList.contains("silhouette-review")),
      );
      if (width === 390)
        await page
          .locator("#visual-showcase")
          .screenshot({ path: out + "/showcase-full-390.png" });
      assert.ok(
        await page
          .locator(".showcase-stage .visual-rig")
          .evaluateAll((ns) =>
            ns.every((n) => getComputedStyle(n).animationName === "none"),
          ),
      );
      assert.equal(await state(), before);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      assert.ok(
        await page
          .locator("#visual-showcase button")
          .evaluateAll((ns) =>
            ns.every((n) => n.getBoundingClientRect().height >= 44),
          ),
      );
      assert.deepEqual(errors, []);
      await page.reload();
      await ready();
      assert.equal(await state(), before);
      await page.goto(base + "/");
      await ready();
      assert.equal(await page.locator("#visual-showcase").count(), 0);
      // Same rig, geometry measurements independent of fill/color or texture.
      const bounds = await page.evaluate(async () => {
        const result = {};
        for (const id of [
          "plate-a-helmet",
          "plate-b-helmet",
          "plate-a-shoulders",
          "plate-b-shoulders",
          "plate-a-torso",
          "plate-b-torso",
          "plate-a-legs",
          "plate-b-legs",
          "plate-a-gloves",
          "plate-b-gloves",
          "plate-a-boots",
          "plate-b-boots",
          "belt-a",
          "belt-b",
          "sword-a",
          "sword-b",
          "shield-a",
          "shield-b",
        ]) {
          const s = await (
            await fetch(VisualManifest.assets[id].file + "?v=m651-1")
          ).text();
          const wrap = document.createElement("div");
          wrap.innerHTML = s;
          document.body.append(wrap);
          const box = wrap.querySelector("svg>g").getBBox();
          result[id] = { width: box.width, height: box.height };
          wrap.remove();
        }
        return result;
      });
      for (const part of [
        "helmet",
        "shoulders",
        "torso",
        "legs",
        "gloves",
        "boots",
      ])
        assert.ok(
          bounds["plate-b-" + part].width > bounds["plate-a-" + part].width,
          part + " B must be broader",
        );
      assert.ok(bounds["belt-b"].width > bounds["belt-a"].width);
      assert.ok(bounds["sword-b"].height < bounds["sword-a"].height);
      assert.ok(bounds["sword-b"].width > bounds["sword-a"].width);
      assert.ok(bounds["shield-a"].height > bounds["shield-a"].width * 1.5);
      assert.ok(
        Math.abs(bounds["shield-b"].height - bounds["shield-b"].width) < 1,
      );
      // Ordinary Equipment APIs retain independent sublayers and glamour persistence.
      await page.evaluate(() => {
        ClassSystem.selectClass("warden");
        for (const [slot, id] of Object.entries({
          torso: "torso-vesper",
          legs: "legs-vesper",
          boots: "boots-vesper",
          gloves: "gloves-vesper",
          belt: "belt-rope",
          cloak: "cloak-pilgrim",
          head: "head-vesper",
          mainHand: "vesper-sword",
          support: "vesper-shield",
        })) {
          const result = Equipment.equip(id, slot);
          if (!result.ok) throw Error(result.message);
        }
      });
      await ready();
      for (const [slot, id, allowed] of [
        ["torso", "torso-warden", ["torso", "shoulders"]],
        ["gloves", "gloves-iron", ["gloves"]],
        ["boots", "boots-plate", ["boots"]],
        ["legs", "legs-sentinel", ["legs"]],
        ["belt", "belt-gold", ["belt"]],
        ["cloak", "cloak-dusk", ["cloak"]],
      ]) {
        const prior = await assets("rig");
        assert.ok(
          await page.evaluate(({ slot, id }) => Equipment.equip(id, slot).ok, {
            slot,
            id,
          }),
        );
        await ready();
        const next = await assets("rig");
        for (const key of Object.keys(prior))
          if (!allowed.includes(key))
            assert.deepEqual(
              next[key],
              prior[key],
              "normal " + slot + " changed " + key,
            );
      }
      await page.evaluate(() => Equipment.unequip("head"));
      await ready();
      assert.equal(
        (await assets("rig"))["hair-front"].asset,
        "hair-veil-front",
      );
      await page.evaluate(() => Equipment.equip("torso-vesper", "torso"));
      await ready();
      await page.evaluate(() => {
        Equipment.state.equipment.torso.appearanceItem = "torso-warden";
        Equipment.save();
        Character.render();
      });
      await ready();
      assert.equal((await assets("rig")).torso.asset, "plate-a-torso");
      const persisted = await state();
      await page.reload();
      await ready();
      assert.equal(await state(), persisted);
      assert.equal((await assets("rig")).torso.asset, "plate-a-torso");
      assert.equal(
        await page.evaluate(() => Equipment.equipped("torso").id),
        "torso-vesper",
      );
      assert.deepEqual(errors, []);
      console.log(
        width +
          "px: " +
          17 +
          " swap/mix/comparison checks + independent normal Equipment/glamour, geometry, isolated persistence, touch, reduced motion, overflow, normal DEBUG absence PASS",
      );
      await page.close();
    }
    console.log(
      count +
        " targeted scenarios passed; visual proofs outside repository: " +
        out,
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
