// ---- Mondo ----
const LC={
v:{rg:'vespro',n:'Veyra',x:50,y:12,pal:['#5a3a2c','#1a1216'],t:'town',d:'Mura, torri e lanterne al crepuscolo. L’ultimo avamposto prima delle terre aperte.',np:['serah','brann'],forge:1},
p:{rg:'vespro',n:'Strada nebbiosa',x:30,y:28,pal:['#3a4256','#12151c'],t:'road',d:'Una strada tra gli alberi, nella nebbia.'},
r:{rg:'vespro',n:'Riparo lungo la strada',x:12,y:42,pal:['#4a3a28','#16120d'],t:'hut',d:'Un rifugio caldo di pietra e legno, con una lanterna maestra sul tetto.',np:['mira']},
b:{rg:'vespro',n:'Vecchio Ponte',x:30,y:58,pal:['#27414a','#0d1519'],t:'bridge',d:'Un ponte di pietra sul torrente scuro.',mb:['lupo'],np:['dorn']},
f:{rg:'vespro',n:'Bosco delle Lanterne Spente',x:56,y:40,pal:['#24402f','#0a1410'],t:'forest',d:'Un bosco fitto, con lanterne appese ai pali: nessuna è più accesa. Tra le felci qualcosa si muove.',mb:['lupo','ragno','seguace'],np:['eldra'],gat:['erba','legno']},
c:{rg:'vespro',n:'Cava abbandonata',x:82,y:52,pal:['#3a3a44','#0c0c10'],t:'cave',d:'Gallerie umide con vene di ferro.',mb:['ragno','brig'],gat:['minerale']},
u:{rg:'vespro',n:'Rovine del Vespro',x:58,y:68,pal:['#4a3a48','#120e14'],t:'ruin',d:'Colonne spezzate sotto un cielo viola.',mb:['brig','sch'],gat:['minerale'],np:['ossian']},
g:{rg:'karuun',n:'Gole di Karuun',x:84,y:16,pal:['#4a4a52','#101014'],t:'cave',d:'Gole di pietra scura. Qui i Kharun forgiano e scavano da generazioni.',np:['thrain'],mb:['verme'],gat:['minerale']},
k:{rg:'karuun',n:'Forgia della Cima',x:92,y:34,pal:['#5a3a2c','#140c0a'],t:'cave',d:'Una forgia antica scavata nella roccia, ancora calda.',mb:['verme'],gat:['minerale']}};
const E=[['v','p',4],['p','r',4],['p','f',5],['r','b',4],['b','f',5],['f','c',6],['f','u',6],['c','u',5],['g','v',6],['k','g',4],['g','gh',4],['k','gi',4],['r','sa',5],['sa','sb',5],['sa','sc',5],['sb','sd',6],['sc','se',6],['b','ma',6],['ma','mb',5],['ma','mc',6],['ma','md',6],['mb','me',6],['g','na',6],['na','nb',5],['nb','nc',5],['nb','nd',6],['nb','ne',5],['c','da',6],['da','db',5],['da','dc',5],['db','dd',6],['dc','de',6]];

