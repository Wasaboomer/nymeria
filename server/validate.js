// Controlli sul salvataggio ricevuto dal client.
// ATTENZIONE: per ora il client calcola ancora le regole (combattimento, ricompense), quindi qui possiamo solo
// respingere dati impossibili o salti di progresso troppo veloci. Il passo successivo è spostare le regole
// sul server (vedi ARCHITETTURA.md); questi controlli sono la rete di sicurezza nel frattempo.
const MAXL = 50;
const CLASSES = ['guard', 'ombra', 'spad', 'arc', 'bardo', 'tempo', 'sac', 'drui'];
const RACES = ['umano', 'kharun', 'velhiri'];
const CRAFTS = [0, 'smith', 'weave', 'wood', 'alch'];
const ITEM_RE = /^[wahgfo]\d#\d+$/;

const need = l => Math.round(60 * Math.pow(l, 1.4));
function totalXp(d) {
  let t = d.xp || 0;
  for (let l = 1; l < d.lv; l++) t += need(l);
  return t;
}
const isObj = o => o && typeof o === 'object' && !Array.isArray(o);
const isInt = (n, a, b) => Number.isInteger(n) && n >= a && n <= b;

// Ritorna null se il salvataggio è accettabile, altrimenti un messaggio.
function validateSave(d, prev, now = Date.now()) {
  if (!isObj(d)) return 'Salvataggio non valido.';
  if (d.v !== 5) return 'Versione del salvataggio non supportata.';
  if (!isInt(d.lv, 1, MAXL)) return 'Livello non valido.';
  if (typeof d.xp !== 'number' || !(d.xp >= 0) || d.xp > need(d.lv)) return 'Esperienza non valida.';
  if (typeof d.g !== 'number' || !Number.isFinite(d.g) || d.g < 0 || d.g > 1e8) return 'Corone non valide.';
  if (!CLASSES.includes(d.spec)) return 'Classe non valida.';
  if (!RACES.includes(d.race)) return 'Popolo non valido.';
  if (!CRAFTS.includes(d.craft || 0)) return 'Mestiere non valido.';
  if (d.name !== undefined && (typeof d.name !== 'string' || d.name.length > 14 || /[<>&"']/.test(d.name))) return 'Nome non valido.';
  if (!isObj(d.items) || !isObj(d.eq) || !isObj(d.inv)) return 'Dati degli oggetti non validi.';
  const ids = Object.keys(d.items);
  if (ids.length > 150) return 'Troppi oggetti.';
  for (const u of ids) {
    const i = d.items[u];
    if (!ITEM_RE.test(u) || !isObj(i)) return 'Oggetto non valido.';
    if (!isInt(i.q, 1, 3)) return 'Qualità non valida.';
    if (typeof i.vr !== 'number' || Math.abs(i.vr) > 0.15) return 'Variazione non valida.';
    if (i.by !== undefined && (typeof i.by !== 'string' || i.by.length > 14 || /[<>&"']/.test(i.by))) return 'Firma non valida.';
    if (!isInt(i.k || 0, 0, 1e7)) return 'Conteggio non valido.';
  }
  if (d.rep !== undefined) { if (!isObj(d.rep)) return 'Reputazione non valida.'; for (const [k, v] of Object.entries(d.rep)) if (!/^[a-z]{3,8}$/.test(k) || !isInt(v, 0, 1e6)) return 'Reputazione non valida.'; }
  for (const k of ['w', 'a', 'h', 'g', 'f', 'o']) if (d.eq[k] !== undefined && d.eq[k] !== null && !d.items[d.eq[k]]) return 'Oggetto equipaggiato mancante.';
  for (const [k, v] of Object.entries(d.inv)) if (!/^[a-z_]{2,16}$/.test(k) || !isInt(v, 0, 99 * 80)) return 'Materiali non validi.';
  if (prev) {
    // scendere di livello (ricominciare da capo) è sempre permesso: il controllo riguarda solo gli aumenti
    const secs = Math.max(1, (now - prev.updated) / 1000);
    const dx = totalXp(d) - totalXp(prev);
    if (dx > 5000 + 60 * secs) return 'Progresso troppo rapido per il tempo trascorso.';
    const dg = d.g - (prev.data.g || 0);
    if (dg > 3000 + 40 * secs) return 'Corone in aumento troppo rapido per il tempo trascorso.';
  }
  return null;
}
module.exports = { validateSave, totalXp, need, MAXL };
