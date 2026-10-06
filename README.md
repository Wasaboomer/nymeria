# Nymeria Character Progression & First Idle Loop 0.1 — M5

M5 aggiunge XP/livelli, crescita reale delle statistiche e un primo ciclo persistente di spedizioni alla base Equipment/Inventory, Combat e Class/Build. Base Equipment & Inventory 0.1: manichino SVG e art direction esistenti, 16 slot, inventario di 49 oggetti demo (44 originali più un kit Mail completo) e regole centralizzate. Nessun framework, backend, build obbligatoria o dipendenza runtime. GitHub Pages può servire direttamente la radice.

## Avvio e test

```sh
python3 -m http.server 8000
```

Aprire la pagina sulla porta 8000. La persistenza usa l'origine HTTP corrente: lo stato locale di sviluppo non viene trasferito automaticamente a GitHub Pages o a un altro browser.

Per eseguire i test reali del browser, con server attivo e Playwright disponibile nell'ambiente di sviluppo:

```sh
node tests/browser.cjs
```

Il cloud fornisce già Playwright e Chromium. In altri ambienti, installare separatamente Playwright come strumento di sviluppo; non serve alla pagina. Variabili opzionali: `NYMERIA_TEST_URL` (default `http://127.0.0.1:8000`) e `NYMERIA_CHROMIUM` (default `/usr/bin/chromium`).

I test touch coprono 320/390/430 px: tutte le famiglie arma/supporto, 2H, slot doppi, equip/rimozione corazza, confronto, totali e Potere, filtri e ordinamento, effetti descrittivi, persistenza, Reset demo, overflow e errori JS. A 390 px verificano inoltre i 49 oggetti demo: equipaggiamento degli utilizzabili e rifiuto di Cloth/Leather e i relativi gruppi SVG. Controllano storage negato e normalizzazione di dati incoerenti. Chromium in emulazione mobile non sostituisce una prova su Safari/iPhone fisico.

## Moduli

| File | Responsabilità |
| --- | --- |
| `items.js` | Asset SVG e palette del manichino originale; nessuna statistica gameplay. |
| `equipment-data.js` | Catalogo, 16 slot, rarità, icone e metadati degli effetti. |
| `equipment.js` | Stato, compatibilità, equip/rimozione, confronto, statistiche, Potere e persistenza. |
| `character.js` | Rendering dei gruppi SVG da `appearanceItem` e riepiloghi statistiche. |
| `inventory.js` | Pannelli equipaggiamento/inventario, filtri, ordinamento e dialogo di confronto. |
| `app.js` | Collegamento dei moduli e editor dell'aspetto esistente. |
| `styles.css` / `index.html` | UI, struttura, materiali e animazioni del prototipo. |

## Modello e regole

Ogni oggetto ha `id`, `name`, `slot` (famiglia), `type`, `rarity`, `itemLevel`, `requiredLevel`, `stats`, `description`, `equipped`, `effects` e `appearance`. Le armi principali hanno inoltre `handedness`, `weaponType` e `allowedSupports`. Tutti gli oggetti demo richiedono livello 1, con competenza armature richiesta; la regola sul requisito di livello è già centralizzata.

I 16 slot concreti contengono `{ equippedItem, appearanceItem }`. Le famiglie `ring`, `earring` e `bracelet` possono essere assegnate a due destinazioni indipendenti; una stessa istanza non può occupare due slot. Il dialogo permette di scegliere SX/DX e confronta con la destinazione selezionata. Le statistiche vengono lette esclusivamente da `equippedItem`, il rendering esclusivamente da `appearanceItem`: il glamour completo non è ancora implementato.

Le armi 2H (bastone, spadone, lancia) bloccano logicamente il supporto. Un supporto incompatibile, anche dopo cambio di arma 1H, torna nella sacca. Il tentativo di equipaggiare direttamente un supporto incompatibile viene rifiutato senza modificare lo stato. Arco e balestra occupano il solo slot principale nel modello demo (`1H` come occupazione logica) per consentire faretra/dardi nel supporto; non indica una tecnica fisica di impugnatura.

L'inventario mostra l'intera collezione con posizione e indicatore equipaggiato; il conteggio distingue sacca ed equipaggiati. Nessun oggetto viene duplicato o perso durante una sostituzione. Il confronto mostra la variazione totale dopo l'operazione, compresa la rimozione di un supporto incompatibile o lo spostamento da SX a DX.

Statistiche base al livello 1: Forza 12, Agilità 15, Vigor 14, Spirito 11; Critico, Velocità e Armatura partono da zero. Il Potere è calcolato in un solo punto:

```text
2 × Forza + 2 × Agilità + Vigor + 2 × Spirito
+ 3 × Critico + 2 × Velocità + Armatura
```

Critico e Velocità sono punti percentuali nel prototipo. Gli effetti speciali sono dati strutturati (`trigger`, `modifier` o `status`). Combat 0.1 interpreta il solo hook `thorn-bleed` della Faretra delle Spine; gli altri effetti restano descrittivi.

## Persistenza e rappresentazione

La chiave `nymeria.equipment.v1` conserva inventario, equipaggiamento, configurazione personaggio, statistiche e Potere. Ogni modifica viene salvata automaticamente; **Salva aspetto** salva anche l'intero stato. Al caricamento i dati vengono validati contro il catalogo, i duplicati vengono eliminati e statistiche/Potere ricalcolati. L'aspetto del vecchio prototipo viene importato da `nymeria.character.v1` se manca il nuovo salvataggio. **Reset demo** ripristina equipaggiamento e aspetto demo, conservando progressione, risorse e loot ottenuto. **Casuale** cambia soltanto capelli, occhi e tintura, mantenendo l'equipaggiamento.

