import React, {useContext} from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import BattagliaNavale from './components/games/BattagliaNavale';

// Importo il contesto globale
import { AuthProvider, AuthContext } from './context/AuthContext';

function AppRoutes() {
  // Prendo i dati dell'utente e lo stato di caricamento dal contesto globale che ho implementato precedentemente
  const { user, loading } = useContext(AuthContext);

  // Se l'app sta ancora leggendo il token dal browser, mostra una schermata di attesa
  if (loading) {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Caricamento...</div>;
  }

  return (
    <Routes>
      {/* Se l'utente è già loggato e prova ad andare sul Login "/", viene spedito direttamente in dashboard */}
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LoginScreen />} />
      
      {/* Se l'utente NON è loggato, la rotta lo respinge e lo rimanda alla pagina "/" */}
      <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />

      <Route path="/battaglia-navale" element={user ? <BattagliaNavale /> : <Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    // in questa sezione viene avvolto tutto l'intervallo delle rotte dentro l'AuthProvider
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;