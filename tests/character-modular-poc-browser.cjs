const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const navigate = require('./mobile-navigation-fixture.cjs');
const base = process.env.NYMERIA_TEST_URL || 'http://127.0.0.1:8009/nymeria';
(async () => {
 const browser = await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try {
  for (const width of [320,375,390,430]) {
   const page = await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
   const errors=[]; page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>window.addEventListener('unhandledrejection',e=>{throw e.reason;}));
   await page.goto(base);
   assert.equal(await page.locator('#modular-character-poc').count(),0);
   assert.equal(await page.evaluate(()=>typeof CharacterModularPOC),'undefined');
   await page.goto(base+'/?test=1');
   await navigate(page,'debug');
   await page.locator('#modular-character-poc summary').tap();
   const snapshot=()=>page.evaluate(()=>JSON.stringify({equipment:Equipment.state,progression:ProgressionStore.state,storage:{...localStorage}}));
   const before=await snapshot();
   const initial=await page.evaluate(()=>{
    const groups=Array.from(document.querySelectorAll('#modular-character-poc svg > g'));
    window.pocOriginalNodes=groups;window.pocOriginalMarkup=groups.map(n=>n.outerHTML);
    const s=CharacterModularPOC.spec;
    return {width:s.width,height:s.height,version:s.version,zones:s.zones};
   });
   assert.equal(initial.width,1024);assert.equal(initial.height,1536);assert.equal(initial.version,1);
   assert.equal(initial.zones.length,9);
   assert.equal(new Set(initial.zones.map(z=>z[0])).size,9);
   for(const z of initial.zones){assert.ok(z[1]>=0&&z[2]>=0&&z[1]+z[3]<=1024&&z[2]+z[4]<=1536);assert.ok(z[5]>=z[1]&&z[5]<=z[1]+z[3]&&z[6]>=z[2]&&z[6]<=z[2]+z[4]);}
   for(const variant of ['custode','base','custode']) {
    await page.locator('[data-poc-torso="'+variant+'"]').tap();
    assert.equal(await page.locator('#modular-character-poc [data-zone="torso"]').getAttribute('data-module'),'torso-'+variant);
    assert.equal(await page.locator('[data-poc-torso="'+variant+'"]').getAttribute('aria-pressed'),'true');
    assert.ok(await page.evaluate(()=>Array.from(document.querySelectorAll('#modular-character-poc svg > g')).every((n,i)=>n.dataset.zone==='torso'?n!==window.pocOriginalNodes[i]:n===window.pocOriginalNodes[i]&&n.outerHTML===window.pocOriginalMarkup[i])));
   }
   assert.equal(await snapshot(),before);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   for(const b of await page.locator('[data-poc-torso]').all())assert.ok((await b.boundingBox()).height>=44);
   await page.locator('#navigation-back').tap();assert.ok(await page.locator('#panel-menu').isVisible());
   await page.locator('#menu-debug-link').tap();assert.ok(await page.locator('#modular-character-poc').isVisible());
   await page.reload();await navigate(page,'debug');await page.locator('#modular-character-poc summary').tap();
   assert.equal(await page.locator('#modular-character-poc [data-zone="torso"]').getAttribute('data-module'),'torso-base');
   assert.equal(await snapshot(),before);assert.deepEqual(errors,[]);
   console.log('PASS POC '+width+': composition, torso-only node replacement, touch, Back/reopen, refresh, no side effects/errors/overflow');
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
