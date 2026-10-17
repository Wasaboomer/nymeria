// Server di NYMERIA: serve il gioco, gestisce account e salvataggio online, pubblica le pagine dei personaggi.
// Nessuna dipendenza esterna. Avvio: node server/server.js  (porta con PORT, database con NYMERIA_DB)
const http = require('http'), fs = require('fs'), path = require('path');
const { openDb } = require('./db'), { createAuth } = require('./auth'), { validateSave } = require('./validate');
const N = require('./names');

const MAX_BODY = 300 * 1024;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function createServer({ dbFile = process.env.NYMERIA_DB || path.join(__dirname, '..', 'data', 'nymeria.db'), indexFile = path.join(__dirname, '..', 'dist', 'index.html'), limits = {} } = {}) {
  const db = openDb(dbFile), auth = createAuth(db);
  const q = {
    getChar: db.prepare('SELECT rev, lv, data, updated FROM characters WHERE account_id = ?'),
    addChar: db.prepare('INSERT INTO characters (account_id, rev, lv, data, updated) VALUES (?, 1, ?, ?, ?)'),
    setChar: db.prepare('UPDATE characters SET rev = rev + 1, lv = ?, data = ?, updated = ? WHERE account_id = ? AND rev = ?'),
    profile: db.prepare('SELECT a.user, c.data, c.lv, c.updated FROM accounts a JOIN characters c ON c.account_id = a.id WHERE a.user = ?'),
  };

  // limitatore di richieste semplice, in memoria: finestra di un minuto per indirizzo e tipo di azione
  const hits = new Map(), LIM = { auth: 10, save: 60, read: 120, ...limits };
  function limited(ip, kind) {
    const k = ip + '|' + kind, now = Date.now(), h = (hits.get(k) || []).filter(t => now - t < 60000);
    h.push(now); hits.set(k, h);
    if (hits.size > 5000) for (const [kk, v] of hits) if (!v.some(t => now - t < 60000)) hits.delete(kk);
    return h.length > LIM[kind];
  }

  const SEC = {
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'",
  };
  const send = (res, status, body, type = 'application/json; charset=utf-8') => {
    res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', ...SEC });
    res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
  };
  const fail = (res, status, error) => send(res, status, { error });

  function readJson(req) {
    return new Promise((resolve, reject) => {
      let size = 0; const chunks = [];
      req.on('data', c => { size += c.length; if (size > MAX_BODY) { reject(Object.assign(new Error('big'), { status: 413 })); req.destroy(); } else chunks.push(c); });
      req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (e) { reject(Object.assign(new Error('json'), { status: 400 })); } });
      req.on('error', reject);
    });
  }
  const token = req => { const h = req.headers.authorization || ''; return h.startsWith('Bearer ') ? h.slice(7) : ''; };

  function profileView(user) {
    const r = q.profile.get(user);
    if (!r) return null;
    const d = JSON.parse(r.data), eq = [];
    for (const k of ['w', 'a', 'h']) {
      const u = d.eq && d.eq[k], it = u && d.items && d.items[u];
      if (!it) continue;
      const t = u.split('#')[0];
      eq.push({ slot: N.SLOT[k], item: N.ITEM[t] || t, rarity: N.RARITY[t] || 0, quality: N.QUALITY[it.q - 1], by: it.by || '', kills: it.k || 0, strongest: it.bn || '' });
    }
    return { user: r.user, name: d.name || 'Viandante', race: N.RACE[d.race] || d.race, cls: N.CLASS[d.spec] || d.spec, level: r.lv, craft: N.CRAFT[d.craft] || '', updated: r.updated, equipment: eq };
  }
  function profileHtml(p) {
    const rows = p.equipment.map(e => `<li><b style="color:${N.RARITY_COLOR[e.rarity]}">${esc(e.item)}</b> <small>${esc(e.slot)} · ${esc(e.quality)}${e.by ? ' · forgiata da ' + esc(e.by) : ''}${e.kills ? ' · ' + e.kills + ' nemici sconfitti' : ''}</small></li>`).join('');
    return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.name)} · NYMERIA</title>
