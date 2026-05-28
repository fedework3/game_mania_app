require('dotenv').config();// va a prendere il file .env
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); // Nuova libreria per MongoDB
const bcrypt = require('bcrypt'); // NUOVO: Per criptare le password
const jwt = require('jsonwebtoken'); // NUOVO: Per i token di sessione
const http = require('http');
const { Server } = require('socket.io');

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3001",
        methods: ["GET", "POST"]
    }
});

const JWT_SECRET = "chiave_token";//chiave segreta per i token

app.use(cors());
app.use(express.json());

// --- 1. CONNESSIONE A MONGODB ---

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("🟢 Connesso a MongoDB con successo!"))
    .catch(err => console.error("🔴 Errore di connessione a MongoDB:", err));

// --- 2. CREAZIONE DEL MODELLO DATI ---
// Definiamo come è fatto un Utente nel nostro database
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true } 
});

const User = mongoose.model('User', userSchema);

// --- 3. ROTTA DI REGISTRAZIONE (Per popolare il database) ---
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Controlla se l'utente esiste già
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ error: "Username già in uso" });
        }

        // NUOVO: Criptiamo la password prima di salvarla! (10 è il livello di sicurezza)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crea e salva il nuovo utente nel database
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        
        res.status(201).json({ success: true, message: "Utente registrato con successo!" });
    } catch (error) {
        res.status(500).json({ error: "Errore del server durante la registrazione" });
    }
});

// --- 4. ROTTA DI LOGIN (Aggiornata con MongoDB) ---
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(`Tentativo di login da: ${username}`);

        // Cerca l'utente nel database MongoDB
        const user = await User.findOne({ username });

        // Se l'utente esiste e la password corrisponde a quella nel DB
        if (!user) {
            return res.status(401).json({ success: false, error: "Username non trovato" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            // NUOVO: La password è giusta! Creiamo il Token JWT valido per 1 ora
            const token = jwt.sign(
                { userId: user._id, username: user.username }, 
                JWT_SECRET, 
                { expiresIn: '1h' }
            );

            // Invece di mandare solo "ok", mandiamo anche il token!
            res.status(200).json({ success: true, token: token, message: "Login approvato" });
        } else {
            res.status(401).json({ success: false, error: "Password errata" });
        }
    } catch (error) {
        res.status(500).json({ error: "Errore del server durante il login" });
    }
});



// Avviamo il server
const initChatHandler = require('./chat/chatHandler');
initChatHandler(io); // Attiviamo la chat passandogli il server socket io

server.listen(PORT, () => console.log(`Backend in esecuzione su http://localhost:${PORT}`));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server in ascolto sulla porta ${PORT}`);
});