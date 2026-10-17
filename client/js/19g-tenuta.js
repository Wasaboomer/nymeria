/* Tenuta, fase 1: casa a livelli, orto a caselle fisse, bacheca dei trofei.
   Tutto a posizioni fisse (niente piazzamento libero). Le immagini dipinte potranno sostituire la scena in codice (TENIMG). */
const TH=[null,
{n:'Capanna',d:'Un tetto di paglia e un focolare. Basta per dormire.',pl:2,cost:[60,{}]},
{n:'Casa',d:'Muri in pietra, camino e un letto vero.',pl:3,cost:[250,{legno:30,minerale:10}]},
{n:'Dimora',d:'Due piani, finestre e un orto recintato.',pl:4,cost:[900,{asse:20,barra:15,tela:10}]},
{n:'Tenuta',d:'Casa grande, fienile e lanterna sul cancello.',pl:6,cost:[2500,{cuoio:20,acciaio:10,ebano:8}]}];
const TC={erba:{n:'Erbe di campo',s:'erba',y:5,m:20,c:8},legno:{n:'Alberello',s:'legno',y:6,m:45,c:12},tela:{n:'Lino',s:'tela',y:2,m:180,c:40}};
const TRF=['#8a4a3a','#8a4a3a','#6a6f78','#3f7a4a','#2f6f8a','#9aa8b8','#a8553a'];
const TRC={umano:'#8a4a3a',kharun:'#6a6f78',velhiri:'#3f7a4a',thalassi:'#2f6f8a',nivari:'#9aa8b8',draeth:'#a8553a'};
function tenS(){if(!S.ten)S.ten={lv:0,pl:[],rt:0};return S.ten}
function ftrack(k){S.fc=S.fc||{};if(!S.fc[k]){S.fc[k]=1;save()}}
function tMin(p){return Math.max(0,Math.ceil((p.t+TC[p.c].m*6e4-NOW())/6e4))}
function tScene(lv){const im=typeof TENIMG!=='undefined'&&TENIMG[(S.race||'umano')+'-'+Math.max(1,lv)];if(im)return'<img src="'+im+'" alt="'+TH[Math.max(1,lv)].n+'" style="width:100%;display:block;border:1px solid var(--bd);aspect-ratio:3/2;object-fit:cover">';const rc=TRC[S.race]||'#8a4a3a',L=Math.max(1,lv);
 const house=[
 '',
 '<path d="M110 118v-24l50-30 50 30v24z" fill="#6b5236"/><path d="M100 98l60-38 60 38z" fill="#c8b070"/><rect x="150" y="100" width="22" height="18" fill="#2a1f14"/>',
 '<rect x="105" y="84" width="110" height="36" fill="#8f8a7a"/><path d="M96 86l64-40 64 40z" fill="'+rc+'"/><rect x="190" y="52" width="12" height="22" fill="#6a6558"/><rect x="152" y="96" width="22" height="24" fill="#2a1f14"/><rect x="118" y="94" width="18" height="14" fill="#e8c86a"/><path d="M196 46c-4-8 6-10 2-18" stroke="#9a9384" fill="none" stroke-width="3" opacity=".6"/>',
 '<rect x="100" y="64" width="120" height="56" fill="#8f8a7a"/><rect x="100" y="90" width="120" height="3" fill="#6a6558"/><path d="M90 66l70-42 70 42z" fill="'+rc+'"/><rect x="196" y="30" width="12" height="20" fill="#6a6558"/><rect x="150" y="98" width="22" height="22" fill="#2a1f14"/><rect x="112" y="72" width="16" height="14" fill="#e8c86a"/><rect x="190" y="72" width="16" height="14" fill="#e8c86a"/><rect x="112" y="98" width="16" height="14" fill="#e8c86a"/><rect x="192" y="98" width="16" height="14" fill="#e8c86a"/>',
 '<rect x="70" y="72" width="90" height="48" fill="#8f8a7a"/><path d="M62 74l53-34 53 34z" fill="'+rc+'"/><rect x="170" y="56" width="110" height="64" fill="#7f7868"/><path d="M160 58l65-40 65 40z" fill="'+rc+'"/><rect x="215" y="26" width="12" height="18" fill="#6a6558"/><rect x="205" y="92" width="26" height="28" fill="#2a1f14"/><rect x="180" y="68" width="16" height="14" fill="#e8c86a"/><rect x="250" y="68" width="16" height="14" fill="#e8c86a"/><rect x="82" y="86" width="16" height="14" fill="#e8c86a"/><rect x="126" y="86" width="16" height="14" fill="#e8c86a"/><rect x="40" y="104" width="4" height="30" fill="#4a3a28"/><circle cx="42" cy="100" r="6" fill="#f0c860"/><circle cx="42" cy="100" r="11" fill="#f0c860" opacity=".25"/>'][L];
 return'<svg viewBox="0 0 320 150" role="img" aria-label="'+TH[L].n+'" style="width:100%;display:block;border:1px solid var(--bd)"><defs><linearGradient id="tsk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2433"/><stop offset="1" stop-color="#6a5a48"/></linearGradient></defs><rect width="320" height="150" fill="url(#tsk)"/><circle cx="268" cy="30" r="12" fill="#e9e2c8" opacity=".85"/><path d="M0 112q80-14 160 0t160 0v38H0z" fill="#2f3a28"/><rect y="120" width="320" height="30" fill="#3a4630"/>'+house+'<path d="M0 124h320" stroke="#4a5a3a" stroke-width="2"/></svg>'}
