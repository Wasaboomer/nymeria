/* Cucina: pesci e orto diventano piatti con bonus temporanei. Si usa dalla Tenuta; i piatti si sbloccano con il livello della casa. */
const DSH=[
{id:'zup',n:'Zuppa di erbe',lv:1,in:{erba:3},hp:.06,at:0,m:30,d:'Scalda e rimette in forze.'},
{id:'bra',n:'Pesce alla brace',lv:1,in:{pesce0:1,legno:1},hp:0,at:.05,m:30,d:'Semplice, con la pelle croccante.'},
{id:'stu',n:'Stufato di pesce',lv:2,in:{pesce0:2,erba:2},hp:.10,at:.03,m:40,d:'Un piatto che tiene a lungo.'},
{id:'spe',n:'Pesce speziato',lv:2,in:{pesce1:1,erba:2},hp:0,at:.10,m:40,d:'Le erbe giuste fanno la differenza.'},
{id:'ban',n:'Banchetto del pescatore',lv:3,in:{pesce1:1,pesce0:1,erba:3,legno:1},hp:.15,at:.06,m:45,d:'Per chi torna da una lunga giornata sull’acqua.'},
{id:'lan',n:'Piatto di lanterna',lv:3,in:{pesce2:1,erba:2},hp:.12,at:.12,m:45,d:'Brilla appena, come il pesce che lo ha dato.'},
{id:'fes',n:'Festa del Vespro',lv:4,in:{pesce3:1,pesce2:1,erba:4},hp:.22,at:.15,m:60,d:'Si cucina per un’occasione sola.'}];
ACH.push({id:'cuc',n:'Cuoco',d:'Cucina piatti',c:()=>S.st.cuc||0,t:[[5,20],[20,60],[50,150]]});
function dshFish(r){return Object.keys(S.inv).filter(k=>FISH[k]&&FISH[k].r===r&&S.inv[k]>0)}
function dshHave(k){if(k.slice(0,5)==='pesce')return dshFish(+k[5]).reduce((a,f)=>a+S.inv[f],0);return S.inv[k]||0}
function dshIn(d){return Object.entries(d.in).map(([k,n])=>{const nm=k.slice(0,5)==='pesce'?['pesce comune','pesce non comune','pesce raro','pesce leggendario'][+k[5]]:MN[k];return n+' '+nm+' ('+dshHave(k)+')'}).join(', ')}
function dshOk(d){return Object.entries(d.in).every(([k,n])=>dshHave(k)>=n)}
function cuHtml(){const t=S.ten,lv=t?t.lv:0;if(!lv)return'';S.dsh=S.dsh||{};
 return'<h2>Cucina</h2><small class="mu">Con i pesci che peschi e le erbe dell’orto prepari piatti: danno vita e attacco in più per un po’. I piatti nuovi si sbloccano migliorando la casa.</small>'+
 DSH.map(d=>{const st=S.dsh[d.id]||0,lock=d.lv>lv;
  if(lock)return'<div class="card" style="opacity:.5"><b>'+d.n+'</b><small>Si sblocca con: '+TH[d.lv].n+'.</small></div>';
  return'<div class="card"><b>'+d.n+'</b> <small>(ne hai '+st+')</small><small>'+d.d+' '+(d.hp?'Vita +'+Math.round(d.hp*100)+'%. ':'')+(d.at?'Attacco +'+Math.round(d.at*100)+'%. ':'')+d.m+' minuti.<br>Serve: '+dshIn(d)+'</small><div class="g4"><button data-a="dco" data-v="'+d.id+'" '+(dshOk(d)&&st<10?'':'disabled')+'>Cucina</button><button data-a="dea" data-v="'+d.id+'" '+(st>0?'':'disabled')+'>Mangia</button></div></div>'}).join('')}
{const t0=V.t;V.t=()=>{const h=t0();return h.replace('<h2>Orto</h2>',cuHtml()+'<h2>Orto</h2>')}}
Object.assign(A,{
dco:id=>{const d=DSH.find(x=>x.id===id);S.dsh=S.dsh||{};if(!d||!dshOk(d)||(S.dsh[id]||0)>=10)return;
 Object.entries(d.in).forEach(([k,n])=>{if(k.slice(0,5)==='pesce'){const r=+k[5];let left=n;dshFish(r).forEach(f=>{const u=Math.min(left,S.inv[f]);S.inv[f]-=u;left-=u;if(!S.inv[f])delete S.inv[f]})}else{S.inv[k]-=n;if(!S.inv[k])delete S.inv[k]}});
 S.dsh[id]=(S.dsh[id]||0)+1;S.st.cuc=(S.st.cuc||0)+1;save();toast(d.n+' pronto.');render()},
dea:id=>{const d=DSH.find(x=>x.id===id);S.dsh=S.dsh||{};if(!d||!(S.dsh[id]>0))return;if(C)return toast('Non durante un combattimento.');if(S.buf&&NOW()<S.buf.t)return toast('Hai già un effetto attivo.');
 S.dsh[id]--;S.buf={hp:d.hp,at:d.at,t:NOW()+d.m*6e4};save();toast(d.n+': effetto per '+d.m+' minuti.');render()}});
