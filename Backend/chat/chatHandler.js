const gestisciBattagliaNavale = require('../battleshipSocket');
const Message = require('./Message'); // Importiamo il modello del databas

// Questo modulo riceve "io" dal server principale e gestisce i canali
module.exports = function(io) {
    io.on('connection', (socket) => {
        socket.on('imposta_username', (username) => {
            socket.username = username; // vediamo il nome che manda il frontend e Salviamo il nome qui
            console.log(`🟢 ${socket.username} si è connesso alla chat!`);
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
                io.emit('ricevi_messaggio', datiMessaggio);
            } catch (errore) {
                console.error("Errore durante il salvataggio del messaggio su DB:", errore);
            }
        });

        socket.on('disconnect', () => {
            console.log(`🔴 ${socket.username} si è disconnesso`); //template literals
            //inseriamo backticks (`). servono per inserire le variabili all'interno del testo.
            //altimenti era: console.log("🔴" +socket.username+ "si è disconnesso`);

        });

        gestisciBattagliaNavale(io, socket);

    });
};