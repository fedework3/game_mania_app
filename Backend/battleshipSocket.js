// battleshipSocket.js

let giocatoreInAttesa = null;
const utentiInGioco = {}; 

const gestisciBattagliaNavale = (io, socket) => {
    
    socket.on('giocatore_pronto', (dati) => {
        console.log(`[Battaglia Navale] ${dati.username} schierato!`);

        if (giocatoreInAttesa) {
            const giocatore1 = giocatoreInAttesa;
            const giocatore2 = { id: socket.id, username: dati.username, griglia: dati.griglia };

            // 1. DECIDIAMO CHI INIZIA IN MODO CASUALE (50% di probabilità)
            const idPrimoGiocatore = Math.random() < 0.5 ? giocatore1.id : giocatore2.id;

            // Salviamo la partita inserendo anche l'informazione sul turno attuale
            utentiInGioco[giocatore1.id] = { avversario: giocatore2, miaGriglia: giocatore1.griglia, turnoDi: idPrimoGiocatore };
            utentiInGioco[giocatore2.id] = { avversario: giocatore1, miaGriglia: giocatore2.griglia, turnoDi: idPrimoGiocatore };

            const nomeStanza = `partita_${giocatore1.id}_${giocatore2.id}`;
            giocatore1.socket.join(nomeStanza);
            socket.join(nomeStanza);

            // 2. INVIAMO IL RISULTATO DEL LANCIO DELLA MONETA AL FRONTEND
            io.to(giocatore1.id).emit('partita_iniziata', { 
                avversario: giocatore2.username, 
                tuoTurno: (idPrimoGiocatore === giocatore1.id) 
            });
            io.to(giocatore2.id).emit('partita_iniziata', { 
                avversario: giocatore1.username, 
                tuoTurno: (idPrimoGiocatore === giocatore2.id) 
            });

            giocatoreInAttesa = null;

        } else {
            giocatoreInAttesa = { id: socket.id, username: dati.username, griglia: dati.griglia, socket: socket };
        }
    });

    socket.on('lancia_colpo', ({ riga, colonna }) => {
        const mioStato = utentiInGioco[socket.id];
        
        // SICUREZZA: Se non è il tuo turno, il server ignora il colpo (impedisce imbrogli)
        if (!mioStato || mioStato.turnoDi !== socket.id) return; 

        const avversario = mioStato.avversario;
        const statoAvversario = utentiInGioco[avversario.id];

        const cellaBersaglio = statoAvversario.miaGriglia[riga][colonna];
        let esito = 2; // Acqua di default

        if (cellaBersaglio === 1) {
            esito = 3; // Colpito!
            statoAvversario.miaGriglia[riga][colonna] = 3;

            // Usiamo ".some" per cercare se c'è almeno un "1" (nave intatta) rimasto nella griglia nemica.
            // Se non ne trova, significa che sono state tutte affondate!
            const naviSopravvissute = statoAvversario.miaGriglia.some(r => r.includes(1));

            if (!naviSopravvissute) {
                // Mandiamo l'ultimo colpo visivo sui radar per fargli vedere l'esplosione finale
                socket.emit('risultato_colpo', { riga, colonna, esito, tuoTurno: false });
                io.to(avversario.id).emit('colpo_subito', { riga, colonna, esito, tuoTurno: false });

                // Decretiamo il vincitore e il perdente!
                socket.emit('fine_partita', { messaggio: "VITTORIA! 🏆 Hai affondato tutta la flotta!" });
                io.to(avversario.id).emit('fine_partita', { messaggio: "SCONFITTA! 💥 La tua flotta è distrutta!" });

                // Pulizia della memoria del server per liberare spazio
                delete utentiInGioco[socket.id];
                delete utentiInGioco[avversario.id];
                
                return; // Interrompiamo la funzione qui, la partita è finita!
            }
        }

        // 3. GESTIONE DEL CAMBIO TURNO (solo se la partita non è finita)
        if (esito === 2) {
            // Se è ACQUA, il turno passa all'avversario
            mioStato.turnoDi = avversario.id;
            statoAvversario.turnoDi = avversario.id;
        } 
        // Se è COLPITO (esito === 3), non facciamo nulla: il turno rimane a socket.id!

        // 4. RISPOSTE CON AGGIORNAMENTO TURNO
        socket.emit('risultato_colpo', { 
            riga, colonna, esito, 
            tuoTurno: (esito === 3) 
        });

        io.to(avversario.id).emit('colpo_subito', { 
            riga, colonna, esito, 
            tuoTurno: (esito === 2) 
        });
    });

    socket.on('disconnect', () => {
        if (giocatoreInAttesa && giocatoreInAttesa.id === socket.id) {
            giocatoreInAttesa = null;
        }

        // Se un giocatore aggiorna la pagina o chiude il browser MENTRE sta giocando
        const mioStato = utentiInGioco[socket.id];
        if (mioStato) {
            const avversario = mioStato.avversario;
            // Diciamo all'avversario che ha vinto a tavolino
            io.to(avversario.id).emit('fine_partita', { messaggio: "VITTORIA! 🏆 L'avversario è scappato." });
            
            // Puliamo i dati dal server
            delete utentiInGioco[socket.id];
            delete utentiInGioco[avversario.id];
        }
    });
};

module.exports = gestisciBattagliaNavale;