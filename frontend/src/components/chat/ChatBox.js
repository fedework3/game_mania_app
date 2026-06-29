import React, { useState, useEffect, useContext, useRef } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from '../../context/AuthContext'; // contesto globale
// Connessione socket per questo componente
const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000');

function ChatBox() {
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [utentiOnline, setUtentiOnline] = useState([]);

  // Prendiamo l'utente direttamente dal guscio globale
  const { user } = useContext(AuthContext);
  const username = user ? user.username : 'Ospite';

  // ho creato l'ancora invisibile che mi porta sempre verso l'ultimo messaggio inserito
  const fineChatRef = useRef(null);

  // Funzione che fa scorrere la pagina verso l'ancora in modo fluido
  const scorriInBasso = () => {
    fineChatRef.current?.scrollIntoView({ behavior: "smooth" });
  };// il ? Si chiama Optional Chaining. Serve a evitare che il sito vada in crash se per qualche motivo il div non è ancora stato caricato sulla pagina

  // Dico a React di scorrere in basso ogni volta che l'array "messages" cambia
  useEffect(() => {
    scorriInBasso();
  }, [messages]);

  useEffect(() => {
    //  Appena apro la chat, chiedo al backend gli ultimi 150 messaggi
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
      socket.emit('imposta_username', user.username);// mi connetto all'evento dando username
    }

    socket.on('ricevi_messaggio', (nuovoMessaggio) => {
      setMessages((messaggiPrecedenti) => [...messaggiPrecedenti, nuovoMessaggio]);
    });

    socket.on('aggiorna_utenti_online', (listaUtenti) => {
      setUtentiOnline(listaUtenti);
    });

    return () => {
      socket.off('ricevi_messaggio');
      socket.off('aggiorna_utenti_online');
    };
  }, [user]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage) return;//callback in cui prendo le informazioni e blocco il ricaricamento

    //  nome utente
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

      <div className="online-users-panel">
        
        <div className="online-users-header">
          🟢 Online ({utentiOnline.length})
        </div>
        
        <div className="online-users-list">
          {utentiOnline.length > 0 ? (
            utentiOnline.map((nome, i) => (
              <span key={i} className="online-user-badge">
                {nome}
              </span>
            ))
          ) : (
            <span>Al momento sei l'unico connesso</span>
          )}
        </div>

      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <p style={{ color: '#aaa', textAlign: 'center', fontSize: '14px' }}>
            Nessun messaggio. Scrivi qualcosa per iniziare!
          </p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className="chat-bubble">
              <span style={{ fontSize: '0.75rem', color: '#8b9bb4', marginRight: '8px', fontFamily: 'monospace' }}>
                {msg.orario 
                  ? new Date(msg.orario).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                  : ''}
              </span>
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