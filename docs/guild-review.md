# M7.0 Guild Foundation — review del branch

Baseline revisionata: `fc6daca21c8ff82b8f05f5ec81eeca2478f31a1d` su `m7-guilds`. `main` resta `10bac68285669db64b5d4978a1323d9ba621b38d`; nessun merge o modifica della sua ref. M7.0 richiede ancora revisione utente e prova fisica, non è una release validata.

## Problemi dell'implementazione ricevuta

- Hub vuoto: `window.GuildSystem` non esiste per una dichiarazione globale `const GuildSystem`; render interrompeva la UI prima del form.
- Escape letterali `\n` nell'HTML invece di newline; script/guild route con versioni cache miste rispetto a navigazione e CSS modificati.
- `localStorage` letto come parametro predefinito fuori da try/catch; scritture non gestite, stato mutato prima della conferma, listener UI capaci di far risultare fallita un'operazione già salvata.
- Un test concorrente ripetuto ha inoltre rilevato cache localStorage obsolete fra processi anche con il solo Web Lock; i ritardi sotto il lock non sono una correzione affidabile. Scelta conservativa: una lease Web Locks per una sola scheda scrivente, fino a chiusura/reload; altre schede consultabili e modifiche rifiutate senza perdere dati.
- Creazione senza rilettura/serializzazione: una scheda obsoleta poteva creare una seconda gilda o perdere contributi di un'altra scheda.
- Normalizzazione copiava membri arbitrari: null/name mancante potevano causare eccezioni, ranghi/fondatore/ID unici non garantiti, array e campi scalari accettati.
- Contributi senza limite nel modello, decimali troncati; Infinity/XP fuori curva e cap con XP residua non coerente; saldi e contributi individuali non bounded.
- Errori dei contributi ignorati dalla UI, nessun feedback di scrittura fallita, nessuna indicazione per ogni membro simulato, tesoreria “CONDIVISA” fuorviante.
- Radio con larghezza 100%, pulsanti senza stile/target coerente, etichette form insufficienti, nomi/motti/saldi lunghi senza contenimento mobile.

## Correzioni e confini

Engine senza DOM e senza dipendenze da ProgressionStore/Equipment: stato letto come copia, normalizzazione whitelist e idempotente, player unico leader, membri non-player simulati, XP totale canonica, cap e saldi finiti. Creazione/contributi asincroni rileggono nella scheda titolare della lease, scrivono una sola copia e pubblicano dopo successo; listener isolati. Versione futura non sovrascritta, errore storage mostrato e ritentabile, JSON corrotto recuperabile con avviso senza toccare i salvataggi personali.

UI accede alla dichiarazione lessicale del sistema, usa SVG originali del catalogo, escaping dei testi, controlli 44px, membri demo espliciti, feedback persistente e valori form conservati su errori. Materiali nominati dal catalogo di progressione; livello del fondatore mostrato dalla progressione centrale in sola lettura. Route `guild` già ricevuta mantenuta nello stack M6.2, nessuna nuova bottom destination o riscrittura del router. Test navigation esteso ai fallimenti dei tre moduli Guild.

Contributi **solo simulati**: mai sottrarre risorse giocatore e scrivere la gilda separatamente. La progettazione proposta è una migrazione verso un unico ledger canonico e un reducer sotto `ProgressionStore.transact`, con credito/debito/XP/ricevuta nel medesimo setItem e medesimo lock. Saldi demo non convertibili in valuta reale. Una transazione backend sarà necessaria per multiplayer futuro. Nessun collegamento economico o feature M7.1 implementato.

Resta il limite del prototipo locale: una sola scheda scrivente con Web Locks, nessuna garanzia multi-processo senza Web Locks, nessun recupero di contenuto da JSON completamente illeggibile, nessun backup/backend. La gilda non simula l'esistenza di altri giocatori reali.

## Verifiche automatizzate

- 18 verifiche motore Guild: creazione/doppia creazione, input, quantità/overflow, XP multipli/cap, normalizzazione idempotente, invarianti, marker versione mancante, JSON corrotto, schema futuro, storage negato/quota/retry, copia dello stato e isolamento dei listener.
- Suite Guild browser su 320/375/390/430 px: percorso reale Menu/Gilda/Indietro e focus/stack, sigilli e escaping, ruoli/demo, contributi isolati dal ledger personale, livello fondatore dalla progressione centrale, reload, recupero salvataggi, storage failure/retry con valori form conservati, touch 44px, overflow ed errori JS/HTTP.
- Due schede reali: unica creazione, 30 modifiche del lettore rifiutate mentre lo scrittore conferma i contributi, aggiornamento UI del lettore, passaggio della lease dopo chiusura, reload e contributi senza duplicare gilda o perdere unità. Fallback senza Web Locks verificato in una singola scheda con avviso esplicito.
- Tutte le suite disponibili del progetto eseguite: 166 verifiche Node (incluse Guild e manifest visuale) e 17 suite browser (incluse Guild, M2–M6.5.1 e navigazione con moduli mancanti/cache precedente), tutte superate sul sottopercorso `/nymeria/`. Le suite pertinenti sono rieseguite dopo le correzioni finali.
- Screenshot/log/test output restano fuori dal checkout; nessun asset temporaneo o dipendenza aggiunta. Nessuna modifica a ProgressionStore, motore Combat, Class, Quest/Expedition o al codice del router M6.2.

Ancora da provare su iPhone fisico: tastiera/input/radio sigilli, scroll e Indietro/focus, refresh/chiusura/riapertura, passaggio fra schede e riacquisizione della lease (inclusi back/forward cache e sospensione Safari). Il risultato automatizzato non costituisce validazione M7.0.
