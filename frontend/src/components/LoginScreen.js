import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
//import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import '../Login.css';

function LoginScreen() {
  const [isOn, setIsOn] = useState(false); //stati di react
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState({ text: '', color: '' });
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

  const toggleLamp = () => setIsOn(!isOn); 
  //const clickSound = new Audio('https://www.soundjay.com/buttons/sounds/button-16.mp3');
  //clickSound.play();

  const handleAuth = async (type, e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const { username, password } = Object.fromEntries(formData);

    if (!username || !password) return setMessage({ text: "Compila tutti i campi", color: "#e74c3c" });
    setMessage({ text: "Attendi...", color: "#f1c40f" });

    try {
      const endpoint = type === 'login' ? '/api/login' : '/api/register';
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        if (type === 'register') {
          setMessage({ text: "Registrazione OK! Ora accedi.", color: "#2ecc71" });
          setTimeout(() => setIsLogin(true), 1500);
        } else {
          loginGlobal(data.token);
        }
      } else {
        setMessage({ text: data.error || "Errore", color: "#e74c3c" });
      }
    } catch (error) {
      setMessage({ text: "Errore di connessione al server", color: "#e74c3c" });
    }
  };

  return (
    <div className="app-container" data-on={isOn} ref={appRef}>
      <p className="hint">{isOn ? "Luce accesa" : "Accendi la luce per accedere"}</p>
      <button className="lamp-switch" onClick={toggleLamp} style={{ '--on': isOn ? 1 : 0 }}></button>
      <div className="auth-container">
        {isOn && (
          <div className="form-card">
            {isLogin ? (
              <form onSubmit={(e) => handleAuth('login', e)}>
                <h3>Login</h3>
                <input name="username" type="text" placeholder="Username" />
                <input name="password" type="password" placeholder="Password" />
                <button type="submit" className="submit-btn">Accedi</button>
                <span className="toggle-link" onClick={() => setIsLogin(false)}>Non hai un account?</span>
              </form>
            ) : (
              <form onSubmit={(e) => handleAuth('register', e)}>
                <h3>Registrazione</h3>
                <input name="username" type="text" placeholder="Scegli Username" />
                <input name="password" type="password" placeholder="Scegli Password" />
                <button type="submit" className="submit-btn register">Crea Account</button>
                <span className="toggle-link" onClick={() => setIsLogin(true)}>Hai già un account?</span>
              </form>
            )}
            <p style={{ color: message.color, marginTop: '15px' }}>{message.text}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginScreen; // Esporta il componente