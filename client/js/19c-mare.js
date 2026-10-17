/* I THALASSI: Arcipelago di Marea. Origine, luoghi, mostri, pesca, missioni e reputazione della Flotta delle Maree. */
RN.thalassi='Thalassi';FRC.thalassi='maree';delete FZ.maree.wip;FZ.maree.it=['a12','a13'];RG.mare.wip=0;ORG.thalassi='qm3';
Object.assign(ARM,{a12:{n:'Veste del Marinaio',v:62,r:2,fz:1},a13:{n:'Mantello di Marea',v:100,r:3,fz:1}});
Object.assign(NPC,{imara:'Imara, ormeggiatrice del Porto',baku:'Baku, vecchio pescatore',anaya:'Anaya, tuffatrice di perle'});
Object.assign(NR_ROLE,{imara:'Capoporto, missioni d’origine',baku:'Pescatore, missioni',anaya:'Tuffatrice, missioni'});
Object.assign(LC.ma,{wip:0,pal:['#1c4a5e','#08161e'],np:['imara']});
Object.assign(LC.mb,{wip:0,pal:['#2a4a56','#0a161c'],np:['baku'],mb:['granchio','gabbiano'],gat:['minerale']});
Object.assign(LC.mc,{wip:0,pal:['#1c5a62','#06181c'],np:['anaya'],mb:['murena','medusa'],gat:['erba']});
LC.ma.gat=['legno','erba'];LC.mc.gat=['erba','perla'];
Object.assign(M,{granchio:{n:'Granchio di scoglio',lv:1,hp:150,at:6},gabbiano:{n:'Gabbiano affamato',lv:2,hp:190,at:8},murena:{n:'Murena',lv:4,hp:300,at:11},medusa:{n:'Medusa errante',lv:4,hp:280,at:12},regina:{n:'Regina delle Murene',lv:6,hp:650,at:14,sp:{n:'Morso d’olio',cd:9,m:1.7}}});
Object.assign(LM,{granchio:[['minerale',.2,1,1]],gabbiano:[['pelle',.5,1,1]],murena:[['pelle',.4,1,1]],medusa:[['erba',.4,1,2]],regina:[['perla',.8,1,2],['frammento',.3,1,1]]});
MN.perla='Perla';MRAR.perla=2;MG.perla='🦪';PRICE.perla=14;MR.perla=1;
ND.push(
{id:'ma1',loc:'ma',n:'Legname di deriva',k:'legno',m:'legno',g:1,lv:1,ch:3,d:20,y:1},
{id:'ma2',loc:'ma',n:'Alghe medicinali',k:'erba',m:'erba',g:1,lv:1,ch:3,d:15,y:1},
{id:'mb1',loc:'mb',n:'Rocce di sale',k:'minerale',m:'minerale',g:1,lv:1,ch:3,d:20,y:1},
{id:'mc1',loc:'mc',n:'Banchi di ostriche',k:'erba',m:'perla',g:1,lv:3,ch:2,d:50,y:1},
{id:'mc2',loc:'mc',n:'Alghe dell’isola',k:'erba',m:'erba',g:1,lv:2,ch:3,d:25,y:1});
Object.assign(FISH,{sardina:{n:'Sardina',r:0,p:4,g:'🐟',lv:1,w:50},orata:{n:'Orata',r:0,p:6,g:'🐠',lv:1,w:40},tonno:{n:'Tonno',r:1,p:11,g:'🐟',lv:2,w:22},spada:{n:'Pesce spada',r:2,p:24,g:'🗡️',lv:4,w:8},cavalluccio:{n:'Cavalluccio d’oro',r:3,p:55,g:'✨',lv:6,w:2}});
['sardina','orata','tonno','spada','cavalluccio'].forEach(k=>{MN[k]=FISH[k].n;MRAR[k]=FISH[k].r;MG[k]=FISH[k].g;PRICE[k]=FISH[k].p});
Object.assign(SP,{ma:['sardina','orata','tonno','cavalluccio'],mb:['orata','tonno','spada','cavalluccio'],mc:['sardina','tonno','spada','cavalluccio']});
QD.find(q=>q.id==='m7').ch.push({l:'Offrire una perla del mare',d:'I Thalassi sanno cosa vale un dono.',race:'thalassi',fl:{ponte:'perla'},tx:'Dorn rigira la perla alla luce e si schiarisce la voce. «Sei dei pochi che sanno come si tratta. Passa.»'});
QD.push(
{rc:'thalassi',id:'qm1',t:'Legname per le reti',origin:1,giver:'imara',ty:'gat',tg:'legno',n:3,x:30,g:6,elv:1,min:1,tx:'Sono Imara, e le reti del Porto si sono strappate con la burrasca. Portami tre pezzi di legno di deriva dalla banchina: l’Ascia che hai è quella di tuo padre, tienila bene.'},
{rc:'thalassi',id:'qm2',t:'Granchi sulla scogliera',origin:1,pre:'qm1',giver:'imara',ty:'kill',tg:'granchio',n:2,x:40,g:8,elv:1,min:1,tx:'I granchi di scoglio hanno invaso la Scogliera dei Gabbiani e tagliano le lenze a chi pesca. Scacciane due.'},
{rc:'thalassi',id:'qm3',t:'Un messaggio per Veyra',origin:1,dn:'Serah legge il messaggio di Imara: «Il mare vi manda una delle sue. Chi sa leggere le maree sa anche leggere gli uomini.»',pre:'qm2',giver:'imara',ty:'talk',tg:'serah',n:1,x:50,g:10,elv:2,min:1,tx:'Porta questo messaggio a Serah, all’Avamposto di Veyra. La strada è lunga e a terra le maree non contano, ma tu saprai orientarti.'},
{id:'tm1',t:'Reti nuove',giver:'imara',pre:'qm3',ty:'gat',tg:'sardina',n:4,x:50,g:12,elv:2,min:2,tx:'Chi ha le reti nuove vuole festeggiare con pesce fresco. Pesca quattro sardine al Porto e portamele.',dn:'Imara le sistema in una cassetta di sale. «Brava mano. Il mare ti riconosce già.»'},
{id:'tm2',t:'Il canto dei gabbiani',giver:'baku',ty:'kill',tg:'gabbiano',n:3,x:60,g:14,elv:2,min:2,tx:'Sono Baku, e da quarant’anni pesco su questa scogliera. I gabbiani sono diventati sfrontati e rubano le esche dalle mani. Abbattine tre, ma senza rabbia.',dn:'Baku ride a bocca chiusa. «Domani qualcuno tornerà a cantare, non a rubare.»'},
{id:'tm3',t:'Ostriche di Anaya',giver:'anaya',ty:'gat',tg:'perla',n:3,fr:['maree',1],x:110,g:26,elv:4,min:4,tx:'Anaya: «Le perle migliori vivono nei banchi bassi dell’Isola. Se la Flotta ti conosce, raccogline tre per me. Non strappare i gusci: aprili piano.»',dn:'Anaya le tiene in mano come uova. «Ognuna è un anno di mare. Ti devo qualcosa.»'},
{id:'tm4',t:'Meduse sui banchi',giver:'anaya',pre:'tm3',ty:'kill',tg:'medusa',n:3,fr:['maree',1],x:120,g:28,elv:4,min:4,tx:'Le meduse bruciano i tuffatori. Scacciane tre dai banchi bassi: non servono arpioni, basta il rispetto.',dn:'Anaya si lascia scivolare in acqua, ride e riemerge. «Si respira meglio, ora.»'},
{id:'tmb',t:'La Regina delle Murene',giver:'anaya',pre:'tm4',ty:'kill',tg:'regina',n:1,at:'mc',boss:['regina','murena'],x:300,g:60,elv:6,min:5,tx:'Anaya: «Una Murena enorme dorme sotto i banchi e si sveglia solo quando l’olio filtra fino all’acqua. Se la lasciamo stare, ci inghiotte. Se la affronti, forse la quiete torna.»',cq:'La Regina si ritira e ti guarda dal fondo, con un occhio d’argento. Anaya trattiene il fiato.',ch:[
 {l:'Chiudere il suo covo con un sasso',d:'Il mare resta sicuro. Più reputazione con la Flotta delle Maree e più Corone.',fl:{regina:'chiusa'},rep:[['maree',200]],gm:1.4,tx:'Il sasso scende lento. Il covo si chiude, e per un momento l’acqua smette di tremare. Anaya annuisce.'},
 {l:'Lasciarla tornare libera',d:'Rispetti il mare. Più esperienza e reputazione col Cerchio delle Liane.',fl:{regina:'libera'},rep:[['liane',120]],xm:1.3,tx:'La Regina scivola via nell’acqua più profonda. Anaya la saluta con due dita sulla fronte.'}]}
);
