const $=s=>document.querySelector(s),rnd=Math.random,K='nymeria.fase1',ov=$('#ov'),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
let S=load(),C=null,T='w',AO=[],NR=null,NX=null,NAV=null,NF=0,GP=0,GM='',PV=null;
function load(){try{const r=JSON.parse(localStorage.getItem(K));if(r&&r.v===5){r.look=r.look||{f:0,hr:0,sk:0,hc:0,m:0};r.eq.h=r.eq.h||'h0';if(!r.items){r.own=r.own||{};r.own.h0=1}r.race=r.race||'umano';r.spec=({tank:'guard',dps:'spad',heal:'sac',smite:'spad'})[r.spec]||r.spec;if(!['guard','ombra','spad','arc','bardo','tempo','sac','drui'].includes(r.spec))r.spec='spad';r.cls=r.spec;r.gl=r.gl||{};r.nd=r.nd||{};r.gx=r.gx||{};r.lt=r.lt||0;r.hv=r.hv||null;r.cx=r.cx??(r.cr||0)*12;r.pd=r.pd||0;r.fl=r.fl||{};if(r.smith&&!r.craft)r.craft='smith';r.ch1=r.ch1||0;r.od=r.od||0;r.name=r.name||'Viandante';if(!r.av){const n=({umano:48})[r.race]||24;r.av={p:((r.look?r.look.f*7+r.look.hr*3+r.look.sk:0)%n),bg:({kharun:8,velhiri:2})[r.race]||0,em:r.look?(r.look.m*5+r.look.hc)%30:0}}if(r.avd==null)r.avd=1;
 if(!r.items){r.items={};r.nu=r.nu||1;const mp={};Object.keys(r.own||{}).forEach(id=>{const u=id+'#'+(++r.nu);r.items[u]={q:r.own[id],vr:0,by:'',cl:0,k:0,mx:0,bn:''};mp[id]=u});Object.keys(r.eq).forEach(k=>{if(mp[r.eq[k]])r.eq[k]=mp[r.eq[k]]});
  r.dep=(r.dep||[]).map(d=>{if(d.t==='i'&&d.id){const u=d.id+'#'+(++r.nu);return{t:'i',u,i:{q:d.q,vr:0,by:'',cl:0,k:0,mx:0,bn:''}}}return d});delete r.own}
 return r}}catch(e){}return null}
function save(){try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}try{cloudPush()}catch(e){}}
const need=l=>Math.round(60*Math.pow(l,1.4)),MAXL=50;
