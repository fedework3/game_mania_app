// battleshipSocket.js

// La nostra sedia per la sala d'attesa (può ospitare un solo giocatore alla volta)
let giocatoreInAttesa = null;

const gestisciBattagliaNavale = (io, socket) => {
    
    // Quando il frontend invia il messaggio "giocatore_pronto"
    socket.on('giocatore_pronto', (dati) => {
        console.log(`[Battaglia Navale] ${dati.username} ha schierato le navi ed è pronto!`);

        if (giocatoreInAttesa) {
            // C'È GIÀ QUALCUNO! INIZIAMO LA PARTITA
            const giocatore1 = giocatoreInAttesa;
            
            // Il giocatore 2 è quello che ha appena cliccato "Pronto"
            const giocatore2 = { 
                id: socket.id, 
                username: dati.username, 
                griglia: dati.griglia 
            };

            // Creiamo una "Stanza Segreta" (Room) per farli giocare e parlare solo tra di loro
            const nomeStanza = `partita_${giocatore1.id}_${giocatore2.id}`;
            giocatore1.socket.join(nomeStanza);
            socket.join(nomeStanza);

            console.log(`Partita avviata tra ${giocatore1.username} e ${giocatore2.username}`);

            // Avvisiamo ENTRAMBI i giocatori che la partita è iniziata inviandogli il nome del nemico
            io.to(giocatore1.id).emit('partita_iniziata', { avversario: giocatore2.username });
            io.to(giocatore2.id).emit('partita_iniziata', { avversario: giocatore1.username });

            // Svuotiamo la sedia della sala d'attesa per i prossimi giocatori
            giocatoreInAttesa = null;

        } else {
            // LA SEDIA È VUOTA: Il giocatore si siede e aspetta
            console.log(`Nessun avversario, ${dati.username} è in attesa...`);
            giocatoreInAttesa = { 
                id: socket.id, 
                username: dati.username, 
                griglia: dati.griglia, 
                socket: socket 
            };
        }
    });

    // Se il giocatore chiude la pagina mentre sta aspettando, liberiamo la sedia!
    socket.on('disconnect', () => {
        if (giocatoreInAttesa && giocatoreInAttesa.id === socket.id) {
            console.log(`${giocatoreInAttesa.username} si è stancato di aspettare ed è uscito.`);
            giocatoreInAttesa = null;
        }
    });
};

// Esportiamo la funzione per poterla usare in server.js
module.exports = gestisciBattagliaNavale;