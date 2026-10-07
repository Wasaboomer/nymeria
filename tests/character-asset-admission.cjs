const assert=require('node:assert/strict');
const {RIG,validate}=require('../tools/validate-character-asset.cjs');
const good={rigVersion:1,zone:'torso',variant:'custode-a',file:'assets/torso-custode-a.png',origin:{x:325,y:360},anchor:{x:512,y:390},nativeSize:{width:374,height:480},placeholder:false,overlapZones:['arms','waist']};
assert.equal(validate(good).ok,true);
for (const mutate of [
 m=>m.rigVersion=2,
 m=>m.zone='banana',
 m=>m.anchor={x:0,y:0},
 m=>m.origin={x:900,y:1400},
 m=>m.file='armor.jpg',
 m=>m.placeholder='no'
]) {
 const m=structuredClone(good); mutate(m); assert.equal(validate(m).ok,false);
}
assert.equal(RIG.width,1024); assert.equal(RIG.height,1536); assert.equal(Object.keys(RIG.zones).length,9);
console.log('PASS Character Rig v1 structural admission gate');