Il rig conserva la geometria originale e aggiunge gruppi per i nuovi slot. Aggiornare uno slot non ricrea i figli degli altri gruppi. La tintura resta nel solo canale degli inserti della corazza, senza filtri globali. Gli slot vuoti possono mostrare abiti base del manichino, che non conferiscono statistiche. Alcuni oggetti condividono una silhouette provvisoria; gli accessori più piccoli sono segni SVG tecnici, non asset definitivi. `nymeria-art.png` è conservata e non utilizzata.

Per un nuovo oggetto, aggiungere dati a `equipment-data.js` e un asset/mapping a `character.js`; le regole di compatibilità restano in `equipment.js`. Non sono implementati party, dungeon, crafting, classi definitive, backend, multiplayer o monetizzazione.


## Class & Build 0.1 — M4

Il tab **Classe** permette il cambio libero tra **Custode** e **Cacciatore** e la selezione di una tendenza principale. Conserva l'inventario; le armature incompatibili tornano in sacca, senza sostituzioni automatiche. I requisiti di combattimento sono **Spada 1H + Scudo** e **Arco + Faretra**: la UI spiega il kit richiesto e gli oggetti attuali, porta a Equipaggiamento e rifiuta l'avvio se il kit manca. Anche un profilo marcato `kitValid: false` non può avviare il motore.

### Architettura estesa

| Modulo | Responsabilità |
| --- | --- |
| `classes-data.js` | Identità, ruolo, risorsa, statistiche preferite, tipi arma/supporto, abilità, passiva, modificatori, AUTO, sei tendenze, metriche di riepilogo. |
| `class-system.js` | Selezione/persistenza, requisito kit e composizione di un profilo di combattimento. Nessuna copia delle statistiche degli oggetti. |
| `build-system.js` | Compatibilità per classe, pesi/score, componenti effetti e hook futuri per sinergie/set; consigli per gli oggetti posseduti. |
| `class-ui.js` | Pannello Classe, schede abilità, selezione tendenza e pesi dichiarati provvisori. |
| `combat-data.js` | Formule comuni, kit legacy, nemico, effetti/hook, condizioni e normalizzazione parametrizzata sul profilo. |
| `combat-engine.js` | Motore puro a passi fissi: risorse, abilità, effetti, mitigazione/blocco, log e risultati. Non confronta ID/nome delle classi. |
| `combat-ui.js` | Bridge all'Equipment System, un clock RAF, risorsa sotto HP, strategie separate per classe e risultati. |
| `inventory.js` | UI esistente con indicatori discreti e score nel confronto. |
| `navigation.js` | Bootstrap indipendente dai moduli; cinque tab, tastiera e `hidden`. |

Il motore continua a usare copie di `Equipment.state.resultingStats` e degli effetti degli oggetti effettivamente equipaggiati. `create({ stats, effects, rules, seed, profile })` estende la vecchia API: senza `profile` il kit Combat 0.1 rimane disponibile per regressione. Il profilo contiene abilità, risorsa, modificatori, effetti, AUTO e metadati classe/build. La simulazione non accede a DOM/storage e non muta Equipment. Per aggiungere una classe usare dati e hook generici; una meccanica nuova richiederà un hook del motore, non un controllo sul nome della classe.

Cambiare classe, tendenza o equipaggiamento azzera lo scontro (anche in pausa) e aggiorna il profilo. Cambiare soltanto capelli/occhi/tintura aggiorna il manichino senza interromperlo. I preset AUTO seguono la build; PERSONALIZZATA mantiene ordine e condizioni separatamente per ciascuna classe. Disponibili otto condizioni: Sempre, debuff assente, buff assente, HP nemico < X%, HP giocatore < X%, abilità pronta, Risorsa > X, Risorsa < X. Si può scegliere quale buff/debuff controllare. Tutte le soglie sono confronti stretti.

### Risorse e abilità

**Cacciatore:** Concentrazione iniziale 100/100, rigenerazione 6/s; Tiro Rapido recupera 4 punti. Statistiche desiderate: Agilità, Critico e Velocità. Il kit conserva Sanguinamento e il vero hook `thorn-bleed` della Faretra delle Spine.

| Abilità | Danno (base × coefficiente + bonus) / effetto | CD | Costo |
| --- | --- | --- | --- |
| Tiro Rapido | 0,65 + 8; recupero 4 | 0 s | 0 |
| Freccia Lacerante | 0,55 + 4; Sanguinamento | 4 s | 12 |
| Tiro Potente | 1,8 + 12 | 6 s | 28 |
| Colpo Finale | 0,85 + 8; ×2,3 sotto 25% HP nemico | 5 s | 22 |
| Passo del Vento | 6 s: Agilità +8, Velocità +20 punti, Schivata +12 punti | 12 s | 10 |

**Custode:** Risolutezza iniziale 0/100, nessuna rigenerazione passiva; +10 quando un colpo raggiunge il giocatore, +18 aggiuntivi se bloccato. Un colpo schivato non genera risorsa. I costi limitano la difesa attiva e il contrattacco. Passiva **Baluardo**, con kit valido: Armatura ×1,6, HP ×1,15, mitigazione aggiuntiva 12%, blocco 23% che dimezza il colpo. Statistiche desiderate: Vigor, Armatura, Forza.

