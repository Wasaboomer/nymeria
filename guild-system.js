/* One isolated prototype ledger. Never debits ProgressionStore or player inventory. */
const GuildEngine = (() => {
  const data =
    typeof module !== "undefined" && module.exports
      ? require("./guild-data.js")
      : GuildData;
  const KEY = "nymeria.guild.v1";
  const copy = (value) => JSON.parse(JSON.stringify(value));
  const object = (value) =>
    value !== null && typeof value === "object" && !Array.isArray(value);
  const text = (value, limit) =>
    typeof value === "string"
      ? value
          .replace(/[\u0000-\u001f\u007f]/g, " ")
          .trim()
          .replace(/\s+/g, " ")
          .slice(0, limit)
      : "";
  const amount = (value, max = data.limits.balance) => {
    if (typeof value !== "number" && typeof value !== "string") return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed)
      ? Math.max(0, Math.min(max, Math.floor(parsed)))
      : 0;
  };
  const empty = () => ({ version: data.schemaVersion, guild: null });
  const resourceKeys = ["crowns", "iron", "fiber", "ether"];
  function normalize(raw) {
    if (
      !object(raw) ||
      (raw.version !== undefined && raw.version !== data.schemaVersion) ||
      !object(raw.guild)
    )
      return empty();
    const g = raw.guild;
    const level = Math.max(1, amount(g.level, data.limits.level));
    const total =
      typeof g.totalXP === "number" &&
      Number.isFinite(g.totalXP) &&
      g.totalXP >= 0
        ? g.totalXP
        : data.thresholds[level - 1] + amount(g.xp);
    const rows = Array.isArray(g.members) ? g.members : [];
    const owner = rows.find((m) => object(m) && m.id === "player") || {};
    const members = [
      {
        id: "player",
        name: text(owner.name, 40) || "Iria del Vespro",
        role: "leader",
        level: Math.max(1, amount(owner.level, 20)),
        contribution: amount(owner.contribution),
        simulated: false,
      },
    ];
    const ids = new Set(["player"]);
    for (const m of rows) {
      if (members.length >= data.limits.members) break;
      if (
        !object(m) ||
        typeof m.id !== "string" ||
        !/^[a-zA-Z0-9_-]{1,64}$/.test(m.id) ||
        ids.has(m.id)
      )
        continue;
      const name = text(m.name, 40);
      if (!name) continue;
      ids.add(m.id);
      members.push({
        id: m.id,
        name,
        role: m.role === "officer" ? "officer" : "member",
        level: Math.max(1, amount(m.level, 20)),
        contribution: amount(m.contribution),
        simulated: true,
      });
    }
    return {
      version: data.schemaVersion,
      guild: {
        id: text(g.id, 80) || "guild-local",
        name: text(g.name, data.limits.name) || "Gilda recuperata",
        motto: text(g.motto, data.limits.motto),
        sigil: data.sigils.some((s) => s.id === g.sigil) ? g.sigil : "tower",
        ...data.fromTotal(total),
        treasury: Object.fromEntries(
          resourceKeys.map((key) => [key, amount(g.treasury?.[key])]),
        ),
        members,
        createdAt: amount(g.createdAt, 1e15),
      },
    };
  }
  function create({
    storage = {
      getItem: (key) => localStorage.getItem(key),
      setItem: (key, value) => localStorage.setItem(key, value),
    },
    exclusive = (run) => run(),
    now = Date.now,
  } = {}) {
    let state = empty(),
      storageIssue = false,
      recovered = false,
      pending = Promise.resolve();
    const listeners = new Set();
    function emit() {
      for (const listener of listeners) {
        try {
          listener(copy(state));
        } catch {
          /* UI failure must never roll back a committed record. */
        }
      }
    }
    function read() {
      try {
        const source = storage.getItem(KEY);
        if (source === null)
          return { ok: true, state: empty(), recovered: false };
        let raw;
        try {
          raw = JSON.parse(source);
        } catch {
          return { ok: true, state: empty(), recovered: true };
        }
        if (
          object(raw) &&
          raw.version !== undefined &&
          raw.version !== data.schemaVersion
        )
          return {
            ok: false,
            message:
              "Salvataggio gilda di versione non supportata: nessun dato sovrascritto.",
          };
        const value = normalize(raw);
        return {
          ok: true,
          state: value,
          recovered: JSON.stringify(value) !== JSON.stringify(raw),
        };
      } catch {
        return {
          ok: false,
          message:
            "Salvataggio locale non disponibile. Nessuna modifica applicata.",
        };
      }
    }
    function load() {
      const result = read();
      storageIssue = !result.ok;
      if (result.ok) {
        state = result.state;
        recovered = result.recovered;
      }
      emit();
      return copy(state);
    }
    load();
    function transact(change) {
      // Re-read under the injected write policy; browser uses a single-writer lease.
      // No lock or write is shared with ProgressionStore: these are simulated contributions.
      const run = () =>
        exclusive(() => {
          const latest = read();
          if (!latest.ok) {
            storageIssue = true;
            emit();
            return latest;
          }
          state = latest.state;
          recovered = latest.recovered;
          const draft = copy(state),
            result = change(draft);
          if (!result.ok) {
            storageIssue = false;
            emit();
            return result;
          }
          try {
            storage.setItem(KEY, JSON.stringify(draft));
          } catch {
            storageIssue = true;
            emit();
            return {
              ok: false,
              message:
                "Impossibile salvare. Nessuna modifica applicata; puoi riprovare.",
            };
          }
          state = draft;
          storageIssue = false;
          recovered = false;
          emit();
          return result;
        });
      const operation = pending.then(run).catch(() => ({
        ok: false,
        message: "Operazione gilda non disponibile. Riprova.",
      }));
      pending = operation.then(() => undefined);
      return operation;
    }
    function createGuild(input) {
      return transact((draft) => {
        if (draft.guild)
          return { ok: false, message: "Fai già parte di una gilda." };
        if (!object(input))
          return { ok: false, message: "Inserisci i dati della gilda." };
        const name = text(input.name, data.limits.name);
        if (name.length < 3)
          return {
            ok: false,
            message: "Il nome deve avere almeno 3 caratteri.",
          };
        if (
          input.sigil !== undefined &&
          !data.sigils.some((s) => s.id === input.sigil)
        )
          return { ok: false, message: "Seleziona un sigillo valido." };
        const createdAt = amount(now(), 1e15);
        draft.guild = normalize({
          version: data.schemaVersion,
          guild: {
            id: "guild-" + createdAt,
            name,
            motto: text(input.motto, data.limits.motto),
            sigil: input.sigil || "tower",
            level: 1,
            xp: 0,
            createdAt,
            members: [
              { id: "player", role: "leader", contribution: 0 },
              ...copy(data.simulatedMembers),
            ],
          },
        }).guild;
        return { ok: true, message: "Gilda locale creata." };
      });
    }
    function contribute(kind, value) {
      return transact((draft) => {
        if (!draft.guild || !resourceKeys.includes(kind))
          return { ok: false, message: "Contributo non valido." };
        const parsed =
          typeof value === "string" && /^\d{1,4}$/.test(value.trim())
            ? Number(value.trim())
            : typeof value === "number"
              ? value
              : NaN;
        if (
          !Number.isSafeInteger(parsed) ||
          parsed < 1 ||
          parsed > data.limits.contribution
        )
          return { ok: false, message: "Inserisci un intero da 1 a 9999." };
        const guild = draft.guild,
          me = guild.members[0];
        if (
          guild.treasury[kind] + parsed > data.limits.balance ||
          me.contribution + parsed > data.limits.balance
        )
          return {
            ok: false,
            message:
              "Limite del prototipo raggiunto. Nessuna modifica applicata.",
          };
        guild.treasury[kind] += parsed;
        me.contribution += parsed;
        Object.assign(
          guild,
          data.fromTotal(guild.totalXP + Math.max(1, Math.floor(parsed / 5))),
        );
        return {
          ok: true,
          message:
            "+" +
            parsed +
            " alla tesoreria simulata. Risorse personali invariate.",
        };
      });
    }
    return {
      get state() {
        return copy(state);
      },
      get storageIssue() {
        return storageIssue;
      },
      get recovered() {
        return recovered;
      },
      load,
      createGuild,
      contribute,
      subscribe(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
      },
    };
  }
  return { KEY, create, normalize, empty };
})();
if (typeof module !== "undefined" && module.exports)
  module.exports = GuildEngine;
