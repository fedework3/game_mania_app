import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
//import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import '../Login.css';

function LoginScreen() {
  const [isOn, setIsOn] = useState(false); //stati di react
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState({ text: '', color: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [datiInput, setDatiInput] = useState({ username: '', password: '' });

  const handleInputChange = (e) => {
    setDatiInput({ ...datiInput, [e.target.name]: e.target.value });
  }; //La lettera e sta per "Event" (Evento). Quando l'utente digita una lettera sulla tastiera, 
     //il browser genera un evento e lo passa a questa funzione. Dentro questa e ci sono tutte le informazioni sulla casellina in cui l'utente sta scrivendo.
     //Spread Operator (i tre puntini). Prende tutto ciò che è già salvato nel form e lo copia qui
  const appRef = useRef(null); // riferimento body per animazione GSAP
  //const navigate = useNavigate();
  const {loginGlobal} = useContext(AuthContext);

  //effetto animazione GSAP, quando cambia isOn
  useEffect(() => {
    if (isOn) {
      gsap.to(".app-container", { backgroundColor: "#1c1f24", duration: 0.6 });
    } else {
      gsap.to(".app-container", { backgroundColor: "#121417", duration: 0.6 });
    }
  }, [isOn]);

  const toggleLamp = () => setIsOn(!isOn); //pulsante accendi e spegni
  //const clickSound = new Audio('https://www.soundjay.com/buttons/sounds/button-16.mp3');
  //clickSound.play();

  const handleAuth = async (type, e) => {
    e.preventDefault();
    const formData = new FormData(e.target);//Prende il form (e.target), estrae i dati e li trasforma in un oggetto Javascript
    const { username, password } = Object.fromEntries(formData); //tramite la destrutturazione prendo le variabili che mi servono
    // funzione asincrona. aspetto la risposta del server. due parametri: il type (la parola "login" o "register") e l'evento e (il click sul bottone del form)
    // con la seconda stringa blocco il ricaricamento. quando si invia un form HTML, il browser ricarica l'intera pagina

    if (!username || !password) return setMessage({ text: "Compila tutti i campi", color: "#e74c3c" });
    setMessage({ text: "Attendi...", color: "#f1c40f" }); // se ci sono campi vuoti blocco la funzione altrimenti proseguo

    try {
      const endpoint = type === 'login' ? '/api/login' : '/api/register';//Se il type è 'login', la destinazione sarà /api/login, altrimenti /api/register
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      }); //aspetto la risposta per la chiamata al server

      const data = await response.json();//aspetto che la risposta grezza rievuta dal server venga convertito in oggetto json

      if (response.ok) {
        if (type === 'register') {
          setMessage({ text: "Registrazione OK! Ora accedi.", color: "#2ecc71" });
          setTimeout(() => setIsLogin(true), 1500);
        } else {
          loginGlobal(data.token);
        } // se è tutto ok e se era la registrazione dopo 1,5 secondi mi porta nel login, altrimenti richiamo la funz del login
      } else {
        setMessage({ text: data.error || "Errore", color: "#e74c3c" });
      }
    } catch (error) {
      setMessage({ text: "Errore di connessione al server", color: "#e74c3c" });
    }
  };

  //in htlm la prima parentesi graffa dico che sto scrivendo in javascript. se ne metto un'altra sto inserendo le variabili

  return (
    <div className="app-container" data-on={isOn} ref={appRef}>
      
      {/* Sfondo animato a griglia */}
      <div className="gaming-background"></div>

      <div className="content-wrapper">
        
        {/* LATO SINISTRO: Scritta di benvenuto */}
        <div className="welcome-section">
          <h1 className="cyber-title">BENVENUTI</h1>
          <p className="cyber-subtitle">Entra nel mondo di Game Mania</p>
        </div>

        {/* LATO DESTRO: Lampada e Form */}
        <div className="login-section">
          <p className="hint">{isOn ? "Luce accesa" : "Accendi la luce per accedere"}</p>
          <button className="lamp-switch" onClick={toggleLamp} style={{ '--on': isOn ? 1 : 0 }}></button>
          
          <div className="auth-container">
            {isOn && (
              <div className="form-card">
                {isLogin ? (
                  <form onSubmit={(e) => handleAuth('login', e)}>
                    <h3>Login</h3>
                    <input name="username" type="text" placeholder="Username" value={datiInput.username} onChange={handleInputChange} />
                    <div className="password-wrapper">
                      <input 
                        name="password" 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Password"
                        value={datiInput.password} 
                        onChange={handleInputChange}
                      />
                      <span 
                        className="eye-icon" 
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? "Nascondi password" : "Mostra password"}
                      >
                        {showPassword ? "🔒" : "👁️"} 
                      </span>
                    </div>
                    <button type="submit" className="submit-btn">Accedi</button>
                    <span className="toggle-link" onClick={() => setIsLogin(false)}>Non hai un account?</span>
                  </form>
                ) : (
                  <form onSubmit={(e) => handleAuth('register', e)}>
                    <h3>Registrazione</h3>
                    <input name="username" type="text" placeholder="Scegli Username" value={datiInput.username} onChange={handleInputChange} />
                    <div className="password-wrapper">
                      <input 
                        name="password" 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Password"
                        value={datiInput.password} 
                        onChange={handleInputChange}
                      />
                      <span 
                        className="eye-icon" 
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? "Nascondi password" : "Mostra password"}
                      >
                        {showPassword ? "🔒" : "👁️"} 
                      </span>
                    </div>
                    <button type="submit" className="submit-btn register">Crea Account</button>
                    <span className="toggle-link" onClick={() => setIsLogin(true)}>Hai già un account?</span>
                  </form>
                )}
                <p style={{ color: message.color, marginTop: '15px' }}>{message.text}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default LoginScreen; // Esporta il componente