/* M7.3 isolated profession ledger. No player or guild resources are debited. */
const ProfessionEngine = (() => {
  const data=typeof module!=="undefined"&&module.exports?require("./profession-data.js"):ProfessionData;
  const KEY="nymeria.professions.v1", copy=v=>JSON.parse(JSON.stringify(v));
  const empty=()=>({version:data.schemaVersion,professions:Object.fromEntries(data.professions.map(p=>[p.id,{level:1,xp:0}])),materials:{},discoveries:[]});
  const threshold=level=>50+(level-1)*35;
  function normalize(raw){
    const s=empty(); if(!raw||typeof raw!=="object"||raw.version!==data.schemaVersion)return s;
    for(const p of data.professions){const r=raw.professions?.[p.id];if(r&&Number.isInteger(r.level)&&Number.isFinite(r.xp)){s.professions[p.id].level=Math.max(1,Math.min(p.maxLevel,r.level));s.professions[p.id].xp=Math.max(0,Math.floor(r.xp));}}
    if(raw.materials&&typeof raw.materials==="object")for(const [k,v] of Object.entries(raw.materials))if(Number.isSafeInteger(v)&&v>=0)s.materials[k]=v;
    if(Array.isArray(raw.discoveries))s.discoveries=[...new Set(raw.discoveries.filter(x=>typeof x==="string"))];
    return s;
  }
  function create({storage={getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v)}}={}){
    let state=empty(),storageIssue=false;
    function read(){try{const raw=JSON.parse(storage.getItem(KEY)||"null");if(raw&&raw.version!==undefined&&raw.version!==data.schemaVersion)return{ok:false};return{ok:true,state:normalize(raw)}}catch{return{ok:false}}}
    function load(){const r=read();storageIssue=!r.ok;if(r.ok)state=r.state;return copy(state)}
    function commit(next){try{storage.setItem(KEY,JSON.stringify(next));state=next;storageIssue=false;return true}catch{storageIssue=true;return false}}
    function awardXp(next,id,amount){const p=data.profession(id),row=next.professions[id];if(!p||!row)return;row.xp+=amount;while(row.level<p.maxLevel&&row.xp>=threshold(row.level)){row.xp-=threshold(row.level);row.level++}if(row.level===p.maxLevel)row.xp=Math.min(row.xp,threshold(row.level));}
    function gather(nodeId){const n=data.node(nodeId);if(!n)return{ok:false,message:"Unknown gathering node."};const next=copy(state);next.materials[n.material]=(next.materials[n.material]||0)+n.amount;awardXp(next,n.profession,n.xp);if(!commit(next))return{ok:false,message:"Profession save unavailable. Nothing was gathered."};return{ok:true,material:n.material,amount:n.amount};}
    function craft(recipeId){const r=data.recipe(recipeId);if(!r)return{ok:false,message:"Unknown recipe."};const row=state.professions[r.profession];if(!row||row.level<r.level)return{ok:false,message:"Profession level too low."};for(const[k,v]of Object.entries(r.costs))if((state.materials[k]||0)<v)return{ok:false,message:"Missing materials."};const next=copy(state);for(const[k,v]of Object.entries(r.costs))next.materials[k]-=v;for(const[k,v]of Object.entries(r.outputs||{}))next.materials[k]=(next.materials[k]||0)+v;if(r.discovery&&!next.discoveries.includes(r.discovery))next.discoveries.push(r.discovery);awardXp(next,r.profession,r.xp);if(!commit(next))return{ok:false,message:"Profession save unavailable. Nothing was crafted."};return{ok:true,recipe:r.id,discovery:r.discovery||null};}
    load(); return{KEY,get state(){return copy(state)},get storageIssue(){return storageIssue},load,gather,craft,threshold};
  }
  const api={KEY,create,threshold}; if(typeof module!=="undefined"&&module.exports)module.exports=api; return api;
})();