import React, { useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from '../../context/AuthContext'; // contesto globale
// Connessione socket isolata per questo componente
const socket = io('http://localhost:3000');

function ChatBox() {
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);

  // Prendiamo l'utente direttamente dal guscio globale! Non serve più jwtDecode qui!
  const { user } = useContext(AuthContext);
  const username = user ? user.username : 'Ospite';

  useEffect(() => {
    if (user) {
      socket.emit('imposta_username', user.username);
    }

    socket.on('ricevi_messaggio', (nuovoMessaggio) => {
      setMessages((messaggiPrecedenti) => [...messaggiPrecedenti, nuovoMessaggio]);
    });

    return () => {
      socket.off('ricevi_messaggio');
    };
  }, [user]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage) return;

    // Usiamo il VERO nome utente al posto di "Io"!
    const datiMessaggio = {
      autore: username, 
      testo: chatMessage
    };

    socket.emit('invia_messaggio', datiMessaggio);
    setChatMessage('');
  };

  return (
    <div className="chat-column">
      <h2 className="column-title">Chat Globale 💬</h2>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <p style={{ color: '#aaa', textAlign: 'center', fontSize: '14px' }}>
            Nessun messaggio. Scrivi qualcosa per iniziare!
          </p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className="chat-bubble">
              {/* Se l'autore sono io, coloro il mio nome di verde, altrimenti di blu */}
              <strong style={{ color: msg.autore === username ? '#2ecc71' : '#3498db' }}>
                {msg.autore}:
              </strong> {msg.testo}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input 
          type="text" 
          placeholder="Scrivi un messaggio..." 
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          className="chat-input"
        />
        <button type="submit" className="chat-submit">Invia</button>
      </form>
    </div>
  );
}

export default ChatBox;