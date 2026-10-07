/* M7.1 isolated collective-project ledger. Never debits player resources. */
const GuildProjectEngine = (() => {
  const data = typeof module !== "undefined" && module.exports ? require("./guild-project-data.js") : GuildProjectData;
  const KEY = "nymeria.guild-projects.v1";
  const resources = ["crowns", "iron", "fiber", "ether"];
  const copy = (v) => JSON.parse(JSON.stringify(v));
  const blankProgress = (project) => Object.fromEntries(Object.keys(project.requirements).map((k) => [k, 0]));
  const empty = () => ({ version: data.schemaVersion, projects: {} });
  function normalize(raw) {
    const state = empty();
    if (!raw || raw.version !== data.schemaVersion || typeof raw.projects !== "object") return state;
    for (const project of data.projects) {
      const row = raw.projects[project.id];
      if (!row || typeof row !== "object") continue;
      const progress = blankProgress(project);
      for (const key of Object.keys(progress)) {
        const n = Math.floor(Number(row.progress?.[key]) || 0);
        progress[key] = Math.max(0, Math.min(project.requirements[key], n));
      }
      state.projects[project.id] = { progress, completed: Object.keys(progress).every((k) => progress[k] >= project.requirements[k]), completedAt: Number(row.completedAt) || 0 };
    }
    return state;
  }
  function create(options = {}) {
    const storage = options.storage || (typeof localStorage !== "undefined" ? localStorage : null);
    let state = empty(), listeners = new Set(), storageIssue = false;
    function load() {
      try { state = normalize(JSON.parse(storage?.getItem(KEY) || "null")); storageIssue = !storage; }
      catch { storageIssue = true; }
      return copy(state);
    }
    function emit() { for (const fn of listeners) { try { fn(copy(state)); } catch {} } }
    function contribute(projectId, kind, value) {
      const project = data.byId(projectId);
      const amount = Number(value);
      if (!project || !resources.includes(kind) || !(kind in project.requirements) || !Number.isInteger(amount) || amount < 1 || amount > 9999)
        return { ok: false, message: "Contributo non valido." };
      load();
      const current = state.projects[projectId] || { progress: blankProgress(project), completed: false, completedAt: 0 };
      if (current.completed) return { ok: false, message: "Progetto già completato." };
      const remaining = project.requirements[kind] - current.progress[kind];
      if (remaining <= 0) return { ok: false, message: "Questa risorsa è già completa." };
      const applied = Math.min(amount, remaining);
      const next = copy(state);
      next.projects[projectId] = copy(current);
      next.projects[projectId].progress[kind] += applied;
      const completed = Object.keys(project.requirements).every((k) => next.projects[projectId].progress[k] >= project.requirements[k]);
      next.projects[projectId].completed = completed;
      if (completed) next.projects[projectId].completedAt = Date.now();
      try { storage.setItem(KEY, JSON.stringify(next)); }
      catch { storageIssue = true; return { ok: false, message: "Salvataggio progetto non disponibile." }; }
      state = next; storageIssue = false; emit();
      return { ok: true, applied, completed, message: completed ? project.name + " completato! " + project.reward : applied + " unità aggiunte al progetto." };
    }
    load();
    return { KEY, get state(){ return copy(state); }, get storageIssue(){ return storageIssue; }, load, contribute, subscribe(fn){ listeners.add(fn); return () => listeners.delete(fn); } };
  }
  return { KEY, empty, normalize, create };
})();
const GuildProjectSystem = typeof localStorage !== "undefined" ? GuildProjectEngine.create() : null;
if (typeof module !== "undefined" && module.exports) module.exports = GuildProjectEngine;
