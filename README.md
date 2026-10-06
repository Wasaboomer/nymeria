# Nymeria Class & Build System 0.1 — M4

M4 estende Combat 0.1 con Custode e Cacciatore, risorse e sei tendenze di build sullo stesso motore di combattimento. Base Equipment & Inventory 0.1: manichino SVG e art direction esistenti, 16 slot, inventario di 44 oggetti demo e regole centralizzate. Nessun framework, backend, build obbligatoria o dipendenza runtime. GitHub Pages può servire direttamente la radice.

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

I test touch coprono 320/390/430 px: tutte le famiglie arma/supporto, 2H, slot doppi, equip/rimozione corazza, confronto, totali e Potere, filtri e ordinamento, effetti descrittivi, persistenza, Reset demo, overflow e errori JS. A 390 px verificano inoltre l'equipaggiamento di tutti i 44 oggetti e i relativi gruppi SVG. Controllano storage negato e normalizzazione di dati incoerenti. Chromium in emulazione mobile non sostituisce una prova su Safari/iPhone fisico.

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

Ogni oggetto ha `id`, `name`, `slot` (famiglia), `type`, `rarity`, `itemLevel`, `requiredLevel`, `stats`, `description`, `equipped`, `effects` e `appearance`. Le armi principali hanno inoltre `handedness`, `weaponType` e `allowedSupports`. Tutti gli oggetti demo sono utilizzabili a livello 1; la regola sul requisito di livello è già centralizzata.

I 16 slot concreti contengono `{ equippedItem, appearanceItem }`. Le famiglie `ring`, `earring` e `bracelet` possono essere assegnate a due destinazioni indipendenti; una stessa istanza non può occupare due slot. Il dialogo permette di scegliere SX/DX e confronta con la destinazione selezionata. Le statistiche vengono lette esclusivamente da `equippedItem`, il rendering esclusivamente da `appearanceItem`: il glamour completo non è ancora implementato.

Le armi 2H (bastone, spadone, lancia) bloccano logicamente il supporto. Un supporto incompatibile, anche dopo cambio di arma 1H, torna nella sacca. Il tentativo di equipaggiare direttamente un supporto incompatibile viene rifiutato senza modificare lo stato. Arco e balestra occupano il solo slot principale nel modello demo (`1H` come occupazione logica) per consentire faretra/dardi nel supporto; non indica una tecnica fisica di impugnatura.

L'inventario mostra l'intera collezione con posizione e indicatore equipaggiato; il conteggio distingue sacca ed equipaggiati. Nessun oggetto viene duplicato o perso durante una sostituzione. Il confronto mostra la variazione totale dopo l'operazione, compresa la rimozione di un supporto incompatibile o lo spostamento da SX a DX.

Statistiche base: Forza 12, Agilità 15, Vigor 14, Spirito 11; Critico, Velocità e Armatura partono da zero. Il Potere è calcolato in un solo punto:

```text
2 × Forza + 2 × Agilità + Vigor + 2 × Spirito
+ 3 × Critico + 2 × Velocità + Armatura
```

Critico e Velocità sono punti percentuali nel prototipo. Gli effetti speciali sono dati strutturati (`trigger`, `modifier` o `status`). Combat 0.1 interpreta il solo hook `thorn-bleed` della Faretra delle Spine; gli altri effetti restano descrittivi.

## Persistenza e rappresentazione

La chiave `nymeria.equipment.v1` conserva inventario, equipaggiamento, configurazione personaggio, statistiche e Potere. Ogni modifica viene salvata automaticamente; **Salva aspetto** salva anche l'intero stato. Al caricamento i dati vengono validati contro il catalogo, i duplicati vengono eliminati e statistiche/Potere ricalcolati. L'aspetto del vecchio prototipo viene importato da `nymeria.character.v1` se manca il nuovo salvataggio. **Reset demo** ripristina inventario, equipaggiamento e aspetto iniziali. **Casuale** cambia soltanto capelli, occhi e tintura, mantenendo l'equipaggiamento.

Il rig conserva la geometria originale e aggiunge gruppi per i nuovi slot. Aggiornare uno slot non ricrea i figli degli altri gruppi. La tintura resta nel solo canale degli inserti della corazza, senza filtri globali. Gli slot vuoti possono mostrare abiti base del manichino, che non conferiscono statistiche. Alcuni oggetti condividono una silhouette provvisoria; gli accessori più piccoli sono segni SVG tecnici, non asset definitivi. `nymeria-art.png` è conservata e non utilizzata.

Per un nuovo oggetto, aggiungere dati a `equipment-data.js` e un asset/mapping a `character.js`; le regole di compatibilità restano in `equipment.js`. Non sono implementati party, dungeon, crafting, classi definitive, backend, multiplayer o monetizzazione.


## Class & Build 0.1 — M4

Il tab **Classe** permette il cambio libero tra **Custode** e **Cacciatore** e la selezione di una tendenza principale. Non modifica l'inventario o l'equipaggiamento. I requisiti di combattimento sono **Spada 1H + Scudo** e **Arco + Faretra**: la UI spiega il kit richiesto e gli oggetti attuali, porta a Equipaggiamento e rifiuta l'avvio se il kit manca. Anche un profilo marcato `kitValid: false` non può avviare il motore.

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

`scoreItemForBuild(item, classId, buildId)` è centralizzata; restituisce `null` per arma/supporto incompatibile con la classe. `scoreBreakdown` distingue statistiche, effetti riconosciuti e sinergie; `registerScoreHook` offre l'estensione per effetti/set contestuali futuri. Nessun punteggio basato sul solo item level.

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
- Equipment e aspetto mantengono le chiavi e normalizzazione precedenti. Reset demo ripristina l'equipaggiamento/aspetto, non classe o strategie; Reset combat azzera solo l'incontro.
- In caso di storage negato/dati non validi si usano default e messaggi discreti, senza bloccare tab o gameplay. Gli asset condividono `?v=class-build-0.1` per evitare versioni cache miste.

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

### Roadmap — M5 / Progressione

**TODO — Character Progression: XP, barra esperienza, level-up e curve di livello.** Non implementati in M4; nessuna barra XP finta. Il Liv. 1 esistente resta il valore demo usato dal sistema equipaggiamento.
