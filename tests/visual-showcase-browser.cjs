/* Targeted M6.5 debug showcase checks; no screenshots or generated files. */
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const navigate = require("./mobile-navigation-fixture.cjs");
const base = process.env.NYMERIA_TEST_URL || "http://127.0.0.1:8008";
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    for (const width of [320, 390, 430]) {
      const page = await browser.newPage({
        viewport: { width, height: 844 },
        isMobile: true,
        hasTouch: true,
        reducedMotion: "reduce",
      });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(base);
      await page.evaluate(() => VisualRenderer.ready());
      assert.equal(await page.locator("#visual-showcase").count(), 0);
      await page.goto(base + "/?test=1");
      await navigate(page, "debug");
      const saved = () =>
        page.evaluate(() =>
          JSON.stringify({
            equipment: Equipment.state,
            progression: ProgressionStore.state,
            storage: { ...localStorage },
          }),
        );
      const before = await saved();
      assert.equal(await page.locator("#showcase-character").count(), 0);
      await page.locator("#visual-showcase > summary").tap();
      const ready = () => page.evaluate(() => VisualRenderer.ready());
      await ready();
      const tap = async (selector) => {
        await page.locator("#visual-showcase " + selector).tap();
        await ready();
      };
      const layer = (key) =>
        page.locator('#showcase-character [data-layer="' + key + '"]');
      for (const [preset, torso, weapon, support] of [
        ["plateA", "plate-a-torso", "sword-a", "shield-a"],
        ["plateB", "plate-b-torso", "sword-b", "shield-b"],
        ["mailA", "mail-a-torso", "bow-a", "quiver-a"],
      ]) {
        await tap('[data-showcase-preset="' + preset + '"]');
        assert.equal(await layer("torso").getAttribute("data-asset"), torso);
        assert.equal(await layer("weapon").getAttribute("data-asset"), weapon);
        assert.equal(
          await layer("support").getAttribute("data-asset"),
          support,
        );
        for (const part of ["head", "legs", "boots", "gloves"])
          assert.ok(await layer(part).getAttribute("data-asset"));
      }
      await page.evaluate(
        () =>
          (window.showcaseTorso = document.querySelector(
            '#showcase-character [data-layer="torso"]',
          )),
      );
      for (const [id, part, asset] of [
        ["sword", "weapon", "sword-a"],
        ["vesper-sword", "weapon", "sword-b"],
        ["shield", "support", "shield-a"],
        ["vesper-shield", "support", "shield-b"],
      ]) {
        await tap('[data-showcase-item="' + id + '"]');
        assert.equal(await layer(part).getAttribute("data-asset"), asset);
        assert.ok(
          await page.evaluate(
            () =>
              window.showcaseTorso ===
              document.querySelector(
                '#showcase-character [data-layer="torso"]',
              ),
          ),
        );
      }
      await tap("[data-showcase-bow]");
      assert.equal(await layer("weapon").getAttribute("data-asset"), "bow-a");
      assert.equal(
        await layer("support").getAttribute("data-asset"),
        "quiver-a",
      );
      const options = await page
        .locator("[data-showcase-appearance]")
        .evaluateAll((nodes) =>
          nodes.map((n) => ({
            key: n.dataset.showcaseAppearance,
            value: n.dataset.showcaseValue,
          })),
        );
      for (const { key, value } of options) {
        await tap(
          '[data-showcase-appearance="' +
            key +
            '"][data-showcase-value="' +
            value +
            '"]',
        );
        assert.equal(
          await page
            .locator(
              '[data-showcase-appearance="' +
                key +
                '"][data-showcase-value="' +
                value +
                '"]',
            )
            .getAttribute("aria-pressed"),
          "true",
        );
        if (key === "hair")
          assert.equal(
            await layer("hair-front").getAttribute("data-asset"),
            "hair-" + value + "-front",
          );
        if (key === "face")
          assert.equal(
            await layer("face").getAttribute("data-asset"),
            "face-" + value,
          );
        if (["skin", "hairColor", "eyes", "dye"].includes(key)) {
          const actual = await page.evaluate(
            ({ key, value }) => {
              const palette = key === "hairColor" ? "hair" : key;
              const color = PALETTES[palette].find(
                (row) => row.id === value,
              ).color;
              const node = document.querySelector(
                key === "dye"
                  ? '#showcase-character [data-layer="torso"]'
                  : "#showcase-character .visual-rig",
              );
              return {
                expected: color,
                actual: node.style
                  .getPropertyValue("--" + (key === "hairColor" ? "hair" : key))
                  .trim(),
              };
            },
            { key, value },
          );
          assert.equal(actual.actual, actual.expected);
        }
      }
      for (const id of await page
        .locator("[data-showcase-enemy]")
        .evaluateAll((nodes) => nodes.map((n) => n.dataset.showcaseEnemy))) {
        await tap('[data-showcase-enemy="' + id + '"]');
        assert.ok(
          await page.locator(".showcase-enemy").evaluate(async (img) => {
            await img.decode();
            return !img.hidden && img.naturalWidth === 360;
          }),
        );
        assert.ok(
          await page.evaluate(
            (id) =>
              document
                .querySelector(".showcase-enemy")
                .src.includes("/" + VisualManifest.enemies[id] + ".svg"),
            id,
          ),
        );
      }
      await tap("[data-showcase-base]");
      assert.equal(await layer("weapon").getAttribute("data-asset"), "");
      await tap("[data-showcase-helmet]");
      assert.equal(
        await layer("head").getAttribute("data-asset"),
        "plate-a-helmet",
      );
      await tap("[data-showcase-helmet]");
      assert.equal(await layer("head").getAttribute("data-asset"), "");
      assert.equal(await saved(), before);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      assert.ok(
        await page
          .locator("#visual-showcase button")
          .evaluateAll((nodes) =>
            nodes.every((n) => n.getBoundingClientRect().height >= 44),
          ),
      );
      assert.equal(
        await page
          .locator("#showcase-character .visual-rig")
          .evaluate((n) => getComputedStyle(n).animationName),
        "none",
      );
      await page.reload();
      await ready();
      assert.equal(await saved(), before);
      assert.equal(await page.locator("#showcase-character").count(), 0);
      assert.deepEqual(errors, []);
      await page.close();
      console.log(
        width +
          "px: presets, modular swaps, all appearance/enemies, isolated saves, reload, touch, overflow, reduced motion PASS",
      );
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