| Abilità | Danno / effetto | CD | Costo |
| --- | --- | --- | --- |
| Fendente | 0,65 × base + 6 | 0 s | 0 |
| Guardia Ferrea | 6 s: mitigazione +18 punti, blocco +25 punti | 10 s | 15 |
| Colpo di Scudo | 0,9 × base + 10; Sbilanciato: danno nemico −15% per 4 s | 5 s | 10 |
| Ritorsione | 1,15 × base + 8 + 1,6 × Risolutezza spesa | 4 s | 30 |
| Ultimo Baluardo | 7 s: mitigazione +35 punti, blocco +20 punti; AUTO sotto 35% HP | 20 s | 20 |

I guadagni sono limitati al massimo; la metrica «generata» conta i punti effettivamente recuperati, escludendo quelli persi al cap. I costi vengono verificati prima della selezione/azione e non rendono negativa la risorsa. Il modello supporta anche perdita al secondo (`decay`, attualmente 0 per entrambe le classi) e guadagni da eventi. Durante la pausa non rigenera e non decade nulla.

### Sei tendenze reali

| Classe / tendenza | Effetto sul combattimento | AUTO (in ordine) |
| --- | --- | --- |
| Custode / Baluardo | Blocco +12 punti; Guardia dura 8 s e aggiunge altri 8 punti mitigazione / 10 blocco | Ultimo Baluardo → Guardia → Ritorsione (>45 risorsa) → Scudo → Fendente |
| Custode / Ritorsione | Generazione Risolutezza ×1,5; danno Ritorsione ×1,35 | Ultimo Baluardo → Ritorsione (>29) → Scudo → Guardia → Fendente |
| Custode / Comando | Sbilanciato dura 6 s e riduce il danno nemico del 25%; base per futura utilità di gruppo | Ultimo Baluardo → Scudo → Guardia → Ritorsione → Fendente |
| Cacciatore / Predatore | Critico +5 punti; danno Tiro Potente ×1,15 | Finale → Potente → Lacerante → Vento → Rapido |
| Cacciatore / Laceratore | Tick Sanguinamento ×1,45, durata +2 s | Lacerante → Finale → Potente → Vento → Rapido |
| Cacciatore / Esploratore | Velocità +8 punti; rigenerazione ×1,25; Vento dura 8 s | Vento → Lacerante → Finale → Potente → Rapido |

Ogni riga conserva le condizioni dell'abilità (es. debuff/buff assente, Finale sotto 25%, Ultimo Baluardo sotto 35%), non lancia abilità alla cieca. Queste tendenze sono una singola scelta provvisoria; nessun albero talenti o specializzazione rigida.

### Formule provvisorie

Con F = Forza, A = Agilità, V = Vigor, S = Spirito, C = Critico, Ve = Velocità e Ar = Armatura:

```text
HP = round((160 + 9 × V) × moltiplicatore HP del profilo)
Base Cacciatore/legacy = 8 + 0,75 × F + 1,3 × A + 0,3 × S
Base Custode = 8 + 1,6 × F + 0,25 × A + 0,2 × S
Danno diretto = (base × coefficiente + bonus + costo × danno-per-risorsa)
                × modificatore classe (Custode 0,95) × modificatore abilità/build
                × eventuale critico × 100/(100 + Ar bersaglio)
Critico = min(60%, clamp(5% + 0,15% × A + C%, 0%, 60%) + bonus build)
Moltiplicatore critico = 1,75
GCD = max(0,55 s, 1,6 s / (1 + Ve/100 + A/200))
Schivata = clamp(0,1% × A + buff, 0%, 35%)
Danno nemico = danno attacco × (1 − riduzione Sbilanciato, cap 80%)
              × 100/(100 + Armatura effettiva)
              × (1 − mitigazione complessiva, cap 80%)
              × (1 − riduzione blocco, cap 90%) se il colpo è bloccato
Probabilità blocco = min(80%, passiva + build + buff)
```

Danni arrotondati e limitati agli HP rimasti; minimo 1 per un colpo andato a segno. La risorsa usa valori frazionari e un epsilon numerico. Il riepilogo conta danno effettivo, DPS, danno subito, critici e abilità più usata; aggiunge classe/build, risorsa generata/usata, Sanguinamento per Cacciatore e mitigazione/blocchi per Custode. «Danno mitigato / bloccato» confronta il danno base dell'attacco con quello ridotto da debuff, armatura, mitigazione e blocco; non include le schivate.

Sanguinamento: tick ogni secondo, base ×0,12 prima della mitigazione, durata 6 s, nessun critico, 1 stack per sorgente. Il refresh conserva la cadenza e il massimo di potenza/scadenza. Faretra delle Spine: ogni `rangedHit` ha probabilità 30% di applicare/rinnovare il bleed con tick ×1,35 e +2 s. I modificatori Laceratore si combinano: tick ×1,45×1,35 e durata 10 s sul proc. Origine attore/abilità/oggetto viene mantenuta; gli altri effetti degli oggetti restano descrittivi.

Guardiano invariato: 1050 HP, Armatura 35, attacco ogni 2,4 s, primo colpo a 1,2 s; danno 44, speciale 72 con CD 8 s. Il tempo avanza in passi fissi 50 ms con RNG a seed interno. Un solo RAF gestisce 1×/2×/4×. Il background mette in pausa senza simulazione offline. Log massimo 60 eventi.

Misure ripetibili (seed 1, equipaggiamento iniziale più kit richiesto): Cacciatore/Predatore vince in **19,95 s**, **52,6 DPS**, **252 danni subiti**; Custode/Baluardo vince in **36,3 s**, **28,9 DPS**, **238 danni subiti**, **9 blocchi**. Danni subiti al secondo circa **12,6 contro 6,6**. Eliminando gli altri slot, Cacciatore perde con seed 1 e Custode perde con seed 3. Strategie che non attaccano/ignorano i difensivi possono perdere: non esiste una vittoria garantita. Sono esempi, non un bilanciamento definitivo.