function tPlot(p,i){
 if(!p)return'<div class="card tpl"><svg viewBox="0 0 60 40" width="60" height="40"><rect x="4" y="14" width="52" height="22" fill="#4a3826"/><path d="M4 14h52" stroke="#6a5238"/></svg><small>Terra libera</small><button data-a="tpl" data-v="'+i+'">Semina</button></div>';
 const m=tMin(p),d=m===0,g=TC[p.c],f=Math.min(1,1-m/g.m);
 const st=d?3:f>.5?2:1,pl=st===1?'<path d="M30 28v-6M26 22l4-4 4 4" stroke="#6fbf73" stroke-width="2" fill="none"/>':st===2?'<path d="M30 28v-12M24 20l6-6 6 6M24 26l6-6 6 6" stroke="#6fbf73" stroke-width="2.4" fill="none"/>':'<path d="M30 28V8M22 16l8-8 8 8M22 24l8-8 8 8" stroke="#8fd16a" stroke-width="3" fill="none"/><circle cx="30" cy="8" r="4" fill="#e8c86a"/>';
 return'<div class="card tpl"><svg viewBox="0 0 60 40" width="60" height="40"><rect x="4" y="26" width="52" height="12" fill="#4a3826"/>'+pl+'</svg><small>'+g.n+'</small>'+(d?'<button data-a="tha" data-v="'+i+'">Raccogli ×'+g.y+'</button>':'<small>Pronto tra '+(m>=60?Math.floor(m/60)+' h '+(m%60)+' min':m+' min')+'</small>')+'</div>'}
function tTrophies(){const o=[];
 [['ch1','Luci nel Vespro','🕯️'],['ch2','Radici nere','🌲'],['ch3','La gabbia di luce','🔆'],['ch4','I popoli sapevano','📜']].forEach(([k,n,g])=>o.push([n,g,!!S[k]]));
 Object.keys(RARE).forEach(k=>o.push([RARE[k].n,'🐺',!!(S.rare&&S.rare[k])]));
 Object.keys(FISH).filter(k=>FISH[k].r>=1).forEach(k=>o.push([FISH[k].n,FISH[k].g,!!(S.fc&&S.fc[k])]));
 return o}
