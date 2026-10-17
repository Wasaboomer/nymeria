// Prova completa con un browser vero: node test/e2e.js  (richiede Playwright)
const { chromium } = require('playwright');
const { createServer } = require('../server/server');
const assert = require('node:assert/strict');
(async () => {
  const srv = createServer({ dbFile: ':memory:' });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const b = await chromium.launch(), errs = [];
  const mk = async () => { const ctx = await b.newContext({ viewport: { width: 430, height: 900 } }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); return p; };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  // dispositivo 1: nuovo personaggio e registrazione
  const p1 = await mk(); await p1.goto(base); await wait(400);
  assert.ok(await p1.evaluate(() => CLD.on), 'il gioco riconosce il server');
  assert.match(await p1.innerText('#m'), /Account online/, 'la scheda account compare nella scelta del popolo');
  await p1.evaluate(() => { NR = 'umano'; A.sex('f'); A.faced(); });
  await p1.fill('#pn', 'Aldric'); await p1.evaluate(() => A.new('arc')); await p1.evaluate(() => { ov.hidden = true; });
  await p1.evaluate(() => { S.lv = 3; S.g = 80; save(); T = 'u'; render(); });
  await p1.fill('#cu', 'Aldric'); await p1.fill('#cp', 'password123'); await p1.click('[data-a=creg]'); await wait(600);
  assert.ok(await p1.evaluate(() => !!CLD.token), 'registrato');
  await p1.evaluate(() => { S.g = 95; save(); }); await wait(3200);
  const online = await p1.evaluate(async () => (await cApi('GET', '/api/save')).j);
  assert.equal(online.data.g, 95); assert.equal(online.data.name, 'Aldric'); assert.ok(online.rev >= 1);
  // dispositivo 2: stesso account, nessun dato locale
  const p2 = await mk(); await p2.goto(base); await wait(400);
  await p2.fill('#cu', 'Aldric'); await p2.fill('#cp', 'password123'); await p2.click('[data-a=cin]'); await wait(800);
  const s2 = await p2.evaluate(() => S && { name: S.name, g: S.g, spec: S.spec });
  assert.deepEqual(s2, { name: 'Aldric', g: 95, spec: 'arc' }, 'il personaggio arriva sul secondo dispositivo');
  // conflitto: il secondo dispositivo salva, il primo scopre la differenza
  await p2.evaluate(() => { S.g = 110; save(); }); await wait(3200);
  await p1.evaluate(() => { S.g = 99; save(); }); await wait(3200);
  assert.match(await p1.innerText('#ov'), /altro dispositivo/, 'il primo dispositivo vede il conflitto');
  await p1.click('[data-a=ao][data-v="0"]'); await wait(300);
  assert.equal(await p1.evaluate(() => S.g), 110, 'scegliendo il salvataggio online si ottiene quello del secondo dispositivo');
  // pagina pubblica
  const html = await (await fetch(base + '/p/Aldric')).text();
  assert.match(html, /Aldric/); assert.match(html, /livello 3/);
  // file locale: nessuna scheda account, gioco regolare
  const p3 = await mk(); await p3.goto('file://' + require('path').join(__dirname, '..', 'dist', 'index.html')); await wait(400);
  await p3.evaluate(() => { NR = 'umano'; render(); });
  assert.ok(!/Account online/.test(await p3.innerText('#m')), 'senza server niente scheda account');
  assert.deepEqual(errs, [], 'nessun errore nel browser');
  await b.close(); srv.close();
  console.log('E2E OK');
})().catch(e => { console.error('E2E FALLITO:', e.message); process.exit(1); });
