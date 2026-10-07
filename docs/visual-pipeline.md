# M6.5 — Visual Identity & Modular Character Vertical Slice

Baseline: `4ac9ada7919a156e53d0fa65f6528be0df80ba46` (M6.2). Nessun nuovo sistema gameplay, formula, curva XP, ricompensa o contenuto del mondo.

## Stato e qualità

| Categoria | Consegna | Qualità |
| --- | --- | --- |
| Pipeline | Manifest, compositore SVG condiviso, cache, namespace, hide rules, mapping Equipment, fallback | Base tecnica utilizzabile e verificata; da estendere per produzione |
| Personaggio | Corpo adulto, orecchie, volto, occhi, capelli separati, sottostrati | Vertical slice vettoriale originale; non artwork illustrato definitivo |
| Custode | Plate A/B: torso, gambe, stivali, guanti, spallacci ed elmo; Sword A/B; Shield A/B | Geometrie distinte, vertical-slice quality |
| Cacciatore | Mail A, Bow A, Quiver A sul medesimo rig | Vertical-slice quality |
| Creator | 3 carnagioni, 3 acconciature, 3 colori capelli, 3 occhi, 2 volti/dettagli | Opzioni reali; nessuna barba in questa iterazione |
| Mantelli/cinture | Due sagome per ciascuno, legate a oggetti esistenti | Vertical-slice quality |
| Accessori piccoli | Collana, orecchini, bracciali e anelli, anchor SX/DX | Placeholder condivisi per categoria; non artwork individuale per ogni gioiello |
| Oggetti fuori dal slice | Fallback per slot/materiale/famiglia | Placeholder; non dichiarati asset definitivi dell'oggetto |
| Nemici | Predone, Segugio, Sentinella di Elar, Cervo del Crepuscolo | Vettori stilizzati del slice, non artwork finale |
| Altri nemici / Guardiano demo | Silhouette generica / Sentinella condivisa | Placeholder espliciti |
| Mappa | Terreno, montagne, fiume, bosco e percorso originali; sei nodi reali | Mappa stilizzata del slice, non concept preso dal web |
| Icone | 14 concetti SVG originali, più landmark già originali della Frontiera | Fondazione vettoriale utilizzabile; pass artistico finale ancora necessario |

**Nessun artwork personaggio è dichiarato production-ready.** I file SVG sono asset indipendenti utilizzabili nel prototipo, non ritagli di un concept, immagini complete per combinazione o maschere di un personaggio unico. La valutazione artistica resta separata dalla correttezza tecnica.

## Rig e coordinate

Rig `human-adult-v1`, corpo `human-adult`, canvas trasparente **360 × 640**, posa frontale a riposo, proporzioni adulte. Export sempre con `viewBox="0 0 360 640"`: niente crop automatico, ridimensionamento del singolo pezzo o origin differente.

| Anchor | x / y |
| --- | --- |
| Testa | 180 / 80 |
| Collo / attacco mantello | 180 / 135 |
| Vita | 180 / 285 |
| Mano sinistra / supporto | 109 / 330 |
| Mano destra / arma | 259 / 320 |
| Suolo / piedi | 180 / 602 |

Non servono offset per questi asset: ogni file include già le coordinate del rig. Eventuali asset futuri con offset devono dichiararlo nel manifest ed estendere esplicitamente il compositore; non correggerli con posizionamenti ad hoc nella UI.

Ordine del pittore: `cloak → hair-back → body / skin → ears → underclothes → legs → boots → torso → arms/gloves → gloves → belt → shoulders → face → eyes → hair-front → head → necklace → earLeft → earRight → braceletLeft → braceletRight → ringLeft → ringRight → support → weapon → FX`.

Mantello e capelli posteriori devono stare dietro il corpo; volto e occhi davanti al corpo. Il sottostrato dei pantaloni impedisce di mostrare pelle nelle articolazioni delle piastre. Queste sono le ragioni delle differenze dall'ordine di riferimento. `head` è il layer helmet per conservare l'identità dello slot M2; `weapon` corrisponde a `mainHand`. FX è riservato, senza aggiungere un sistema effetti complesso.

Gli **spallacci sono un asset/layer indipendente** associato per ora al torso: M2 ha 16 slot e nessuno slot shoulders. Il manifest descrive un bundle `[torso, shoulders]`, non un diciassettesimo slot fittizio. Un futuro slot shoulders potrà cambiare solo il mapping senza duplicare il renderer.

## Separazione dei dati

