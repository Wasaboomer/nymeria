/* Reusable in-memory presentation queue. Never reads/writes game saves. */
const NotificationSystem = (() => {
  function create() {
    const queue = [], seen = new Set(), listeners = new Set();
    let current = null, serial = 0;
    const clone = x => JSON.parse(JSON.stringify(x));
    function publish() {
      for (const fn of listeners) { try { fn(); } catch { /* Independent UI consumers. */ } }
    }
    function advance() {
      if (!current && queue.length) current = queue.shift();
    }
    function notify(type, payload = {}, options = {}) {
      if (options.key && seen.has(options.key)) return null;
      if (options.key) seen.add(options.key);
      const entry = { id: ++serial, type, payload: clone(payload), key: options.key || null };
      // A level-up goes ahead of waiting banners, without cancelling the active one.
      if (type === "levelUp") {
        const index = queue.findIndex(x => x.type !== "levelUp");
        queue.splice(index < 0 ? queue.length : index, 0, entry);
      } else queue.push(entry);
      advance(); publish();
      return entry.id;
    }
    function dismiss(id = current?.id) {
      if (!current || current.id !== id) return false;
      current = null; advance(); publish(); return true;
    }
    return { notify, dismiss,
      get current() { return current ? clone(current) : null; },
      get pending() { return clone(queue); },
      subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    };
  }
  return { create };
})();
if (typeof module !== "undefined" && module.exports) module.exports = NotificationSystem;
const Notifications = typeof window !== "undefined" ? NotificationSystem.create() : null;
