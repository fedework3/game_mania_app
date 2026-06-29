import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

// Creiamo il contesto
export const AuthContext = createContext();//creo la scatola vuota.
// Dichiaro a React che esisterà uno spazio di memoria condiviso chiamato AuthContext

// Creiamo il Provider (il guscio che conterrà i dati).
// È il componente che fa da "Gestore" della scatola.
// Prende tutti gli altri componenti della tua app (i children, cioè le pagine) e
// li avvolge, facendoli vivere al suo interno 
// user ricorda chi è connesso in questo momento.
// loading è un interruttore di sicurezza: non fa caricare le pagine finché non si ha controllato se l'utente ha già fatto l'accesso in passato
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Serve a bloccare l'app finché non ha controllato il token
  
  //Questo blocco scatta una sola volta quando apri il sito. è il "cosa fare"
  // Va a sbirciare nel localStorage (la memoria del browser) per vedere se c'è un token salvato
  // da una visita precedente. Se lo trova, lo "decodifica" con jwtDecode per leggere il nome utente e lo salva nello stato. 
  // Se il token è scaduto o falso, lo butta via. Alla fine, spegne il loading.
  // con [] gli dico di farla solo una volta, altrimenti farebbe all'infinito. se ci metto variabili dentro, viene eseguito all'inizio e anche quando le variabili cambiano
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded); // Salviamo i dati dell'utente (id, username) nello stato globale
      } catch (error) {
        console.error("Token non valido o scaduto");
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  // Funzione globale per fare il Login
  const loginGlobal = (token) => {
    localStorage.setItem('token', token);//salva il token dentro il browser e permettere di rimanere loggato anche se si refresha
    const decoded = jwtDecode(token);
    setUser(decoded);
  };

  // Funzione globale per fare il Logout
  const logoutGlobal = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    // Esponiamo i dati dell'utente e le funzioni a tutta l'app
    <AuthContext.Provider value={{ user, loginGlobal, logoutGlobal, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Senza questo file nel frontend, interfaccia grafica non avrebbe alcuna memoria
// di chi sta usando il computer 