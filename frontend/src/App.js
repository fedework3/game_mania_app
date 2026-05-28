import React, {useContext} from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Importiamo i componenti che abbiamo appena creato nella cartella componenti
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';

// Importiamo il contesto globale
import { AuthProvider, AuthContext } from './context/AuthContext';

function AppRoutes() {
  // Prendiamo i dati dell'utente e lo stato di caricamento dal contesto globale
  const { user, loading } = useContext(AuthContext);

  // Se l'app sta ancora leggendo il token dal browser, mostra una schermata di attesa
  if (loading) {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Caricamento...</div>;
  }

  return (
    <Routes>
      {/* Se l'utente è già loggato e prova ad andare sul Login "/", lo mandiamo direttamente in dashboard */}
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LoginScreen />} />
      
      {/* Se l'utente NON è loggato, la rotta lo respinge e lo rimanda alla pagina "/" */}
      <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    // Avvolgiamo tutto l'intervallo delle rotte dentro l'AuthProvider
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;