<style>:root{color-scheme:dark}body{margin:0;padding:24px max(16px,env(safe-area-inset-left));background:#07080a;color:#e6e1d5;font:17px/1.5 Georgia,serif}main{max-width:520px;margin:auto}h1{color:#c9a24d;margin:.2em 0}small{color:#9a9384}ul{padding-left:1.1em}</style></head>
<body><main><h1>${esc(p.name)}</h1><p>${esc(p.race)}, ${esc(p.cls)}, livello ${p.level}${p.craft ? ' · ' + esc(p.craft) : ''}</p><h2>Equipaggiamento</h2><ul>${rows}</ul><p><small>Account: ${esc(p.user)}</small></p></main></body></html>`;
  }

  async function handle(req, res) {
    const url = new URL(req.url, 'http://x'), ip = req.socket.remoteAddress || '?', m = req.method, p = url.pathname;
    try {
      if (m === 'GET' && (p === '/' || p === '/index.html')) {
        let html; try { html = fs.readFileSync(indexFile); } catch (e) { return fail(res, 500, 'Gioco non compilato: esegui npm run build.'); }
        return send(res, 200, html, 'text/html; charset=utf-8');
      }
      if (m === 'GET' && p === '/api/health') return send(res, 200, { ok: true });
      if (m === 'POST' && (p === '/api/register' || p === '/api/login')) {
        if (limited(ip, 'auth')) return fail(res, 429, 'Troppi tentativi: riprova tra un minuto.');
        const b = await readJson(req);
        const r = p === '/api/register' ? auth.register(b.user, b.pass) : auth.login(b.user, b.pass);
        return r.error ? fail(res, r.status, r.error) : send(res, p === '/api/register' ? 201 : 200, { token: r.token, user: r.user });
      }
      if (m === 'POST' && p === '/api/logout') { auth.logout(token(req)); return send(res, 200, { ok: true }); }
      if (p === '/api/save') {
        const me = auth.verify(token(req));
        if (!me) return fail(res, 401, 'Accesso scaduto: accedi di nuovo.');
        if (limited(ip, m === 'GET' ? 'read' : 'save')) return fail(res, 429, 'Troppe richieste.');
        const row = q.getChar.get(me.id);
        if (m === 'GET') return row ? send(res, 200, { rev: row.rev, data: JSON.parse(row.data) }) : send(res, 200, { rev: 0, data: null });
        if (m === 'PUT') {
          const b = await readJson(req), prev = row ? { ...row, data: JSON.parse(row.data) } : null;
          if (!Number.isInteger(b.rev) || b.rev < 0) return fail(res, 400, 'Revisione non valida.');
          if ((row ? row.rev : 0) !== b.rev) return send(res, 409, { error: 'Il personaggio è stato salvato da un altro dispositivo.', rev: row ? row.rev : 0, data: prev && prev.data });
          const err = validateSave(b.data, prev);
          if (err) return fail(res, 422, err);
          const json = JSON.stringify(b.data), now = Date.now();
          if (!row) q.addChar.run(me.id, b.data.lv, json, now);
          else if (q.setChar.run(b.data.lv, json, now, me.id, b.rev).changes !== 1) return fail(res, 409, 'Conflitto di salvataggio: riprova.');
          return send(res, 200, { rev: b.rev + 1 });
        }
      }
      let mm;
      if (m === 'GET' && (mm = p.match(/^\/api\/profile\/([A-Za-z0-9_]{3,16})$/))) {
        if (limited(ip, 'read')) return fail(res, 429, 'Troppe richieste.');
        const v = profileView(mm[1]); return v ? send(res, 200, v) : fail(res, 404, 'Personaggio non trovato.');
      }
      if (m === 'GET' && (mm = p.match(/^\/p\/([A-Za-z0-9_]{3,16})$/))) {
        if (limited(ip, 'read')) return fail(res, 429, 'Troppe richieste.');
        const v = profileView(mm[1]); return v ? send(res, 200, profileHtml(v), 'text/html; charset=utf-8') : fail(res, 404, 'Personaggio non trovato.');
      }
      return fail(res, 404, 'Non trovato.');
    } catch (e) {
      if (e.status) return fail(res, e.status, e.status === 413 ? 'Dati troppo grandi.' : 'Richiesta non valida.');
      console.error(e); return fail(res, 500, 'Errore del server.');
    }
  }
  const server = http.createServer((req, res) => { handle(req, res); });
  server.on('close', () => { try { db.close(); } catch (e) {} });
  return server;
}

module.exports = { createServer };
if (require.main === module) {
  const port = +process.env.PORT || 8080;
  createServer().listen(port, () => console.log('NYMERIA in ascolto su http://localhost:' + port));
}
