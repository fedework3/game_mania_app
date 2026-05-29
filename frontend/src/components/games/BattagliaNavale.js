import React, { useState, useEffect, useContext } from 'react'; // NUOVO: importati useEffect e useContext
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext'; // NUOVO: per sapere chi sta giocando
import { io } from 'socket.io-client'; // NUOVO: il nostro walkie-talkie

// NUOVO: Inserisci qui il link del tuo backend (Render se stai testando online, o localhost se sei in locale)
const socket = io(process.env.REACT_APP_BACKEND_URL);
//const socket = io('http://localhost:5000');

const BattagliaNavale = () => {
  const navigate = useNavigate();
  
  // NUOVO: Recuperiamo i dati dell'utente connesso
  const { user } = useContext(AuthContext); 

  const [grigliaPersonale, setGrigliaPersonale] = useState(Array.from({ length: 10 }, () => Array(10).fill(0)));
  const [naviRimanenti, setNaviRimanenti] = useState(5);
  const [isPronto, setIsPronto] = useState(false);
  const [grigliaAttacchi, setGrigliaAttacchi] = useState(Array.from({ length: 10 }, () => Array(10).fill(0)));

  // NUOVO STATO: Ci serve per capire se stiamo aspettando un nemico o se stiamo già combattendo
  const [messaggioStato, setMessaggioStato] = useState("Posiziona le tue 5 navi sulla griglia prima di iniziare.");

  // NUOVO: useEffect che "ascolta" le risposte del backend in tempo reale
  useEffect(() => {
    // Quando il server ci dice che ha trovato due giocatori pronti
    socket.on('partita_iniziata', (dati) => {
      setMessaggioStato(`Partita iniziata! Il tuo avversario è: ${dati.avversario}`);
      alert(`Scontro imminente! Giocherai contro ${dati.avversario} 🏴‍☠️`);
    });

    // Pulizia quando usciamo dalla pagina
    return () => {
      socket.off('partita_iniziata');
    };
  }, []);

  const gestisciEsci = () => {
    const conferma = window.confirm("Sei sicuro di abbandonare la partita?");
    if (conferma) {
      navigate('/dashboard');
    }
  };

  const gestisciClickPersonale = (indiceRiga, indiceColonna) => {
    if (isPronto) return;

    const cella = grigliaPersonale[indiceRiga][indiceColonna];
    if (cella === 0 && naviRimanenti > 0) {
      const nuovaGriglia = grigliaPersonale.map((r, i) => r.map((c, j) => (i === indiceRiga && j === indiceColonna ? 1 : c)));
      setGrigliaPersonale(nuovaGriglia);
      setNaviRimanenti(naviRimanenti - 1);
    } else if (cella === 1) {
      const nuovaGriglia = grigliaPersonale.map((r, i) => r.map((c, j) => (i === indiceRiga && j === indiceColonna ? 0 : c)));
      setGrigliaPersonale(nuovaGriglia);
      setNaviRimanenti(naviRimanenti + 1);
    }
  };

  const gestisciPronto = () => {
    if (naviRimanenti > 0) {
      alert(`Devi piazzare ancora ${naviRimanenti} navi!`);
      return;
    }
    
    setIsPronto(true);
    setMessaggioStato("In attesa di un avversario... ⏳");
    
    // NUOVO: Inviamo la nostra griglia segreta e il nostro nome al Backend!
    socket.emit('giocatore_pronto', {
      username: user ? user.username : 'Ospite',
      griglia: grigliaPersonale
    });
  };

  const gestisciAttacco = (indiceRiga, indiceColonna) => {
    if (!isPronto || grigliaAttacchi[indiceRiga][indiceColonna] !== 0) return;

    const nuovaGriglia = grigliaAttacchi.map((r, i) => 
      r.map((c, j) => (i === indiceRiga && j === indiceColonna ? 2 : c))
    );
    setGrigliaAttacchi(nuovaGriglia);
    
    // NUOVO: Qui in futuro manderemo il colpo al server
    // socket.emit('lancia_colpo', { riga: indiceRiga, colonna: indiceColonna });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', position: 'relative', textAlign: 'center' }}>
      
      <button onClick={gestisciEsci} style={{ position: 'absolute', top: '20px', right: '20px', backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
        Esci ❌
      </button>

      <h2>Battaglia Navale 🚢</h2>
      
      {/* NUOVO: Mostriamo il messaggio di stato dinamico */}
      <p style={{ fontSize: '18px', fontWeight: 'bold', color: isPronto ? 'red' : 'black' }}>
        {messaggioStato}
      </p>
      
      {!isPronto ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px', marginTop: '20px' }}>
            <div style={{ border: '2px dashed #666', padding: '15px', borderRadius: '8px', backgroundColor: '#f9f9f9', width: '150px' }}>
              <h4>Navi disponibili</h4>
              <p style={{ fontSize: '24px', fontWeight: 'bold' }}>🚢 x {naviRimanenti}</p>
            </div>

            <Griglia dati={grigliaPersonale} onClick={gestisciClickPersonale} />

            <button onClick={gestisciPronto} style={{ backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '20px 30px', fontSize: '18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              PRONTO 🏁
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '50px', marginTop: '20px' }}>
            <div>
              <h4>La tua flotta</h4>
              <Griglia dati={grigliaPersonale} onClick={() => {}} />
            </div>
            <div>
              <h4>Radar Nemico</h4>
              <Griglia dati={grigliaAttacchi} onClick={gestisciAttacco} isRadar={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Griglia = ({ dati, onClick, isRadar }) => (
  <div style={{ border: '3px solid #333', padding: '2px', backgroundColor: '#fff', display: 'inline-block' }}>
    {dati.map((riga, i) => (
      <div key={i} style={{ display: 'flex' }}>
        {riga.map((cella, j) => {
          let bgColor = 'lightblue';
          if (cella === 1) bgColor = '#555';
          if (cella === 2) bgColor = 'white';
          if (cella === 3) bgColor = 'red';

          return (
            <div
              key={j}
              onClick={() => onClick(i, j)}
              style={{
                width: '40px', height: '40px', border: '1px solid #999',
                backgroundColor: bgColor,
                cursor: 'crosshair',
                transition: 'background-color 0.2s',
                display: 'flex', justifyContent: 'center', alignItems: 'center'
              }}
            >
              {!isRadar && cella === 1 && "🚢"}
              {cella === 2 && "💦"}
              {cella === 3 && "🔥"}
            </div>
          );
        })}
      </div>
    ))}
  </div>
);

export default BattagliaNavale;