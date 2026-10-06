/* Central semantic commit events and pure notification queue, using real M2–M6 systems. */
const assert=require('node:assert/strict');
const fixture=require('./world-fixture.cjs'),Data=require('../progression-data.js');
const Queue=require('../notification-system.js'),Classes=require('../classes-data.js');
let checks=0;
async function check(name,run){await run();console.log('PASS '+name);checks++;}
const ok=async promise=>{const r=await promise;assert.ok(r.ok,r.message);return r;};
(async()=>{
 for(const cls of ['warden','hunter'])for(const source of ['combat','expedition','quest']){
  await check(`${cls} level-up from ${source}: central event and class gains`,async()=>{
   const f=fixture();f.kit(cls);const events=[];f.store.subscribeEvents(e=>events.push(e));
   await f.store.transact(s=>{s.totalXP=70;return {ok:true};});
   const initial={...f.equipment.state.resultingStats};
   if(source==='combat') {const ticket=(await f.system.beginManualCombat('guardian')).ticket;await ok(f.system.awardManualCombat(ticket.id,'victory'));}
   if(source==='expedition') {await f.finish();await ok(f.system.claim(f.store.state.pendingExpeditionResult.id));}
   if(source==='quest') {await f.quests.accept('mq01');await f.world.talk('serah');await f.world.enter('broken-path');await ok(f.quests.claim('mq01'));}
   const level=events.filter(e=>e.type==='levelUp');assert.equal(level.length,1);
   assert.equal(level[0].payload.classId,cls);assert.equal(level[0].payload.previousLevel,1);assert.equal(level[0].payload.resultingLevel,2);
   assert.deepEqual(level[0].payload.statGains,Data.statGains(Classes.classes[cls].statGrowthPerLevel,1));
   for(const[key,value]of Object.entries(level[0].payload.statGains))assert.equal(f.equipment.state.resultingStats[key]-initial[key],value);
  });
 }
 await check('future XP source, aggregate multi-level and prototype class change use current data',async()=>{
  const f=fixture();f.kit('hunter');await f.level(3);f.classes.selectClass('warden');
  const events=[];f.store.subscribeEvents(e=>events.push(e));
  await f.store.transact(s=>{s.totalXP=Data.thresholds[4];return {ok:true};});
  const e=events.find(e=>e.type==='levelUp');assert.equal(e.payload.previousLevel,3);assert.equal(e.payload.resultingLevel,5);
  assert.deepEqual(e.payload.statGains,{force:4,vigor:6,spirit:2});
 });
 await check('L19 → cap emits one real increment; cap excess XP emits none',async()=>{
  const f=fixture();f.kit('hunter');await f.level(19);const events=[];f.store.subscribeEvents(e=>events.push(e));
  await f.store.transact(s=>{s.totalXP=Data.thresholds[19]+500;return {ok:true};});
  assert.equal(events.filter(e=>e.type==='levelUp').length,1);assert.equal(events[0].payload.resultingLevel,20);
  assert.deepEqual(events[0].payload.statGains,{agility:3,vigor:1,critical:.5});
  events.length=0;await f.store.transact(s=>{s.totalXP+=500;return {ok:true};});assert.equal(events.length,0);assert.equal(f.store.state.overflowXP,1000);
 });
 await check('area, tablet and title semantic events only on first durable addition',async()=>{
  const f=fixture({testMode:true});const events=[];f.store.subscribeEvents(e=>events.push(e));
  await f.world.debug('unlock','elar-ruins');await f.world.enter('elar-ruins');await f.world.explore('tablet_of_elar');
  await f.world.explore('tablet_of_elar');await f.world.debug('unlock','elar-ruins');
  assert.equal(events.filter(e=>e.type==='areaUnlocked').length,1);assert.equal(events.filter(e=>e.type==='discovery').length,1);
  assert.equal(events.find(e=>e.type==='discovery').payload.requirement,'Richiede Archeologia 10');
  await f.store.transact(s=>{s.frontier.achievements.push('frontier-conqueror');return {ok:true};});
  await f.store.transact(s=>{s.frontier.achievements.push('frontier-conqueror');return {ok:true};});
  assert.equal(events.filter(e=>e.type==='achievement').length,1);
 });
 await check('real M6 quest claims emit all four area unlocks and final title centrally',async()=>{
  const f=fixture({testMode:true});f.kit('warden');await f.level(8);const events=[];f.store.subscribeEvents(e=>events.push(e));
  for(const id of ['mq01','mq02','mq03','mq04','mq05','mq06']){
   const quest=require('../quest-data.js').get(id);await ok(f.world.enter(quest.location));await ok(f.quests.accept(id));await ok(f.quests.debug(id,'complete'));await ok(f.quests.claim(id));
  }
  assert.deepEqual(events.filter(e=>e.type==='areaUnlocked').map(e=>e.payload.id),['world:lantern-wood','world:elar-ruins','world:vesper-ford','world:silent-tower']);
  const title=events.filter(e=>e.type==='achievement');assert.equal(title.length,1);assert.equal(title[0].payload.name,'Conquistatore della Frontiera');
  assert.equal((await f.quests.claim('mq06')).ok,false);assert.equal(events.filter(e=>e.type==='achievement').length,1);
 });
 await check('refresh, old migration, later transaction reread and second instance never replay events',async()=>{
  const f=fixture({testMode:true});f.kit();await f.store.transact(s=>{s.totalXP=80;return {ok:true};});
  const events=[];f.store.subscribeEvents(e=>events.push(e));f.store.refresh();assert.equal(events.length,0);
  const reopened=fixture({memory:f.memory});reopened.store.subscribeEvents(e=>events.push(e));reopened.store.refresh();
  await reopened.world.enter('veyra');assert.equal(events.length,0);assert.equal(reopened.store.state.totalXP,80);
  await f.store.transact(s=>{s.totalXP+=500;return {ok:true};});events.length=0;
  await reopened.world.enter('veyra');assert.equal(events.length,0);
 });
 await check('write failure, unchanged and duplicate claims emit no feedback; retry once',async()=>{
  const f=fixture({testMode:true});await f.quests.accept('mq01');await f.quests.debug('mq01','complete');
  await f.store.transact(s=>{s.totalXP=70;return {ok:true};});
  const blocked=fixture({memory:f.memory,denyWrite:true}),events=[];
  blocked.store.subscribeEvents(e=>events.push(e));assert.equal((await blocked.quests.claim('mq01')).ok,false);assert.equal(events.length,0);
  f.store.subscribeEvents(e=>events.push(e));await ok(f.quests.claim('mq01'));assert.equal(events.length,1);
  await f.quests.claim('mq01');await f.store.transact(()=>({ok:true,unchanged:true}));assert.equal(events.length,1);
 });
 await check('broken presentation listener cannot undo rewards, block later listeners or enable duplicate payment',async()=>{
  const f=fixture({testMode:true});await f.quests.accept('mq01');await f.quests.debug('mq01','complete');
  await f.store.transact(s=>{s.totalXP=70;return {ok:true};});let count=0;
  f.store.subscribeEvents(()=>{throw new Error('UI failure');});f.store.subscribeEvents(()=>count++);
  await ok(f.quests.claim('mq01'));assert.equal(f.store.state.totalXP,110);assert.equal(count,1);assert.equal((await f.quests.claim('mq01')).ok,false);
  assert.equal(fixture({memory:f.memory}).store.state.totalXP,110);
 });
 await check('queue: no overlap/cancellation, level-up priority, keyed dedup, stale dismiss safe',()=>{
  const q=Queue.create();const first=q.notify('discovery',{name:'Tablet'},{key:'tablet'});
  q.notify('achievement',{name:'Title'});q.notify('levelUp',{previousLevel:3,resultingLevel:5});q.notify('areaUnlocked',{name:'Forest'});
  assert.equal(q.current.id,first);assert.deepEqual(q.pending.map(e=>e.type),['levelUp','achievement','areaUnlocked']);
  assert.equal(q.notify('discovery',{name:'Tablet'},{key:'tablet'}),null);assert.equal(q.dismiss(999),false);
  assert.ok(q.dismiss(first));assert.equal(q.current.type,'levelUp');q.dismiss();assert.equal(q.current.type,'achievement');q.dismiss();q.dismiss();assert.equal(q.current,null);
 });
 await check('notification API supports all categories and never touches any game saves',()=>{
  const q=Queue.create();for(const type of ['levelUp','areaUnlocked','questAvailable','importantItem','discovery','achievement','featureUnlocked'])q.notify(type,{name:'Test'});
  assert.equal(q.current.type,'levelUp');assert.equal(q.pending.length,6);let signals=0;const stop=q.subscribe(()=>signals++);q.dismiss();stop();q.dismiss();assert.equal(signals,1);
 });
 console.log(`${checks} notification engine/integration checks passed.`);
})().catch(e=>{console.error(e);process.exit(1)});
