/* I DRAETH: Cenere di Draeth. Origine, luoghi, mostri, missioni e reputazione dei Figli della Cenere. */
RN.draeth='Draeth';FRC.draeth='cenere';delete FZ.cenere.wip;FZ.cenere.it=['a16','a17'];RG.cenere.wip=0;ORG.draeth='qd3';
Object.assign(ARM,{a16:{n:'Veste di Cenere',v:62,r:2,fz:1},a17:{n:'Corazza d’Ossa',v:100,r:3,fz:1}});
Object.assign(NPC,{zahira:'Zahira, custode del Bastione',orhan:'Orhan, cercatore di ossa',selin:'Selin, vetraia di cenere'});
Object.assign(NR_ROLE,{zahira:'Custode, missioni d’origine',orhan:'Cercatore, missioni',selin:'Vetraia, missioni'});
Object.assign(LC.db,{wip:0,pal:['#5a2a1e','#140808'],np:['zahira','selin'],gat:['minerale']});
Object.assign(LC.da,{wip:0,pal:['#4a2a24','#120808'],np:['orhan'],mb:['scorpione','sciacallo'],gat:['frammento']});
Object.assign(LC.dc,{wip:0,pal:['#3a2420','#0e0606'],mb:['cenerino','ossuto'],gat:['minerale']});
Object.assign(M,{scorpione:{n:'Scorpione di cenere',lv:1,hp:160,at:7},sciacallo:{n:'Sciacallo di cenere',lv:2,hp:190,at:8},cenerino:{n:'Elementale di cenere',lv:4,hp:330,at:12},ossuto:{n:'Guardiano d’ossa',lv:5,hp:380,at:13},vermec:{n:'Verme di cenere',lv:7,hp:900,at:16,sp:{n:'Fuoco nero',cd:9,m:1.8}}});
Object.assign(LM,{scorpione:[['minerale',.25,1,1]],sciacallo:[['pelle',.55,1,1]],cenerino:[['minerale',.4,1,2],['frammento',.06,1,1]],ossuto:[['frammento',.12,1,1],['minerale',.3,1,2]],vermec:[['frammento',.7,1,2],['ferro_puro',.5,1,2]]});
ND.push(
{id:'db1',loc:'db',n:'Vene di ossidiana',k:'minerale',m:'minerale',g:1,lv:1,ch:3,d:20,y:1},
{id:'da1',loc:'da',n:'Ossa antiche',k:'minerale',m:'frammento',g:2,lv:3,ch:1,d:60,y:1},
{id:'da2',loc:'da',n:'Filone di cenere',k:'minerale',m:'minerale',g:1,lv:1,ch:3,d:20,y:1},
{id:'dc1',loc:'dc',n:'Vene nere delle dune',k:'minerale',m:'minerale',g:1,lv:2,ch:3,d:25,y:1});
QD.find(q=>q.id==='m7').ch.push({l:'Offrire una reliquia di cenere',d:'I Draeth sanno cosa vale una reliquia.',race:'draeth',fl:{ponte:'reliquia'},tx:'Dorn riconosce il segno e fa un passo indietro. «Dalla Cenere. Dicono che vendiate più di quello che avete. Passa.»'});
QD.push(
{rc:'draeth',id:'qd1',t:'Ossidiana per il Bastione',origin:1,giver:'zahira',ty:'gat',tg:'minerale',n:3,x:30,g:6,elv:1,min:1,tx:'Sono Zahira, e il Bastione si regge sulla pietra nera. Le mura hanno crepe nuove: portami tre pezzi di minerale dalle vene qui attorno. Il Piccone che hai era di tuo padre.'},
{rc:'draeth',id:'qd2',t:'Scorpioni sul sentiero',origin:1,pre:'qd1',giver:'zahira',ty:'kill',tg:'scorpione',n:2,x:40,g:8,elv:1,min:1,tx:'Gli scorpioni di cenere stanno invadendo il Sentiero e pungono i carovanieri. Scacciane due.'},
{rc:'draeth',id:'qd3',t:'Un messaggio per Veyra',origin:1,dn:'Serah legge il messaggio di Zahira: «La Cenere vi manda uno dei suoi. Chi ha la pelle bruciata non teme il fuoco, ma lo rispetta.»',pre:'qd2',giver:'zahira',ty:'talk',tg:'serah',n:1,x:50,g:10,elv:2,min:1,tx:'Porta questo messaggio a Serah, all’Avamposto di Veyra. La strada è lunga e fuori dalla cenere l’aria è fredda: tienilo caro.'},
{id:'td1',t:'Ossa vecchie',giver:'orhan',ty:'gat',tg:'frammento',n:3,x:80,g:18,elv:3,min:3,tx:'Sono Orhan, e cerco ossa nei posti dove nessuno scava. Se hai buona mano con il Piccone, portami tre frammenti antichi dal Sentiero.',dn:'Orhan li gira tra le dita, uno a uno. «Qualcuno ha dormito qui, molto tempo fa.»'},
{id:'td2',t:'Sciacalli sul sentiero',giver:'orhan',ty:'kill',tg:'sciacallo',n:3,x:60,g:14,elv:2,min:2,tx:'Gli sciacalli di cenere seguono i carovanieri e li derubano. Abbattine tre, ma lascia i cuccioli.',dn:'Orhan sorride appena. «Così si lavora in pace.»'},
{id:'td3',t:'Vetro nero',giver:'selin',ty:'gat',tg:'minerale',n:4,fr:['cenere',1],x:90,g:20,elv:3,min:3,tx:'Sono Selin, e soffio vetro con la cenere del vulcano. Portami quattro pezzi di minerale nero dalle dune e ti insegno a vedere il fuoco dentro.',dn:'Selin lo getta nella fornace. Il vetro si colora di rosso. «Guarda: respira.»'},
{id:'td4',t:'Fuochi senza fiamma',giver:'selin',pre:'td3',ty:'kill',tg:'cenerino',n:3,fr:['cenere',1],x:120,g:28,elv:4,min:4,tx:'Gli elementali di cenere bruciano senza fiamma e rovinano le fornaci. Scacciane tre dalle Dune Nere.',dn:'Selin pulisce il bancone. «Ora il fuoco torna a obbedirmi.»'},
{id:'tdb',t:'Il Verme di cenere',giver:'orhan',pre:'td2',ty:'kill',tg:'vermec',n:1,at:'dc',boss:['vermec','cenerino'],x:320,g:65,elv:6,min:5,tx:'Orhan: «Un verme di cenere grande come un carro ha scavato sotto le Dune. Se lo lasciamo, il Bastione crolla. Se lo uccidi, perdiamo una delle ultime creature del fuoco.»',cq:'Il Verme si ritira nel buco che ha scavato e ti guarda con gli occhi di brace. Orhan non respira.',ch:[
 {l:'Chiudere il buco con la pietra',d:'Il Bastione è salvo. Più reputazione con i Figli della Cenere e più Corone.',fl:{vermec:'chiuso'},rep:[['cenere',200]],gm:1.4,tx:'Le pietre calano una dopo l’altra. Il buco si chiude con un sospiro di fuoco. Orhan si siede sulla cenere.'},
 {l:'Lasciarlo scendere più a fondo',d:'Rispetti la creatura. Più esperienza e reputazione con il Clan della Forgia.',fl:{vermec:'libero'},rep:[['forg',120]],xm:1.3,tx:'Il Verme scivola verso il basso in un fiume di brace. Orhan lo guarda finché la cenere non si posa.'}]}
);
