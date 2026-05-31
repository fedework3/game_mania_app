import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import '../../BattagliaNavale.css'; // NUOVO: Importiamo il nostro foglio di stile!

const socket = io(process.env.REACT_APP_BACKEND_URL);

const BattagliaNavale = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); 

  const [grigliaPersonale, setGrigliaPersonale] = useState(Array.from({ length: 10 }, () => Array(10).fill(0)));
  const [naviRimanenti, setNaviRimanenti] = useState(5);
  const [isPronto, setIsPronto] = useState(false);
  const [grigliaAttacchi, setGrigliaAttacchi] = useState(Array.from({ length: 10 }, () => Array(10).fill(0)));
  const [messaggioStato, setMessaggioStato] = useState("Posiziona le tue 5 navi sulla griglia prima di iniziare.");
  const [mioTurno, setMioTurno] = useState(false);
  
  // NUOVO STATO: Gestisce la fine della partita
  const [vincitore, setVincitore] = useState(null);

  useEffect(() => {
    socket.on('partita_iniziata', (dati) => {
      setMessaggioStato(`Partita iniziata! Il tuo avversario è: ${dati.avversario}`);
      setMioTurno(dati.tuoTurno);
    });

    socket.on('risultato_colpo', ({ riga, colonna, esito, tuoTurno }) => {
      setGrigliaAttacchi(prev => {
        const nuova = [...prev];
        nuova[riga] = [...nuova[riga]];
        nuova[riga][colonna] = esito; 
        return nuova;
      });
      setMioTurno(tuoTurno);
    });

    socket.on('colpo_subito', ({ riga, colonna, esito, tuoTurno }) => {
      setGrigliaPersonale(prev => {
        const nuova = [...prev];
        nuova[riga] = [...nuova[riga]];
        nuova[riga][colonna] = esito; 
        return nuova;
      });
      setMioTurno(tuoTurno); 
    });

    // NUOVO: Ascoltiamo quando il server dichiara la fine della partita
    socket.on('fine_partita', ({ messaggio }) => {
      setVincitore(messaggio); // Mostra il messaggio a schermo
      
      // Timer di 5 secondi prima di tornare alla dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 5000);
    });

    return () => {
      socket.off('partita_iniziata');
      socket.off('risultato_colpo');
      socket.off('colpo_subito');
      socket.off('fine_partita');
    };
  }, [navigate]);

  const gestisciEsci = () => {
    const conferma = window.confirm("Sei sicuro di abbandonare la partita? Perderai automaticamente.");
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
    
    socket.emit('giocatore_pronto', {
      username: user ? user.username : 'Ospite',
      griglia: grigliaPersonale
    });
  };

  const gestisciAttacco = (indiceRiga, indiceColonna) => {
    if (!isPronto || !mioTurno || vincitore || grigliaAttacchi[indiceRiga][indiceColonna] !== 0) return;
    socket.emit('lancia_colpo', { riga: indiceRiga, colonna: indiceColonna });
  };

  return (
    <div className="battaglia-container">
      <button onClick={gestisciEsci} className="btn-abbandona">
        Abbandona ❌
      </button>

      <h2 className="battaglia-title">Battaglia Navale 🚢</h2>
      
      {/* OVERLAY DI FINE PARTITA */}
      {vincitore && (
        <div className="vittoria-overlay">
          <div className="vittoria-banner">
            <h1>{vincitore}</h1>
            <p>Ritorno alla lobby in 5 secondi...</p>
            <div className="loader-linea"></div>
          </div>
        </div>
      )}

      {/* BANNER DEL TURNO */}
      {isPronto && !vincitore && !messaggioStato.includes("In attesa") && (
        <div className={`turno-banner ${mioTurno ? 'mio-turno' : 'suo-turno'}`}>
          {mioTurno ? "🎯 È IL TUO TURNO! Spara al nemico!" : "⏳ Turno dell'avversario... in attesa"}
        </div>
      )}

      <p className="stato-messaggio">{messaggioStato}</p>
      
      {!isPronto ? (
        <div className="setup-fase">
          <div className="flotta-box">
            <h4>Navi disponibili</h4>
            <p className="navi-rimanenti">🚢 x {naviRimanenti}</p>
          </div>
          
          <div className="griglia-wrapper">
            <Griglia dati={grigliaPersonale} onClick={gestisciClickPersonale} />
          </div>

          <button onClick={gestisciPronto} className={`btn-pronto ${naviRimanenti === 0 ? 'attivo' : ''}`}>
            PRONTO 🏁
          </button>
        </div>
      ) : (
        <div className="combattimento-fase">
          <div className="giocatore-box">
            <h4>La tua flotta</h4>
            <Griglia dati={grigliaPersonale} onClick={() => {}} />
          </div>
          <div className="nemico-box">
            <h4>Radar Nemico</h4>
            <Griglia dati={grigliaAttacchi} onClick={gestisciAttacco} isRadar={true} />
          </div>
        </div>
      )}
    </div>
  );
};

// COMPONENTE GRIGLIA MODIFICATO CON COORDINATE
const Griglia = ({ dati, onClick, isRadar }) => {
  const lettere = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  return (
    <div className="griglia-bordata">
      {/* RIGA INTESTAZIONE (Lettere) */}
      <div className="griglia-riga header-riga">
        <div className="cella header-cella vuota"></div>
        {lettere.map((lettera, index) => (
          <div key={index} className="cella header-cella">{lettera}</div>
        ))}
      </div>

      {/* RIGHE DI GIOCO */}
      {dati.map((riga, i) => (
        <div key={i} className="griglia-riga">
          {/* NUMERO COLONNA SINISTRA */}
          <div className="cella header-cella">{i + 1}</div>
          
          {/* CELLE DI GIOCO */}
          {riga.map((cella, j) => {
            let statoClasse = 'acqua-inesplorata';
            if (cella === 1) statoClasse = 'nave';
            if (cella === 2) statoClasse = 'mancato';
            if (cella === 3) statoClasse = 'colpito';

            return (
              <div
                key={j}
                onClick={() => onClick(i, j)}
                className={`cella cella-gioco ${statoClasse} ${isRadar ? 'is-radar' : ''}`}
                title={`${lettere[j]}${i + 1}`} // Tooltip quando passi col mouse!
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
};

export default BattagliaNavale;