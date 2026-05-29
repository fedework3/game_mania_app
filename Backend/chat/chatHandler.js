const gestisciBattagliaNavale = require('../battleshipSocket');

// Questo modulo riceve "io" dal server principale e gestisce i canali
module.exports = function(io) {
    io.on('connection', (socket) => {
        socket.on('imposta_username', (username) => {
            socket.username = username; // vediamo il nome che manda il frontend e Salviamo il nome qui
            console.log(`🟢 ${socket.username} si è connesso alla chat!`);
        });

        // Ascolta i messaggi in arrivo
        socket.on('invia_messaggio', (datiMessaggio) => {
            // Rispedisci a tutti
            io.emit('ricevi_messaggio', datiMessaggio);
        });

        socket.on('disconnect', () => {
            console.log(`🔴 ${socket.username} si è disconnesso`); //template literals
            //inseriamo backticks (`). servono per inserire le variabili all'interno del testo.
            //altimenti era: console.log("🔴" +socket.username+ "si è disconnesso`);

        });

        gestisciBattagliaNavale(io, socket);

    });
};