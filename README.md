# NYMERIA

MMORPG mobile testuale e illustrato. Questa cartella contiene il gioco (client), un server minimo con account e
salvataggio online, e i test.

## Come si avvia

Serve Node.js 22.5 o più recente. Nessuna altra dipendenza.

```
npm start          # compila il gioco e avvia il server su http://localhost:8080
npm test           # compila e lancia i test del server
node test/e2e.js   # prova completa con un browser vero (richiede Playwright: npm i -g playwright)
```

Variabili utili: `PORT` (porta, default 8080) e `NYMERIA_DB` (percorso del database, default `data/nymeria.db`).
La cartella `data/` contiene i personaggi: va salvata con un backup regolare.

Aprendo il gioco dal server compare, nel Menu e nella scelta del popolo, la scheda **Account online**: ci si registra
con nome account e password e il personaggio viene salvato sul server e ripreso da qualsiasi dispositivo. Senza server
(file aperto direttamente, anteprima su claude.ai) il gioco funziona come prima e salva solo sul dispositivo.

## Struttura

```
client/styles.css      stili del gioco
client/body.html       struttura della pagina (menu in basso, schermata di combattimento, finestre)
client/js/NN-nome.js   il codice del gioco, in file numerati: vengono uniti in ordine numerico
tools/build.js         unisce tutto in dist/index.html (per il server) e dist/artifact.html (per l'anteprima)
server/server.js       server HTTP: gioco, account, salvataggio, pagine pubbliche
server/auth.js         registrazione, accesso, sessioni (password con scrypt)
server/validate.js     controlli sul salvataggio ricevuto
server/db.js           database SQLite
test/                  test del server e prova completa nel browser
```

I file del client NON sono moduli separati: sono pezzi dello stesso programma, uniti nell'ordine dei numeri. Per
aggiungere un file, dagli il numero giusto (le funzioni si possono usare prima di essere definite, le costanti no).

## Cosa fa il server oggi

- `POST /api/register`, `POST /api/login`, `POST /api/logout`
- `GET /api/save` e `PUT /api/save`: il personaggio, con numero di revisione per accorgersi dei conflitti tra dispositivi
- `GET /api/profile/<account>` e `GET /p/<account>`: pagina pubblica del personaggio (livello, classe, equipaggiamento firmato)
- limite di richieste, dimensione massima dei dati, intestazioni di sicurezza

Per metterlo online serve HTTPS (di solito un proxy come Caddy o Nginx davanti al server) e un servizio dove
affittare una macchina con Node.js. Dettagli e limiti attuali in `ARCHITETTURA.md`.
