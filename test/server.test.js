const test = require('node:test'), assert = require('node:assert/strict');
const { createServer } = require('../server/server');

const fresh = (o = {}) => ({
  v: 5, spec: 'spad', race: 'umano', cls: 'spad', gl: {}, lv: 1, xp: 0, g: 20, loc: 'v', tr: null,
  eq: { w: 'w0#1', a: 'a0#2', h: 'h0#3' },
  items: { 'w0#1': { q: 1, vr: 0, by: '', cl: 0, k: 0, mx: 0, bn: '' }, 'a0#2': { q: 1, vr: 0, by: '', cl: 0, k: 0, mx: 0, bn: '' }, 'h0#3': { q: 1, vr: 0, by: '', cl: 0, k: 0, mx: 0, bn: '' } },
  nu: 3, name: 'Aldric', look: { f: 0, hr: 0, sk: 0, hc: 0, m: 0 }, nd: {}, gx: {}, lt: 0, hv: null, cx: 0, od: 0, fl: {}, ch1: 0,
  inv: {}, tools: {}, q: {}, qp: {}, done: {}, craft: 0, cr: 0, pd: 0, ...o });

async function boot(limits) {
  const srv = createServer({ dbFile: ':memory:', limits });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const call = async (method, path, body, token) => {
    const r = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)) });
    const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) {}
    return { s: r.status, j, t, h: r.headers };
  };
  return { srv, call, close: () => new Promise(r => srv.close(r)) };
}

test('registrazione, accesso e password', async () => {
  const { call, close } = await boot();
  try {
    assert.equal((await call('POST', '/api/register', { user: 'ab', pass: 'password123' })).s, 400);
    assert.equal((await call('POST', '/api/register', { user: 'Aldric', pass: 'corta' })).s, 400);
    const r = await call('POST', '/api/register', { user: 'Aldric', pass: 'password123' });
    assert.equal(r.s, 201); assert.equal(r.j.token.length, 64);
    assert.equal((await call('POST', '/api/register', { user: 'aldric', pass: 'password123' })).s, 409, 'nome già usato anche con maiuscole diverse');
    assert.equal((await call('POST', '/api/login', { user: 'Aldric', pass: 'sbagliata1' })).s, 401);
    assert.equal((await call('POST', '/api/login', { user: 'Nessuno', pass: 'password123' })).s, 401);
    const l = await call('POST', '/api/login', { user: 'ALDRIC', pass: 'password123' });
    assert.equal(l.s, 200); assert.equal(l.j.user, 'Aldric');
    assert.equal((await call('POST', '/api/logout', {}, l.j.token)).s, 200);
    assert.equal((await call('GET', '/api/save', undefined, l.j.token)).s, 401, 'il token dopo il logout non vale più');
  } finally { await close(); }
});

test('salvataggio, revisioni e conflitti', async () => {
  const { call, close } = await boot();
  try {
    const { j: { token } } = await call('POST', '/api/register', { user: 'Mira', pass: 'password123' });
    assert.equal((await call('GET', '/api/save')).s, 401);
    assert.deepEqual((await call('GET', '/api/save', undefined, token)).j, { rev: 0, data: null });
    const a = await call('PUT', '/api/save', { rev: 0, data: fresh() }, token);
    assert.equal(a.s, 200); assert.equal(a.j.rev, 1);
    const g = await call('GET', '/api/save', undefined, token);
    assert.equal(g.j.rev, 1); assert.equal(g.j.data.name, 'Aldric');
    const b = await call('PUT', '/api/save', { rev: 1, data: fresh({ g: 25 }) }, token);
    assert.equal(b.j.rev, 2);
    const c = await call('PUT', '/api/save', { rev: 1, data: fresh({ g: 30 }) }, token);
    assert.equal(c.s, 409, 'revisione vecchia = salvato da un altro dispositivo');
    assert.equal(c.j.rev, 2); assert.equal(c.j.data.g, 25);
  } finally { await close(); }
});

test('popolo dei Velhiri e oggetti dei nuovi slot sono accettati', async () => {
  const { call, close } = await boot();
  try {
    const { j: { token } } = await call('POST', '/api/register', { user: 'Ylen', pass: 'password123' });
    const it = { q: 1, vr: 0, by: '', cl: 0, k: 0, mx: 0, bn: '' };
    const d = fresh({ race: 'velhiri', loc: 'sb', nu: 6 });
    d.eq = { ...d.eq, g: 'g0#4', f: 'f0#5', o: 'o0#6' };
    d.items = { ...d.items, 'g0#4': it, 'f0#5': it, 'o0#6': it };
    const r = await call('PUT', '/api/save', { rev: 0, data: d }, token);
    assert.equal(r.s, 200, JSON.stringify(r.j));
  } finally { await close(); }
});