### Gear Advisor provvisorio

`scoreItemForBuild(item, classId, buildId)` è centralizzata; restituisce `null` per armatura, arma o supporto incompatibile con la classe. `scoreBreakdown` distingue statistiche, effetti riconosciuti e sinergie; `registerScoreHook` offre l'estensione per effetti/set contestuali futuri. Nessun punteggio basato sul solo item level.

```text
Score = Σ (statistica oggetto × peso classe/tendenza)
        + peso effetti riconosciuti + contributi hook sinergie
↑ Miglioramento: candidato non equipaggiato, equipaggiabile nello slot,
                score − score attuale > max(2 punti, 5% del valore attuale)
★ Migliore posseduto: score massimo tra gli oggetti posseduti compatibili
                     con quello slot/classe/build e requisito livello (pari merito inclusi)
```

| Tendenza | Forza | Agilità | Vigor | Spirito | Critico | Velocità | Armatura |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Baluardo | 1,2 | 0,4 | 3,5 | 0,4 | 0,5 | 0,8 | 3,5 |
| Ritorsione | 3 | 0,6 | 2,4 | 0,4 | 1,4 | 1 | 2,2 |
| Comando | 1,5 | 0,5 | 2,8 | 1 | 0,6 | 2 | 2,8 |
| Predatore | 1 | 3 | 1 | 0,3 | 4 | 2 | 0,5 |
| Laceratore | 1,2 | 3,5 | 1 | 0,4 | 1,8 | 2,4 | 0,5 |
| Esploratore | 0,8 | 2,5 | 1,2 | 0,4 | 2 | 4 | 0,6 |

Laceratore attribuisce inoltre **18 punti** all'effetto `thorn-bleed`. Altri effetti non ancora implementati non ricevono bonus inventati. I pesi sono dichiaratamente provvisori: il consiglio valuta lo slot, non ottimizza tutto il kit o simula il DPS. Il migliore posseduto può essere già equipaggiato; gli slot doppi non duplicano oggetti e il consiglio non promuove lo spostamento di un oggetto già equipaggiato altrove. Il confronto esistente resta la fonte per il delta reale dell'intero equipaggiamento. Inventario conserva anche gli oggetti incompatibili; nessun filtro/cancellazione imposti dalla classe. Non viene usata l'etichetta BIS nell'interfaccia.

### Persistenza, regressioni e limiti

- `nymeria.classes.v1`: classe scelta e tendenza conservata per ciascuna classe.
- `nymeria.combat.v2`: modalità, regole e velocità per ciascuna classe. Importa le preferenze `nymeria.combat.v1` nel Cacciatore. Nessuno scontro viene salvato.
- Equipment e aspetto mantengono le chiavi e normalizzazione precedenti. Reset demo ripristina l'equipaggiamento/aspetto, non classe, strategie, XP o ritrovamenti; Reset combat azzera solo l'incontro.
- In caso di storage negato/dati non validi si usano default e messaggi discreti, senza bloccare tab o gameplay. Gli asset condividono `?v=idle-0.1` per evitare versioni cache miste.

```sh
node tests/class-build-engine.cjs
node tests/class-build-browser.cjs
node tests/combat-engine.cjs
node tests/combat-browser.cjs
node tests/browser.cjs
node tests/navigation.cjs
```

M4 verifica entrambe le classi, sei tendenze, risorse/costi/eventi/rigenerazione/perdita, requisiti kit, statistiche reali, passive/modificatori effettivi, AUTO e strategie per classe, otto condizioni, Faretra delle Spine, score/confronti/indicatori, risultati, vittorie/sconfitte, determinismo e persistenza/migrazione. Browser touch: 320/390/430 px, errori JS e overflow, classi/build, pausa/riprendi/reset, risultati e advisor. Combat e Equipment/Inventory mantengono le suite di regressione; i test del browser Combat sono aggiornati per l'AUTO Predatore, la risorsa e i nuovi campi risultato. I 12 test legacy del motore rimangono validi senza profilo.

UI mantenuta provvisoria; nessun asset definitivo, creazione personaggio completa, set bonus attivo, composizione di più tendenze o Gear Advisor globale. Nessun party, aggro multiplayer, healer, loot, quest, dungeon, raid, crafting, professioni, PvP, backend o monetizzazione. Chromium mobile non sostituisce Safari/iPhone fisico.

## M5 — Character Progression & First Idle Loop 0.1

Il ciclo ora è: **preparo classe/build/equipaggiamento → scelgo Spedizioni → attendo online o offline → leggo il report → riscuoto XP, Corone, materiali e loot → salgo di livello e miglioro il kit → sblocco attività più difficili → riparto**. Non è implementata una ripetizione automatica: una spedizione termina nel report e richiede una nuova partenza dopo la riscossione.

La UI precedente è mantenuta. Il nuovo tab **Spedizioni** mostra la **Frontiera del Vespro**, risorse, rischio, requisiti, stato in corso e report. La barra XP è reale, nella schermata Personaggio e in forma compatta in Spedizioni. L'identità mostra il livello effettivo. Il level-up compare nel feedback Personaggio, nel report e nella notifica. Inventario mostra Corone e i tre materiali senza trasformarli in slot equipaggiamento.

### Moduli M5