- `items.js`: opzioni Creator e palette, più dati legacy conservati per migrazione. Le vecchie geometrie inline non vengono usate dal nuovo renderer.
- `equipment-data.js`: inventario e metadati gameplay. Sette alternative visive demo sono copie dei parametri esistenti, non nuovi livelli di potenza.
- `equipment.js`: ownership, compatibilità, proficiency, equipaggiamento e statistiche. Rimane la fonte di verità.
- `visual-manifest.js`: descrizioni art, rig, ordine, mapping oggetto → asset, hide rules, fallback, nemici e coordinate nodi.
- `visual-renderer.js`: caricamento SVG, composizione e palette. Non assegna oggetti, XP o statistiche.
- `progression-system.js`: solo metadata opzionali `visualSnapshot` nel metodo di preparazione, senza modifiche gameplay.
- `character.js`: adapter Personaggio e riepilogo statistiche esistente.
- `visual-ui.js`: adapter Equipaggiamento / Mappa / combattimento del mondo / icone / diagnostica DEBUG.
- `visual-icons.js`: registro dei 14 concetti originali; i nomi testuali dei pulsanti restano presenti.

Ogni entry del manifest dichiara `id`, `layer`, `file`, `compatibleRig`, `compatibleBody`, `classCompatibility`, `equipmentItems`, `hideRules`, `zOrder`, `quality`. La compatibilità art è descrittiva: l'Armor Proficiency e l'utilizzabilità restano nel sistema Equipment, non vengono replicate nel renderer.

`VisualManifest.resolve(model)` è puro. `VisualRenderer.model()` legge **appearanceItem**, mentre `twoHanded` legge l'oggetto realmente equipaggiato. `VisualRenderer.create(svg, provider)` compone la medesima pipeline per hub, Equipment, Combat demo e incontri del mondo.

Ogni gruppo conserva `data-layer`, `data-item` (ID del vero oggetto di appearance, oppure scelta estetica per capelli/volto), `data-asset` (file effettivamente visualizzato), `data-quality`, `data-fallback`. Un cambio equipaggiamento sostituisce soltanto il gruppo interessato ed eventuali layer del suo bundle/hide rule. I gruppi estranei mantengono gli stessi nodi DOM.

Caricamento asincrono con revisioni per layer e render: una risposta vecchia non può sovrascrivere una scelta successiva, né il suo colore. Gradienti e pattern hanno ID con namespace per istanza/layer, senza collisioni tra i diversi personaggi nella stessa pagina.

## Aspetto, glamour, hide rules

`Character Appearance` (`hair`, `hairColor`, `skin`, `eyes`, `face`) resta distinto da `equipmentAppearance.dye`, dagli `appearanceItem` e dalle statistiche degli `equippedItem`.

- Palette pelle: body e face, senza tingere equipaggiamento.
- Palette capelli e occhi: esclusivamente i rispettivi canali estetici.
- `--dye`: soltanto inserti del torso, mai filtro sull'intero SVG.
- Elmo Plate B chiuso: hide rules per `hair-front`, `hair-back`, `face`, `eyes`.
- Plate A e Mail A aperti: nessuna hide rule capelli.
- Arma **realmente** 2H: supporto nascosto, anche se il visual/glamour è 1H.
- Sword + Shield e Bow + Quiver: entrambi i layer visibili.

Non viene implementato un nuovo editor glamour. Il mapping preserva la rappresentazione distinta già prevista da `appearanceItem`. La normale scelta equipaggiamento continua ad assegnare entrambi gli ID come prima.

## Salvataggi / Creator

Migrazione additiva nello schema Equipment v1 esistente: `skin: warm`, `face: calm` soltanto se assenti/non validi. Gli ID capelli precedenti `veil` e `crest` restano validi; si aggiunge `braid`. Le sette alternative Plate B/Sword B/Shield B usano `demoMigration` come il kit Mail demo già esistente: ownership demo aggiunta una sola volta per ID. Le statistiche sono identiche alle rispettive fonti Plate A/arma/scudo.

Nessun reset di livello/XP, build/classe, equipaggiamento, appearanceItem, Corone, materiali, inventario, quest, scoperte, spedizioni, report o receipt. `characterCreated` mantiene le regole precedenti: un vecchio personaggio rimane creato, un draft rimane draft. Creator chiuso dopo conferma, persistente dopo refresh; riapertura solo temporanea con `?test=1`. Barber System e vincoli d'identità rimangono TODO; nessun servizio o modifica libera post-creazione aggiunto.

## Mappa e Combat

La mappa usa `WorldData.locations`, `state.unlockedContent`, posizione persistita e obiettivi non completati della quest tracciata. Novità = quest realmente disponibile/completata presso il luogo; non un badge casuale. Stati con testo oltre al colore. Nodi bloccati non navigano; nodi disponibili usano lo stesso `data-world-enter` di M6.2. Le destinazioni contestuali, il ritorno e i controlli delle quest rimangono quelli esistenti.

