// ---- Registro delle missioni: orientarsi tra missioni, luoghi e tempi di viaggio ----
let PIN=null;
const npcLoc=id=>Object.keys(LC).find(k=>(LC[k].np||[]).includes(id)),npcN=id=>NPC[id].split(',')[0];
function travSec(to){const f=S.tr?S.tr.to:S.loc;if(f===to)return 0;const d={[f]:0},qu=[f];while(qu.length){const c=qu.shift();for(const [n,t] of nb(c)){if(!(n in d)){d[n]=d[c]+t;if(n===to)return d[n];qu.push(n)}}}return null}
function qAvail(){return QD.filter(q=>!S.q[q.id]&&(!q.pre||S.q[q.pre]===2)&&(!q.rc||q.rc===S.race)&&(!q.fr||repGr(q.fr[0])>=q.fr[1])&&!(q.giver==='serah'&&ORG[S.race]&&S.q[ORG[S.race]]!==2)&&(!q.rqa||q.rqa.every(k=>S.fl[k]))&&(!q.rq||Object.entries(q.rq).every(([k,v])=>S.fl[k]===v)))}
function qStep(q){const L=LC[S.loc],here=id=>(L.np||[]).includes(id),ready=q.ty!=='talk'&&S.qp[q.id]>=q.n;
 const pr=q.ty==='talk'?'Parla con '+npcN(q.tg):(q.ty==='kill'?M[q.tg].n:q.ty==='obs'?'Osservazioni':MN[q.tg]||q.tg)+': '+S.qp[q.id]+'/'+q.n;let b,at;
 if(ready){at=npcLoc(q.giver);b=here(q.giver)?['talk',q.giver,'Consegna a '+npcN(q.giver)]:['goq',at,'Torna da '+npcN(q.giver)]}
 else if(q.ty==='talk'){at=npcLoc(q.tg);b=here(q.tg)?['talk',q.tg,'Parla con '+npcN(q.tg)]:['goq',at,'Raggiungi '+npcN(q.tg)]}
 else if(q.boss){at=q.at;b=S.loc===at?['boss',q.id,'Sfida '+M[q.tg].n]:['goq',at,'Raggiungi '+LC[at].n]}
 else if(q.ty==='obs'){at=q.tg;b=S.loc===at?['obs','','Osserva '+OL[at]]:['goq',at,'Raggiungi '+LC[at].n]}
 else if(q.ty==='kill'){at=(L.mb||[]).includes(q.tg)?S.loc:Object.keys(LC).filter(k=>!LC[k].wip&&(LC[k].mb||[]).includes(q.tg)).sort((a,c)=>(travSec(a)??999)-(travSec(c)??999))[0];b=at===S.loc?['qf',q.tg,'Combatti '+M[q.tg].n]:['goq',at,'Cerca '+M[q.tg].n]}
 else{const nd=ND.find(n=>n.m===q.tg),tk=nd&&nd.k;
  if(tk&&!S.tools[tk]){at=npcLoc('brann');b=here('brann')?['talk','brann','Compra il '+TOOL[tk][0]+' da Brann']:['goq',at,'Vai da Brann: serve il '+TOOL[tk][0]]}
  else{at=nodesAt(S.loc).some(n=>n.m===q.tg)?S.loc:(ND.filter(n=>n.m===q.tg&&!LC[n.loc].wip).map(n=>n.loc).sort((a,c)=>(travSec(a)??999)-(travSec(c)??999))[0]);b=at===S.loc?['gat','','Raccogli '+(MN[q.tg]||q.tg)]:['goq',at,'Cerca '+(MN[q.tg]||q.tg)]}}
 return{pr,b,at,ready}}
