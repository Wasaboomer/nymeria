const navigate = require('./mobile-navigation-fixture.cjs');
/* Feedback in different tabs, real source adapters, queue, expiry, touch and reduced motion. */
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const base=process.env.NYMERIA_TEST_URL||'http://127.0.0.1:8000';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const width of [320,390,430]){
  const context=await browser.newContext({viewport:{width,height:844},hasTouch:true,isMobile:true,reducedMotion:width===320?'reduce':'no-preference'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install({time:new Date('2026-10-06T12:00:00Z')});await page.clock.pauseAt(new Date('2026-10-06T12:00:01Z'));await page.goto(base+'/?test=1');
  const host=page.locator('#global-notifications');assert.ok(await host.isHidden());
  const drain=()=>page.evaluate(()=>{while(Notifications.current)Notifications.dismiss();});
  const setup=async(cls,xp=70)=>{
   await page.evaluate(async({cls,xp})=>{
    ClassSystem.selectClass(cls);
    for(const[slot,id]of Object.entries(cls==='warden'?{mainHand:'sword',support:'shield',torso:'torso-warden',legs:'legs-sentinel',boots:'boots-plate'}:{mainHand:'bow',support:'quiver',torso:'torso-chain',legs:'legs-chain',boots:'boots-chain'}))Equipment.equip(id,slot);
    await ProgressionStore.transact(s=>{s.totalXP=xp;return {ok:true};});
    while(Notifications.current)Notifications.dismiss();
   },{cls,xp});
  };
  for(const cls of ['warden','hunter'])for(const source of ['combat','expedition','quest']){
   // Fresh page prevents prior quest claims and guarantees no notification replay.
   await page.evaluate(()=>localStorage.clear());await page.reload();await setup(cls);
   await navigate(page, source==='combat'?'inventory':source==='expedition'?'equipment':'world');
   await page.evaluate(async source=>{
    if(source==='combat'){
     // Actual Combat UI runs the unchanged engine/settlement, while Inventory stays selected.
     CombatUI.start({seed:1});CombatUI.engine.advance(180);await CombatUI.settleRewards();
    }
    if(source==='expedition'){
     await ProgressionSystem.start('patrol',{seed:1});await ProgressionSystem.debugComplete();
     await ProgressionSystem.claim(ProgressionStore.state.pendingExpeditionResult.id);
    }
    if(source==='quest'){
     await QuestSystem.accept('mq01');await WorldSystem.talk('serah');await WorldSystem.enter('broken-path');await QuestSystem.claim('mq01');
    }
   },source);
   const level=await page.evaluate(()=>Notifications.current);assert.equal(level.type,'levelUp');assert.ok(await host.isVisible());
   const lines=await host.innerText();assert.match(lines,/LIVELLO AUMENTATO!/);assert.match(lines,/Livello 2/);
   assert.match(lines,cls==='hunter'?/\+3 Agilità.*\+1 Vigor.*\+0,5% Critico/s:/\+2 Forza.*\+3 Vigor.*\+1 Spirito/s);
   assert.ok(await page.locator(source==='combat'?'#panel-inventory':source==='expedition'?'#panel-equipment':'#panel-world').isVisible());
   assert.equal(await host.getAttribute('role'),'status');assert.equal(await host.getAttribute('aria-live'),'polite');
   if(width===320)assert.equal(await page.locator('.notification-card').evaluate(el=>getComputedStyle(el).animationName),'none');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.locator('[data-dismiss-notification]').tap();assert.ok(await host.isHidden());
   const saved=await page.evaluate(()=>ProgressionStore.state);await page.reload();assert.ok(await host.isHidden());
   assert.equal(await page.evaluate(()=>ProgressionStore.state.totalXP),saved.totalXP);assert.equal(await page.evaluate(()=>Notifications.pending.length),0);
   if(source==='quest')assert.equal(await page.evaluate(()=>ProgressionStore.state.frontier.quests.mq01.status),'claimed');
  }
  await setup('hunter',await page.evaluate(()=>ProgressionData.thresholds[2]));await navigate(page, "class");
  await page.evaluate(async()=>{await ProgressionStore.transact(s=>{s.totalXP=ProgressionData.thresholds[4];return {ok:true};});});
  assert.match(await host.innerText(),/LIVELLI AUMENTATI!/);assert.match(await host.innerText(),/Livello 3 → 5/);
  assert.match(await host.innerText(),/\+6 Agilità.*\+2 Vigor.*\+1% Critico/s);
  if(width===390)await page.screenshot({path:'/tmp/nymeria-m61-multilevel-390.png',fullPage:true,animations:'disabled'});await drain();
  await setup('warden',await page.evaluate(()=>ProgressionData.thresholds[18]));
  await page.evaluate(async()=>{await ProgressionStore.transact(s=>{s.totalXP=ProgressionData.thresholds[19]+100;return {ok:true};});});
  assert.match(await host.innerText(),/Livello 20/);assert.match(await host.innerText(),/Livello massimo raggiunto/);assert.match(await host.innerText(),/\+3 Vigor/);
  await drain();await page.evaluate(async()=>{await ProgressionStore.transact(s=>{s.totalXP+=100;return {ok:true};});});assert.ok(await host.isHidden());
  await navigate(page, "world");
  await page.evaluate(async()=>{
   await WorldSystem.debug('unlock','elar-ruins');await WorldSystem.enter('elar-ruins');await WorldSystem.explore('tablet_of_elar');
   await ProgressionStore.transact(s=>{s.frontier.achievements.push('frontier-conqueror');return {ok:true};});
  });
  assert.equal(await host.getAttribute('data-type'),'areaUnlocked');assert.match(await host.innerText(),/Rovine di Elar/);
  assert.deepEqual(await page.evaluate(()=>Notifications.pending.map(e=>e.type)),['discovery','achievement']);
  await page.locator('[data-dismiss-notification]').tap();assert.equal(await host.getAttribute('data-type'),'discovery');assert.match(await host.innerText(),/Tavoletta di Elar/);assert.match(await host.innerText(),/Archeologia 10/);
  if(width===390)await page.screenshot({path:'/tmp/nymeria-m61-discovery-390.png',fullPage:true,animations:'disabled'});
  await page.locator('[data-dismiss-notification]').tap();assert.equal(await host.getAttribute('data-type'),'achievement');assert.match(await host.innerText(),/Conquistatore della Frontiera/);
  await page.locator('[data-dismiss-notification]').tap();assert.ok(await host.isHidden());
  await page.evaluate(async()=>{await WorldSystem.explore('tablet_of_elar');await WorldSystem.debug('unlock','elar-ruins');await ProgressionStore.transact(s=>{s.frontier.achievements.push('frontier-conqueror');return {ok:true};});});assert.ok(await host.isHidden());
  await page.reload();assert.ok(await host.isHidden());assert.ok(await page.evaluate(()=>ProgressionStore.state.frontier.discoveries.includes('tablet_of_elar')));
  // All seven kinds are usable by future emitters; a level-up never cancels an active banner.
  await page.evaluate(()=>{Notifications.notify('importantItem',{name:'Reliquia'});Notifications.notify('questAvailable',{title:'Missione futura'});Notifications.notify('levelUp',{previousLevel:3,resultingLevel:4,levelCap:20,statGains:{agility:3}});Notifications.notify('featureUnlocked',{name:'Funzionalità futura'});});
  assert.equal(await host.getAttribute('data-type'),'importantItem');await page.locator('[data-dismiss-notification]').tap();assert.equal(await host.getAttribute('data-type'),'levelUp');await page.locator('[data-dismiss-notification]').tap();assert.equal(await host.getAttribute('data-type'),'questAvailable');await drain();
  // Timeout and queue advance without user dismissal (remove sticky touch hover/focus).
  await page.evaluate(()=>{document.activeElement?.blur();Notifications.notify('featureUnlocked',{name:'Temporanea'});Notifications.notify('importantItem',{name:'Successiva'});});
  await page.mouse.move(0,840);await page.clock.runFor(5200);assert.equal(await host.getAttribute('data-type'),'importantItem');await page.clock.runFor(5200);assert.ok(await host.isHidden());
  // An open inventory modal cannot obscure feedback or make its dismiss button inert.
  await navigate(page, "inventory");await page.locator('[data-item-id="sword"]').tap();
  await page.evaluate(()=>Notifications.notify('levelUp',{previousLevel:2,resultingLevel:3,levelCap:20,statGains:{force:2,vigor:3,spirit:1}}));
  assert.ok(await page.locator('#item-dialog #global-notifications').isVisible());await page.locator('[data-dismiss-notification]').tap();assert.ok(await host.isHidden());await page.locator('#close-detail').tap();
  assert.deepEqual(errors,[]);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  console.log(`PASS ${width}px: both classes × Combat/Expedition/Quest, different tabs, growth, multi/cap, queue/priority/dismiss/expiry, area/tablet/title, reload/no duplicates, modal access, touch/motion/no errors/overflow`);
  await context.close();
 }
 // A failed feedback producer script is optional: the ledger still starts and pays once.
 const context=await browser.newContext();const page=await context.newPage();
 await page.route('**/progression-events.js*',route=>route.abort());await page.goto(base);
 const paid=await page.evaluate(async()=>{await ProgressionStore.transact(s=>{s.totalXP=70;return {ok:true};});const ticket=(await ProgressionSystem.beginManualCombat('guardian')).ticket;return ProgressionSystem.awardManualCombat(ticket.id,'victory');});
 assert.ok(paid.ok);assert.equal(await page.evaluate(()=>ProgressionStore.state.totalXP),105);assert.equal(await page.evaluate(()=>ProgressionStore.state.crowns),4);
 await page.reload();assert.equal(await page.evaluate(()=>ProgressionStore.state.totalXP),105);assert.ok(await page.locator('#global-notifications').isHidden());await context.close();
 console.log('PASS failed feedback script: ledger starts, reward persists exactly once, no replay');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
