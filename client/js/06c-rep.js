/* Reputazioni: sei fazioni, cinque gradi */
const FZ={lant:{n:'Guardia delle Lanterne',pp:'Umani',rg:'vespro',c:'#e0b050',d:'Custodi e capitani che tengono accese le lanterne.',it:['a6','a7']},
forg:{n:'Clan della Forgia',pp:'Kharun',rg:'karuun',c:'#d0702a',d:'I forgiatori delle Gole di Karuun.',it:['a8','a9']},
liane:{n:'Cerchio delle Liane',pp:'Velhiri',rg:'selva',c:'#5aa56a',d:'Gli ascoltatori della Selva dei Mille Anelli.',it:['a10','a11']},
maree:{n:'Flotta delle Maree',pp:'Thalassi',rg:'mare',c:'#4a90d9',d:'Marinai dell’Arcipelago di Marea.',wip:1},
brina:{n:'Gente della Brina',pp:'Nivari',rg:'neve',c:'#9ac8e0',d:'Cacciatori delle Distese Gelate.',wip:1},
cenere:{n:'Figli della Cenere',pp:'Draeth',rg:'cenere',c:'#c0503a',d:'Il popolo di Cenere di Draeth.',wip:1}};
const FRG={vespro:'lant',karuun:'forg',selva:'liane',mare:'maree',neve:'brina',cenere:'cenere'},FRC={umano:'lant',kharun:'forg',velhiri:'liane'};
const GRD=[['Sconosciuto',0,'Solo le missioni di base'],['Conosciuto',500,'Missioni della fazione e −3% ai prezzi del luogo'],['Amico',1500,'Missioni con scelta e −5% ai prezzi del luogo'],['Onorato',3500,'Un’armatura della fazione, di grado blu'],['Venerato',7000,'Un’armatura unica della fazione e −10% ai prezzi del luogo']],DSC=[0,.03,.05,.05,.10];
const repPts=f=>(S.rep&&S.rep[f])||0,repGr=f=>{const p=repPts(f);let g=0;GRD.forEach((x,i)=>{if(p>=x[1])g=i});return g};
function qFz(q){if(q.fz)return q.fz;const l=npcLoc(q.giver);return l&&LC[l]?FRG[LC[l].rg]:null}
const qRp=q=>q.rp!==undefined?q.rp:Math.max(10,Math.round((q.x||0)*.5));
function repAdd(f,n){if(!FZ[f]||!n)return'';S.rep=S.rep||{};const a=repGr(f),p0=repPts(f);S.rep[f]=n<0?Math.max(p0+n,a>=1?500:0,Math.min(p0,0)):p0+n;const b=repGr(f);
 if(b>a)setTimeout(()=>toast(FZ[f].n+': ora sei '+GRD[b][0]+'.'),400);return' '+(n>0?'+':'−')+Math.abs(n)+' reputazione ('+FZ[f].n+')'}
function repQuest(q){const f=qFz(q);if(!f||S.done['r_'+q.id])return'';S.done['r_'+q.id]=1;return repAdd(f,qRp(q))}
function ensureRep(){if(!S||!S.q||S.rv)return;S.rep=S.rep||{};QD.forEach(q=>{if(S.q[q.id]===2&&!S.done['r_'+q.id]){S.done['r_'+q.id]=1;const f=qFz(q);if(f)S.rep[f]=repPts(f)+qRp(q)}});
 const o=FRC[S.race];if(o)S.rep[o]=Math.max(repPts(o),500);S.rv=1;save()}
const repDisc=()=>{const f=LC[S.loc]&&FRG[LC[S.loc].rg];return f?DSC[repGr(f)]:0},px=n=>Math.max(1,Math.round(n*(1-repDisc())));
function repClaim(f){const F=FZ[f],g=repGr(f);S.rc=S.rc||{};const i=g>=4&&!S.rc[f+4]?1:g>=3&&!S.rc[f+3]?0:-1;if(!F||i<0)return;S.rc[f+(i?4:3)]=1;const u=giveItem(F.it[i],{q:i?3:2,vr:0});save();render();show('Hai ricevuto un premio dalla fazione.'+dropNote(u))}
function repHtml(){const own=FRC[S.race];let h='<h2>Reputazioni</h2><small>Aiuta i popoli con le missioni per salire di grado: ogni grado dà un premio. Non scendi mai sotto «Conosciuto» col tuo popolo.</small>';
 Object.keys(FZ).sort((a,b)=>(b===own)-(a===own)||(!!FZ[a].wip-!!FZ[b].wip)).forEach(f=>{const F=FZ[f],p=repPts(f),g=repGr(f),n=GRD[g+1],lo=GRD[g][1],pc=n?Math.round((p-lo)/(n[1]-lo)*100):100;
  const cl=(g>=3&&!(S.rc||{})[f+3])||(g>=4&&!(S.rc||{})[f+4]);
  h+='<div class="card"'+(F.wip?' style="opacity:.5;border-style:dashed"':'')+'><div class="row"><div><b style="color:'+F.c+'">'+F.n+'</b><small>'+F.pp+(F.wip?' · regione in preparazione':'')+'</small></div><b>'+GRD[g][0]+'</b></div>'+
  (F.wip?'':'<div class="bar"><i style="width:'+pc+'%;background:'+F.c+'"></i></div><small>'+(n?p+' / '+n[1]+' · prossimo: '+n[0]+' ('+n[2]+')':'Grado massimo · '+p+' punti')+'</small>'+
  (cl?'<button data-a="rcl" data-v="'+f+'">Ritira il premio</button>':''))+'</div>'});return h}
