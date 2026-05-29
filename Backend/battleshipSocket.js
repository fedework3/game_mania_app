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

            // 2. INVIAMO IL RISULTATO DEL LANCIO DELLA MONETA AL FRONTEND (tuoTurno sarà true o false)
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
        }

        // 3. GESTIONE DEL CAMBIO TURNO
        if (esito === 2) {
            // Se è ACQUA, il turno passa all'avversario
            mioStato.turnoDi = avversario.id;
            statoAvversario.turnoDi = avversario.id;
        } 
        // Se è COLPITO (esito === 3), non facciamo nulla: il turno rimane a socket.id!

        // 4. RISPOSTE CON AGGIORNAMENTO TURNO
        // Per chi ha sparato: continua se ha colpito una nave (esito 3)
        socket.emit('risultato_colpo', { 
            riga, colonna, esito, 
            tuoTurno: (esito === 3) 
        });

        // Per chi ha subito il colpo: diventa il suo turno solo se il nemico ha preso l'acqua (esito 2)
        io.to(avversario.id).emit('colpo_subito', { 
            riga, colonna, esito, 
            tuoTurno: (esito === 2) 
        });
    });

    socket.on('disconnect', () => {
        if (giocatoreInAttesa && giocatoreInAttesa.id === socket.id) {
            giocatoreInAttesa = null;
        }
    });
};

module.exports = gestisciBattagliaNavale;