/* A single tab owns guild writes for its lifetime. Web Locks alone around each
   read/setItem are insufficient: separate renderer processes can read stale
   localStorage caches even after the previous operation releases its lock. */
const GuildTabWriter = (() => {
  let owned = false,
    release = null;
  if (typeof window !== "undefined")
    window.addEventListener("pagehide", () => {
      owned = false;
      if (release) release();
    });
  function exclusive(run) {
    if (!navigator.locks) return run(); // documented single-tab-only fallback
    if (owned) return run();
    return new Promise((resolve) => {
      navigator.locks
        .request(
          "nymeria-guild-writer",
          { ifAvailable: true },
          async (lock) => {
            if (!lock) {
              resolve({
                ok: false,
                message:
                  "La gilda è modificabile in un'altra scheda. Chiudi quella scheda e riprova; qui puoi consultarla.",
              });
              return;
            }
            owned = true;
            const lifetime = new Promise((done) => (release = done));
            try {
              // Drain pending storage events when taking over a previously used ledger.
              await new Promise((done) => setTimeout(done, 0));
              if (!owned) {
                resolve({
                  ok: false,
                  message: "Scheda chiusa o sospesa: operazione non applicata.",
                });
                return;
              }
              resolve(await run());
              await lifetime;
            } finally {
              owned = false;
              release = null;
            }
          },
        )
        .catch(() => {
          owned = false;
          resolve({
            ok: false,
            message: "Accesso esclusivo alla gilda non disponibile. Riprova.",
          });
        });
    });
  }
  return { exclusive };
})();
const GuildSystem =
  typeof window !== "undefined"
    ? GuildEngine.create({ exclusive: GuildTabWriter.exclusive })
    : null;
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === GuildEngine.KEY || event.key === null) GuildSystem.load();
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) GuildSystem.load();
  });
}
