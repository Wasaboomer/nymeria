/* M7.0 physical-device preparation; real UI, existing navigation and local saves. */
const assert = require("node:assert/strict"),
  { chromium } = require("playwright");
const base = process.env.NYMERIA_TEST_URL || "http://127.0.0.1:8009/nymeria";
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    for (const width of [320, 375, 390, 430]) {
      const context = await browser.newContext({
          viewport: { width, height: 844 },
          hasTouch: true,
          isMobile: true,
          reducedMotion: "reduce",
        }),
        page = await context.newPage(),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("response", (r) => {
        if (r.status() >= 400) errors.push(r.status() + " " + r.url());
      });
      await page.goto(base + "/");
      await page.evaluate(() => VisualRenderer.ready());
      const untouched = () =>
        page.evaluate(() =>
          JSON.stringify(
            Object.fromEntries(
              Object.entries(localStorage).filter(
                ([k]) => k !== "nymeria.guild.v1",
              ),
            ),
          ),
        );
      const before = await untouched();
      assert.equal(await page.locator(".bottom-nav [data-screen]").count(), 4);
      const open = async () => {
        await page.locator("#tab-menu").tap();
        await page.locator('[data-nav="guild"]').tap();
      };
      await open();
      assert.ok(await page.locator("#guild-create").isVisible());
      assert.equal(await page.evaluate(() => NymeriaNavigation.depth), 1);
      assert.equal(await page.locator("#context-title").textContent(), "Gilda");
      await page.locator("#navigation-back").tap();
      assert.ok(await page.locator("#panel-menu").isVisible());
      assert.equal(await page.evaluate(() => NymeriaNavigation.depth), 0);
      assert.equal(
        await page.evaluate(() => document.activeElement.dataset.nav),
        "guild",
      );
      await page.locator('[data-nav="guild"]').tap();
      await page
        .locator('#guild-create [name="name"]')
        .fill("Vespro <img src=x>");
      await page
        .locator('#guild-create [name="motto"]')
        .fill("Motto ".repeat(12));
      await page.locator('label:has([value="wolf"])').tap();
      await page.locator("#guild-create button").tap();
      await page.waitForSelector(".guild-members");
      assert.equal(await page.locator("#guild-create").count(), 0);
      assert.equal(
        await page.locator(".guild-hero h1").textContent(),
        "Vespro <img src=x>",
      );
      assert.equal(await page.locator("#guild-root img").count(), 0);
      assert.equal(await page.locator(".guild-members article").count(), 4);
      assert.equal(
        await page.getByText("Membro demo · simulato", { exact: true }).count(),
        3,
      );
      assert.equal(
        await page.evaluate(() => GuildSystem.state.guild.sigil),
        "wolf",
      );
      assert.equal(
        await page.locator(".guild-sigil svg").getAttribute("aria-label"),
        "Lupo delle Brume",
      );
      for (const key of ["crowns", "iron", "fiber", "ether"]) {
        await page.locator("#guild-contribute select").selectOption(key);
        await page.locator("#guild-contribute input").fill("10");
        await page.locator("#guild-contribute button").tap();
        await page.waitForFunction(
          (key) => GuildSystem.state.guild.treasury[key] === 10,
          key,
        );
        assert.match(
          await page.locator("#guild-status").textContent(),
          /Risorse personali invariate/,
        );
      }
      assert.equal(await untouched(), before);
      const guild = await page.evaluate(() => GuildSystem.state);
      await page.reload();
      await page.evaluate(() => VisualRenderer.ready());
      await open();
      assert.deepEqual(await page.evaluate(() => GuildSystem.state), guild);
      assert.equal(
        await page.evaluate(
          async () => (await GuildSystem.createGuild({ name: "Duplicate" })).ok,
        ),
        false,
      );
      // Local founder level is a read-only projection of central progression.
      await page.evaluate(() =>
        ProgressionStore.transact((draft) => {
          draft.totalXP = ProgressionData.thresholds[3];
          return { ok: true };
        }),
      );
      await page.waitForFunction(() =>
        document
          .querySelector('[data-guild-member="player"]')
          .textContent.includes("Liv. 4"),
      );
      assert.deepEqual(await page.evaluate(() => GuildSystem.state), guild);
      // Submit invalid values through the event handler, including values HTML constraints normally reject.
      for (const amount of ["0", "-5", "1.5", "1e3", "10000"]) {
        await page.locator("#guild-contribute input").fill(amount);
        await page
          .locator("#guild-contribute")
          .evaluate((form) =>
            form.dispatchEvent(
              new Event("submit", { bubbles: true, cancelable: true }),
            ),
          );
        await page.waitForFunction(
          () =>
            document
              .querySelector("#guild-contribute")
              .getAttribute("aria-busy") === "false",
        );
        assert.match(
          await page.locator("#guild-status").textContent(),
          /intero/,
        );
        assert.deepEqual(await page.evaluate(() => GuildSystem.state), guild);
      }
      // Storage errors must be visible and preserve the committed balance; a retry succeeds.
      await page.evaluate(() => {
        window.realSet = Storage.prototype.setItem;
        Storage.prototype.setItem = function (key, value) {
          if (key === "nymeria.guild.v1") throw Error("quota");
          return window.realSet.call(this, key, value);
        };
      });
      await page.locator("#guild-contribute select").selectOption("ether");
      await page.locator("#guild-contribute input").fill("15");
      await page.locator("#guild-contribute button").tap();
      await page.waitForFunction(() =>
        document
          .querySelector("#guild-status")
          .textContent.includes("Impossibile salvare"),
      );
      assert.deepEqual(await page.evaluate(() => GuildSystem.state), guild);
      assert.equal(
        await page.locator("#guild-contribute input").inputValue(),
        "15",
      );
      await page.evaluate(() => (Storage.prototype.setItem = window.realSet));
      await page.locator("#guild-contribute button").tap();
      await page.waitForFunction(
        () => GuildSystem.state.guild.treasury.ether === 25,
      );
      // Long legacy identity, huge balances and malformed member fields recover without UI crashes.
      await page.evaluate(() => {
        localStorage.setItem(
          "nymeria.guild.v1",
          JSON.stringify({
            version: 1,
            guild: {
              name: "W".repeat(28),
              motto: "W".repeat(72),
              level: 20,
              xp: 999999,
              treasury: { crowns: 1e9 },
              members: [
                null,
                {
                  id: "npc",
                  name: "W".repeat(40),
                  role: "leader",
                  contribution: 1e9,
                },
              ],
            },
          }),
        );
        GuildSystem.load();
      });
      assert.match(await page.locator(".guild-xp").textContent(), /MASSIMO/);
      assert.equal(await page.locator(".guild-members article").count(), 2);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      assert.ok(
        await page
          .locator(
            "#panel-guild button,#panel-guild select,#panel-guild input:not([type=radio])",
          )
          .evaluateAll((nodes) =>
            nodes.every((n) => n.getBoundingClientRect().height >= 44),
          ),
      );
      await page.locator("#navigation-back").tap();
      assert.equal(await page.evaluate(() => NymeriaNavigation.depth), 0);
      for (const id of ["world", "character", "expeditions", "menu"]) {
        await page.locator("#tab-" + id).tap();
        assert.ok(await page.locator("#panel-" + id).isVisible());
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
      }
      assert.equal(await page.locator("#menu-debug-link").isVisible(), false);
      assert.equal(await page.locator("#visual-showcase").count(), 0);
      // Corrupt JSON and denied reads on cold initialization must not stop the app/nav.
      await page.evaluate(() =>
        localStorage.setItem("nymeria.guild.v1", "{broken"),
      );
      await page.reload();
      await open();
      assert.ok(await page.locator("#guild-create").isVisible());
      assert.ok(await page.locator(".guild-warning").isVisible());
      await page.addInitScript(() => {
        const original = Storage.prototype.getItem;
        Storage.prototype.getItem = function (key) {
          if (key === "nymeria.guild.v1") throw Error("denied");
          return original.call(this, key);
        };
      });
      await page.reload();
      await open();
      assert.ok(await page.locator(".guild-warning").isVisible());
      assert.ok(await page.locator("#guild-create").isVisible());
      assert.deepEqual(errors, []);
      await context.close();
      console.log(
        width +
          "px: creation, identity/sigil, demo ranks, contribution isolation/validation, reload, recovery, storage failures, navigation/back, touch, overflow and zero JS/HTTP errors PASS",
      );
    }
    const fallback = await browser.newContext(),
      fallbackPage = await fallback.newPage();
    await fallbackPage.addInitScript(() =>
      Object.defineProperty(navigator, "locks", { value: undefined }),
    );
    await fallbackPage.goto(base + "/");
    await fallbackPage.locator("#tab-menu").click();
    await fallbackPage.locator('[data-nav="guild"]').click();
    assert.match(
      await fallbackPage.locator(".guild-prototype").textContent(),
      /non supporta Web Locks/,
    );
    assert.equal(
      await fallbackPage.evaluate(
        async () => (await GuildSystem.createGuild({ name: "Solo locale" })).ok,
      ),
      true,
    );
    assert.equal(
      await fallbackPage.evaluate(
        async () => (await GuildSystem.contribute("crowns", 10)).ok,
      ),
      true,
    );
    await fallbackPage.reload();
    assert.equal(
      await fallbackPage.evaluate(
        () => GuildSystem.state.guild.treasury.crowns,
      ),
      10,
    );
    await fallback.close();
    // One lifetime writer lease avoids stale localStorage caches across renderer processes.
    const context = await browser.newContext(),
      a = await context.newPage(),
      b = await context.newPage();
    await Promise.all([a.goto(base + "/"), b.goto(base + "/")]);
    const create = (p) =>
      p.evaluate(() =>
        GuildSystem.createGuild({ name: "Gilda concorrente", sigil: "sun" }),
      );
    const r = await Promise.all([create(a), create(b)]);
    assert.equal(r.filter((x) => x.ok).length, 1);
    const owner = r[0].ok ? a : b,
      reader = r[0].ok ? b : a;
    for (let round = 1; round <= 30; round++) {
      const results = await Promise.all([
        owner.evaluate(() => GuildSystem.contribute("iron", 10)),
        reader.evaluate(() => GuildSystem.contribute("iron", 20)),
      ]);
      assert.equal(results[0].ok, true);
      assert.equal(results[1].ok, false);
      assert.match(results[1].message, /altra scheda/);
      await reader.waitForFunction(
        (total) => GuildSystem.state.guild?.treasury.iron === total,
        round * 10,
      );
    }
    assert.equal(
      await owner.evaluate(() => GuildSystem.state.guild.treasury.iron),
      300,
    );
    assert.equal(
      await reader.evaluate(() => GuildSystem.state.guild.treasury.iron),
      300,
    );
    await owner.close();
    assert.equal(
      await reader.evaluate(
        async () => (await GuildSystem.contribute("iron", 20)).ok,
      ),
      true,
    );
    assert.equal(
      await reader.evaluate(() => GuildSystem.state.guild.treasury.iron),
      320,
    );
    const guildId = await reader.evaluate(() => GuildSystem.state.guild.id);
    await reader.reload();
    assert.equal(
      await reader.evaluate(
        async () => (await GuildSystem.createGuild({ name: "Duplicate" })).ok,
      ),
      false,
    );
    assert.equal(
      await reader.evaluate(() => GuildSystem.state.guild.id),
      guildId,
    );
    assert.equal(
      await reader.evaluate(
        async () => (await GuildSystem.contribute("iron", 5)).ok,
      ),
      true,
    );
    assert.equal(
      await reader.evaluate(() => GuildSystem.state.guild.treasury.iron),
      325,
    );
    await context.close();
    console.log(
      "Two actual tabs: one writer, 30 concurrent attempts safely rejected, reader synchronization, writer handoff/close/reload, no duplicate guild or lost contribution PASS",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