| File | Responsabilità |
| --- | --- |
| `progression-data.js` | Curva XP, soglie, cap, eccedenza, crescita base e nomi materiali. |
| `progression-store.js` | Record locale versionato, validazione/normalizzazione e transazioni di progressione; serializzazione fra tab tramite Web Locks quando disponibili. |
| `progression-system.js` | Partenza, snapshot, scadenza, interruzione, claim, riconciliazione Equipment e Test Mode. |
| `expedition-data.js` | Quattro attività, durate, incontri, difficoltà, premi, loot table e sei eventi. |
| `expedition-engine.js` | Risoluzione deterministica degli incontri usando lo stesso Combat Engine; stima rischio basata su simulazioni. |
| `expedition-ui.js` | XP, risorse, pannello Spedizioni, countdown, report, bentornato e controlli di sviluppo. |

`equipment.js` conserva l'unico algoritmo di somma delle statistiche: usa basi di livello da ProgressionData, poi somma gli oggetti. Classe/build e buff restano nel profilo/effectiveStats del Combat Engine. `equipment-data.js` contiene undici oggetti fissi di loot, separati dai 49 oggetti demo; tutti riusano asset esistenti. `build-system.js` estende il consiglio con un candidato appena trovato prima della riscossione. `combat-engine.js` aggiunge soltanto un template nemico parametrico e l'opzione headless `captureLog: false`: niente secondo motore matematico.

### XP, cap e crescita

```text
Livello iniziale = 1; cap = 20
XP richiesta per passare da L a L+1 = round(80 × L^1,35), per L < 20
Esempi: L1 80; L2 204; L3 353; L4 520; L5 703; L8 1325
XP totale per raggiungere L20 = 36597
XP corrente = XP totale − soglia cumulativa del livello corrente
Al cap: XP corrente/necessaria = 0; XP totale continua a crescere
XP eccedente = XP totale − 36597, conservata nel record
```

Livello, XP corrente/necessaria ed eccedenza vengono ricalcolati dall'unica fonte `totalXP`. Una ricompensa grande può superare più soglie e registra tutti i level-up. Al cap la barra mostra **MAX** e XP totali, senza suggerire un livello 21. Contatori e ingressi numerici sono normalizzati a interi non negativi, con un limite tecnico di 1 miliardo nel prototipo.

```text
Base livello L = base livello 1 + (L − 1) × crescita
Crescita per livello: Forza +2, Agilità +2, Vigor +2, Spirito +1
Critico, Velocità e Armatura base: nessuna crescita automatica
Totali Equipment = base livello + statistiche oggetti
Statistica effettiva Combat = totali Equipment + classe/build + buff/modificatori
HP = (160 + 9 × Vigor totale) × eventuale moltiplicatore del profilo, arrotondato
```

A parità di oggetti il livello 10 aggiunge Forza/Agilità/Vigor +18 e Spirito +9 rispetto al livello 1; l'HP base Combat cresce di 162 prima dei moltiplicatori di classe. I test confrontano davvero gli incontri con lo stesso kit ai due livelli. Il requisito di livello degli oggetti usa questa progressione, non il vecchio Liv. 1 fisso.

### Quattro spedizioni

| Attività | Durata reale | Livello | Incontri base | Nemico: HP / danno / armatura rispetto al Guardiano | Eventi per incontro | XP base se completa |
| --- | --- | ---: | ---: | --- | ---: | ---: |
| Pattuglia delle Rovine | 1 min | 1 | 3 | ×0,32 / ×0,5 / ×0,5 | 35% | 90 |
| Sentiero Spezzato | 5 min | 3 | 5 | ×0,75 / ×0,75 / ×0,8 | 40% | 200 |
| Ricognizione del Vespro | 15 min | 5 | 8 | ×1 / ×1 / ×1,1 | 45% | 480 |
| Veglia della Frontiera | 30 min | 8 | 15 | ×1,5 / ×1,35 / ×1,4 | 50% | 1140 |

XP per incontro vinto: rispettivamente **18 / 30 / 45 / 60**. Bonus completamento: **36 / 50 / 120 / 240**. Corone per incontro: **4 / 6 / 9 / 12**, bonus finale **8 / 15 / 24 / 40**. Materiali per incontro: **1 / 2 / 3 / 4**, alternando Ferro del Vespro, Fibra Lunare e Polvere d'Etere; gli eventi possono aggiungerne. I premi base crescono con l'attività e non con il tempo tenuto aperto il browser.

I requisiti vengono derivati dal livello nel record `unlockedContent`; la UI bloccata mostra «Si sblocca al livello X». L'architettura usa durate in millisecondi e può supportare ore senza timer persistenti (il validatore attuale consente fino a sette giorni per incarico).

### Stima rischio e incontri

La stima **Facile / Adeguata / Difficile / Pericolosa** non usa Potere o una percentuale inventata: risolve la stessa attività con la preparazione corrente su tre seed fissi (`11, 29, 71`). Tre successi con HP finale medio ≥50% → Facile; tre successi con HP inferiore → Adeguata; almeno un successo → Difficile; nessun successo → Pericolosa. Include livello, equipaggiamento, effetti, classe/build e strategia AUTO/PERSONALIZZATA. Il risultato effettivo usa un nuovo seed e può differire. Le stime sono memorizzate in UI per preparazione, senza ricalcolarle ogni secondo.

Alla partenza viene salvato uno snapshot di statistiche reali, livello, oggetti/effects, profilo classe/build e regole della strategia. Prepararsi diversamente dopo la partenza non cambia retroattivamente la spedizione. Combattimento manuale resta disponibile e indipendente; non assegna ricompense di spedizione. Un level-up ricalcola Equipment e quindi resetta l'eventuale scontro manuale come una modifica alle statistiche, usando il comportamento già esistente.

