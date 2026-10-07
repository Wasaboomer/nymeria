#!/usr/bin/env node
'use strict';

/*
 * Nymeria Character Rig v1 admission gate.
 * Dependency-free structural validator for asset manifests.
 * Pixel/alpha inspection is intentionally a separate gate until a decoder is adopted.
 */
const fs = require('node:fs');
const path = require('node:path');

const RIG = Object.freeze({
  version: 1,
  width: 1024,
  height: 1536,
  zones: Object.freeze({
    back:     {bounds:[270,330,484,840], anchor:[512,355]},
    legs:     {bounds:[355,810,314,530], anchor:[512,835]},
    feet:     {bounds:[325,1290,374,150],anchor:[512,1320]},
    torso:    {bounds:[325,360,374,480], anchor:[512,390]},
    arms:     {bounds:[215,390,594,540], anchor:[512,410]},
    waist:    {bounds:[325,790,374,120], anchor:[512,825]},
    head:     {bounds:[380,120,264,265], anchor:[512,340]},
    offHand:  {bounds:[130,660,260,420], anchor:[260,770]},
    mainHand: {bounds:[735,530,160,710], anchor:[790,785]}
  })
});

function fail(errors, message) { errors.push(message); }
function ints(v,n){ return Array.isArray(v) && v.length===n && v.every(Number.isInteger); }
function validate(m) {
  const errors=[];
  if (!m || typeof m!=='object' || Array.isArray(m)) return {ok:false,errors:['manifest must be an object']};
  if (m.rigVersion!==RIG.version) fail(errors,'rigVersion must be 1');
  if (!RIG.zones[m.zone]) fail(errors,'unknown zone');
  if (typeof m.variant!=='string' || !m.variant.trim()) fail(errors,'variant required');
  if (typeof m.file!=='string' || !/\.(png|webp|svg)$/i.test(m.file)) fail(errors,'file must be png/webp/svg');
  if (!m.origin || !Number.isInteger(m.origin.x) || !Number.isInteger(m.origin.y)) fail(errors,'integer origin required');
  if (!m.anchor || !Number.isInteger(m.anchor.x) || !Number.isInteger(m.anchor.y)) fail(errors,'integer anchor required');
  if (!m.nativeSize || !Number.isInteger(m.nativeSize.width) || !Number.isInteger(m.nativeSize.height) || m.nativeSize.width<1 || m.nativeSize.height<1) fail(errors,'positive integer nativeSize required');
  if (typeof m.placeholder!=='boolean') fail(errors,'placeholder boolean required');
  if (m.overlapZones!==undefined && (!Array.isArray(m.overlapZones) || m.overlapZones.some(z=>!RIG.zones[z]))) fail(errors,'overlapZones contains unknown zone');
  if (RIG.zones[m.zone] && m.anchor && Number.isInteger(m.anchor.x) && Number.isInteger(m.anchor.y)) {
    const [x,y,w,h]=RIG.zones[m.zone].bounds;
    if (m.anchor.x<x || m.anchor.x>x+w || m.anchor.y<y || m.anchor.y>y+h) fail(errors,'anchor outside primary zone');
  }
  if (m.origin && m.nativeSize && [m.origin.x,m.origin.y,m.nativeSize.width,m.nativeSize.height].every(Number.isInteger)) {
    if (m.origin.x<0 || m.origin.y<0 || m.origin.x+m.nativeSize.width>RIG.width || m.origin.y+m.nativeSize.height>RIG.height) fail(errors,'native rectangle outside rig canvas');
  }
  return {ok:errors.length===0,errors};
}

if (require.main===module) {
  const target=process.argv[2];
  if (!target) { console.error('Usage: node tools/validate-character-asset.cjs manifest.json'); process.exit(2); }
  let manifest;
  try { manifest=JSON.parse(fs.readFileSync(path.resolve(target),'utf8')); }
  catch(e){ console.error('REJECT:',e.message); process.exit(1); }
  const result=validate(manifest);
  if (!result.ok){ console.error('REJECT:\n- '+result.errors.join('\n- ')); process.exit(1); }
  console.log('PASS structural gate:',manifest.zone+'/'+manifest.variant);
  console.log('NOTE: pixel/alpha gate still required before production admission.');
}
module.exports={RIG,validate};
