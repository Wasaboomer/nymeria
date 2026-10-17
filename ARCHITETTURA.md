# Architettura e prossimi passi

## Stato attuale (versione 0.2)

Il **client calcola ancora tutte le regole**: combattimento, ricompense, raccolta, mestieri, imprese. Il server
conserva gli account e il personaggio e controlla che i dati ricevuti siano possibili. Questo significa:

- il salvataggio online funziona e si può usare da più dispositivi;
- **non è a prova di imbroglio**: un giocatore esperto può modificare il proprio client e inviare un personaggio
  forte ma plausibile. `server/validate.js` blocca i dati impossibili e i salti di progresso troppo rapidi
  (esperienza e Corone nel tempo trascorso), ma non è una difesa vera.

Va bene per provare il gioco con pochi amici. **Non basta per gilde, mercato o classifiche**, dove l'imbroglio
rovina il gioco degli altri.

## Il passo successivo: le regole sul server

Si sposta un pezzo alla volta, dal più semplice al più delicato. Per ogni pezzo il client invia solo
*"voglio fare questa azione"* e il server calcola il risultato.

1. **Dati e formule condivisi.** Estrarre da `client/js` le tabelle (oggetti, nemici, ricette, luoghi, classi) in file
   senza interfaccia, usati sia dal client sia dal server. Oggi `server/names.js` duplica alcuni nomi: sparirà.
2. **Mestieri, Borsa, deposito, vendita.** Sono operazioni senza tempo reale: il server verifica materiali e spazio e
   assegna l'oggetto. Qui nasce il registro degli oggetti unici (un identificativo per esemplare).
3. **Raccolta e imprese giornaliere.** Il server tiene i tempi (già assoluti, `NOW()`), le cariche dei nodi e i contatori.
4. **Combattimento.** Il passo più grande: il server simula lo scontro e il client lo mostra. Per i combattimenti a
   tempo reale in gruppo si userà un server di stanze (ad esempio Colyseus). La tattica automatica
   alla disconnessione (sempre peggiore del giocatore umano) gira già nello stesso simulatore.
5. **Spegnere la fiducia nel client.** Quando tutti i punti sopra sono fatti, `PUT /api/save` smette di accettare
   dati dal client e resta solo in lettura.

## Decisioni da prendere con calma

- Dove affittare la macchina (prezzo, backup, dati in Europa per la privacy).
- Chat e moderazione: gli store le richiedono se il gioco ha chat o profili pubblici.
- Età e informativa sulla privacy prima della pubblicazione.
- Passare da SQLite a un database più grande solo se i giocatori lo richiedono.
