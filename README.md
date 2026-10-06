# Nymeria Combat Prototype 0.1

Combat 0.1 aggiunge il primo scontro automatico 1 contro 1 al sistema già esistente. Base Equipment & Inventory 0.1: manichino SVG e art direction esistenti, 16 slot, inventario di 44 oggetti demo e regole centralizzate. Nessun framework, backend, build obbligatoria o dipendenza runtime. GitHub Pages può servire direttamente la radice.

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
| `app.js` | Collegamento dei moduli, tab mobile e editor dell'aspetto esistente. |
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


## Combat 0.1

Il nuovo tab **Combattimento** richiede realmente **Arco + Faretra** (normale o delle Spine). Il messaggio porta a Equipaggiamento senza cambiare oggetti automaticamente. Il kit temporaneo Arciere comprende Tiro Rapido, Freccia Lacerante, Tiro Potente, Colpo Finale e Passo del Vento. Il Guardiano delle Rovine attacca automaticamente e usa Frattura delle Rovine ogni 8 s quando pronta; può uccidere il giocatore.

### Architettura

- `combat-data.js`: formule, cinque abilità, effetti, nemico, hook degli oggetti, condizioni e validazione delle preferenze.
- `combat-engine.js`: simulazione pura, senza DOM o timer; `create({ stats, effects, rules, seed })`, `start`, `advance`, `pause`, `resume`, `setRules`, `snapshot`. `seed` è opzionale e interno: in uso normale ogni incontro sceglie un seed casuale.
- `combat-ui.js`: bridge all'Equipment System, pannello mobile, configurazione e un solo loop `requestAnimationFrame`. 1×/2×/4× moltiplicano il delta dello stesso loop. Nessun `setInterval` parallelo.
- `navigation.js`: bootstrap dei tab indipendente dai moduli applicativi. Tutti gli asset usano una versione condivisa nella query URL per evitare il precedente problema di cache; aggiornarla insieme ai file durante ogni rilascio.

Ogni scontro usa una copia delle statistiche reali `Equipment.state.resultingStats` e degli effetti effettivamente equipaggiati. Una modifica all'equipaggiamento interrompe/resetta lo scontro e aggiorna il modello: serve avviare un nuovo combattimento. Non viene mutato l'inventario né vengono assegnati loot, XP o ricompense.

### Formule provvisorie

Con F = Forza, A = Agilità, V = Vigor, S = Spirito, C = Critico, Ve = Velocità e Ar = Armatura:

```text
HP massimo = round(160 + 9 × V)
Danno base = 8 + 0,75 × F + 1,3 × A + 0,3 × S
Danno diretto = round((base × coefficiente abilità + bonus) × eventuale critico × 100 / (100 + Ar bersaglio))
Probabilità critico = clamp(5% + 0,15% × A + C%, 0%, 60%)
Moltiplicatore critico = 1,75
GCD = max(0,55 s, 1,6 s / (1 + Ve / 100 + A / 200))
Schivata = clamp(0,1% × A + bonus buff, 0%, 35%)
```

Tiro Rapido: coefficiente 0,65 e bonus 8. Freccia Lacerante: 0,55 e bonus 4, cooldown 4 s. Tiro Potente: 1,8 e bonus 12, cooldown 6 s. Colpo Finale: 0,85 e bonus 8, cooldown 5 s, danno ×2,3 **sotto** il 25% HP nemico. Passo del Vento: Agilità +8, Velocità +20 punti percentuali e Schivata +12 punti per 6 s, cooldown 12 s.

Sanguinamento: 6 s, tick ogni 1 s, danno base ×0,12 prima della mitigazione, nessun critico e massimo 1 stack per sorgente. Il refresh conserva il prossimo tick e non riduce potenza o scadenza già applicate. Le istanze tengono durata, stack, origine (attore/abilità/oggetto), tick e scadenza. La Faretra delle Spine viene risolta attraverso l'ID `thorn-bleed`: ogni attacco a distanza ha il 30% di probabilità di applicare/rinnovare Sanguinamento con danno dei tick ×1,35 e durata +2 s. Non si controlla il nome visualizzato dell'oggetto.

Il motore usa passi fissi di 50 ms e un RNG con seed. Le azioni sono selezionate in ordine: prima abilità con cooldown pronto e condizione soddisfatta. Le condizioni HP sono strettamente `<`, non `<=`. AUTO usa il preset; PERSONALIZZATA conserva cinque abilità distinte e permette riordino ↑/↓ e sei famiglie di condizioni. Le modifiche alla strategia valgono dalla prossima azione.

### Preferenze e limiti

`nymeria.combat.v1` salva modalità, ordine, condizioni e velocità. Nessun combattimento in corso viene salvato. **Reset** azzera solo lo scontro, non le preferenze né l'equipaggiamento; **Combatti di nuovo** crea un incontro nuovo. Un tab browser in background mette lo scontro in pausa: nessuna simulazione offline o recupero del tempo trascorso. Il log conserva al massimo 60 eventi, mostrati dal più recente, e il risultato include durata, danni effettivi, DPS medio, danni subiti, critici e abilità più usata.

Bilanciamento provvisorio, singolo kit e nemico, nessuna IA avanzata o animazione complessa. Non sono implementati ruoli, aggro, party, talenti, dungeon, loot, XP, backend o multiplayer. Il personaggio usa il manichino esistente, il nemico un semplice placeholder SVG.

### Test aggiuntivi

Con server attivo:

```sh
node tests/combat-engine.cjs
node tests/combat-browser.cjs
node tests/navigation.cjs
node tests/browser.cjs
```

I 12 controlli del motore usano statistiche ottenute dall'Equipment System reale, non un secondo set fittizio. Verificano vittoria (seed 1) e sconfitta (seed 2) con lo stesso equipaggiamento, critici, cooldown, DoT/refresh/scadenza, buff, condizioni e priorità, pausa, determinismo indipendente dalla suddivisione del tempo, modifiche alla build, hook Faretra delle Spine, limite del log e validazione.

Le prove Chromium touch a 320/390/430 px verificano l'intero flusso dal requisito dell'equipaggiamento ai risultati, le impostazioni reali della UI, pausa/ripresa, velocità 1×/2×/4× su un unico clock, replay/reset, persistenza, cambi equipaggiamento, errori JS e overflow. Il clock del browser è controllato per rendere i test temporali ripetibili; il runtime normale usa tempo reale. Safari/iPhone fisico non viene emulato da Chromium.
