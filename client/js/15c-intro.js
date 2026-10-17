/* Introduzione e guida "Primi passi" */
const INTRO={
umano:{t:'Frontiera del Vespro',s:'Sei nato dove la strada incontra la nebbia. Gli Umani del Vespro non hanno la forza dei Kharun né i sensi dei Velhiri: hanno mercati, patti e una lanterna che da generazioni tiene lontano il buio.',b:'Versatile: +5% Corone dalle missioni.'},
kharun:{t:'Gole di Karuun',s:'Vivi sotto la roccia, dove il fuoco delle forge non si spegne mai. I Kharun reggono i colpi come la pietra che li ha cresciuti. Ma un messaggio dell’Anziano ti chiama a Veyra, in superficie.',b:'Robusto: +10% vita.'},
nivari:{t:'Distese Gelate',s:'I Nivari vivono dove la neve non si scioglie mai, seguendo le tracce dei lupi e le rotte del ghiaccio. La capocaccia Aneka ha un messaggio per Veyra, e la strada passa dalle montagne.',b:'Cacciatore: +15% di probabilità di materiali extra dai nemici sconfitti.'},
draeth:{t:'Cenere di Draeth',s:'I Draeth vivono sotto un cielo rosso, tra vulcani e ossa antiche, e sanno trovare ciò che altri non vedono. La custode Zahira ha un messaggio per Veyra, ma la strada è fredda.',b:'Cercatore di reliquie: +15% di probabilità di raccolto extra su materiali rari.'},
thalassi:{t:'Arcipelago di Marea',s:'I Thalassi vivono tra barche, banchine e isole basse, e leggono il mare come altri leggono il cielo. Ma qualcosa filtra nell’acqua, e la capoporto Imara ha un messaggio per Veyra.',b:'Marinaio: viaggi più rapidi del 10% e pesca più facile.'},
velhiri:{t:'Selva dei Mille Anelli',s:'I Velhiri vivono tra le liane, ascoltando il bosco. Sanno dove crescono le erbe migliori e quando il legno è pronto. Ma qualcosa disturba la Selva, e l’Anziana Ylen ha bisogno di te.',b:'Raccoglitore: +15% probabilità di raccolto extra su erba e legno.'}};
const INTRO_P=[
['Il mondo di Nymeria','Nymeria è un mondo di strade, selve e profondità, in cui ogni popolo ha imparato a vivere nel proprio ambiente. Tutte le storie si incontrano a Veyra. Sei un viandante e il tuo nome conta ancora poco: lo farai crescere con le tue azioni.'],
['Come si gioca','Le cinque schede in basso sono tutto ciò che serve:<br><br><b>Mondo</b>: dove sei, chi c’è, cosa raccogliere, dove andare.<br><b>Eroe</b>: scheda e abilità.<br><b>Borsa</b>: equipaggiamento, oggetti, materiali e Corone.<br><b>Diario</b>: missioni, imprese del giorno e mappa.<br><b>Menu</b>: salvataggio e segnalazioni.<br><br>Il riquadro «Prossima missione» nel Mondo ti dice sempre cosa fare e dove andare.'],
['Gli scontri','Un combattimento sta in una sola schermata. L’attacco base parte da solo. Tocca le quattro abilità quando sono cariche e scegli il bersaglio toccando un nemico. Attento ai colpi rossi: quando un nemico carica un colpo forte compare un pulsante. PARA riduce il danno (se tocchi all’ultimo secondo lo annulli e contrattacchi), SCHIVA va premuto solo quando diventa dorato, SPEZZA interrompe e stordisce il nemico (costa energia). Ogni classe ha il suo stile: il Guardiano para con più margine e contrattacca forte, l’Ombra schiva con più margine, Spadaccino e Arciere contrattaccano di più ma hanno meno margine, Bardo e Mago spezzano a costo minore, i curatori guariscono se reagiscono bene. Se lasci fare alla tattica automatica reagisce al posto tuo, ma sbaglia più spesso. Puoi fuggire quando vuoi, senza perdere niente.'],
['Raccogliere e creare','Tutti possono raccogliere con lo strumento giusto. A Veyra scegli un solo mestiere di creazione, per sempre: Fabbro, Tessitore, Carpentiere o Alchimista. I pezzi migliori li fanno gli artigiani e portano la loro firma.']];
function introSheet(p){p=+p||0;const R=INTRO[S.race]||INTRO.umano,tot=INTRO_P.length+2;let h,btn;
 if(p===0){h='<h2>'+R.t+'</h2><p>'+R.s+'</p><p class="mu"><b>'+RN[S.race]+'</b>: '+R.b+'</p>'}
 else if(p<=INTRO_P.length){h='<h2>'+INTRO_P[p-1][0]+'</h2><p>'+INTRO_P[p-1][1]+'</p>'}
 else{const n=nextQ(),at=n&&Object.keys(LC).find(k=>(LC[k].np||[]).includes(n.giver));
  h='<h2>Il tuo primo passo</h2><p>'+(n?'Cerca <b>'+NPC[n.giver].split(',')[0]+'</b>'+(at?' a <b>'+LC[at].n+'</b>':'')+' e accetta la missione <b>'+n.t+'</b>.':'Esplora il mondo.')+'</p><p class="mu">Nel Mondo trovi la guida <b>Primi passi</b>: ti accompagna finché non hai imparato le basi.</p>'}
 S.intro=1;save();
 ov.hidden=false;ov.innerHTML='<div class="sheet"><small class="mu">'+(p+1)+' / '+tot+'</small>'+h+'<div class="brow">'+(p<tot-1?'<button data-a="intro" data-v="'+(p+1)+'">Avanti</button><button data-a="ok">Salta</button>':'<button data-a="ok">Inizia</button>')+'</div></div>'}
