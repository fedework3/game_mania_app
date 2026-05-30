import React, { useState, useEffect, useContext, useRef } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from '../../context/AuthContext'; // contesto globale
// Connessione socket isolata per questo componente
const socket = io(process.env.REACT_APP_BACKEND_URL);

function ChatBox() {
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);

  // Prendiamo l'utente direttamente dal guscio globale! Non serve più jwtDecode qui!
  const { user } = useContext(AuthContext);
  const username = user ? user.username : 'Ospite';

  // NUOVO: Creiamo l'ancora invisibile
  const fineChatRef = useRef(null);

  // NUOVO: Funzione che fa scorrere la pagina verso l'ancora in modo fluido
  const scorriInBasso = () => {
    fineChatRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // NUOVO: Diciamo a React di scorrere in basso ogni volta che l'array "messages" cambia
  useEffect(() => {
    scorriInBasso();
  }, [messages]);

  useEffect(() => {
    // 1. NUOVO: Appena apro la chat, chiedo al backend gli ultimi 50 messaggi
    const caricaStorico = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/messages`);
        if (response.ok) {
          const storico = await response.json();
          setMessages(storico); // Riempio la chat con la memoria del database!
        }
      } catch (error) {
        console.error("Errore nel caricamento dello storico:", error);
      }
    };

    caricaStorico(); // Eseguo la funzione. Quando si apre la pagina, 
    // la funzione caricaStorico scatta per prima. 
    // Bussa alla nuova rotta /api/messages del server Node, 
    // si fa dare la lista dei vecchi messaggi da MongoDB e li stampa a schermo.
    //  Poi, Socket.io prende aggiunge in tempo reale
    //  i messaggi nuovi che si scrivono

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
      username: username, 
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
              {/* Se scrivo io, coloro il mio nome di verde, altrimenti di blu */}
              <strong style={{ color: msg.username === username ? '#2ecc71' : '#3498db' }}>
                {msg.username}:
              </strong> {msg.testo}
            </div>
          ))
        )}
        <div ref={fineChatRef} />
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