function tHtml(){const t=tenS(),lv=t.lv;
 if(!lv){const c=TH[1].cost;return'<h2>La tua Tenuta</h2><div class="card"><b>Un posto tuo</b><small>Un pezzo di terra dove tornare: una casa che cresce con te, un piccolo orto e una bacheca per i trofei. Costo: '+c[0]+' Corone. Si sblocca al livello 3.</small><button data-a="tup" '+(S.lv>=3&&S.g>=c[0]?'':'disabled')+'>Costruisci la capanna</button></div><button data-a="tab" data-v="u">Indietro</button>'}
 const h=TH[lv],nx=TH[lv+1],cd=t.rt&&NOW()<t.rt;
 let up='';if(nx){const c=nx.cost,ok=S.g>=c[0]&&Object.entries(c[1]).every(([k,n])=>(S.inv[k]||0)>=n);
  up='<div class="card"><b>Migliora: '+nx.n+'</b><small>'+nx.d+' '+nx.pl+' caselle di orto.<br>Costo: '+c[0]+' Corone'+Object.entries(c[1]).map(([k,n])=>', '+n+' '+(MN[k]||k)+' ('+(S.inv[k]||0)+')').join('')+'</small><button data-a="tup" '+(ok?'':'disabled')+'>Costruisci</button></div>'}
 const tr=tTrophies(),got=tr.filter(x=>x[2]).length,has=tr.some(x=>x[2]);
 return'<h2>'+h.n+'</h2>'+tScene(lv)+'<small class="mu">'+h.d+'</small>'+
 '<div class="card"><b>Focolare</b><small>Riposa un po’ accanto al fuoco: per 30 minuti hai più vita e più attacco. Si può fare ogni 2 ore.</small><button data-a="trs" '+(cd||(S.buf&&NOW()<S.buf.t)?'disabled':'')+'>'+(cd?'Riposerai di nuovo tra '+Math.ceil((t.rt-NOW())/6e4)+' min':'Riposa')+'</button></div>'+
 '<h2>Orto</h2><div class="g4">'+Array.from({length:h.pl},(_,i)=>tPlot(t.pl[i],i)).join('')+'</div>'+
 (t.pl.some((p,i)=>p&&i<h.pl&&tMin(p)===0)?'<button data-a="thall">Raccogli tutto</button>':'')+
 up+'<h2>Bacheca dei trofei</h2><small class="mu">'+got+' su '+tr.length+'. Si riempie con le creature rare, i capitoli e i pesci più preziosi.</small><div class="trg">'+tr.map(x=>'<div class="trq'+(x[2]?' on':'')+'" title="'+(x[2]?x[0]:'Ancora da ottenere')+'"><span>'+(x[2]?x[1]:'?')+'</span><small>'+(x[2]?x[0]:'—')+'</small></div>').join('')+'</div>'+
 '<button data-a="tab" data-v="u">Indietro</button>'}
V.t=tHtml;
{const u0=V.u;V.u=()=>{const r=u0(),t=S.ten&&S.ten.lv;return r.replace('<h2>Menu</h2>','<h2>Menu</h2><div class="card"><b>La tua Tenuta</b><small>'+(t?TH[t].n+': orto, focolare e trofei.':'Casa, orto e trofei. Si sblocca al livello 3.')+'</small><button data-a="tab" data-v="t">Vai alla Tenuta</button></div>')}}
Object.assign(A,{
tup:()=>{const t=tenS(),n=TH[t.lv+1];if(!n)return;const c=n.cost;if(!t.lv&&S.lv<3)return toast('Serve il livello 3.');if(S.g<c[0]||!Object.entries(c[1]).every(([k,q])=>(S.inv[k]||0)>=q))return toast('Mancano risorse.');S.g-=c[0];Object.entries(c[1]).forEach(([k,q])=>{S.inv[k]-=q;if(!S.inv[k])delete S.inv[k]});t.lv++;save();toast(n.n+' costruita.');render()},
tpl:i=>{ask('Cosa semini?',Object.keys(TC).map(k=>{const c=TC[k];return[c.n+' · '+c.c+' Corone','Dopo '+(c.m>=60?c.m/60+' h':c.m+' min')+' raccogli '+c.y+' × '+MN[c.s],()=>{if(S.g<c.c)return toast('Corone insufficienti.');const t=tenS();S.g-=c.c;t.pl[+i]={c:k,t:NOW()};save();render()}]}).concat([['Annulla','',()=>{}]]))},
tha:i=>{const t=tenS(),p=t.pl[+i];if(!p||tMin(p))return;const g=TC[p.c];inv(g.s,g.y);t.pl[+i]=null;save();toast('Raccolto: '+g.y+' × '+MN[g.s]);render()},
thall:()=>{const t=tenS();let n=0;t.pl.forEach((p,i)=>{if(p&&i<TH[t.lv].pl&&!tMin(p)){const g=TC[p.c];inv(g.s,g.y,1);t.pl[i]=null;n++}});save();toast('Raccolte '+n+' caselle.');render()},
trs:()=>{const t=tenS();if(t.rt&&NOW()<t.rt||S.buf&&NOW()<S.buf.t)return;S.buf={hp:.03*t.lv,at:.02*t.lv,t:NOW()+30*6e4};t.rt=NOW()+2*36e5;save();toast('Ti senti riposato.');render()}});
setInterval(()=>{if(S&&T==='t'&&ov.hidden)render()},30000);
