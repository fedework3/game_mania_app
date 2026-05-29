const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  username: { type: String, required: true },
  testo: { type: String, required: true },
  orario: { type: Date, default: Date.now } // Salva l'ora esatta in automatico
});

module.exports = mongoose.model('Message', MessageSchema);