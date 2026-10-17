/* PESCA: minigioco a tempismo. Lancia, aspetta che abbocchi, tira al momento giusto, poi recupera con tre colpi a segno. */
const FISH={trota:{n:'Trota di torrente',r:0,p:4,g:'🐟',lv:1,w:50},carpa:{n:'Carpa grigia',r:0,p:5,g:'🐟',lv:1,w:40},luccio:{n:'Luccio',r:1,p:9,g:'🐠',lv:2,w:20},anguilla:{n:'Anguilla della palude',r:1,p:8,g:'🐍',lv:2,w:30},lanterna:{n:'Pesce lanterna',r:2,p:22,g:'🐡',lv:4,w:8},dorata:{n:'Carpa dorata',r:3,p:50,g:'✨',lv:6,w:2}};
const SP={b:['trota','carpa','luccio','dorata'],sc:['trota','carpa','lanterna','dorata'],se:['anguilla','lanterna','luccio','dorata']};
Object.keys(FISH).forEach(k=>{MN[k]=FISH[k].n;MRAR[k]=FISH[k].r;MG[k]=FISH[k].g;PRICE[k]=FISH[k].p});
GN.pesca='Pescatore';
ACH.push({id:'pesca',n:'Pescatore',d:'Pesca pesci',c:()=>S.st.pesca||0,t:[[10,20],[40,60],[120,150]]});
let FG=null,FT=0;
const fstop=()=>{clearTimeout(FT);clearInterval(FT);FT=0};
function fpick(){const lv=lvG('pesca'),l=SP[S.loc].filter(k=>FISH[k].lv<=lv),t=l.reduce((a,k)=>a+FISH[k].w,0);let x=rnd()*t;for(const k of l){x-=FISH[k].w;if(x<=0)return k}return l[0]}
const fpos=()=>{const t=(Date.now()-FG.t0)/1000;return Math.abs(((t*FG.sp)%2)-1)};
function fzone(){FG.zc=.22+rnd()*.56}
function fpanel(){if(!FG)FG={st:'idle',hit:0,lives:3};const L=LC[S.loc],lv=lvG('pesca'),F=FG.fish&&FISH[FG.fish];GP=0;ov.hidden=false;
 const xpn=Math.pow(lv,2)*8,body=FG.st==='idle'?'<button data-a="fc">Lancia la lenza</button>':
  FG.st==='wait'?'<div class="card" style="text-align:center"><div style="font-size:42px">🎣</div><p class="mu">La lenza è in acqua… aspetta che qualcosa abbocchi.</p></div><button data-a="fx">Ritira la lenza</button>':
  FG.st==='bite'?'<div class="card" style="text-align:center;border-color:#e0b050"><div style="font-size:42px">❗</div><b>Abbocca!</b></div><button data-a="ftap" style="font-size:20px;padding:18px">TIRA!</button>':
  '<div class="card"><b>'+(F?F.n:'Qualcosa di grosso')+'</b><small>Tocca Recupera quando il segno bianco è nella zona verde.</small><div class="fbar"><i class="fz" style="left:'+((FG.zc-FG.zw/2)*100)+'%;width:'+(FG.zw*100)+'%"></i><b class="fm" id="fm"></b></div><small>Presa '+'●'.repeat(FG.hit)+'○'.repeat(3-FG.hit)+' · Lenza '+'♥'.repeat(FG.lives)+'♡'.repeat(3-FG.lives)+'</small></div><button data-a="frec" style="font-size:20px;padding:18px">Recupera!</button>';
 ov.innerHTML='<div class="sheet"><h2>Pesca · '+L.n+'</h2><small>Pescatore livello '+lv+' · esperienza '+(S.gx.pesca||0)+' / '+xpn+'</small>'+body+(FG.msg&&FG.st==='idle'?'<div class="card" role="status">'+FG.msg+'</div>':'')+'<button data-a="fz">Chiudi</button></div>'}
Object.assign(A,{
 fp:()=>{fstop();FG=null;fpanel()},
 fz:()=>{fstop();FG=null;ov.hidden=true;render()},
 fx:()=>{fstop();FG={st:'idle',hit:0,lives:3,msg:'Hai ritirato la lenza.'};fpanel()},
 fc:()=>{fstop();FG={st:'wait',hit:0,lives:3};fpanel();FT=setTimeout(()=>{if(!FG||FG.st!=='wait')return;FG.fish=fpick();const r=FISH[FG.fish].r;FG.st='bite';fpanel();FT=setTimeout(()=>{if(FG&&FG.st==='bite'){FG={st:'idle',hit:0,lives:3,msg:'Il pesce è scappato: hai tirato troppo tardi.'};fpanel()}},1400-r*180)},1500+rnd()*2600)},
 ftap:()=>{if(!FG||FG.st!=='bite')return;fstop();const r=FISH[FG.fish].r;FG.st='fight';FG.t0=Date.now();FG.sp=1.0+r*.4;FG.zw=Math.max(.16,Math.min(.55,(.36-r*.05+(lvG('pesca')-1)*.012)*(S.race==='thalassi'?1.15:1)));fzone();fpanel();FT=setInterval(()=>{const m=$('#fm');if(!m||!FG||FG.st!=='fight'){fstop();return}m.style.left='calc('+(fpos()*100)+'% - 3px)'},30)},
 frec:()=>{if(!FG||FG.st!=='fight')return;const ok=Math.abs(fpos()-FG.zc)<=FG.zw/2;if(ok)FG.hit++;else FG.lives--;
  if(FG.hit>=3){fstop();const k=FG.fish,F=FISH[k],lv0=lvG('pesca');let msg;if(room(k)){inv(k,1);ftrack(k);qprog('gat',k,1);S.st.pesca=(S.st.pesca||0)+1;const xp=4+4*F.r;S.gx.pesca=(S.gx.pesca||0)+xp;msg='Hai pescato: '+F.n+'! Esperienza Pescatore +'+xp+(lvG('pesca')>lv0?'. Sali al livello '+lvG('pesca')+' di Pescatore!':'.')}else msg='Borsa dei materiali piena: il pesce torna in acqua.';save();FG={st:'idle',hit:0,lives:3,msg};return fpanel()}
  if(FG.lives<=0){fstop();FG={st:'idle',hit:0,lives:3,msg:'La lenza si è spezzata e il pesce è scappato.'};return fpanel()}
  fzone();fpanel()}});
QD.push(
{id:'pf1',t:'La cena di Dorn',giver:'dorn',ty:'gat',tg:'carpa',n:3,x:60,g:16,elv:3,min:2,tx:'Dorn ti guarda i piedi bagnati e sbuffa: «Il torrente sotto il ponte è pieno di carpe, ma io non ho tempo di stare fermo con una lenza. Pescamene tre e non dire a nessuno che mi hai visto cucinare.»',dn:'Dorn annusa il pesce e quasi sorride. «Niente male. Per stavolta il pedaggio lo salto.»'},
{id:'pf2',t:'Pesce per il Ponte',giver:'pell',ty:'gat',tg:'trota',n:3,x:70,g:18,elv:3,min:3,tx:'Chi lavora sulle liane ha fame. Sotto il Ponte di Liane vivono trote chiare: pescamene tre e dividiamo il pranzo.',dn:'Pell dispone le trote sulle foglie larghe. «Mangiamo con le mani, qui. Sei dei nostri.»'});