Il piano degli incontri/eventi e i roll loot sono generati dal seed. Ogni incontro usa `CombatEngine.create` con il Guardiano scalato, mantenendo abilità, risorse, difese, critici, DoT, cooldown e Faretra delle Spine reali. HP residui vengono conservati, con un riposo di **40% HP massimi** prima del successivo incontro; risorsa e cooldown ripartono come in una nuova battaglia astratta. Ogni incontro viene risolto per massimo **180 secondi simulati**, a passi fissi del motore senza DOM/RAF/log dettagliato. Sconfitta o timeout interrompono la sequenza. Il costo del calcolo dipende dal numero finito di incontri, non dai minuti/giorni offline.

La durata dell'attività è il tempo di viaggio assegnato: non è la somma delle durate delle battaglie astratte. Gli incontri aggiuntivi possono aumentare il totale. Il report conserva esito, durata simulata, danni e HP di ogni incontro per verifica, oltre al riepilogo leggibile.

### Sei eventi automatici

| Evento | Modifica reale, premi concessi se l'incontro viene vinto |
| --- | --- |
| Mercante dei guadi | +7 Corone |
| Altare del Vespro | XP dell'incontro ×1,2 |
| Varco tra le spine | +2 Fibra Lunare, chance loot dell'incontro +20 punti |
| Imboscata dei cenerei | Un incontro extra con HP/danno/armatura ×1,2 |
| Archivio sepolto | +2 Polvere d'Etere, XP dell'incontro ×1,1 |
| Bestia ferita | +2 Ferro del Vespro, difficoltà di quell'incontro ×0,85 |

Nessuna scelta interattiva o acquisto. Il report mostra gli eventi effettivamente incontrati prima di una sconfitta, senza rivelare quelli della parte non raggiunta. Le definizioni eventi e attività sono conservate nella preparazione persistita; `rulesVersion: 1` serve a gestire future migrazioni del risolutore.

### Loot table personale fissa

| Famiglia | Custode (Plate) | Cacciatore (Mail) | iLv / requisito | Attività |
| --- | --- | --- | --- | --- |
| Gioiello | Anello della Frontiera (universale) | Stesso anello | 8 / 1 | Pattuglia, Sentiero |
| Stivali | Sabatons del guado lunare | Stivali del guado lunare (maglia) | 8 / 1 | Pattuglia, Sentiero |
| Arma del sentiero | Lama della frontiera | Arco del sentiero spezzato | 12 / 3 | Sentiero, Ricognizione |
| Arma della veglia | Lama della veglia | Arco della ricognizione | 14 / 5 | Ricognizione, Veglia |
| Corazza | Corazza della veglia (piastre) | Usbergo della veglia (maglia) | 14 / 5 | Ricognizione, Veglia |
| Supporto | Scudo del vespro stellato | Faretra del vespro stellato | 18 / 8 | Veglia |

Gli ID storici `moon-boots` (Mail) e `frontier-mail` (Plate, corazza a piastre) restano stabili per non perdere il possesso. `armorType` è l'autorità sul materiale, non il nome dell'ID. Gli asset SVG condivisi rimangono dichiaratamente provvisori; questa iterazione aggiorna regole e catalogo senza rifare il renderer.

Probabilità loot per incontro vinto: **12 / 14 / 16 / 18%**; roll aggiuntivo solo a spedizione completata: **30 / 35 / 40 / 45%**. Alla partenza ciascuna voce viene associata alla variante utilizzabile dalla preparazione salvata; i roll scelgono uniformemente le voci di questa tabella personale congelata. Gli eventi possono aumentare la chance del singolo incontro. Non sono generati oggetti proceduralmente.

Un oggetto nuovo entra in Inventario soltanto al claim; non viene mai auto-equipaggiato. «Oggetto trovato» mostra nome, rarità, item level, livello richiesto e consigli Gear Advisor quando appropriati. Prima del claim il confronto include il ritrovamento come candidato, indicato come consiglio dopo riscossione; dopo il claim usa il possesso reale. Il personal loot rispetta la preparazione salvata alla partenza. Dopo un cambio classe il ritrovamento può essere inutilizzabile dalla classe corrente, ma resta possedibile e non riceve consigli errati.

Ogni oggetto fisso può essere posseduto una volta. Se lo stesso ID ricompare, il duplicato viene convertito in **+2 Ferro del Vespro** al claim, anche per duplicati nello stesso report. Il report indica la conversione; non sposta o sostituisce l'esemplare equipaggiato. I 44 oggetti demo originali restano disponibili, con metadati di materiale coerenti; cinque nuovi pezzi Mail completano il kit del Cacciatore.

### Offline, salvataggio e claim

Chiave canonica: **`nymeria.progression.v1`**, schema `version: 1`:

```text
level / currentXP / requiredXP / totalXP / overflowXP
crowns / materials { iron, fiber, ether }
unlockedContent / ownedLootIds / sequence
activeExpedition { id, activityId, activity, eventDefinitions,
  startedAt, endsAt, seed, snapshot, lootPolicy, rulesVersion, testMode }
pendingExpeditionResult
lastClaim { report, loot, levelUps, resultingLevel, claimedAt }
```

`Date.now()` viene confrontato con `endsAt` al caricamento, ritorno in foreground e nel piccolo timer di presentazione. Una riapertura dopo 20 minuti risolve una spedizione scaduta in una sola operazione, mostra **Bentornato** e il report, con XP/risorse ancora da riscuotere. Non serve un timer vivo in background. Il countdown è una vista dei timestamp, non la fonte di avanzamento. Un orologio portato indietro non concede premi; il progresso visivo è limitato fra 0 e 100%.

