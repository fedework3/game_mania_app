import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

// Creiamo il contesto
export const AuthContext = createContext();

// Creiamo il Provider (il guscio che conterrà i dati)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Serve a bloccare l'app finché non ha controllato il token

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
    localStorage.setItem('token', token);
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