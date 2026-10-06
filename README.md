# Nymeria Equipment & Inventory System 0.1

Iterazione sul Character Prototype 0.1: manichino SVG e art direction esistenti, 16 slot, inventario di 44 oggetti demo e regole centralizzate. Nessun framework, backend, build obbligatoria o dipendenza runtime. GitHub Pages può servire direttamente la radice.

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

Critico e Velocità sono punti percentuali nel prototipo. Gli effetti speciali sono descrizioni e dati strutturati (`trigger`, `modifier` o `status`) per un futuro Combat System: nessun combattimento viene eseguito.

## Persistenza e rappresentazione

La chiave `nymeria.equipment.v1` conserva inventario, equipaggiamento, configurazione personaggio, statistiche e Potere. Ogni modifica viene salvata automaticamente; **Salva aspetto** salva anche l'intero stato. Al caricamento i dati vengono validati contro il catalogo, i duplicati vengono eliminati e statistiche/Potere ricalcolati. L'aspetto del vecchio prototipo viene importato da `nymeria.character.v1` se manca il nuovo salvataggio. **Reset demo** ripristina inventario, equipaggiamento e aspetto iniziali. **Casuale** cambia soltanto capelli, occhi e tintura, mantenendo l'equipaggiamento.

Il rig conserva la geometria originale e aggiunge gruppi per i nuovi slot. Aggiornare uno slot non ricrea i figli degli altri gruppi. La tintura resta nel solo canale degli inserti della corazza, senza filtri globali. Gli slot vuoti possono mostrare abiti base del manichino, che non conferiscono statistiche. Alcuni oggetti condividono una silhouette provvisoria; gli accessori più piccoli sono segni SVG tecnici, non asset definitivi. `nymeria-art.png` è conservata e non utilizzata.

Per un nuovo oggetto, aggiungere dati a `equipment-data.js` e un asset/mapping a `character.js`; le regole di compatibilità restano in `equipment.js`. Non sono implementati combattimento, crafting, classi definitive, backend, multiplayer o monetizzazione.
