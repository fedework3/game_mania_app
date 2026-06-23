const gestisciBattagliaNavale = require('../battleshipSocket');
const Message = require('./Message'); // Importiamo il modello del databas

const utentiConnessi = new Map();

// Questo modulo riceve "io" dal server principale e gestisce i canali
module.exports = function(io) {
    io.on('connection', (socket) => {
        socket.on('imposta_username', (username) => {
            socket.username = username; // vediamo il nome che manda il frontend e Salviamo il nome qui
            console.log(`🟢 ${socket.username} si è connesso alla chat!`);
            // NUOVO: Aggiungiamo l'utente al registro (usiamo socket.id come chiave univoca)
            utentiConnessi.set(socket.id, username);
            
            // NUOVO: Rimuoviamo eventuali doppioni (se uno ha due schede aperte) e inviamo la lista a tutti
            const listaUtentiUnici = [...new Set(utentiConnessi.values())];
            io.emit('aggiorna_utenti_online', listaUtentiUnici);
        });

        // Ascolta i messaggi in arrivo
        socket.on('invia_messaggio', async (datiMessaggio) => {
            try {
                // 1. Prepariamo il pacchetto per MongoDB
                const nuovoMessaggio = new Message({
                    username: datiMessaggio.username,
                    testo: datiMessaggio.testo,
                    orario: Date.now()
                });
                
                // 2. Lo salviamo fisicamente nel database in cloud
                await nuovoMessaggio.save();

                const MAX_MESSAGGI = 150;
                const conteggio = await Message.countDocuments();
        
                if (conteggio > MAX_MESSAGGI) {
                    // Individua i 150 messaggi più recenti presenti nel database
                    const messaggiDaTenere = await Message.find()
                        .sort({ orario: -1 })
                        .limit(MAX_MESSAGGI)
                        .select('_id');

                    // Estrae solo la lista dei loro ID
                    const idsDaTenere = messaggiDaTenere.map(m => m._id);

                    // Cancella tutti i messaggi il cui ID NON è presente nella lista di quelli recenti
                    await Message.deleteMany({ _id: { $nin: idsDaTenere } });
                }

                // 3. Se il salvataggio va a buon fine, lo mostriamo in tempo reale a tutti
                io.emit('ricevi_messaggio', nuovoMessaggio);
            } catch (errore) {
                console.error("Errore durante il salvataggio del messaggio su DB:", errore);
            }
        });

        socket.on('disconnect', () => {
            console.log(`🔴 ${socket.username} si è disconnesso`); //template literals
            //inseriamo backticks (`). servono per inserire le variabili all'interno del testo.
            //altimenti era: console.log("🔴" +socket.username+ "si è disconnesso`);
            
            // NUOVO: Cancelliamo l'utente dal registro quando chiude la pagina
            if (utentiConnessi.has(socket.id)) {
                utentiConnessi.delete(socket.id);
                
                // NUOVO: Annunciamo a tutti la lista aggiornata (con un utente in meno)
                const listaUtentiUnici = [...new Set(utentiConnessi.values())];
                io.emit('aggiorna_utenti_online', listaUtentiUnici);
            }

        });

        gestisciBattagliaNavale(io, socket);

    });
};