test('la reputazione viene validata', async () => {
  const { call, close } = await boot();
  try {
    const { j: { token } } = await call('POST', '/api/register', { user: 'Fazione', pass: 'password123' });
    const put = (rev, d) => call('PUT', '/api/save', { rev, data: d }, token);
    assert.equal((await put(0, fresh({ rep: { lant: -5 } }))).s, 422, 'punti negativi');
    assert.equal((await put(0, fresh({ rep: { lant: 5e9 } }))).s, 422, 'punti enormi');
    assert.equal((await put(0, fresh({ rep: [1] }))).s, 422, 'formato sbagliato');
    assert.equal((await put(0, fresh({ rep: { lant: 700, forg: 500 } }))).s, 200);
  } finally { await close(); }
});

test('salvataggi impossibili o barati vengono respinti', async () => {
  const { call, close } = await boot();
  try {
    const { j: { token } } = await call('POST', '/api/register', { user: 'Cheater', pass: 'password123' });
    const put = (rev, d) => call('PUT', '/api/save', { rev, data: d }, token);
    assert.equal((await put(0, fresh({ lv: 99 }))).s, 422, 'livello oltre il massimo');
    assert.equal((await put(0, fresh({ g: -5 }))).s, 422);
    assert.equal((await put(0, fresh({ spec: 'hacker' }))).s, 422);
    assert.equal((await put(0, fresh({ name: '<script>' }))).s, 422);
    assert.equal((await put(0, fresh({ eq: { w: 'w9#9', a: 'a0#2', h: 'h0#3' } }))).s, 422, 'oggetto equipaggiato inesistente');
    const bad = fresh(); bad.items['w1#9'] = { q: 3, vr: 0.9, by: '', cl: 0, k: 0 };
    assert.equal((await put(0, bad)).s, 422, 'variazione troppo alta');
    assert.equal((await put(0, fresh())).s, 200);
    assert.equal((await put(1, fresh({ lv: 40 }))).s, 422, 'da livello 1 a 40 in pochi secondi');
    assert.equal((await put(1, fresh({ g: 5e6 }))).s, 422, 'milioni di Corone in pochi secondi');
    assert.equal((await put(1, fresh({ lv: 2, xp: 10, g: 60 }))).s, 200, 'un progresso normale passa');
  } finally { await close(); }
});

test('JSON rotto e dati troppo grandi', async () => {
  const { call, close } = await boot();
  try {
    assert.equal((await call('POST', '/api/login', 'non json')).s, 400);
    let status = 0;
    try { status = (await call('POST', '/api/login', { user: 'x', pass: 'y'.repeat(400 * 1024) })).s; } catch (e) { status = 'chiusa'; }
    assert.ok(status === 413 || status === 'chiusa', 'la richiesta enorme viene rifiutata o chiusa, stato: ' + status);
    assert.equal((await call('GET', '/api/health')).s, 200, 'il server resta in piedi');
  } finally { await close(); }
});

test('limite di richieste sugli accessi', async () => {
  const { call, close } = await boot({ auth: 3 });
  try {
    assert.equal((await call('POST', '/api/login', { user: 'a', pass: 'b' })).s, 401);
    assert.equal((await call('POST', '/api/login', { user: 'a', pass: 'b' })).s, 401);
    assert.equal((await call('POST', '/api/login', { user: 'a', pass: 'b' })).s, 401);
    assert.equal((await call('POST', '/api/login', { user: 'a', pass: 'b' })).s, 429, 'dopo troppi tentativi si viene fermati');
  } finally { await close(); }
});

test('pagina pubblica del personaggio', async () => {
  const { call, close } = await boot();
  try {
    const { j: { token } } = await call('POST', '/api/register', { user: 'Brann', pass: 'password123' });
    const d = fresh({ name: 'Brann', lv: 1 });
    d.items['w1#4'] = { q: 3, vr: 0.04, by: 'Brann', cl: 5, k: 12, mx: 3, bn: 'Lupo della Boscaglia' }; d.eq.w = 'w1#4';
    await call('PUT', '/api/save', { rev: 0, data: d }, token);
    const p = await call('GET', '/api/profile/Brann');
    assert.equal(p.s, 200); assert.equal(p.j.cls, 'Spadaccino'); assert.equal(p.j.equipment[0].kills, 12); assert.equal(p.j.equipment[0].by, 'Brann');
    assert.equal((await call('GET', '/api/profile/Nessuno')).s, 404);
    const h = await call('GET', '/p/Brann');
    assert.equal(h.s, 200); assert.match(h.t, /forgiata da Brann/); assert.match(h.h.get('content-type'), /text\/html/);
    assert.equal(p.j.equipment.length, 3);
    assert.ok(!('token' in p.j) && !h.t.includes('password'), 'nessun dato riservato');
  } finally { await close(); }
});

test('il gioco viene servito con intestazioni di sicurezza', async () => {
  const { call, close } = await boot();
  try {
    const r = await call('GET', '/');
    assert.equal(r.s, 200); assert.match(r.t, /NYMERIA/);
    assert.equal(r.h.get('x-content-type-options'), 'nosniff'); assert.match(r.h.get('content-security-policy'), /frame-ancestors 'none'/);
    assert.equal((await call('GET', '/api/health')).j.ok, true);
    assert.equal((await call('GET', '/../etc/passwd')).s, 404);
  } finally { await close(); }
});
