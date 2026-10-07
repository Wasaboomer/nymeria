const assert = require("node:assert/strict");
const Engine = require("../guild-system"),
  Data = require("../guild-data");
let checks = 0;
const memory = () => {
  const map = new Map();
  return {
    map,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
  };
};
const check = async (name, run) => {
  await run();
  checks++;
  console.log("PASS " + name);
};
const input = {
  name: " Custodi   del Vespro ",
  motto: " Una promessa ",
  sigil: "wolf",
};
(async () => {
  await check(
    "creation, sanitized identity, one founder and explicitly simulated members",
    async () => {
      const s = Engine.create({ storage: memory(), now: () => 1000 });
      assert.equal((await s.createGuild(input)).ok, true);
      const g = s.state.guild;
      assert.equal(g.name, "Custodi del Vespro");
      assert.equal(g.id, "guild-1000");
      assert.equal(g.members.length, 4);
      assert.equal(g.members[0].role, "leader");
      assert.ok(g.members.slice(1).every((m) => m.simulated));
      assert.equal(g.totalXP, 0);
    },
  );
  await check(
    "duplicate creation and rapid duplicate submissions cannot replace an existing guild",
    async () => {
      const s = Engine.create({ storage: memory() });
      const results = await Promise.all([
        s.createGuild(input),
        s.createGuild({ ...input, name: "Seconda" }),
      ]);
      assert.deepEqual(
        results.map((r) => r.ok),
        [true, false],
      );
      assert.equal(s.state.guild.name, "Custodi del Vespro");
    },
  );
  await check("invalid inputs fail cleanly with no write", async () => {
    const storage = memory(),
      s = Engine.create({ storage });
    for (const value of [
      null,
      undefined,
      [],
      {},
      { name: "ab" },
      { name: true },
      { name: "Gilda", sigil: "bogus" },
    ])
      assert.equal((await s.createGuild(value)).ok, false);
    assert.equal(storage.map.size, 0);
  });
  await check(
    "all resources and player contribution persist across reload",
    async () => {
      const storage = memory(),
        s = Engine.create({ storage });
      await s.createGuild(input);
      for (const key of ["crowns", "iron", "fiber", "ether"])
        assert.equal((await s.contribute(key, "10")).ok, true);
      assert.equal(s.state.guild.members[0].contribution, 40);
      assert.equal(s.state.guild.xp, 8);
      assert.deepEqual(Engine.create({ storage }).state, s.state);
      const detached = s.state;
      detached.guild.treasury.crowns = 0;
      assert.equal(s.state.guild.treasury.crowns, 10);
    },
  );
  await check(
    "negative, zero, NaN, absurd, fractional, exponential and coerced amounts rejected without mutation",
    async () => {
      const storage = memory(),
        s = Engine.create({ storage });
      await s.createGuild(input);
      const before = storage.getItem(Engine.KEY);
      for (const value of [
        -1,
        0,
        NaN,
        Infinity,
        -Infinity,
        1e20,
        10000,
        0.5,
        1.8,
        true,
        null,
        undefined,
        {},
        [],
        "",
        "-1",
        "0",
        "NaN",
        "1e3",
        "1.5",
        "99999",
        "0x10",
      ]) {
        assert.equal(
          (await s.contribute("crowns", value)).ok,
          false,
          String(value),
        );
        assert.equal(storage.getItem(Engine.KEY), before);
      }
      for (const key of ["bad", "__proto__", "constructor", null])
        assert.equal((await s.contribute(key, 5)).ok, false);
      assert.equal(s.state.guild.treasury.crowns, 0);
      assert.equal((await s.contribute("crowns", " 1 ")).ok, true);
    },
  );
  await check("no guild cannot receive contributions", async () => {
    const s = Engine.create({ storage: memory() });
    assert.equal((await s.contribute("crowns", 10)).ok, false);
    assert.equal(s.state.guild, null);
  });
  await check(
    "bounded treasury and individual totals: overflow rejected with no partial change",
    async () => {
      const storage = memory(),
        s = Engine.create({ storage });
      await s.createGuild(input);
      const raw = s.state;
      raw.guild.treasury.crowns = Data.limits.balance;
      storage.setItem(Engine.KEY, JSON.stringify(raw));
      const before = storage.getItem(Engine.KEY);
      assert.equal((await s.contribute("crowns", 1)).ok, false);
      assert.equal(storage.getItem(Engine.KEY), before);
      raw.guild.treasury.crowns = 0;
      raw.guild.members[0].contribution = Data.limits.balance;
      storage.setItem(Engine.KEY, JSON.stringify(raw));
      assert.equal((await s.contribute("iron", 1)).ok, false);
      assert.equal(s.state.guild.treasury.iron, 0);
    },
  );
  await check(
    "XP thresholds, multiple levels and hard cap are deterministic",
    async () => {
      const storage = memory(),
        s = Engine.create({ storage });
      await s.createGuild(input);
      await s.contribute("crowns", 1500);
      assert.equal(s.state.guild.level, 2);
      assert.equal(s.state.guild.xp, 0);
      await s.contribute("crowns", 9999);
      assert.ok(s.state.guild.level >= 4);
      const raw = s.state;
      raw.guild.totalXP = Data.thresholds[19] - 1;
      storage.setItem(Engine.KEY, JSON.stringify(raw));
      await s.contribute("iron", 10);
      assert.equal(s.state.guild.level, 20);
      assert.equal(s.state.guild.xp, 0);
      assert.equal(s.state.guild.totalXP, Data.thresholds[19]);
      await s.contribute("iron", 10);
      assert.equal(s.state.guild.xp, 0);
      assert.equal(Data.xpForLevel(20), 0);
    },
  );
  await check(
    "legacy level+XP migrate without resetting treasury or identity",
    async () => {
      const raw = {
        version: 1,
        guild: {
          id: "legacy",
          name: "Vecchia Gilda",
          level: 2,
          xp: 600,
          treasury: { crowns: 45, iron: 12 },
          members: [
            {
              id: "player",
              name: "Iria",
              role: "leader",
              level: 4,
              contribution: 57,
            },
          ],
        },
      };
      const n = Engine.normalize(raw);
      assert.equal(n.guild.level, 3);
      assert.equal(n.guild.xp, 50);
      assert.equal(n.guild.treasury.crowns, 45);
      assert.equal(n.guild.members[0].contribution, 57);
      assert.deepEqual(Engine.normalize(n), n);
    },
  );
  await check(
    "missing/scalar/hostile member fields normalize with unique IDs and exactly one local leader",
    async () => {
      const n = Engine.normalize({
        version: 1,
        guild: {
          name: ["bad"],
          motto: {},
          sigil: "invalid",
          level: Infinity,
          xp: NaN,
          treasury: { crowns: -2, iron: Infinity, fiber: "12.9", ether: 1e30 },
          members: [
            null,
            "x",
            {},
            {
              id: "player",
              role: "member",
              name: null,
              level: -5,
              contribution: -4,
            },
            { id: "player", name: "Duplicate" },
            {
              id: "npc-1",
              name: "Demo",
              role: "leader",
              level: 99,
              contribution: "7",
            },
            { id: "npc-1", name: "Duplicate" },
            { id: "npc-2", name: "Other", role: "invalid" },
            { id: "bad id", name: "Bad" },
          ],
        },
      });
      assert.equal(n.guild.members.length, 3);
      assert.equal(
        n.guild.members.filter((m) => m.role === "leader").length,
        1,
      );
      assert.equal(n.guild.members[0].id, "player");
      assert.equal(n.guild.members[0].contribution, 0);
      assert.ok(n.guild.members.slice(1).every((m) => m.simulated));
      assert.deepEqual(n.guild.treasury, {
        crowns: 0,
        iron: 0,
        fiber: 12,
        ether: 1e9,
      });
      assert.equal(n.guild.level, 1);
      assert.equal(n.guild.sigil, "tower");
      assert.deepEqual(Engine.normalize(n), n);
    },
  );
  await check(
    "member cap, truncation and invalid guild containers",
    async () => {
      for (const raw of [
        null,
        {},
        [],
        { version: 1, guild: 42 },
        { version: 1, guild: [] },
      ])
        assert.deepEqual(Engine.normalize(raw), Engine.empty());
      const n = Engine.normalize({
        version: 1,
        guild: {
          name: "a".repeat(100),
          motto: "x".repeat(200),
          members: Array.from({ length: 70 }, (_, i) => ({
            id: "npc-" + i,
            name: "Member",
            role: "officer",
          })),
        },
      });
      assert.equal(n.guild.members.length, 30);
      assert.equal(n.guild.name.length, 28);
      assert.equal(n.guild.motto.length, 72);
    },
  );
  await check(
    "corrupt JSON recovers safely without touching player ledger",
    async () => {
      const storage = memory();
      storage.setItem(Engine.KEY, "{broken");
      storage.setItem("nymeria.progression.v1", "PLAYER_LEDGER");
      const s = Engine.create({ storage });
      assert.equal(s.recovered, true);
      assert.equal(s.state.guild, null);
      await s.createGuild(input);
      assert.equal(storage.getItem("nymeria.progression.v1"), "PLAYER_LEDGER");
      assert.equal(s.recovered, false);
    },
  );
  await check(
    "incomplete schema marker salvages an existing guild instead of allowing recreation",
    async () => {
      const storage = memory();
      storage.setItem(
        Engine.KEY,
        JSON.stringify({
          guild: { id: "old-guild", name: "Esistente", treasury: { iron: 8 } },
        }),
      );
      const s = Engine.create({ storage });
      assert.equal(s.state.guild.id, "old-guild");
      assert.equal(s.state.guild.treasury.iron, 8);
      assert.equal(s.recovered, true);
      assert.equal((await s.createGuild(input)).ok, false);
    },
  );
  await check("unknown schema is protected from overwrite", async () => {
    const storage = memory();
    storage.setItem(
      Engine.KEY,
      JSON.stringify({ version: 2, guild: { name: "Future" } }),
    );
    const before = storage.getItem(Engine.KEY),
      s = Engine.create({ storage });
    assert.equal(s.storageIssue, true);
    assert.equal((await s.createGuild(input)).ok, false);
    assert.equal(storage.getItem(Engine.KEY), before);
  });
  await check(
    "read/write storage failures keep last committed state and allow retry",
    async () => {
      const storage = memory();
      let failRead = false,
        failWrite = false;
      const s = Engine.create({
        storage: {
          getItem: (k) => {
            if (failRead) throw Error();
            return storage.getItem(k);
          },
          setItem: (k, v) => {
            if (failWrite) throw Error();
            storage.setItem(k, v);
          },
        },
      });
      failWrite = true;
      assert.equal((await s.createGuild(input)).ok, false);
      assert.equal(s.state.guild, null);
      failWrite = false;
      await s.createGuild(input);
      const before = s.state;
      failWrite = true;
      assert.equal((await s.contribute("crowns", 10)).ok, false);
      assert.deepEqual(s.state, before);
      failWrite = false;
      failRead = true;
      assert.equal((await s.contribute("crowns", 10)).ok, false);
      assert.deepEqual(s.state, before);
      failRead = false;
      assert.equal((await s.contribute("crowns", 10)).ok, true);
      assert.equal(s.state.guild.treasury.crowns, 10);
    },
  );
  await check("denied storage does not throw during startup", async () => {
    const s = Engine.create({
      storage: {
        getItem: () => {
          throw Error();
        },
        setItem: () => {
          throw Error();
        },
      },
    });
    assert.equal(s.storageIssue, true);
    assert.equal((await s.createGuild(input)).ok, false);
  });
  await check(
    "two stale instances re-read under shared lock: one guild and additive contributions",
    async () => {
      const storage = memory();
      let queue = Promise.resolve();
      const exclusive = (run) => {
        const result = queue.then(run);
        queue = result.then(() => {});
        return result;
      };
      const a = Engine.create({ storage, exclusive }),
        b = Engine.create({ storage, exclusive });
      const r = await Promise.all([
        a.createGuild(input),
        b.createGuild({ ...input, name: "Other" }),
      ]);
      assert.equal(r.filter((v) => v.ok).length, 1);
      await Promise.all([
        a.contribute("crowns", 10),
        b.contribute("crowns", 20),
      ]);
      a.load();
      assert.equal(a.state.guild.treasury.crowns, 30);
      assert.equal(a.state.guild.members[0].contribution, 30);
      assert.equal(
        a.state.guild.members.filter((m) => m.role === "leader").length,
        1,
      );
    },
  );
  await check(
    "listener exceptions cannot turn a committed write into failure",
    async () => {
      const s = Engine.create({ storage: memory() });
      s.subscribe(() => {
        throw Error("UI failure");
      });
      assert.equal((await s.createGuild(input)).ok, true);
      assert.equal((await s.contribute("crowns", 10)).ok, true);
    },
  );
  console.log(checks + " Guild Foundation engine checks passed.");
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
