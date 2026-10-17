/* RACCOLTA: nodi personali con cariche e rigenerazione a tempo assoluto (Date.now), che scorre anche offline. */
const MR={minerale:0,erba:0,legno:0,ferro_puro:2,ebano:1,frammento:2},RAR=['Comune','Non comune','Raro','Epico','Leggendario'],GN={minerale:'Minatore',erba:'Erborista',legno:'Boscaiolo'};
const MN={acciaio:'Acciaio del Vespro',minerale:'Minerale',erba:'Erbe',legno:'Legno',pelle:'Pelle',barra:'Barre di ferro',asse:'Assi',tela:'Tela',cuoio:'Cuoio',p_vig:'Elisir di vigore',p_fer:'Elisir di ferocia',p_cus:'Elisir del custode',ferro_puro:'Ferro puro',ebano:'Ebano scuro',frammento:'Frammento antico'};
PRICE.ferro_puro=18;PRICE.acciaio=40;PRICE.ebano=10;PRICE.frammento=25;
const ND=[
{id:'c1',loc:'c',n:'Vena di ferro',k:'minerale',m:'minerale',g:1,lv:1,ch:3,d:20,y:1},
{id:'c2',loc:'c',n:'Vena di ferro del Vespro',k:'minerale',m:'ferro_puro',g:2,lv:3,ch:2,d:45,y:1},
{id:'f1',loc:'f',n:'Radura delle erbe',k:'erba',m:'erba',g:1,lv:1,ch:3,d:15,y:1},
{id:'f2',loc:'f',n:'Alberi della boscaglia',k:'legno',m:'legno',g:1,lv:1,ch:3,d:20,y:1},
{id:'f3',loc:'f',n:'Ebano scuro',k:'legno',m:'ebano',g:2,lv:3,ch:2,d:40,y:1},
{id:'u1',loc:'u',n:'Filone tra le rovine',k:'minerale',m:'minerale',g:1,lv:1,ch:2,d:25,y:1},
{id:'u2',loc:'u',n:'Frammenti antichi',k:'minerale',m:'frammento',g:2,lv:4,ch:1,d:60,y:1},
{id:'g1',loc:'g',n:'Vena di Karuun',k:'minerale',m:'minerale',g:1,lv:1,ch:3,d:15,y:1},
{id:'g2',loc:'g',n:'Cuore di ferro puro',k:'minerale',m:'ferro_puro',g:2,lv:3,ch:2,d:45,y:1},
{id:'k1',loc:'k',n:'Vena della Forgia',k:'minerale',m:'minerale',g:1,lv:1,ch:3,d:20,y:1},
{id:'sa1',loc:'sa',n:'Erbe della radura',k:'erba',m:'erba',g:1,lv:1,ch:3,d:15,y:1},
{id:'sb1',loc:'sb',n:'Rami caduti',k:'legno',m:'legno',g:1,lv:1,ch:3,d:20,y:1},
{id:'sc1',loc:'sc',n:'Legno vivo del ponte',k:'legno',m:'legno',g:1,lv:1,ch:3,d:20,y:1},
{id:'sc2',loc:'sc',n:'Ebano delle liane',k:'legno',m:'ebano',g:2,lv:3,ch:2,d:40,y:1},
{id:'gh1',loc:'gh',n:'Vene di minerale nero',k:'minerale',m:'minerale',g:1,lv:3,ch:3,d:25,y:1},
{id:'gi1',loc:'gi',n:'Filoni delle grandi forge',k:'minerale',m:'minerale',g:1,lv:3,ch:3,d:30,y:1},
{id:'sd1',loc:'sd',n:'Erbe dell’Albero Madre',k:'erba',m:'erba',g:1,lv:2,ch:3,d:25,y:1},
{id:'se1',loc:'se',n:'Funghi luminosi',k:'erba',m:'erba',g:1,lv:1,ch:3,d:15,y:1},
{id:'k2',loc:'k',n:'Filone riscaldato',k:'minerale',m:'ferro_puro',g:2,lv:3,ch:2,d:40,y:1}];
const NOW=()=>{const t=Math.max(Date.now(),S.lt||0);S.lt=t;return t};
const hs=t=>{let h=2166136261;for(const c of t)h=Math.imul(h^c.charCodeAt(0),16777619);return(h>>>0)/4294967296};
const lvG=k=>1+Math.floor(Math.sqrt((S.gx[k]||0)/8));
const tier=k=>S.tools[k]||0;
function nodesAt(loc){const a=ND.filter(n=>n.loc===loc);if(S.hv&&S.hv.loc===loc){const st=S.nd[S.hv.id];if(NOW()<S.hv.exp&&(!st||st.c>0)){const b=a.find(n=>MR[n.m]>=1);if(b)a.push({id:S.hv.id,loc,n:'Filone nascosto',k:b.k,m:b.m,g:1,lv:1,ch:2,d:0,y:2,hid:1})}}return a}
function nst(n){const t=NOW();let st=S.nd[n.id];if(!st)st={c:n.ch,t:0,y:0,cl:1};if(st.c<=0&&!n.hid&&t>=st.t){st.c=n.ch;st.y++;st.cl=1;st.t=0}return st}
function nstate(n){const st=nst(n);if(tier(n.k)<n.g)return['lock',tier(n.k)===0?'Serve il '+TOOL[n.k][0]+': lo vende Brann a Veyra':'Richiede '+TOOL[n.k][0]+(n.g>=2?' II':''),st];if(lvG(n.k)<n.lv)return['lock','Richiede '+GN[n.k]+' livello '+n.lv+' (ora '+lvG(n.k)+')',st];if(st.c<=0)return['out','Esaurito · tra '+Math.max(1,Math.ceil((st.t-NOW())/60000))+' min',st];return['ok','Disponibile',st]}
function questNeeds(m){return QD.some(q=>S.q[q.id]===1&&q.ty==='gat'&&q.tg===m&&S.qp[q.id]<q.n)}
function doGather(id,mode){const n=nodesAt(S.loc).find(x=>x.id===id);if(!n)return;const[stt,,st]=nstate(n);
 if(mode==='scarti'){if(!(MR[n.m]===0&&stt==='out'&&questNeeds(n.m)))return;if(!room(n.m)){GM='Borsa dei materiali piena: fai spazio.';return gatherPanel()}inv(n.m,1);qprog('gat',n.m,1);GM='Raccogli scarti per la missione: '+MN[n.m]+' ×1.';save();return gatherPanel()}
 if(stt!=='ok')return;if(!room(n.m)){GM='Borsa dei materiali piena: vendi o usa qualcosa per fare spazio.';return gatherPanel()}const lv0=lvG(n.k),last=st.c===1;let amt,txt;
 if(mode==='fondo'){st.cl=0;if(rnd()<.3){amt=0;txt='La parete cede: la carica è perduta e non ottieni nulla.'}else{amt=n.y*2;txt=MN[n.m]+' ×'+amt+' (scavo a fondo).'}}
 else{amt=n.y+(rnd()<.3+(S.race==='velhiri'&&(n.k==='erba'||n.k==='legno')?.15:0)+(S.race==='draeth'&&MR[n.m]>=2?.15:0)?1:0);txt=MN[n.m]+' ×'+amt+'.';if(last&&st.cl&&!n.hid){amt++;txt=MN[n.m]+' ×'+amt+' (ultima carica pulita +1).'}}
 st.c--;if(st.c<=0&&!n.hid)st.t=NOW()+Math.round(n.d*60000*(.85+.3*hs(n.id+':'+st.y)));
 S.nd[n.id]=st;const xp=amt?4+3*MR[n.m]:2;S.gx[n.k]=(S.gx[n.k]||0)+xp;if(amt){amt=inv(n.m,amt);qprog('gat',n.m,amt);qa('gat',amt)}
 GM=txt+' Esperienza '+GN[n.k]+' +'+xp+(lvG(n.k)>lv0?'. Sali al livello '+lvG(n.k)+' di '+GN[n.k]+'!':'.');save();gatherPanel()}
