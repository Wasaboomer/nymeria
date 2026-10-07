/* M7.4 cosmetic dye ledger. Appearance is deliberately separate from Equipment stats. */
const DyeEngine = (() => {
  const data=typeof module!=="undefined"&&module.exports?require("./dye-data.js"):DyeData;
  const KEY="nymeria.dyes.v1", MAX_DYES=999;
  const copy=v=>JSON.parse(JSON.stringify(v));
  const empty=()=>({version:data.schemaVersion,inventory:{},applications:{}});
  function normalize(raw){
    const s=empty(); if(!raw||raw.version!==data.schemaVersion)return s;
    for(const p of data.pigments){const n=raw.inventory?.[p.id];if(Number.isSafeInteger(n)&&n>=0)s.inventory[p.id]=Math.min(MAX_DYES,n);}
    if(raw.applications&&typeof raw.applications==="object")for(const [itemId,row] of Object.entries(raw.applications)){
      if(!row||typeof row!=="object")continue; const clean={};
      for(const ch of data.channels){const id=row[ch.id];if(data.pigment(id))clean[ch.id]=id;}
      if(Object.keys(clean).length)s.applications[itemId]=clean;
    } return s;
  }
  function create({storage={getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v)}}={}){
    let state=empty(),listeners=new Set();
    const emit=()=>listeners.forEach(fn=>{try{fn(copy(state))}catch{}});
    function load(){try{state=normalize(JSON.parse(storage.getItem(KEY)||"null"))}catch{state=empty()}emit();return copy(state)}
    function save(next){try{storage.setItem(KEY,JSON.stringify(next));state=next;emit();return true}catch{return false}}
    function grant(pigment,amount=1){if(!data.pigment(pigment)||!Number.isSafeInteger(amount)||amount<1)return {ok:false,message:"Invalid dye."};const n=copy(state),v=(n.inventory[pigment]||0)+amount;if(v>MAX_DYES)return {ok:false,message:"Dye storage limit reached."};n.inventory[pigment]=v;return save(n)?{ok:true}:{ok:false,message:"Dye save unavailable."}}
    function apply(itemId,channel,pigment){
      if(!itemId||!data.channels.some(x=>x.id===channel)||!data.pigment(pigment))return {ok:false,message:"Invalid appearance choice."};
      if((state.inventory[pigment]||0)<1)return {ok:false,message:"You do not own this dye."};
      const n=copy(state); n.inventory[pigment]--; n.applications[itemId]={...(n.applications[itemId]||{}),[channel]:pigment};
      return save(n)?{ok:true,itemId,channel,pigment}:{ok:false,message:"Dye save unavailable."};
    }
    load();return {KEY,load,grant,apply,get state(){return copy(state)},subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)}};
  }
  return {KEY,MAX_DYES,empty,normalize,create};
})();
if(typeof module!=="undefined"&&module.exports)module.exports=DyeEngine;