World UI emette eventi di presentazione `nymeria:world-render` e `nymeria:world-battle-render`. Il nuovo adapter non calcola danni né assegna reward. Il personaggio in incontro deriva da **gearIds del ticket salvato**, così cambi classe/equipaggiamento successivi non cambiano il kit mostrato. I nuovi ticket includono anche `visualSnapshot` con dati estetici, dye e appearanceItem IDs: il glamour/aspetto alla partenza è preservato dopo cambi o refresh. Questo è soltanto metadata di presentazione nel metodo snapshot centrale, non una modifica al calcolo di statistiche/reward. Nei ticket M6 preesistenti non esiste questo campo: il combattimento usa il corpo corrente e i visual dei gearIds reali, senza inventare un glamour storico. Nel combattimento demo, il renderer aggiorna l'aspetto seguendo la politica preesistente di reset su cambio preparazione.

Nemico tramite metadata `enemyId → file`. Feedback skill deriva dal log del motore e dai nomi delle abilità del profilo salvato. HP restano calcolati dal motore. Log compatto, non rimosso. Idle del rig, oscillazione minima mantello/braccia/arma/supporto, blink e breve feedback di attacco; nessun cambio di tempi del motore. Tutti questi movimenti rispettano `prefers-reduced-motion`. Nessuna animazione complessa/hit rig è promessa per questa iterazione.

## Export, naming, budget e fallback

File SVG locali UTF-8: `assets/character/<set>-<part>.svg`, `hair-<style>-back/front.svg`, `assets/enemies/<visual>.svg`, `assets/world/frontier.svg`. Nessuna dipendenza runtime aggiunta.

Prima dell'export:

1. Disegnare sul rig/anchor condiviso, tenendo trasparente tutto ciò che non appartiene al pezzo.
2. Conservare canvas e scala. Un file contiene un singolo layer, mai un personaggio con il resto dell'equipaggiamento incluso.
3. Usare path vettoriali, gradienti e pattern interni, senza script, font esterni, immagini embedded o richieste remote.
4. Palette soltanto nei canali previsti: `--skin`, `--skin-light`, `--skin-shadow`, `--hair`, `--eyes`, `--dye`.
5. Eliminare definizioni inutilizzate; verificare intersezioni su tutte le combinazioni supportate.
6. Registrare asset e mapping, eseguire i test e confrontare screenshot a 390 px.

Budget indicativo: **≤8 KB per parte**, ≤150 KB per catalogo personaggio di questo slice, canvas riservata via CSS. Consegna attuale: **62 SVG, circa 53 KB totali non compressi**, massimo file circa 2,4 KB. Cache delle Promise per asset, caricamento dei pezzi effettivamente necessari, stesso asset riusato nelle istanze; nessuna combinazione prerenderizzata. La mappa è un piccolo SVG background locale; i nemici hanno dimensioni dichiarate.

Con asset assente/non valido/rig incompatibile, sostituzione limitata al layer con fallback registrato. Se manca anche quello, si mantiene l'ultimo visual valido quando disponibile; in assenza, il layer rimane vuoto e gli altri continuano a funzionare. Body ha un fallback dedicato. In Test Mode, `data-visual-debug` e **DEBUG → Rig / asset diagnostics** indicano istanza, layer e asset mancanti. I failure sono memorizzati per la sessione: refresh ritenta il caricamento. Gli oggetti senza visual individuale usano un fallback dichiarato `placeholder`; la loro presenza/compatibilità/statistiche non cambiano.

I dati vengono salvati indipendentemente dai caricamenti grafici. Nessun errore asset cancella inventario o personaggio.

## Estensione

**Nuovo item visuale:** esportare la parte sul canvas condiviso; in `visual-manifest.js` registrare `asset(id, layer, metadata)` e `link(itemId, [assetId])`. L'item gameplay esiste in Equipment; niente inventario parallelo. Per bundle/spallacci passare più ID. Per un elmo chiuso aggiungere hide rules nei metadata, non nella UI.

**Nuova acconciatura:** aggiungere metadata a `ITEMS.hair`, esportare `hair-<id>-back.svg` e `hair-<id>-front.svg`. Il manifest registra entrambe automaticamente, Equipment valida l'ID dallo stesso catalogo, Creator lo presenta automaticamente. Nessuna combinazione per skin/occhi richiesta.

**Nuovo dettaglio volto:** aggiungere `ITEMS.face`, esportare `face-<id>.svg`. Registry e Creator derivano dalla stessa lista.

**Nuova classe:** aggiungere la classe nei sistemi gameplay quando autorizzato, poi asset con lo stesso rig e nuovi link metadata/classCompatibility. Non copiare `Character`, né introdurre un renderer per classe. Un corpo/posa incompatibile richiede un nuovo rig esplicito con asset compatibili e validazione, non deformazioni casuali dei pezzi di questo rig.

