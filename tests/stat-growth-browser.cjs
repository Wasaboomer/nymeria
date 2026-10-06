const navigate = require('./mobile-navigation-fixture.cjs');
const assert = require('node:assert/strict');
const dismissNotifications = require('./notifications-fixture.cjs');
const { chromium } = require('playwright');
(async () => {
 const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
 try {
  for (const width of [320,390,430]) {
   const context = await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true});
   const page = await context.newPage(), errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(process.env.NYMERIA_TEST_URL || 'http://127.0.0.1:8000');
   for (const cls of ['warden','hunter']) {
    for (const level of [1,2,10,20]) {
     const result = await page.evaluate(async ({cls,level})=>{
      ClassSystem.selectClass(cls);
      for (const slot of Object.keys(Equipment.state.equipment)) Equipment.unequip(slot);
      await ProgressionStore.transact(s=>{s.totalXP=ProgressionData.thresholds[level-1];return {ok:true};});
      const actual=Equipment.state.resultingStats;
      const expected=ProgressionData.baseStats(level,Equipment.baseStats,ClassSystem.selected().statGrowthPerLevel);
      return {actual,expected};
     },{cls,level});
     assert.deepEqual(result.actual,result.expected);
     await page.reload();
     assert.deepEqual(await page.evaluate(()=>Equipment.state.resultingStats),result.actual);
    }
   }
   const summary = await page.evaluate(async ()=>{
    ClassSystem.selectClass('hunter');
    await ProgressionStore.transact(s=>{s.totalXP=79;return {ok:true};});
    const ticket=(await ProgressionSystem.beginManualCombat('guardian')).ticket;
    const result=await ProgressionSystem.awardManualCombat(ticket.id,'victory');
    return ProgressionData.levelUpSummary(result.receipt);
   });
   assert.ok(summary.includes('+3 Agilità') && summary.includes('+1 Vigor') && summary.includes('+0,5% Critico'));
   await dismissNotifications(page);
   for(const id of ['inventory','equipment','character']) {
    await navigate(page, id);
    assert.ok(await page.locator(`#panel-${id}`).isVisible());
   }
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert.deepEqual(errors,[]);
   console.log(`PASS ${width}px: both classes L1/2/10/20, reload, level-up gains, touch, no errors/overflow`);
   await context.close();
  }
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