**Riscuoti ricompense** legge sempre l'ultimo record, controlla l'ID del report e scrive XP, Corone, materiali, ID loot e ricevuta/consumo del report in **un unico `localStorage.setItem`**. Non esiste una fase in cui si assegna XP ma si lascia il report riscuotibile. La UI protegge dai tap ripetuti; refresh e chiamate ripetute trovano il report già consumato. Web Locks serializza partenza/completamento/claim fra tab dello stesso browser/origine quando disponibile. In browser senza Web Locks è garantita l'idempotenza nella singola pagina e dopo refresh; non è promessa una transazione simultanea fra più processi/tab senza quel supporto.

L'inventario equipaggiabile e il livello vengono riconciliati dal record canonico: se il secondo salvataggio `nymeria.equipment.v1` viene interrotto, al caricamento il loot e il livello vengono recuperati senza un nuovo claim. Chiavi classe/build, strategie ed equipaggiamento esistenti sono mantenute. I vecchi salvataggi M4 partono con progressione L1/0 XP senza perdere oggetti o preparazione. Record corrotti sono normalizzati; un futuro schema sconosciuto non viene sovrascritto dalla progressione.

Se il salvataggio non è disponibile o una scrittura fallisce, la partenza/ricompensa non viene applicata in memoria come se fosse persistita. Il report resta riscuotibile per un nuovo tentativo. Combattimento manuale e i tab restano utilizzabili. Il timer può essere chiuso: alla riapertura lo stato viene ricalcolato dal record.

**Fallimento:** premi parziali solo dagli incontri vinti, niente bonus finale; equipaggiamento intatto. Il loot già trovato in incontri vinti può essere riscosso. **Termina spedizione:** prima della scadenza cancella l'incarico, senza XP, Corone, materiali o loot; nessuna penalità all'equipaggiamento. Un incarico già scaduto va risolto e riscosso. Non si può partire con un incarico attivo o un report non riscosso. **Reset demo** non azzera XP, risorse o ritrovamenti; non è un prestige/reset di progressione.

### Test Mode e test

Modalità normale: URL senza parametri, nessun comando di sviluppo visibile. **`?test=1`** mostra un pannello tratteggiato **TEST MODE — SOLO SVILUPPO** e marca le nuove partenze/report come TEST. **Completa ora · TEST** risolve subito un incarico TEST con lo stesso seed, snapshot, incontri e premi. `startedAt`, `endsAt` e durate normali restano invariati; il comando non accelera incarichi normali iniziati prima. Le ricompense TEST modificano esplicitamente il salvataggio locale del prototipo; non esistono accelerazioni pagate o con valuta. Non viene aggiunto un comando normale che regali XP/livelli.

```sh
node tests/armor-loot-engine.cjs
node tests/armor-loot-browser.cjs
node tests/progression-engine.cjs
node tests/progression-browser.cjs
node tests/combat-engine.cjs
node tests/class-build-engine.cjs
node tests/combat-browser.cjs
node tests/class-build-browser.cjs
node tests/browser.cjs
node tests/navigation.cjs
```

I 19 controlli M5 usano Equipment e Class/Build reali: curva, confini, livelli multipli/cap/eccedenza, statistiche/HP/danno a parità di kit, requisiti, snapshot, offline, successo/fallimento/timeout/premi parziali, tutte le risorse, sei eventi, loot/duplicati/consigli, claim ripetuti, interruzione, recupero dopo scrittura Equipment interrotta, persistenza negata, migrazione M4 e orologio arretrato. Nessun secondo set di statistiche gameplay inventato nei test.

Chromium touch a **320/390/430 px** verifica barra XP, identità, sblocchi, tutte le attività, countdown, refresh, chiusura pagina/ritorno a +20 minuti, bentornato, claim/doppio click, loot/advisor/equip/duplicati, risorse, cancellazione, Combat indipendente, Test Mode, fallimento/cap, errori JS e overflow. Le fixture possono impostare XP alle soglie reali per testare gli sblocchi: questo non è un pulsante del gioco. Due tab reali verificano partenza/claim concorrenti con Web Locks. Un ulteriore test chiude completamente il processo Chromium, riapre lo stesso profilo persistente dopo +20 minuti, completa/riscuote e verifica i premi dopo un secondo riavvio. Le suite Equipment, Class/Build, Combat e navigazione rimangono regressioni obbligatorie; il selettore di errore Equipment è ora circoscritto al dialogo, dato che anche Spedizioni può mostrare un messaggio di storage.

### Limiti e TODO futuri

- Prototipo locale, con bilanciamento provvisorio, quattro attività e undici oggetti loot; nessuna garanzia di anti-cheat, clock fidato o sincronizzazione fra dispositivi senza backend. Cambiare origine/browser o cancellare i dati locali cambia il salvataggio.
- Una sola spedizione, nessuna ripetizione automatica o simulazione di missioni infinite mentre si è assenti. Ricompense applicate al claim, non alla sola scadenza.
- Stima su tre seed, non una probabilità esatta. Occorre migliorare la taratura delle ricompense/rischio ai vari livelli e per le sei tendenze; le attività appena sbloccate possono richiedere un kit migliore.
- TODO: bilanciamento curva/growth, migrazioni per nuovi `schemaVersion`/`rulesVersion`, ampliamento loot table e score di effetti/set, eventi con scelte, futura definizione delle attività simultanee. Nessuna di queste estensioni è implementata qui.
- Safari/iPhone fisico non è stato testato; emulazione Chromium mobile non lo sostituisce. Valutare i fallback di persistenza/concorrenza sul dispositivo reale.
- Non implementati energia/stamina, acquisti, pubblicità, accelerazioni con valuta, crafting, professioni, quest vere, mappa, dungeon, party/guild, multiplayer, backend, notifiche push, PvP, prestige o battle pass. Nessuna monetizzazione dei timer.


## Armor Proficiency & Smart Loot 0.1 — integrazione M5