## Verifica e limiti

`node tests/visual-manifest.cjs`: 7 gruppi di verifiche metadata/geometrie/mapping/budget/migrazione/opzioni.

`NYMERIA_TEST_URL=http://127.0.0.1:8004 node tests/visual-browser.cjs`: scenari reali touch Chromium 320/390/430, parti A/B, naked/base clothing, hair/helmet, 2H, glamour, tintura, Creator/DEBUG, sedici slot e inventario filtrato, mappa/stati/quest, Combat/preparazione/refresh, fallback, motion, overflow, cache e assenza errori JS. Scrive proof in `/workspace/nymeria-preview/m65` (override `NYMERIA_PROOF_DIR`); screenshot **fuori dal repository**.

Suite precedenti M2–M6.2 mantenute; aggiornate soltanto aspettative necessarie per sette nuovi oggetti demo e quattro script/versione cache. Le verifiche delle geometrie attendono il renderer dove è necessario.

Non sono prove eseguite su un iPhone fisico o Safari reale. Le viewport touch riproducono le dimensioni richieste; safe area via CSS resta da verificare su hardware con notch. Nessun benchmark FPS su device è dichiarato. La qualità del rig e l'ampiezza degli asset sono adatte a questo piccolo slice; produzione richiede revisione artistica, più corpi/pose, visual individuali per altri oggetti, altri nemici, ulteriori animazioni e QA dei browser reali.

## Inventario dei file M6.5

File applicazione modificati: `app.js`, `character.js`, `combat-ui.js`, `equipment-data.js`, `equipment.js`, `index.html`, `items.js`, `progression-system.js`, `styles.css`, `world-ui.js`. Documenti: `README.md` e questo documento. Nuovi moduli: `visual-manifest.js`, `visual-renderer.js`, `visual-icons.js`, `visual-ui.js`.

Test nuovi: `tests/visual-manifest.cjs`, `tests/visual-browser.cjs`. Aspettative demo/cache aggiornate nei test `armor-loot-engine`, `browser`, `class-build-browser`, `class-build-engine`, `mobile-ux-browser`, `navigation`, `progression-browser`, `progression-engine` (tutti `.cjs`).

Asset SVG creati (62):

- `assets/character/`: `arms.svg`, `base-boots.svg`, `base-legs.svg`, `base-torso.svg`, `belt-a.svg`, `belt-b.svg`, `body-fallback.svg`, `body.svg`, `bow-a.svg`, `bracelet-left.svg`, `bracelet-right.svg`, `cloak-a.svg`, `cloak-b.svg`, `ear-left.svg`, `ear-right.svg`, `ears.svg`, `eyes.svg`, `face-calm.svg`, `face-scar.svg`, `greatsword.svg`, `hair-braid-back.svg`, `hair-braid-front.svg`, `hair-crest-back.svg`, `hair-crest-front.svg`, `hair-veil-back.svg`, `hair-veil-front.svg`, `head-fallback.svg`, `mail-a-boots.svg`, `mail-a-gloves.svg`, `mail-a-helmet.svg`, `mail-a-legs.svg`, `mail-a-shoulders.svg`, `mail-a-torso.svg`, `necklace.svg`, `plate-a-boots.svg`, `plate-a-gloves.svg`, `plate-a-helmet.svg`, `plate-a-legs.svg`, `plate-a-shoulders.svg`, `plate-a-torso.svg`, `plate-b-boots.svg`, `plate-b-gloves.svg`, `plate-b-helmet.svg`, `plate-b-legs.svg`, `plate-b-shoulders.svg`, `plate-b-torso.svg`, `quiver-a.svg`, `ring-left.svg`, `ring-right.svg`, `shield-a.svg`, `shield-b.svg`, `staff.svg`, `support-fallback.svg`, `sword-a.svg`, `sword-b.svg`, `underclothes.svg`.
- `assets/enemies/`: `fallback.svg`, `hound.svg`, `raider.svg`, `sentinel.svg`, `stag.svg`.
- `assets/world/`: `frontier.svg`.

Risultato della validazione conclusiva: 141 verifiche Node delle 9 suite precedenti + 7 verifiche pipeline (148 complessive); 41 scenari browser M6.5; tutte le 13 suite browser precedenti M2–M6.2 verdi. Prova dedicata sotto `/nymeria/`: tutti i 62 SVG rispondono correttamente, script/CSS relativi validi, Equipment/Mappa/Combat funzionanti e nessuna collisione degli ID SVG/DOM. Screenshot finali tutti a 390 px, fuori dal repository; nessun errore JS o overflow nelle viewport touch 320/390/430.
