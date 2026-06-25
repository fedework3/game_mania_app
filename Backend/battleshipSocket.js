let giocatoreInAttesa = null;
const utentiInGioco = {}; 

const gestisciBattagliaNavale = (io, socket) => {
    
    socket.on('giocatore_pronto', (dati) => {
        if (giocatoreInAttesa) {
            if (giocatoreInAttesa.username === dati.username) {
                // È la stessa persona! Aggiorniamo i suoi dati nel caso abbia cambiato le navi,
                // ma NON facciamo partire la partita contro se stesso.
                giocatoreInAttesa = { id: socket.id, username: dati.username, griglia: dati.griglia, socket: socket };
                return; // Fermiamo l'esecuzione qui!
            }
            const giocatore1 = giocatoreInAttesa;
            const giocatore2 = { id: socket.id, username: dati.username, griglia: dati.griglia };

            const idPrimoGiocatore = Math.random() < 0.5 ? giocatore1.id : giocatore2.id;

            utentiInGioco[giocatore1.id] = { avversario: giocatore2, miaGriglia: giocatore1.griglia, turnoDi: idPrimoGiocatore };
            utentiInGioco[giocatore2.id] = { avversario: giocatore1, miaGriglia: giocatore2.griglia, turnoDi: idPrimoGiocatore };

            const nomeStanza = `partita_${giocatore1.id}_${giocatore2.id}`;
            giocatore1.socket.join(nomeStanza);
            socket.join(nomeStanza);

            io.to(giocatore1.id).emit('partita_iniziata', { avversario: giocatore2.username, tuoTurno: (idPrimoGiocatore === giocatore1.id) });
            io.to(giocatore2.id).emit('partita_iniziata', { avversario: giocatore1.username, tuoTurno: (idPrimoGiocatore === giocatore2.id) });

            giocatoreInAttesa = null;
        } else {
            giocatoreInAttesa = { id: socket.id, username: dati.username, griglia: dati.griglia, socket: socket };
        }
    });

    socket.on('abbandona_coda', () => {
        // Se la sedia è occupata proprio da chi se ne sta andando, la svuotiamo!
        if (giocatoreInAttesa && giocatoreInAttesa.id === socket.id) {
            giocatoreInAttesa = null;
        }
    });

    socket.on('lancia_colpo', ({ riga, colonna }) => {
        const mioStato = utentiInGioco[socket.id];
        if (!mioStato || mioStato.turnoDi !== socket.id) return; 

        const avversario = mioStato.avversario;
        const statoAvversario = utentiInGioco[avversario.id];

        let cellaBersaglio = statoAvversario.miaGriglia[riga][colonna];
        let esito = 2; // 2 = Acqua
        let coordinateAffondate = []; // Servirà a dire al frontend quali X trasformare in Fuoco

        // Le navi ora hanno ID da 10 in su (es. 10, 11, 12, 13, 14)
        if (cellaBersaglio >= 10) {
            const idNave = cellaBersaglio;
            esito = 3; // 3 = COLPITO (X Rossa)
            statoAvversario.miaGriglia[riga][colonna] = -idNave; // Segniamo il pezzo come distrutto

            // CERCHIAMO SE CI SONO ALTRI PEZZI DI QUESTA NAVE
            const naveSopravvissuta = statoAvversario.miaGriglia.some(r => r.includes(idNave));

            if (!naveSopravvissuta) {
                esito = 4; // 4 = AFFONDATO! (Fuoco)
                // Troviamo tutte le coordinate di questa nave distrutta per farle bruciare
                statoAvversario.miaGriglia.forEach((row, rI) => {
                    row.forEach((col, cI) => {
                        if (col === -idNave) {
                            statoAvversario.miaGriglia[rI][cI] = 4; // Diventa fuoco sul server
                            coordinateAffondate.push({ r: rI, c: cI });
                        }
                    });
                });
            }

            // CONTROLLO VITTORIA GLOBALE
            const naviRimaste = statoAvversario.miaGriglia.some(r => r.some(c => c >= 10));
            if (!naviRimaste) {
                socket.emit('risultato_colpo', { riga, colonna, esito, tuoTurno: false, coordinateAffondate });
                io.to(avversario.id).emit('colpo_subito', { riga, colonna, esito, tuoTurno: false, coordinateAffondate });

                socket.emit('fine_partita', { messaggio: "VITTORIA! 🏆 Hai affondato tutta la flotta!" });
                io.to(avversario.id).emit('fine_partita', { messaggio: "SCONFITTA! 💥 La tua flotta è distrutta!" });
                
                delete utentiInGioco[socket.id];
                delete utentiInGioco[avversario.id];
                return; 
            }
        }

        if (esito === 2) {
            mioStato.turnoDi = avversario.id;
            statoAvversario.turnoDi = avversario.id;
        } 

        socket.emit('risultato_colpo', { riga, colonna, esito, tuoTurno: (esito >= 3), coordinateAffondate });
        io.to(avversario.id).emit('colpo_subito', { riga, colonna, esito, tuoTurno: (esito === 2), coordinateAffondate });
    });

    socket.on('disconnect', () => {
        if (giocatoreInAttesa && giocatoreInAttesa.id === socket.id) giocatoreInAttesa = null;
        const mioStato = utentiInGioco[socket.id];
        if (mioStato) {
            io.to(mioStato.avversario.id).emit('fine_partita', { messaggio: "VITTORIA! 🏆 L'avversario è scappato." });
            delete utentiInGioco[socket.id];
            delete utentiInGioco[mioStato.avversario.id];
        }
    });
};
module.exports = gestisciBattagliaNavale;