`armor-rules.js` centralizza esclusivamente quattro materiali: `cloth`, `leather`, `mail`, `plate`. Tutti i pezzi di `head`, `torso`, `legs`, `gloves`, `boots` dichiarano `armorType`. I bracciali demo sono gioielli universali, non bracciali d'armatura; mantelli, cinture, collane, orecchini, anelli, armi e supporti non richiedono un materiale d'armatura.

Ogni classe dichiara una sola `armorProficiency` in `classes-data.js`: **Custode → Plate**, **Cacciatore → Mail**. La stessa regola supporta future classi Cloth/Leather senza gerarchie di competenza: Plate non autorizza a indossare Mail/Leather/Cloth. Equipment rifiuta il tentativo con un messaggio esplicito e mantiene l'oggetto in inventario. Il cambio classe prototipale rimuove soltanto le armature incompatibili dagli slot, mantenendo proprietà, gioielli e aspetto personale. Il Cacciatore nuovo parte con usbergo, gambali e stivali Mail; il Custode ha un kit demo Plate completo disponibile. Nessun equipaggiamento viene scelto automaticamente al cambio classe.

Gear Advisor usa la stessa compatibilità prima del punteggio: gli oggetti incompatibili non concorrono al migliore per slot e non ricevono **↑ Miglioramento** o **★ Migliore posseduto**. Inventario, dettagli e report mostrano invece **Non utilizzabile · Plate/Mail/Cloth/Leather** quando necessario. Le famiglie di armi/supporti continuano a essere considerate dal kit Combat e dal consiglio; il sandbox Equipment mantiene le combinazioni demo già esistenti.

### Personal loot e preparazione salvata

`personal-loot.js` applica la politica soltanto alle ricompense personali delle spedizioni. Alla partenza salva `lootPolicy {version: 1, kind: "personalLoot", classId, armorProficiency, weaponTypes, supportTypes, handedness, lootIds}` insieme allo snapshot. Il profilo include questi criteri; le build attuali condividono la famiglia arma/supporto della propria classe. Il risolutore usa esclusivamente la tabella personale congelata, mai la classe corrente al completamento o alla riscossione. Ogni armatura ottenuta rispetta la competenza salvata; armi e supporti rispettano le famiglie salvate e il livello di sblocco dell'attività. Gioielli universali rimangono nella tabella normalmente.

Il possesso non è filtrato dalla classe. Future sorgenti **worldLoot / sharedLoot / tradeLoot** potranno assegnare oggetti di altre classi senza questa politica. Non sono implementate in 0.1: nessuna regola globale in inventario cancella gli oggetti incompatibili, nemmeno quelli personali riscossi dopo un cambio classe.

### Migrazione conservativa

Le chiavi e gli schema principali restano `nymeria.equipment.v1` e `nymeria.progression.v1` (`version: 1`); è un'estensione additiva. Equipment rilegge i metadati canonici del catalogo, aggiunge i cinque oggetti demo Mail ai vecchi inventari e conserva tutti gli oggetti già posseduti. Le armature incompatibili salvate vengono rimesse in sacca e le statistiche ricalcolate; nessuna conversione degli oggetti già posseduti.

Per una vecchia spedizione attiva senza `lootPolicy`, la migrazione deriva la competenza e le famiglie da `snapshot.profile.classId` (o dal nome classe storico), mantenendo seed, timestamp, statistiche, strategia e incontri. Per un vecchio report **non riscosso**, associa soltanto gli ID loot alle varianti della classe salvata nel report; XP, Corone, materiali ed esiti non vengono risimulati. I report già riscossi, gli ID posseduti e le ricevute rimangono invariati: nessun nuovo claim o reroll. La politica normalizzata viene persistita nella successiva transazione; la riconciliazione Equipment salva gli slot aggiornati all'avvio.

### Identità futura della classe

**La scelta della classe/archetipo deve avere peso e non consentirà cambi arbitrari tra ruoli incompatibili.** Un personaggio nato come Tank non potrà trasformarsi liberamente in Healer. Evoluzioni e build future devono appartenere a una famiglia coerente dell'archetipo. Il blocco definitivo del cambio classe non è implementato: il prototipo mantiene Custode/Cacciatore liberamente selezionabili per i test.

### Salvage System — TODO, non implementato

- Smantella equipaggiamento indesiderato.
- Restituisce materiali.
- Possibile smantellamento multiplo.
- Futuro auto-salvage per rarità.
- Futuro auto-salvage degli oggetti non migliorativi.
- Protezione/favorite per impedire distruzione accidentale.

La conversione M5 di duplicati al claim resta il comportamento esistente; non è uno smantellamento degli oggetti nell'inventario.

### Test dell'integrazione

`tests/armor-loot-engine.cjs` verifica 23 casi usando Equipment, Class, Advisor, persistenza e Combat/Expedition reali: tutte le competenze/rifiuti, conservazione, migliore utilizzabile, gioielli, cambio classe, tutti i loot pool M5, snapshot e migrazione di inventari/spedizioni/report. `tests/character-fixture.cjs` condivide la preparazione reale con la suite M5.

`tests/armor-loot-browser.cjs` verifica tramite touch a **320/390/430 px** tutti gli slot indossabili, rifiuti e messaggi, assenza di badge errati, cambio classe durante spedizione, reload, claim/possesso/equip del personal loot, gioielli, dimensioni leggibili del personaggio, errori JS e overflow. Le suite Equipment, Combat, M4, M5 e navigazione restano obbligatorie; i test si preparano con kit coerenti, senza aggirare le competenze. Test mobile eseguiti in Chromium emulato; Safari/iPhone fisico non verificato in questa iterazione.