// luoghi in preparazione (wip): visibili sulla mappa, non ancora raggiungibili
const W=(rg,n,x,y,t,d)=>({rg,n,x,y,t,d,wip:1,pal:['#2a2a32','#0c0c10']});
Object.assign(LC,{
gh:W('karuun','Miniere Profonde',104,24,'cave','Gallerie che scendono sotto le Gole, dove la roccia è calda.'),
gi:W('karuun','Sala delle Grandi Forge',112,44,'cave','Sotto la montagna, i Kharun battono il metallo da generazioni.'),
sa:W('selva','Radura d’Ingresso',-14,46,'forest','Dove la strada si perde tra radici più alte di una casa.'),
sb:W('selva','Città tra i Rami',-52,30,'town','Ponti e piattaforme sospese: la casa dei Velhiri.'),
sc:W('selva','Ponte di Liane',-40,58,'bridge','Un ponte vivo, intrecciato dalle radici.'),
sd:W('selva','Albero Madre',-80,18,'forest','Il più antico degli alberi. Si dice che ascolti.'),
se:W('selva','Palude dei Funghi',-72,62,'forest','Aria densa e luce verde, tra funghi grandi come tende.'),
ma:W('mare','Porto di Marea',30,92,'town','Banchine, reti e barche: la casa dei Thalassi.'),
mb:W('mare','Scogliera dei Gabbiani',-6,110,'road','Una costa di roccia battuta dal vento.'),
mc:W('mare','Isola delle Perle',50,128,'ruin','Acque basse e conchiglie, ma le correnti sono insidiose.'),
md:W('mare','Relitto di Orlo',86,104,'ruin','Una nave antica incagliata, piena di segreti.'),
me:W('mare','Faro Spento',20,136,'ruin','Un faro che non brilla più da generazioni.'),
na:W('neve','Passo del Gelo',112,-6,'road','La via oltre le gole: l’aria diventa tagliente.'),
nb:W('neve','Accampamento di Brina',140,-36,'town','Tende di pelle e fuochi bassi: la casa dei Nivari.'),
nc:W('neve','Lago Ghiacciato',118,-60,'road','Una distesa di ghiaccio che canta quando cede.'),
nd:W('neve','Cime Bianche',172,-60,'cave','Vette dove vivono i grandi predatori.'),
ne:W('neve','Grotta del Mammut',170,-20,'cave','Una caverna di ghiaccio, antica e profonda.'),
da:W('cenere','Sentiero di Cenere',120,66,'road','Il suolo diventa nero e il cielo rosso.'),
db:W('cenere','Bastione di Ossa',160,84,'town','Una fortezza costruita con ossa di creature enormi: la casa dei Draeth.'),
dc:W('cenere','Dune Nere',130,104,'road','Dune di cenere vulcanica, calde anche di notte.'),
dd:W('cenere','Cratere Ardente',186,112,'cave','Un vulcano attivo, ricco di materiali rari.'),
de:W('cenere','Rovine Sepolte',100,96,'ruin','Città antiche sotto la cenere.')});
Object.assign(LC.sa,{wip:0,pal:['#24402f','#0a1410'],np:['tarsa'],mb:['cinghiale'],gat:['erba']});
Object.assign(LC.sb,{wip:0,pal:['#3a4a2c','#0e140a'],np:['ylen'],gat:['legno']});
Object.assign(LC.sc,{wip:0,pal:['#2a4a3a','#0a1612'],np:['pell'],mb:['cinghiale','falena'],gat:['legno']});
Object.assign(LC.sd,{wip:0,pal:['#3a5a34','#0c160a'],mb:['falena','spora'],gat:['erba']});
Object.assign(LC.se,{wip:0,pal:['#3a4a2a','#101608'],mb:['falena','spora'],gat:['erba']});
const RG={vespro:{n:'Frontiera del Vespro',p:'Umani · popolo delle pianure',x:50,y:62,d:'Strade, nebbia e rovine.'},
karuun:{n:'Gole di Karuun',p:'Kharun · popolo del sottosuolo',x:124,y:44,d:'Forge e gallerie sotto la montagna.'},
selva:{n:'Selva dei Mille Anelli',p:'Velhiri · popolo del bosco',x:20,y:26,d:'Alberi immensi e città tra i rami.'},
mare:{n:'Arcipelago di Marea',p:'Thalassi · popolo del mare',x:52,y:122,d:'Isole, scogliere e barche.',wip:1},
neve:{n:'Distese Gelate',p:'Nivari · popolo del ghiaccio',x:160,y:20,d:'Tundra e ghiacciai, caccia e fuochi bassi.',wip:1},
cenere:{n:'Cenere di Draeth',p:'Draeth · popolo del deserto di cenere',x:152,y:92,d:'Vulcani, dune nere e ossa antiche.',wip:1}};
const M={cinghiale:{n:'Cinghiale della Selva',lv:2,hp:200,at:8},falena:{n:'Falena della palude',lv:4,hp:260,at:11},spora:{n:'Spora errante',lv:5,hp:330,at:13},guardiano:{n:'Guardiano d’edera',lv:6,hp:700,at:14,sp:{n:'Radici strangolatrici',cd:9,m:1.7}},verme:{n:'Verme di roccia',lv:1,hp:150,at:6},lupo:{n:'Lupo della Boscaglia',lv:1,hp:165,at:6},ragno:{n:'Ragno delle Cave',lv:3,hp:270,at:10},brig:{n:'Brigante della Frontiera',lv:5,hp:420,at:15},sch:{n:'Scheletro errante',lv:7,hp:630,at:21},seguace:{n:'Seguace Corrotto',lv:4,hp:250,at:10},anziano:{n:'Anziano Corrotto',lv:6,hp:650,at:13,sp:{n:'Fiamma nera',cd:10,m:1.8}}};
const TOOL={erba:['Falcetto',12],legno:['Ascia',15],minerale:['Piccone',15]};
const PRICE={erba:3,legno:3,minerale:4,barra:12,pelle:5};
const WEAP={w0:{n:'Spada logora',v:0,r:0},w1:{n:'Spada temprata',v:9,r:1},w2:{n:'Lama del Vespro',v:22,r:3},w3:{n:'Lama della Fiamma Nera',v:26,r:3}},ARM={a0:{n:'Casacca da viaggio',v:0},a1:{n:'Maglia di ferro',v:40,r:1},a2:{n:'Corazza del Vespro',v:90,r:3},a3:{n:'Veste del Custode',v:55,r:2},a4:{n:'Veste di lino',v:40,r:1},a5:{n:'Tunica del Vespro',v:90,r:3},a6:{n:'Manto della Guardia',v:62,r:2,fz:1},a7:{n:'Egida delle Lanterne',v:100,r:3,fz:1},a8:{n:'Corazza del Clan',v:62,r:2,fz:1},a9:{n:'Cuore di Forgia',v:100,r:3,fz:1},a10:{n:'Veste del Cerchio',v:62,r:2,fz:1},a11:{n:'Manto dei Mille Anelli',v:100,r:3,fz:1}};
const HEL={h0:{n:'Nessun elmo',v:0},h1:{n:'Elmo di pelle di lupo',v:10,r:0},h2:{n:'Cappuccio del brigante',v:16,r:1},h3:{n:'Elmo d’acciaio',v:28,r:2},h4:{n:'Cappuccio del Seguace',v:30,r:2},h5:{n:'Cappello del tessitore',v:28,r:2}};
const SKN=['#e8c4a0','#c99a72','#8d5a3a','#f1d9c4'],HCL=['#2a1c14','#8a5a2a','#b8b0a0','#7a2f3a'],LK={f:['Volto severo','Volto sereno','Volto fiero'],hr:['Capelli corti','Capelli lunghi','Cresta','Calvo'],sk:['Pelle chiara','Pelle ambrata','Pelle scura','Pelle pallida'],hc:['Castani scuri','Biondo rame','Grigi','Rosso scuro'],m:['Nessun segno','Cicatrice','Tatuaggio']};
const CR={smith:{n:'Fabbro',pl:'Fornace',d:'Forgia armi di lama e armature di metallo.'},weave:{n:'Tessitore',pl:'Telaio',d:'Tesse vesti, cappelli e armature leggere.'},wood:{n:'Carpentiere',pl:'Bottega',d:'Intaglia archi, bastoni e strumenti di legno.'},alch:{n:'Alchimista',pl:'Laboratorio',d:'Prepara elisir che potenziano per mezz’ora.'}},FAM={spada:'blade',pugnali:'blade',arco:'wood',bastone:'wood',liuto:'wood'};
const REC=[
{cr:'smith',id:'barra',n:'Barra di ferro',in:{minerale:2},min:1,xp:4,mat:'barra'},
{cr:'smith',id:'acciaio',n:'Acciaio del Vespro',in:{barra:2,ferro_puro:1},min:3,xp:14,mat:'acciaio'},
{cr:'smith',id:'w1',n:'Spada temprata',in:{barra:3,pelle:1},min:2,xp:10,eq:1,fam:'blade'},
{cr:'smith',id:'a1',n:'Maglia di ferro',in:{barra:5,pelle:2},min:3,xp:16,eq:1},
{cr:'smith',id:'h3',n:'Elmo d’acciaio',in:{acciaio:2,pelle:1},min:4,xp:22,eq:1},
{cr:'smith',id:'g2',n:'Guanti di ferro',in:{barra:2,pelle:1},min:3,xp:12,eq:1},
{cr:'smith',id:'f2',n:'Stivali ferrati',in:{barra:3,pelle:2},min:3,xp:14,eq:1},
{cr:'smith',id:'o2',n:'Scudo di ferro',in:{barra:4,pelle:1},min:4,xp:18,eq:1},
{cr:'weave',id:'g1',n:'Guanti di cuoio',in:{cuoio:3},min:2,xp:10,eq:1},
{cr:'weave',id:'f1',n:'Stivali di cuoio',in:{cuoio:4},min:2,xp:10,eq:1},
{cr:'wood',id:'o1',n:'Scudo di legno',in:{asse:4,pelle:1},min:2,xp:10,eq:1},
{cr:'smith',id:'w2',n:'Lama del Vespro',in:{acciaio:2,barra:2},min:5,xp:30,eq:1,fam:'blade'},
{cr:'smith',id:'a2',n:'Corazza del Vespro',in:{acciaio:3,barra:4,pelle:2},min:6,xp:40,eq:1},
{cr:'wood',id:'asse',n:'Asse levigata',in:{legno:2},min:1,xp:4,mat:'asse'},
{cr:'wood',id:'w1',n:'Arma temprata',in:{asse:3,pelle:1},min:2,xp:10,eq:1,fam:'wood'},
{cr:'wood',id:'w2',n:'Arma del Vespro',in:{asse:3,ebano:2},min:5,xp:30,eq:1,fam:'wood'},
{cr:'weave',id:'tela',n:'Tela di fibra',in:{erba:3},min:1,xp:4,mat:'tela'},
{cr:'weave',id:'cuoio',n:'Cuoio conciato',in:{pelle:2},min:1,xp:4,mat:'cuoio'},
{cr:'weave',id:'a4',n:'Veste di lino',in:{tela:4,cuoio:1},min:2,xp:12,eq:1},
{cr:'weave',id:'h5',n:'Cappello del tessitore',in:{tela:3,cuoio:2},min:4,xp:20,eq:1},
{cr:'weave',id:'a5',n:'Tunica del Vespro',in:{tela:5,cuoio:3,frammento:1},min:6,xp:38,eq:1},
{cr:'weave',id:'zaino',n:'Zaino di tela',in:{tela:6,cuoio:3},min:3,xp:18,bag:['bx',4],mx:3},
{cr:'weave',id:'sacca',n:'Sacca dei materiali',in:{tela:6,cuoio:3},min:3,xp:18,bag:['mx',4],mx:3},
{cr:'alch',id:'p_vig',n:'Elisir di vigore',in:{erba:4},min:1,xp:5,pot:{hp:.2},mat:'p_vig'},
{cr:'alch',id:'p_fer',n:'Elisir di ferocia',in:{erba:3,minerale:1},min:2,xp:8,pot:{at:.2},mat:'p_fer'},
{cr:'alch',id:'p_cus',n:'Elisir del custode',in:{erba:5,ebano:1},min:4,xp:14,pot:{hp:.12,at:.12},mat:'p_cus'}];
const ORD={smith:[{n:'Barre per la guardia',in:{barra:3},g:14,x:12},{n:'Pelli per i rinforzi',in:{pelle:3},g:10,x:8},{n:'Acciaio per Serah',in:{acciaio:1},g:30,x:20},{n:'Minerale per la fornace',in:{minerale:6},g:10,x:8}],
weave:[{n:'Tela per i mantelli',in:{tela:3},g:14,x:12},{n:'Cuoio per i guanti',in:{cuoio:2},g:12,x:10},{n:'Erbe tintorie',in:{erba:4},g:9,x:6}],
wood:[{n:'Assi per la palizzata',in:{asse:3},g:14,x:12},{n:'Legno da ardere',in:{legno:6},g:10,x:8},{n:'Ebano per l’intagliatore',in:{ebano:1},g:30,x:20}],
alch:[{n:'Erbe per l’infermeria',in:{erba:4},g:9,x:6},{n:'Un elisir di vigore',in:{p_vig:1},g:20,x:14},{n:'Erbe e minerale per i sigilli',in:{erba:3,minerale:2},g:14,x:10}]};
const QM=[1,1.15,1.3],QN=['Normale','Fine','Eccellente'];
const IC=['#9a9a9a','#4fb06d','#4a90d9','#a05ad6','#d9a93a'];
const GLO={g0:{n:'Nessun guanto',v:0},g1:{n:'Guanti di cuoio',v:2,r:0},g2:{n:'Guanti di ferro',v:4,r:1}},BOO={f0:{n:'Nessun stivale',v:0},f1:{n:'Stivali di cuoio',v:8,r:0},f2:{n:'Stivali ferrati',v:16,r:1}},OFF={o0:{n:'Nessuna mano secondaria',v:0},o1:{n:'Scudo di legno',v:20,r:0},o2:{n:'Scudo di ferro',v:36,r:1}};
const SL={w:[WEAP,'attacco','Arma'],a:[ARM,'vita','Armatura'],h:[HEL,'vita','Elmo'],g:[GLO,'attacco','Guanti'],f:[BOO,'vita','Stivali'],o:[OFF,'vita','Mano secondaria']};
const EQS=[['h','Testa'],['a','Petto'],['g','Mani'],['f','Piedi'],['w','Arma'],['o','Secondaria']],EQL=['Collana','Anello','Anello','Talismano'];
const bt=u=>u.split('#')[0],eqd=u=>Object.values(S.eq).includes(u),IR=u=>SL[u[0]][0][bt(u)].r||0,MRAR={minerale:0,erba:0,legno:0,pelle:0,barra:1,asse:1,tela:1,cuoio:1,ebano:2,ferro_puro:2,acciaio:2,frammento:3,p_vig:1,p_fer:1,p_cus:2},mcn=k=>'<span style="color:'+IC[MRAR[k]||0]+'">'+(MN[k]||k)+'</span>',
IV=u=>{const t=bt(u),i=S.items[u]||{q:1,vr:0},x=SL[t[0]][0][t].v*QM[i.q-1]*(1+(i.vr||0));return t[0]==='w'?Math.round(x*10)/10:Math.round(x)},
sellP=u=>Math.max(1,Math.round(IV(u)*.25*(1+IR(u)*.6))),esc=t=>String(t||'').replace(/[<>&"']/g,'').slice(0,14),
itl=u=>itn(u)+(S.items[u]&&S.items[u].by?' <small>· '+S.items[u].by+'</small>':'');
function giveItem(t,o){o=o||{};S.nu=(S.nu||1)+1;const u=t+'#'+S.nu;S.items[u]={q:o.q||1,vr:o.vr!==undefined?o.vr:(rnd()*2-1)*.05,by:o.by||'',cl:o.cl||0,k:0,mx:0,bn:''};return u}
const itn=u=>'<b style="color:'+IC[IR(u)]+'">'+HN(bt(u),SL[u[0]][0][bt(u)].n)+'</b>';
function dlt(a,b,u){const d=+(a-b).toFixed(1);return'<span class="'+(d>0?'up':d<0?'dn':'eq')+'">'+(d>0?'▲ +':d<0?'▼ −':'= ')+Math.abs(d)+(u?' '+u:'')+'</span>'}
function cmpItem(id){const k=id[0],[tb,u]=SL[k],cur=S.eq[k];if(cur===id)return'<small>✔ Equipaggiato</small>';return'<small>Rispetto a '+HN(bt(cur),tb[bt(cur)].n)+': '+dlt(IV(id),IV(cur),u)+' · potenza '+dlt(pwWith(k,id),pw(),'')+'</small>'}
function dropNote(id){return'<span class="card it" style="display:block;border-left-color:'+IC[IR(id)]+'">'+itn(id)+' · '+RAR[IR(id)]+cmpItem(id)+'<small>Aprila dalla Borsa per vederla sul personaggio.</small></span>'}
function QV(tb,u){return IV(u)}
const smithLv=()=>1+Math.floor(Math.sqrt((S.cx||0)/8));
const QD=[
{id:'q1',t:'Lupi sulla strada',main:1,giver:'serah',ty:'kill',tg:'lupo',n:3,x:40,g:8,elv:2,min:1,tx:'I lupi minacciano le carovane. Abbattine tre.'},
{id:'q2',t:'Ferro per l’Avamposto',main:1,pre:'q1',giver:'serah',ty:'gat',tg:'minerale',n:4,x:70,g:12,elv:3,min:2,tx:'Servono armi. Porta quattro pezzi di minerale dalla cava.'},
{id:'q3',t:'Il Vespro si oscura',main:1,pre:'q2',giver:'serah',ty:'kill',tg:'brig',n:2,x:150,g:30,elv:5,min:4,tx:'Banditi alle rovine. Due di loro, e poi parliamo.'},
{rc:'kharun',id:'qk1',t:'Il filone perduto',origin:1,giver:'thrain',ty:'gat',tg:'minerale',n:3,x:30,g:6,elv:1,min:1,tx:'Il filone alla Forgia della Cima si è esaurito. Portami tre pezzi di minerale.'},
{rc:'kharun',id:'qk2',t:'Ombre nella galleria',origin:1,pre:'qk1',giver:'thrain',ty:'kill',tg:'verme',n:2,x:40,g:8,elv:1,min:1,tx:'Dei vermi di roccia bloccano le gallerie. Eliminane due.'},
{rc:'kharun',id:'qk3',t:'Un messaggio per Veyra',origin:1,dn:'Serah legge il messaggio di Thrain: «Benvenuto a Veyra. Qui comincia la storia di tutti.»',pre:'qk2',giver:'thrain',ty:'talk',tg:'serah',n:1,x:50,g:10,elv:2,min:1,tx:'Porta questo messaggio a Serah, all’Avamposto di Veyra. La strada è lunga, ma ti attendono.'},
{rc:'velhiri',id:'qv1',t:'Le erbe di Ylen',origin:1,giver:'ylen',ty:'gat',tg:'erba',n:3,x:30,g:6,elv:1,min:1,tx:'Le erbe della Radura d’Ingresso stanno appassendo, e le cure finiscono. Portami tre erbe: il Falcetto che hai è quello di tuo padre, usalo con rispetto.'},
{rc:'velhiri',id:'qv2',t:'Zanne nella radura',origin:1,pre:'qv1',giver:'ylen',ty:'kill',tg:'cinghiale',n:2,x:40,g:8,elv:2,min:1,tx:'I cinghiali hanno invaso la radura e calpestano le radici giovani. Scacciane due.'},
{rc:'velhiri',id:'qv3',t:'Un messaggio per Veyra',origin:1,dn:'Serah legge il messaggio di Ylen: «Il popolo del bosco ti manda uno dei suoi. Ascoltalo, il bosco ascolta te.»',pre:'qv2',giver:'ylen',ty:'talk',tg:'serah',n:1,x:50,g:10,elv:2,min:1,tx:'Porta questo messaggio a Serah, all’Avamposto di Veyra. La via passa per il Riparo lungo la strada: nessuna fretta, il bosco sa aspettare.'},
{id:'sv1',t:'Radici da liberare',giver:'tarsa',ty:'kill',tg:'cinghiale',n:3,x:60,g:14,elv:3,min:2,tx:'Sono Tarsa, cacciatrice. I cinghiali stanno soffocando il Ponte di Liane. Abbattine tre e la selva respirerà.',dn:'Tarsa annuisce. «Il bosco ti è debitore.»'},
{id:'sv2',t:'Legno vivo',giver:'pell',ty:'gat',tg:'legno',n:5,x:70,g:16,elv:3,min:2,tx:'Il ponte ha bisogno di assi nuove. Portami cinque pezzi di legno, ma solo quello caduto: niente alberi vivi.',dn:'Pell intreccia le assi con le liane. «Il ponte ti ringrazia.»'},
{id:'sv3',t:'Il sussurro dell’Albero Madre',giver:'ylen',pre:'qv3',ty:'obs',tg:'sd',n:3,x:120,g:24,elv:4,min:4,tx:'Si dice che l’Albero Madre parli a chi sa ascoltare. Osservalo tre volte e dimmi cosa senti.',dn:'Ylen chiude gli occhi. «Allora è vero. Le sue radici sentono le lanterne spegnersi.»'},
{id:'svb',t:'Il Guardiano d’edera',giver:'ylen',pre:'sv3',ty:'kill',tg:'guardiano',n:1,at:'sd',boss:['guardiano','spora'],x:300,g:60,elv:6,min:5,ep:1,tx:'Qualcosa ha avvelenato il Guardiano d’edera: ora attacca chiunque si avvicini all’Albero Madre. Fermalo, ma non da solo: una Spora lo protegge.',cq:'Dal Guardiano caduto cade un seme luminoso. Cosa ne fai?',ch:[
 {l:'Piantarlo ai piedi dell’Albero',d:'La selva si rinnova. Più Corone.',fl:{seme:'albero'},gm:1.5,tx:'Il seme affonda tra le radici. Ylen sorride: «Il bosco non dimentica.»'},
 {l:'Portarlo a Veyra',d:'Un dono per gli altri popoli: ricevi la Veste di lino.',fl:{seme:'veyra'},it:'a4',tx:'Ylen esita, poi annuisce. «Che cresca anche tra le mura.»'}]},
{id:'m4',t:'Le lanterne si spengono',main:1,giver:'serah',pre:'q3',ty:'talk',tg:'mira',x:60,g:10,elv:4,min:4,tx:'Lungo la strada le lanterne del Vespro si spengono una a una. Mira, la custode, vive al Riparo: vai a sentire cosa sa.',dn:'Mira ti ascolta in silenzio, poi guarda le lanterne ormai spente. «Allora è cominciato davvero. Ho bisogno di te.»'},
{id:'m5',t:'Luci senza fiamma',main:1,giver:'mira',pre:'m4',ty:'kill',tg:'seguace',n:2,x:140,g:25,elv:5,min:4,tx:'Nel Bosco delle Lanterne Spente si aggirano i Seguaci Corrotti: sono loro a soffocare le fiamme. Abbattine due.',dn:'Mira annuisce. «Portavano questo addosso.» Ti mostra una boccetta di olio nero che gocciola come inchiostro.'},
{id:'m6',t:'Il cuore della lanterna',main:1,giver:'mira',pre:'m5',ty:'gat',tg:'erba',n:4,x:160,g:30,elv:5,min:5,tx:'Per riaccendere la lanterna maestra servono erbe di fiamma. Portami quattro erbe dal bosco.',cq:'Mira ha davanti due strade per riaccendere la lanterna maestra. Cosa le consigli?',ch:[
 {l:'Fiamma pura',d:'Lenta e sicura. Ricevi la Veste del Custode.',fl:{lan:'pura'},it:'a3',tx:'La fiamma pura sale lenta, dorata. Mira sorride per la prima volta: «Questa luce durerà.» Ti consegna la veste dei custodi.'},
 {l:'Olio nero',d:'Potente ma corrotto: più Corone e il Cappuccio del Seguace.',fl:{lan:'nera'},it:'h4',gm:1.6,tx:'L’olio nero brucia violento. La lanterna si accende, ma la sua luce è fredda e viola. Mira distoglie lo sguardo.'}]},
{id:'m7',t:'Il pedaggio di Dorn',main:1,giver:'serah',pre:'m6',ty:'talk',tg:'dorn',x:120,g:0,elv:5,min:5,tx:'Senza il permesso di Dorn nessuno raggiunge le Rovine del Vespro. Parlagli, al Vecchio Ponte.',cq:'Dorn ti sbarra il ponte: «Le Rovine sono oltre. Qui passa solo chi paga, o chi è abbastanza forte.»',ch:[
 {l:'Pagare 40 Corone',d:'Passi senza combattere.',pay:40,fl:{ponte:'pagato'},tx:'Dorn intasca le monete e si fa da parte. «Almeno tu sai come funziona il mondo.»'},
 {l:'Sfidare i suoi banditi',d:'Due briganti ti attaccano. Più rischio, più bottino.',fl:{ponte:'combattuto'},fight:['brig','brig'],tx:'Dorn fischia. Due briganti escono dal bosco.'},
 {l:'Parlare da Umano del Vespro',d:'Gli ricordi il giuramento del Vespro.',race:'umano',fl:{ponte:'parlato'},tx:'Dorn esita, poi abbassa la sbarra. «Il giuramento… non lo sentivo da anni. Passa.»'},
 {l:'Offrire erbe della selva',d:'Un dono di pace.',race:'velhiri',fl:{ponte:'doni'},tx:'Dorn annusa le erbe e sorride: «Non le sentivo da anni. Passa pure.»'},
 {l:'Intimidirlo con la pietra',d:'I Kharun non si piegano.',race:'kharun',fl:{ponte:'intimidito'},tx:'La tua pelle di pietra brilla nella nebbia. Dorn deglutisce e si sposta di lato.'}]},
{id:'m8',pot:'Serah ti passa un elisir di vigore',bag:4,t:'L’Anziano delle Rovine',main:1,giver:'serah',pre:'m7',ty:'kill',tg:'anziano',n:1,at:'u',boss:['anziano','seguace'],x:400,g:80,elv:6,min:6,ep:1,tx:'Il capo dei Seguaci si nasconde alle Rovine del Vespro. Sconfiggi l’Anziano Corrotto: ma non sarà solo: un Seguace lo protegge.',cq:'L’Anziano è caduto e dal suo petto è rotolato un cuore di fiamma nera, ancora caldo. Cosa ne fai?',ch:[
 {l:'Consegnare il Cuore a Serah',d:'Veyra riaccende le sue lanterne. Più Corone.',fl:{cuore:'dato'},gm:1.5,tx:'Serah lo stringe tra le mani. «Il Vespro ti ricorderà.»'},
 {l:'Tenere il Cuore per te',d:'Il suo potere ti segue: ottieni la Lama della Fiamma Nera.',fl:{cuore:'tenuto'},it:'w3',tx:'Serah ti guarda a lungo e non dice nulla. Il cuore pulsa nella tua mano.'}]},
{id:'s1',t:'Erbe per Eldra',giver:'eldra',ty:'gat',tg:'erba',n:5,x:50,g:12,elv:3,min:3,tx:'Sono Eldra, erborista errante. Il bosco è pieno di erbe, ma ho le mani stanche. Portami cinque erbe.',dn:'Eldra annusa le erbe. «Fresche. Grazie, viandante.»'},
{id:'s2',t:'Pagine strappate',giver:'ossian',ty:'obs',tg:'u',n:3,x:90,g:20,elv:5,min:4,tx:'Studio queste rovine da anni, ma il vento strappa le mie pagine. Osserva le rovine tre volte: forse ne trovi i frammenti.',dn:'Ossian ricompone le pagine. «Il Vespro non era una città. Era una promessa. Grazie.»'},
{id:'sp1',t:'Il debito di Mira',giver:'mira',rq:{lan:'pura'},pre:'m6',ty:'kill',tg:'ragno',n:3,x:110,g:25,elv:5,min:5,tx:'La fiamma pura disturba i ragni delle cave. Abbatti tre ragni e la lanterna resterà accesa.',dn:'Mira tiene la lanterna accesa. «Ora la strada è più sicura per tutti.»'},
{id:'sn1',t:'Il prezzo dell’olio',giver:'mira',rq:{lan:'nera'},pre:'m6',ty:'kill',tg:'seguace',n:3,x:130,g:55,elv:5,min:5,tx:'L’olio nero ha un prezzo: i Seguaci lo sentono e vengono a riprenderlo. Eliminane tre prima che arrivino alla lanterna.',dn:'Mira sospira. «Spero che ne sia valsa la pena.»'},
{id:'q4',t:'Il tuo mestiere',giver:'brann',ty:'gat',tg:'minerale',n:3,x:30,g:5,elv:1,min:1,bag:2,tx:'Ogni artigiano comincia dai materiali. Portami tre pezzi di minerale e ti presento i maestri di Veyra: potrai scegliere un solo mestiere di creazione, per sempre.',cq:'Quale mestiere di creazione scegli? La scelta è definitiva: tutti possono raccogliere, ma ognuno può creare in un solo mestiere.',ch:[
 {l:'Fabbro',d:'Armi di lama e armature di metallo. '+'Serve ai guerrieri e ai combattenti in prima linea.',craft:'smith',tx:'Brann ti porta alla Fornace: «Il ferro non perdona, ma ripaga.»'},
 {l:'Tessitore',d:'Vesti, cappelli e armature leggere.',craft:'weave',tx:'Una tessitrice ti consegna ago e filo: «Ogni veste racconta chi la porta.»'},
 {l:'Carpentiere',d:'Archi, bastoni e liuti di legno intagliato.',craft:'wood',tx:'Il carpentiere ti mette in mano un’ascia: «Il legno ascolta chi sa aspettare.»'},
 {l:'Alchimista',d:'Elisir che potenziano vita e attacco per mezz’ora.',craft:'alch',tx:'L’alchimista versa una goccia in una fiala: «Ogni erba nasconde un segreto.»'}]}];
const CL={
guard:{cls:'guard',role:'tank',wk:'spada',n:'Guardiano',hp:140,at:8,hpl:14,atl:1.6,d:'Tank classico: scudo e armatura. Assorbe i colpi e protegge gli alleati.',sk:[
 {n:'Fendente',cd:3,d:'Danno 1,3x',f:()=>hit(1.3)},
 {n:'Colpo di Scudo',cd:6,d:'Danno e stordimento 1,6 s (sui boss 0,5 s)',f:()=>{hit(1);stn(C.e,1.6)}},
 {n:'Guardia Ferrea',cd:9,tg:1,pw:()=>'Assorbe '+Math.round(EA()*2.5),atg:()=>lowIdx(),d:'Scudo su un alleato scelto (su di te anche −60% danni per 4 s)',ok:()=>LF()<.7,f:()=>shieldG(2.5)},
 {n:'Grido di Guerra',cd:12,aoe:1,d:'Cura il 15% e colpisce tutti i nemici',f:()=>{C.hp=Math.min(C.max,C.hp+C.max*.15);hitAll(.6)}},
 {n:'Muro di scudi',cd:14,en:30,d:'Danni subiti −60% per 6 s e scudo su di te',f:()=>{C.guard=6;C.ab+=Math.round(EA()*1.5);C.msg='Alzi il muro di scudi.'}}]},
ombra:{cls:'ombra',role:'tank',wk:'pugnali',n:'Ombra',hp:110,at:9,hpl:11,atl:1.9,d:'Tank che schiva: crea copie e evita i colpi. Con il tempismo giusto subisce pochissimo.',sk:[
 {n:'Fendente d’ombra',cd:2.5,d:'Danno 1,1x',f:()=>hit(1.1)},
 {n:'Schivata',cd:5,en:15,d:'Per 0,8 s eviti ogni colpo; se ci riesci guadagni energia e contrattacchi. Premila quando vedi “Colpo in arrivo”',f:()=>{C.dodge=.8;C.msg='Ti prepari a schivare.'}},
 {n:'Copie d’ombra',cd:12,en:30,d:'Tre copie assorbono i prossimi tre colpi',f:()=>{C.dec=3;C.msg='Tre copie d’ombra ti coprono.'}},
 {n:'Contrattacco',cd:7,en:25,d:'Danno 1,9x e il bersaglio perde 1 s',f:()=>{hit(1.9);stn(C.e,1)}},
 {n:'Velo di nebbia',cd:14,en:30,aoe:1,d:'I nemici fanno il 40% di danni in meno per 6 s',f:()=>{C.fog=6;C.msg='Una nebbia scura copre tutti.'}}]},
spad:{cls:'spad',role:'dps',wk:'spada',n:'Spadaccino',hp:100,at:10,hpl:10,atl:2.2,d:'Danni alti da vicino. Meno vita, più rischio.',sk:[
 {n:'Fendente rapido',cd:2.5,d:'Danno 1,2x',f:()=>hit(1.2)},
 {n:'Colpo devastante',cd:6,d:'Danno 2,6x',f:()=>hit(2.6)},
 {n:'Furia',cd:12,tg:1,pw:()=>'Danni +40% per 5 s',atg:()=>{const k=C.party.findIndex(m=>!m.you&&m.role==='dps'&&m.hp>0);return k>=0?k:C.party.findIndex(m=>m.you)},d:'Danni +40% per 5 s a un compagno scelto (o a te)',f:()=>furia()},
 {n:'Turbine di lame',cd:8,aoe:1,d:'Danno ad area 1,1x a tutti i nemici',f:()=>hitAll(1.1)},
 {n:'Esecuzione',cd:12,en:35,d:'Danno 3,5x se il nemico ha meno del 35% di vita, altrimenti 1,6x',f:()=>hit(C.e.hp/C.e.max<.35?3.5:1.6)}]},
arc:{cls:'arc',role:'dps',wk:'arco',n:'Arciere',hp:95,at:11,hpl:9,atl:2.3,d:'Danni a distanza costanti e precisi. Fragile se i nemici ti raggiungono.',sk:[
 {n:'Tiro rapido',cd:2.5,d:'Danno 1,1x',f:()=>hit(1.1)},
 {n:'Tiro mirato',cd:6,d:'Danno 2,5x',f:()=>hit(2.5)},
 {n:'Pioggia di frecce',cd:9,aoe:1,d:'Danno ad area 1,1x a tutti i nemici',f:()=>hitAll(1.1)},
 {n:'Concentrazione',cd:12,d:'Danni +40% per 5 s',f:()=>{C.fury=5;C.msg='Ti concentri: danni +40% per 5 s.'}},
 {n:'Freccia perforante',cd:10,en:30,d:'Danno 2,8x',f:()=>hit(2.8)}]},
bardo:{cls:'bardo',role:'sup',wk:'liuto',n:'Bardo',hp:105,at:9,hpl:10,atl:1.9,d:'Combatte e suona: dà più danni e cure leggere a tutto il gruppo.',sk:[
 {n:'Nota tagliente',cd:2.5,d:'Danno 1x',f:()=>hit(1)},
 {n:'Canto di guerra',cd:12,en:25,aoe:1,d:'Danni +40% per 5 s a te e a tutti gli alleati',f:()=>{C.fury=5;(C.party||[]).forEach(m=>{if(!m.you)m.fu=5});C.msg='Il canto di guerra infiamma il gruppo.'}},
 {n:'Ballata ristoratrice',cd:14,en:30,aoe:1,pw:()=>'Cura '+Math.round(EA())+' a tutti',d:'Cura leggera su tutti',f:()=>healA(1)},
 {n:'Melodia dissonante',cd:9,en:25,aoe:1,d:'Danno 0,8x a tutti i nemici e li rallenta per 5 s',f:()=>{hitAll(.8);alive().forEach(x=>x.slow=5)}},
 {n:'Crescendo',cd:11,en:35,d:'Danno 2,6x',f:()=>hit(2.6)}]},
tempo:{cls:'tempo',role:'sup',wk:'bastone',n:'Mago del tempo',hp:95,at:8,hpl:9,atl:1.8,d:'Rallenta i nemici e accelera gli alleati. Sui boss i suoi effetti sono più deboli.',sk:[
 {n:'Dardo temporale',cd:2.8,d:'Danno 1x',f:()=>hit(1)},
 {n:'Rallentamento',cd:8,en:20,aoe:1,d:'I nemici attaccano più lentamente per 6 s',f:()=>{alive().forEach(x=>x.slow=6);C.msg='Il tempo rallenta intorno ai nemici.'}},
 {n:'Accelerazione',cd:12,en:30,tg:1,pw:()=>'Danni +40% per 5 s',atg:()=>{const k=C.party.findIndex(m=>!m.you&&m.role==='dps'&&m.hp>0);return k>=0?k:C.party.findIndex(m=>m.you)},d:'Danni +40% per 5 s a un compagno scelto (o a te); i tuoi recuperi −3 s',f:()=>{furia();C.cd=C.cd.map(c=>Math.max(0,c-3))}},
 {n:'Frammento di tempo',cd:7,en:25,d:'Danno 2,2x e il bersaglio perde 0,8 s',f:()=>{hit(2.2);stn(C.e,.8)}},
 {n:'Stasi',cd:16,en:40,aoe:1,d:'Tutti i nemici fermi 2,5 s (sui boss 0,75 s)',f:()=>{alive().forEach(x=>stn(x,2.5));C.msg='Il tempo si ferma.'}}]},
sac:{cls:'sac',role:'heal',wk:'bastone',em:1,n:'Sacerdote',hp:110,at:6,hpl:11,atl:1.5,d:'Curatore singolo: decidi tu chi e quando. Cure forti e scudi sul bersaglio.',sk:[
 {n:'Colpo sacro',cd:3,d:'Danno 1,1x',f:()=>hit(1.1)},
 {n:'Cura potente',cd:5,en:30,tg:1,pw:()=>'Cura '+Math.round(EA()*3.5),d:'Cura forte su un alleato scelto: 3,5 volte il colpo del nemico',f:()=>healS(3.5)},
 {n:'Cura di gruppo',cd:9,en:35,aoe:1,pw:()=>'Cura '+Math.round(EA()*1.5)+' a tutti',d:'Cura debole su tutti: 1,5 volte il colpo del nemico',f:()=>healA(1.5)},
 {n:'Scudo di fede',cd:10,en:25,tg:1,pw:()=>'Assorbe '+Math.round(EA()*2),d:'Scudo su un alleato scelto: assorbe 2 colpi del nemico',f:()=>shieldS(2)},
 {n:'Veglia di luce',cd:14,en:35,tg:1,pw:()=>'Cura '+Math.round(EA()*1.5)+' e scudo',d:'Cura e scudo insieme su un alleato scelto',f:()=>{healS(1.5);shieldS(1.2);C.msg='Veglia di luce sul bersaglio.'}}]},
drui:{cls:'drui',role:'heal',wk:'bastone',em:1,n:'Druido',hp:105,at:7,hpl:10,atl:1.5,d:'Curatore di gruppo: cure nel tempo e scudi su tutti, meno potenti sul singolo.',sk:[
 {n:'Spina',cd:2.8,d:'Danno 0,9x',f:()=>hit(.9)},
 {n:'Radice curativa',cd:6,en:25,tg:1,pw:()=>'Cura '+Math.round(EA()*2.2),atg:()=>lowIdx(),d:'Cura media su un alleato scelto: 2,2 volte il colpo del nemico',f:()=>healS(2.2)},
 {n:'Pioggia di vita',cd:9,en:35,aoe:1,pw:()=>'Cura nel tempo',d:'Cura tutti per 6 s, un po’ ogni secondo',f:()=>{C.hot=6;C.hota=EA();C.msg='Una pioggia di vita cade sul gruppo.'}},
 {n:'Corteccia',cd:12,en:30,aoe:1,pw:()=>'Scudo '+Math.round(EA()*.9)+' a tutti',d:'Scudo su tutti gli alleati',f:()=>{const a=Math.round(EA()*.9);if(C.party)C.party.forEach(m=>{if(gh(m)>0){if(m.you)C.ab+=a;else m.ab=(m.ab||0)+a}});else C.ab+=a;C.msg='Corteccia su tutto il gruppo: assorbe '+a+'.'}},
 {n:'Fioritura',cd:16,en:45,aoe:1,pw:()=>'Cura '+Math.round(EA()*2.4)+' a tutti',d:'Cura forte su tutti',f:()=>healA(2.4)}]}};
const RL=()=>CL[S.spec].role,stn=(e,t)=>{e.stun=Math.max(e.stun||0,(e.boss||e.sp)?t*.3:t)},WNM={spada:['Spada logora','Spada temprata','Lama del Vespro','Lama della Fiamma Nera'],arco:['Arco logoro','Arco temprato','Arco del Vespro','Arco della Fiamma Nera'],bastone:['Bastone logoro','Bastone temprato','Bastone del Vespro','Bastone della Fiamma Nera'],liuto:['Liuto logoro','Liuto temprato','Liuto del Vespro','Liuto della Fiamma Nera'],pugnali:['Pugnali logori','Pugnali temprati','Pugnali del Vespro','Pugnali della Fiamma Nera']},HN=(id,n)=>id&&id[0]==='w'&&S&&CL[S.spec]&&WNM[CL[S.spec].wk]?WNM[CL[S.spec].wk][+id[1]]||n:n,RLN={tank:'Tank',dps:'DPS',sup:'DPS di supporto',heal:'Curatori'};
const RN={umano:'Umano',kharun:'Kharun',velhiri:'Velhiri'},SKV=['#d8caa0','#b8a878','#8a8050','#c8d4a8'],KSK=['Granito','Ardesia','Arenaria','Basalto'],SKK=['#8a8f94','#6a6f78','#9a8a7a','#5a6068'],NR_ROLE={mira:'Custode, missioni',dorn:'Guardiano del Vecchio Ponte',eldra:'Erborista, missioni',ossian:'Studioso, missioni',serah:'Capitana, missioni',brann:'Mercato e mestiere di Fabbro',thrain:'Anziano dei Kharun, missioni d’origine',ylen:'Anziana dei Velhiri, missioni',tarsa:'Cacciatrice, missioni',pell:'Intrecciatore di liane, missioni'};
