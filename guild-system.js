const GuildEngine = (() => {
  const data = typeof module !== "undefined" && module.exports ? require("./guild-data.js") : GuildData;
  const KEY="nymeria.guild.v1";
  const copy=v=>JSON.parse(JSON.stringify(v));
  function empty(){ return {version:data.schemaVersion,guild:null}; }
  function cleanName(v){ return String(v||"").trim().replace(/\s+/g," ").slice(0,28); }
  function cleanMotto(v){ return String(v||"").trim().replace(/\s+/g," ").slice(0,72); }
  function normalize(raw){
    if(!raw || raw.version!==data.schemaVersion || !raw.guild) return empty();
    const g=raw.guild, level=Math.max(1,Math.min(20,Math.floor(Number(g.level)||1)));
    return {version:data.schemaVersion,guild:{
      id:String(g.id||"guild-local"), name:cleanName(g.name)||"Gilda senza nome", motto:cleanMotto(g.motto),
      sigil:["sun","tower","wolf"].includes(g.sigil)?g.sigil:"tower", level,
      xp:Math.max(0,Math.floor(Number(g.xp)||0)), treasury:{
        crowns:Math.max(0,Math.floor(Number(g.treasury?.crowns)||0)),
        iron:Math.max(0,Math.floor(Number(g.treasury?.iron)||0)),
        fiber:Math.max(0,Math.floor(Number(g.treasury?.fiber)||0)),
        ether:Math.max(0,Math.floor(Number(g.treasury?.ether)||0))
      }, members:Array.isArray(g.members)?g.members.slice(0,30):[], createdAt:Number(g.createdAt)||Date.now()
    }};
  }
  function create(storage=localStorage){
    let state=empty(), listeners=new Set();
    function load(){ try{state=normalize(JSON.parse(storage.getItem(KEY)||"null"));}catch{state=empty();} return copy(state); }
    function save(){ storage.setItem(KEY,JSON.stringify(state)); listeners.forEach(fn=>fn(copy(state))); }
    load();
    function createGuild(input){
      if(state.guild) return {ok:false,message:"Fai già parte di una gilda."};
      const name=cleanName(input.name); if(name.length<3) return {ok:false,message:"Il nome deve avere almeno 3 caratteri."};
      state={version:data.schemaVersion,guild:{id:"guild-"+Date.now(),name,motto:cleanMotto(input.motto),sigil:input.sigil||"tower",level:1,xp:0,
        treasury:{crowns:0,iron:0,fiber:0,ether:0},createdAt:Date.now(),
        members:[{id:"player",name:"Iria del Vespro",role:"leader",level:1,contribution:0}].concat(copy(data.simulatedMembers))}};
      save(); return {ok:true};
    }
    function contribute(kind,amount){
      if(!state.guild || !["crowns","iron","fiber","ether"].includes(kind)) return {ok:false,message:"Contributo non valido."};
      amount=Math.floor(Number(amount)); if(!Number.isFinite(amount)||amount<=0) return {ok:false,message:"Inserisci una quantità valida."};
      state.guild.treasury[kind]+=amount; const me=state.guild.members.find(m=>m.id==="player");
      if(me) me.contribution=(me.contribution||0)+amount;
      state.guild.xp+=Math.max(1,Math.floor(amount/5));
      while(state.guild.level<20 && state.guild.xp>=data.xpForLevel(state.guild.level)){state.guild.xp-=data.xpForLevel(state.guild.level);state.guild.level++;}
      save(); return {ok:true};
    }
    return {get state(){return copy(state)},load,createGuild,contribute,subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)}};
  }
  return {KEY,create,normalize,empty};
})();
if(typeof module!=="undefined"&&module.exports) module.exports=GuildEngine;
const GuildSystem=typeof window!=="undefined"?GuildEngine.create():null;
