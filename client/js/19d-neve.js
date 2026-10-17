/* I NIVARI: Distese Gelate. Origine, luoghi, mostri, pesca nel ghiaccio, missioni e reputazione della Gente della Brina. */
RN.nivari='Nivari';FRC.nivari='brina';delete FZ.brina.wip;FZ.brina.it=['a14','a15'];RG.neve.wip=0;ORG.nivari='qn3';
Object.assign(ARM,{a14:{n:'Pelliccia della Brina',v:62,r:2,fz:1},a15:{n:'Manto del Ghiacciaio',v:100,r:3,fz:1}});
Object.assign(NPC,{aneka:'Aneka, capocaccia dell’Accampamento',tuur:'Tuur, cacciatore del passo',ilsa:'Ilsa, guaritrice del freddo'});
Object.assign(NR_ROLE,{aneka:'Capocaccia, missioni d’origine',tuur:'Cacciatore, missioni',ilsa:'Guaritrice, missioni'});
Object.assign(LC.nb,{wip:0,pal:['#3a4a60','#0e121c'],np:['aneka','ilsa'],gat:['legno','erba']});
Object.assign(LC.na,{wip:0,pal:['#4a5a70','#10141c'],np:['tuur'],mb:['lupob','gelo'],gat:['minerale','erba']});
Object.assign(LC.nc,{wip:0,pal:['#5a7a8a','#101c24'],mb:['orso','gelo']});
Object.assign(M,{lupob:{n:'Lupo bianco',lv:1,hp:170,at:7},orso:{n:'Orso delle nevi',lv:4,hp:430,at:13},gelo:{n:'Spirito di gelo',lv:4,hp:330,at:12},mammut:{n:'Mammut dalle zanne di ghiaccio',lv:7,hp:900,at:16,sp:{n:'Carica glaciale',cd:9,m:1.8}}});
Object.assign(LM,{lupob:[['pelle',.65,1,1]],orso:[['pelle',.7,1,2]],gelo:[['erba',.3,1,1],['frammento',.05,1,1]],mammut:[['pelle',1,2,3],['frammento',.6,1,2]]});
ND.push(
{id:'nb1',loc:'nb',n:'Legna secca del campo',k:'legno',m:'legno',g:1,lv:1,ch:3,d:20,y:1},
{id:'nb2',loc:'nb',n:'Erbe sotto la neve',k:'erba',m:'erba',g:1,lv:1,ch:3,d:15,y:1},
{id:'na1',loc:'na',n:'Vena nel ghiaccio',k:'minerale',m:'minerale',g:1,lv:1,ch:3,d:20,y:1},
{id:'na2',loc:'na',n:'Licheni medicinali',k:'erba',m:'erba',g:1,lv:2,ch:3,d:25,y:1});
Object.assign(FISH,{salmone:{n:'Salmone d’acqua fredda',r:0,p:5,g:'🐟',lv:1,w:50},salvelino:{n:'Salvelino',r:0,p:6,g:'🐠',lv:1,w:40},storione:{n:'Storione',r:1,p:12,g:'🐟',lv:2,w:22},cristallo:{n:'Pesce di cristallo',r:2,p:26,g:'💎',lv:4,w:8},bianco:{n:'Storione bianco',r:3,p:58,g:'✨',lv:6,w:2}});
['salmone','salvelino','storione','cristallo','bianco'].forEach(k=>{MN[k]=FISH[k].n;MRAR[k]=FISH[k].r;MG[k]=FISH[k].g;PRICE[k]=FISH[k].p});
Object.assign(SP,{nb:['salmone','salvelino','storione','bianco'],nc:['salvelino','storione','cristallo','bianco']});
QD.find(q=>q.id==='m7').ch.push({l:'Parlare da Nivari',d:'La Gente della Brina non spreca parole.',race:'nivari',fl:{ponte:'brina'},tx:'Dorn ti guarda i denti, poi le mani. «Gente del ghiaccio. Dite poco, ma mantenete. Passa.»'});
QD.push(
{rc:'nivari',id:'qn1',t:'Legna per i fuochi',origin:1,giver:'aneka',ty:'gat',tg:'legno',n:3,x:30,g:6,elv:1,min:1,tx:'Sono Aneka, e senza legna il campo non supera la notte. Portami tre pezzi di legno secco: l’Ascia che hai era di tuo padre, usala con cura.'},
{rc:'nivari',id:'qn2',t:'Lupi sul passo',origin:1,pre:'qn1',giver:'aneka',ty:'kill',tg:'lupob',n:2,x:40,g:8,elv:1,min:1,tx:'I lupi bianchi si avvicinano al Passo del Gelo e spaventano le slitte. Scacciane due.'},
{rc:'nivari',id:'qn3',t:'Un messaggio per Veyra',origin:1,dn:'Serah legge il messaggio di Aneka: «Il ghiaccio vi manda una delle sue. Chi cammina sulla brina non scivola due volte.»',pre:'qn2',giver:'aneka',ty:'talk',tg:'serah',n:1,x:50,g:10,elv:2,min:1,tx:'Porta questo messaggio a Serah, all’Avamposto di Veyra. La strada passa dalle Gole di Karuun: copriti, e non fidarti del fuoco che non conosci.'},
{id:'tn1',t:'Pesca nel ghiaccio',giver:'aneka',pre:'qn3',ty:'gat',tg:'salmone',n:4,x:50,g:12,elv:2,min:2,tx:'Il campo ha fame di pesce fresco. Fai un buco nel ghiaccio e pesca quattro salmoni.',dn:'Aneka li appende al fumo. «Buon braccio. Il lago ti sopporta.»'},
{id:'tn2',t:'Tracce nella neve',giver:'tuur',ty:'kill',tg:'lupob',n:3,x:60,g:14,elv:2,min:2,tx:'Sono Tuur, e conosco ogni passo di questa montagna. I lupi sono troppo vicini alle slitte. Abbattine tre, senza lasciare feriti.',dn:'Tuur annuisce piano. «Silenzio, adesso. La neve ricorda.»'},
{id:'tn3',t:'Erbe sotto la neve',giver:'ilsa',ty:'gat',tg:'erba',n:4,fr:['brina',1],x:90,g:20,elv:3,min:3,tx:'Sono Ilsa, e curo chi ha le mani nere di gelo. I licheni del Passo sono rari, ma bastano quattro erbe: portale intere e non strapparle.',dn:'Ilsa le avvolge in un panno di lana. «Ogni mano salvata è un altro inverno.»'},
{id:'tn4',t:'Spiriti nel gelo',giver:'ilsa',pre:'tn3',ty:'kill',tg:'gelo',n:3,fr:['brina',1],x:120,g:28,elv:4,min:4,tx:'Gli spiriti di gelo raffreddano il sangue di chi li incontra. Scacciane tre dal Passo e dal Lago, con rispetto.',dn:'Ilsa si porta la mano alla fronte. «Si respira. Il gelo ora ha pace.»'},
{id:'tnb',t:'Il Mammut dei Ghiacci',giver:'tuur',pre:'tn2',ty:'kill',tg:'mammut',n:1,at:'nc',boss:['mammut','lupob'],x:320,g:65,elv:6,min:5,tx:'Tuur: «Un mammut dalle zanne di ghiaccio è sceso al Lago, e nessun Nivari osa avvicinarsi. Se lo scacci, il campo avrà carne e pelli per l’inverno. Se lo uccidi, avremo un mammut in meno nel mondo.»',cq:'Il Mammut si lascia cadere nella neve e ti guarda a lungo. Tuur aspetta, senza parlare.',ch:[
 {l:'Dare il colpo finale e portare le pelli al campo',d:'Il campo ha di che vivere. Più reputazione con la Gente della Brina e più Corone.',fl:{mammut:'cacciato'},rep:[['brina',200]],gm:1.4,tx:'Le pelli arrivano al campo su tre slitte. Tuur le conta una per una e dice, per la prima volta, il tuo nome.'},
 {l:'Lasciarlo andare verso nord',d:'Rispetti il mondo. Più esperienza e reputazione col Cerchio delle Liane.',fl:{mammut:'libero'},rep:[['liane',120]],xm:1.3,tx:'Il Mammut barcolla via nella tormenta. Tuur resta immobile, poi tocca il ghiaccio con due dita.'}]}
);