const qTag=q=>q.main?'Storia principale':q.origin?'Origine':(()=>{const l=npcLoc(q.giver);return l&&RG[LC[l].rg]?RG[LC[l].rg].n:'Secondaria'})();
const qDiff=q=>{const d=(q.elv||q.min||1)-S.lv;return d<=-3?['#8a8a8a','banale']:d<=-1?['#5fd08a','facile']:d<=1?['#e8c34a','alla pari']:d<=2?['#e08a3a','difficile']:['#e0524a','molto difficile']};
function qRew(q){const f=fac(q.elv);return'+'+Math.round(q.x*f)+' XP, +'+Math.round(q.g*f)+' Corone'+(q.bag?', +'+q.bag+' slot zaino':'')+(qFz(q)?', +'+qRp(q)+' reputazione':'')}
const qAct=()=>QD.filter(q=>S.q[q.id]===1);
function tkList(){const a=qAct().map(q=>q.id);if(!Array.isArray(S.tk))return a.slice(0,3);return S.tk.filter(i=>a.includes(i)).slice(0,3)}
function trkAdd(id){const a=tkList().filter(i=>i!==id);a.push(id);S.tk=a.slice(-3)}
function trkTog(id){const a=tkList();if(a.includes(id))S.tk=a.filter(i=>i!==id);else trkAdd(id);save();render()}
function trackHtml(){const m=mq(),l=tkList().map(i=>QD.find(q=>q.id===i)).filter(q=>q&&(!m||q.id!==m.id));if(!l.length)return'';
 return'<div class="card"><div class="lb"><span>Missioni seguite</span></div>'+l.map(q=>{const s=qStep(q),t=s.at?travSec(s.at):null,fr=s.at&&LC[s.at]?LC[s.at].n+(t?' · '+t+' s':' · qui'):'';
  return'<div class="card row tkr"><div><b style="color:'+qDiff(q)[0]+'">'+q.t+'</b><small>'+(s.ready?'✔ Pronta · ':'')+s.pr+(fr?' · '+fr:'')+'</small><small>→ '+s.b[2]+'</small></div><button data-a="'+s.b[0]+'"'+(s.b[1]?' data-v="'+s.b[1]+'"':'')+(S.tr?' disabled':'')+'>'+({goq:'Vai',talk:'Parla',qf:'Combatti',gat:'Raccogli',boss:'Sfida',obs:'Osserva'})[s.b[0]]+'</button></div>'}).join('')+'</div>'}
function qPins(){const p={},add=(l,c)=>{if(l&&LC[l]&&!LC[l].wip){p[l]=p[l]||[];if(!p[l].includes(c))p[l].push(c)}};qAvail().forEach(q=>{if(S.lv>=q.min)add(npcLoc(q.giver),'!')});qAct().forEach(q=>{const s=qStep(q);if(s.ready||q.ty==='talk')add(s.at,'?');else add(s.at,'o')});if(PIN)add(PIN,'p');return p}
function logHtml(){const act=qAct(),tk=tkList(),av=qAvail().filter(q=>S.lv>=q.min-1);
 const card=(q,k)=>{const s=k==='a'?qStep(q):null,dc=qDiff(q),loc=k==='a'?s.at:npcLoc(q.giver),t=loc?travSec(loc):null,low=S.lv<q.min;
  return'<div class="card"><b style="color:'+dc[0]+'">'+q.t+'</b><small>'+qTag(q)+' · liv. '+(q.elv||q.min)+' · '+dc[1]+'</small>'+
  (k==='a'?'<small>'+(s.ready?'✔ Pronta · ':'')+s.pr+'</small>':'<small>'+(low?'Richiede il livello '+q.min:'Ottienila da '+npcN(q.giver))+'</small>')+
  (loc&&LC[loc]?'<small>Dove: '+LC[loc].n+(t?' · '+t+' s di viaggio':' · sei qui')+'</small>':'')+'<small>Ricompensa: '+qRew(q)+'</small>'+
  '<div class="brow">'+(loc&&loc!==S.loc?'<button data-a="goq" data-v="'+loc+'">Mostra sulla mappa</button>':'')+(k==='a'?'<button data-a="trk" data-v="'+q.id+'">'+(tk.includes(q.id)?'Non seguire':'Segui')+'</button>':'')+'</div></div>'};
 return'<h2>Missioni attive ('+act.length+')</h2><small>Puoi seguirne fino a tre: compaiono nella schermata del Mondo.</small>'+(act.length?act.sort((a,b)=>(b.main?2:b.origin?1:0)-(a.main?2:a.origin?1:0)).map(q=>card(q,'a')).join(''):'<p class="mu">Nessuna missione attiva.</p>')+
 '<h2>Disponibili ('+av.length+')</h2><small>Sulla mappa: ! giallo = qualcuno ha una missione per te; ? azzurro = da consegnare; rombo bianco = dove portano le missioni attive.</small>'+(av.length?av.map(q=>card(q,'v')).join(''):'<p class="mu">Per ora niente: sali di livello o completa le missioni attive.</p>')}