function gatherPanel(keep){const sc=ov.querySelector('.sheet'),y=sc?sc.scrollTop:0;GP=1;const L=LC[S.loc],ns=nodesAt(S.loc);
 ov.hidden=false;ov.innerHTML='<div class="sheet"><h2>Raccolta · '+L.n+'</h2><small>Il tempo scorre anche quando sei offline: i nodi si rigenerano da soli.</small>'+ns.map(n=>{const[stt,tx,st]=nstate(n),r=MR[n.m];
  const pips=Array.from({length:n.ch},(_,i)=>i<st.c?'●':'○').join(' ');
  const act=stt==='ok'?'<div class="sk"><button data-a="gn" data-v="'+n.id+'|pru">Prudente</button><button data-a="gn" data-v="'+n.id+'|fon">A fondo</button></div><small>Prudente: resa sicura, bonus all’ultima carica se non scavi a fondo. A fondo: resa doppia, 30% di crollo.</small>':
   stt==='out'&&MR[n.m]===0&&questNeeds(n.m)?'<button data-a="gn" data-v="'+n.id+'|scarti">Raccogli scarti (missione)</button>':'';
  return'<div class="card nd r'+r+' '+stt+'"><div class="row"><div><b>'+n.n+'</b><small>'+RAR[r]+' · '+MN[n.m]+' · grado '+(n.g===2?'II':'I')+'</small></div><span aria-label="cariche" style="letter-spacing:2px">'+pips+'</span></div><small>'+(stt==='lock'?'🔒 ':stt==='out'?'⏳ ':'✔ ')+tx+(n.hid?' · sparisce tra '+Math.max(1,Math.ceil((S.hv.exp-NOW())/60000))+' min':'')+'</small>'+act+'</div>'}).join('')+
  (SP[S.loc]?'<div class="card"><b>Punto di pesca</b><small>Tempismo e pazienza. Livello Pescatore '+lvG('pesca')+'.</small><button data-a="fp">Vai a pescare</button></div>':'')+(GM?'<div class="card" role="status">'+GM+'</div>':'')+'<small>Livelli: '+['minerale','erba','legno','pesca'].map(k=>GN[k]+' '+lvG(k)).join(' · ')+'</small><button data-a="ok">Chiudi</button></div>';
 const ns2=ov.querySelector('.sheet');if(keep&&ns2)ns2.scrollTop=y}
function gather(){GM='';gatherPanel()}