function ftSet(k){if(!S||!k)return;S.ft=S.ft||{};if(!S.ft[k]){S.ft[k]=1;save()}}
function ftSteps(){const f=S.ft||{},n=nextQ();return[
 ['qa','Accetta la tua prima missione','Tocca «Parla con…» nel riquadro della missione.'],
 ['mp','Apri la Mappa','Il pulsante in alto a destra nel Mondo. Il rombo bianco indica dove andare.'],
 ['mv','Spostati in un altro luogo','Tocca un luogo vicino. Il viaggio richiede qualche secondo.'],
 ...(Object.keys(S.tools||{}).length?[['ga','Raccogli un materiale','Dove vedi un punto di raccolta, usa lo strumento.']]:[]),
 ['ki','Vinci uno scontro','Cerca un nemico nel Mondo. L’attacco base parte da solo.'],
 ['eq','Indossa un oggetto trovato','Borsa → tocca l’oggetto → «Equipaggia». Chi trovi in battaglia spesso è meglio di ciò che hai.'],
 ['qd','Consegna una missione','Torna da chi te l’ha data per ricevere la ricompensa.']].map(a=>a.concat(!!f[a[0]]))}
function ftCheck(){if(!S||!S.intro||!S.ft||S.ft.hide||S.ft.done)return;if(ftSteps().every(s=>s[3])){S.ft.done=1;S.g+=15;save();toast('Primi passi completati: +15 Corone.')}}
function ftHtml(){if(!S||!S.intro||(S.ft&&(S.ft.hide||S.ft.done)))return'';const st=ftSteps(),d=st.filter(s=>s[3]).length,cur=st.find(s=>!s[3]);
 return'<div class="card"><div class="row"><b>Primi passi</b><small>'+d+' / '+st.length+'</small></div>'+st.map(s=>'<div class="ftr'+(s[3]?' on':'')+(s===cur?' cur':'')+'"><span aria-hidden="true">'+(s[3]?'✔':s===cur?'▸':'○')+'</span><span>'+s[1]+(s===cur?'<small>'+s[2]+'</small>':'')+'</span></div>').join('')+'<button data-a="fth">Nascondi la guida</button></div>'}
