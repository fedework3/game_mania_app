import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import '../../BattagliaNavale.css';

const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000');

const FLOTTA_INIZIALE = [
  { id: 10, size: 5 },
  { id: 11, size: 3 },
  { id: 12, size: 2 },
  { id: 13, size: 2 },
  { id: 14, size: 1 },
  { id: 15, size: 1 },
  { id: 16, size: 1 }
];

// --- ICONE SVG BLINDATE ---
const IconaNave = ({ stile }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '28px', height: '28px', filter: 'drop-shadow(0 0 5px #06b6d4)', transition: 'transform 0.3s', ...stile }}>
    <path d="M2 21c.6.5 1.2 1 2.5 1 1.3 0 2.5-.5 3.2-1 .7-.5 1.2-1 2.5-1 1.3 0 2.5.5 3.2 1 .7.5 1.2 1 2.5 1 1.3 0 2.5-.5 3.2-1 .7-.5 1.2-1 2.5-1 1.3 0 2.5.5 3.2 1"/>
    <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/>
    <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/>
    <path d="M12 10v4"/>
  </svg>
);

const IconaAcqua = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px', filter: 'drop-shadow(0 0 6px #22d3ee)' }}>
    <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>
  </svg>
);

const IconaX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px', filter: 'drop-shadow(0 0 6px #f87171)' }}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const IconaFuoco = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px', filter: 'drop-shadow(0 0 8px #ef4444)' }}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>
);


// --- IL COMPONENTE PRINCIPALE ---
const BattagliaNavale = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); 

  const [grigliaPersonale, setGrigliaPersonale] = useState(Array.from({ length: 10 }, () => Array(10).fill(0)));
  const [grigliaAttacchi, setGrigliaAttacchi] = useState(Array.from({ length: 10 }, () => Array(10).fill(0)));
  const [naviPiazzate, setNaviPiazzate] = useState([]);
  
  const [isPronto, setIsPronto] = useState(false);
  const [messaggioStato, setMessaggioStato] = useState("Posiziona la tua flotta");
  const [mioTurno, setMioTurno] = useState(false);
  const [vincitore, setVincitore] = useState(null);
  const [naviDaPiazzare, setNaviDaPiazzare] = useState(FLOTTA_INIZIALE);
  const [flottaNemica, setFlottaNemica] = useState(FLOTTA_INIZIALE.map(nave => nave.size));

  useEffect(() => {
    socket.on('partita_iniziata', (dati) => {
      setMessaggioStato(`Partita iniziata! Il tuo avversario è: ${dati.avversario}`);
      setMioTurno(dati.tuoTurno);
    });

    socket.on('risultato_colpo', ({ riga, colonna, esito, tuoTurno, coordinateAffondate }) => {
      setGrigliaAttacchi(prev => {
        const nuova = prev.map(row => [...row]);
        if (esito === 4 && coordinateAffondate) coordinateAffondate.forEach(coord => nuova[coord.r][coord.c] = 4);
        else nuova[riga][colonna] = esito;
        return nuova;
      });
      // NUOVA LOGICA: Se affondiamo una nave, calcoliamo quanto era grande e la togliamo!
      if (esito === 4 && coordinateAffondate) {
        const dimensioneAffondata = coordinateAffondate.length;
        setFlottaNemica(prev => {
          const nuovaFlotta = [...prev];
          const indice = nuovaFlotta.indexOf(dimensioneAffondata);
          if (indice > -1) nuovaFlotta.splice(indice, 1); // Rimuove la nave colpita dall'elenco
          return nuovaFlotta;
        });
      }
      setMioTurno(tuoTurno);
    });

    socket.on('colpo_subito', ({ riga, colonna, esito, tuoTurno, coordinateAffondate }) => {
      setGrigliaPersonale(prev => {
        const nuova = prev.map(row => [...row]);
        if (esito === 4 && coordinateAffondate) coordinateAffondate.forEach(coord => nuova[coord.r][coord.c] = 4);
        else nuova[riga][colonna] = esito === 4 ? 4 : esito; 
        return nuova;
      });
      setMioTurno(tuoTurno); 
    });

    socket.on('fine_partita', ({ messaggio }) => {
      setVincitore(messaggio);
      setTimeout(() => navigate('/dashboard'), 5000);
    });

    return () => {
      socket.emit('abbandona_coda');
      socket.off('partita_iniziata');
      socket.off('risultato_colpo');
      socket.off('colpo_subito');
      socket.off('fine_partita');
    };
  }, [navigate]);

  const gestisciEsci = () => {
    if (window.confirm("Sei sicuro di abbandonare? Perderai la partita.")) navigate('/dashboard');
  };

  

  // 1. LOGICA DI PIAZZAMENTO (Automatico Orizzontale o Verticale)
  const gestisciClickPersonale = (riga, col) => {
    // NUOVO: Sicurezza bordi per il drag & drop
    if (riga < 0 || col < 0 || riga > 9 || col > 9) return; 
    if (isPronto || naviDaPiazzare.length === 0) return;
    
    const naveCorrente = naviDaPiazzare[0];
    const lunghezza = naveCorrente.size;
    
    let isVert = false;
    let posizioniValide = [];
    let orizzontaleValida = true;

    // Prova prima in Orizzontale
    if (col + lunghezza > 10) orizzontaleValida = false;
    else {
      for (let i = 0; i < lunghezza; i++) {
        if (grigliaPersonale[riga][col + i] !== 0) orizzontaleValida = false;
      }
    }

    if (orizzontaleValida) {
      isVert = false;
      for (let i = 0; i < lunghezza; i++) posizioniValide.push([riga, col + i]);
    } else {
      // Se non c'è spazio, prova in Verticale
      let verticaleValida = true;
      if (riga + lunghezza > 10) verticaleValida = false;
      else {
        for (let i = 0; i < lunghezza; i++) {
          if (grigliaPersonale[riga + i][col] !== 0) verticaleValida = false;
        }
      }

      if (verticaleValida) {
        isVert = true;
        for (let i = 0; i < lunghezza; i++) posizioniValide.push([riga + i, col]);
      } else {
        return; // Non entra in nessun modo, ignora il click!
      }
    }

    const nuovaGriglia = grigliaPersonale.map(row => [...row]);
    posizioniValide.forEach(([r, c]) => nuovaGriglia[r][c] = naveCorrente.id);
    setGrigliaPersonale(nuovaGriglia);
    
    setNaviPiazzate(prev => [...prev, { id: naveCorrente.id, size: lunghezza, riga, col, isVerticale: isVert }]);
    setNaviDaPiazzare(prev => prev.slice(1));
  };

  const gestisciSpostamentoNave = (idNave, rigaDrop, colDrop, offset = 0) => {
    if (isPronto) return;
    
    // Trova la nave che stiamo spostando
    const nave = naviPiazzate.find(n => n.id === idNave);
    if (!nave) return;

    // Sottraiamo l'offset: se è verticale modifichiamo la riga, se orizzontale la colonna
    const nuovaRiga = nave.isVerticale ? rigaDrop - offset : rigaDrop;
    const nuovaColonna = nave.isVerticale ? colDrop : colDrop - offset;

    // Controllo di sicurezza: se la stai trascinando fuori mappa, annulla!
    if (nuovaRiga < 0 || nuovaColonna < 0 || nuovaRiga > 9 || nuovaColonna > 9) return;

    let valida = true;
    let posizioniValide = [];

    // 1. Creiamo una griglia "simulata" cancellando la nave dalla sua vecchia posizione
    const grigliaSimulata = grigliaPersonale.map(row => row.map(c => c === idNave ? 0 : c));

    // 2. Controlliamo se entra nella nuova posizione, mantenendo la sua rotazione attuale (Orizzontale o Verticale)
    if (nave.isVerticale) {
      if (nuovaRiga + nave.size > 10) valida = false;
      else {
        for (let i = 0; i < nave.size; i++) {
          if (grigliaSimulata[nuovaRiga + i][nuovaColonna] !== 0) valida = false;
          posizioniValide.push([nuovaRiga + i, nuovaColonna]);
        }
      }
    } else {
      if (nuovaColonna + nave.size > 10) valida = false;
      else {
        for (let i = 0; i < nave.size; i++) {
          if (grigliaSimulata[nuovaRiga][nuovaColonna + i] !== 0) valida = false;
          posizioniValide.push([nuovaRiga, nuovaColonna + i]);
        }
      }
    }

    // 3. Se la nuova posizione è valida, aggiorniamo TUTTO in un colpo solo!
    if (valida) {
      posizioniValide.forEach(([r, c]) => grigliaSimulata[r][c] = idNave);
      setGrigliaPersonale(grigliaSimulata); // Aggiorna le caselle d'acqua
      
      // Aggiorna le coordinate della nave nell'array delle navi piazzate
      setNaviPiazzate(prev => 
        prev.map(n => n.id === idNave ? { ...n, riga: nuovaRiga, col: nuovaColonna } : n)
      );
    }
    // Se non è valida (es. la stai trascinando fuori bordo o su un'altra nave), 
    // la funzione finisce qui e la nave torna al suo posto originale
  };

  // 2. LOGICA DI ROTAZIONE (Al Click)
  const ruotaNave = (idNave) => {
    if (isPronto) return;
    const nave = naviPiazzate.find(n => n.id === idNave);
    if (!nave || nave.size === 1) return; // Non serve ruotare navi da 1 casella

    const nuovaVerticale = !nave.isVerticale;
    let valida = true;
    let posizioniValide = [];

    // Creiamo una griglia "simulata" togliendo temporaneamente la nave attuale
    const grigliaSimulata = grigliaPersonale.map(row => row.map(c => c === idNave ? 0 : c));

    if (nuovaVerticale) {
      if (nave.riga + nave.size > 10) valida = false;
      else {
        for (let i = 0; i < nave.size; i++) {
          if (grigliaSimulata[nave.riga + i][nave.col] !== 0) valida = false;
          posizioniValide.push([nave.riga + i, nave.col]);
        }
      }
    } else {
      if (nave.col + nave.size > 10) valida = false;
      else {
        for (let i = 0; i < nave.size; i++) {
          if (grigliaSimulata[nave.riga][nave.col + i] !== 0) valida = false;
          posizioniValide.push([nave.riga, nave.col + i]);
        }
      }
    }

    // Se c'è spazio, applichiamo la rotazione
    if (valida) {
      posizioniValide.forEach(([r, c]) => grigliaSimulata[r][c] = idNave);
      setGrigliaPersonale(grigliaSimulata);
      setNaviPiazzate(prev => prev.map(n => n.id === idNave ? { ...n, isVerticale: nuovaVerticale } : n));
    }
  };

  // 3. LOGICA DI RIMOZIONE (Riprendi Nave)
  const riprendiNave = (idNave) => {
    if (isPronto) return;
    const nave = naviPiazzate.find(n => n.id === idNave);
    if (!nave) return;

    // Pulisci la griglia
    setGrigliaPersonale(prev => prev.map(row => row.map(c => c === idNave ? 0 : c)));
    // Togli dalle navi piazzate
    setNaviPiazzate(prev => prev.filter(n => n.id !== idNave));
    // Rimetti nel mazzo delle navi da piazzare
    setNaviDaPiazzare(prev => [{ id: nave.id, size: nave.size }, ...prev]);
  };

  const resetGriglia = () => {
    setGrigliaPersonale(Array.from({ length: 10 }, () => Array(10).fill(0)));
    setNaviDaPiazzare(FLOTTA_INIZIALE);
    setNaviPiazzate([]);
  };

  const gestisciPronto = () => {
    if (naviDaPiazzare.length > 0) return alert(`Devi piazzare ancora ${naviDaPiazzare.length} navi!`);
    setIsPronto(true);
    setMessaggioStato("In attesa di un avversario... ⏳");
    socket.emit('giocatore_pronto', { username: user ? user.username : 'Ospite', griglia: grigliaPersonale });
  };

  const gestisciAttacco = (riga, col) => {
    if (!isPronto || !mioTurno || vincitore || grigliaAttacchi[riga][col] !== 0) return;
    socket.emit('lancia_colpo', { riga, colonna: col });
  };

  return (
    <div className="battaglia-container">
      <button onClick={gestisciEsci} className="btn-abbandona">Abbandona</button>
      <h2 className="battaglia-title">Battaglia Navale <IconaNave /></h2>
      
      {vincitore && (
        <div className="vittoria-overlay">
          <div className="vittoria-banner">
            <h1>{vincitore}</h1>
            <p>Ritorno alla lobby in 5 secondi...</p>
            <div className="loader-linea"></div>
          </div>
        </div>
      )}

      {!isPronto ? (
        <p className="stato-messaggio">{messaggioStato}</p>
      ) : (
        !vincitore && (
          <div className="info-partita-container">
            {!messaggioStato.includes("In attesa") && (
              <div className={`turno-banner ${mioTurno ? 'mio-turno' : 'suo-turno'}`}>
                {mioTurno ? "🎯 IL TUO TURNO" : "⏳ TURNO AVVERSARIO"}
              </div>
            )}
            <p className="stato-messaggio">{messaggioStato}</p>
          </div>
        )
      )}
      
      {!isPronto ? (
        <div className="setup-fase">
          <div className="flotta-box">
            <h4>Plancia Comando</h4>
            {naviDaPiazzare.length > 0 ? (
              <>
                <div className="preview-nave-container">
                  <p className="nave-attuale">Prossima nave:</p>
                  <div 
                    className="nave-preview-box" 
                    style={{ width: `${naviDaPiazzare[0].size * 42}px`, cursor: 'grab' }}
                    draggable={true}
                    // Calcolo quale pezzo si sta afferrando
                    onMouseDown={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const offsetX = e.clientX - rect.left;
                      // Dividiamo per 42 (la larghezza di una cella) per capire l'indice
                      e.currentTarget.dataset.offset = Math.floor(offsetX / 42);
                    }}
                    onDragStart={(e) => {
                      const offset = e.currentTarget.dataset.offset || 0;
                      // Passiamo una stringa composta da "tipo_azione|offset"
                      // Necessario per far capire al browser che stiamo trascinando qualcosa
                      e.dataTransfer.setData('text/plain', `nuova_nave|${offset}`);
                    }}
                  >
                    <IconaNave />
                  </div>
                </div>
                <p style={{color: '#94a3b8', fontSize: '13px', marginTop: '10px'}}>
                  💡 <strong>Clicca</strong> la nave per ruotarla.<br/>
                  ❌ Usa la 'X' per riprenderla.<br/>
                  🖐️ Tieni premuto per trascinarla
                </p>
                <button onClick={resetGriglia} className="btn-reset" style={{marginTop: '20px'}}>🗑️ Svuota Griglia</button>
              </>
            ) : (
              <p className="navi-pronte">Flotta schierata!</p>
            )}
          </div>
          <div className="griglia-wrapper">
            <Griglia 
              dati={grigliaPersonale} 
              onClick={gestisciClickPersonale} 
              naviPiazzate={naviPiazzate}
              isPronto={isPronto}
              ruotaNave={ruotaNave}
              riprendiNave={riprendiNave}
              spostaNave={gestisciSpostamentoNave}
            />
          </div>
          <button onClick={gestisciPronto} className={`btn-pronto ${naviDaPiazzare.length === 0 ? 'attivo' : ''}`}>PRONTO 🏁</button>
        </div>
      ) : (
        <div className="combattimento-fase">
          <div className="giocatore-box">
            <h4 style={{ marginBottom: '15px' }}>La tua flotta</h4>
            <Griglia dati={grigliaPersonale} onClick={() => {}} naviPiazzate={naviPiazzate} isPronto={true} />
          </div>
          
          <div className="nemico-box">
            
            <div className="titolo-radar-nemico">
              <h4 style={{ marginBottom: '15px' }}>Radar Nemico</h4>
            </div> {/* <-- Questo div mancava e sballava tutto! */}

            {/* NUOVO CONTENITORE: Affianca la griglia e la colonna laterale */}
            <div className="radar-e-flotta">
              
              {/* LA GRIGLIA RIMANE A SINISTRA */}
              <Griglia dati={grigliaAttacchi} onClick={gestisciAttacco} isRadar={true} isPronto={true} />
              
              {/* LA COLONNA CON LE NAVI A DESTRA */}
              <div className="flotta-nemica-colonna">
                {flottaNemica.length > 0 ? (
                  flottaNemica.map((dimensione, idx) => (
                    <div key={idx} className="mini-capsula-nemica" style={{ width: `${dimensione * 28}px`, height: '26px' }} title={`Nave da ${dimensione} caselle`}>
                      {/* MODIFICATO: Ruotiamo l'icona di 90 gradi per farla stare dritta nella capsula */}
                      <IconaNave stile={{ width: '14px', height: '14px'}} />
                    </div>
                  ))
                ) : (
                  <span className="nemico-distrutto">DISTRUTTA!</span>
                )}
              </div>
              
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE GRIGLIA ---
const Griglia = ({ dati, onClick, isRadar = false, naviPiazzate = [], isPronto, ruotaNave, riprendiNave, spostaNave }) => {
  const lettere = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  
  return (
    <div className="griglia-bordata">
      <div className="griglia-riga header-riga">
        <div className="cella header-cella vuota"></div>
        {lettere.map((lettera, index) => <div key={index} className="cella header-cella">{lettera}</div>)}
      </div>
      
      {dati.map((riga, i) => (
        <div key={i} className="griglia-riga">
          <div className="cella header-cella">{i + 1}</div>
          {riga.map((cella, j) => {
            let statoClasse = 'acqua-inesplorata';
            if (cella === 2) statoClasse = 'mancato';
            if (cella === 3) statoClasse = 'colpito';
            if (cella === 4) statoClasse = 'affondato';

            return (
              <div
                key={j}
                onClick={() => onClick(i, j)}
                onDragOver={(e) => {
                  // Permettiamo il drop solo se NON è il radar nemico e se NON siamo ancora pronti
                  if (!isRadar && !isPronto) {
                    e.preventDefault(); 
                  }
                }}
                onDrop={(e) => {
                  if (!isRadar && !isPronto) {
                    e.preventDefault();
                    // Leggiamo cosa stiamo trascinando
                    const draggedData = e.dataTransfer.getData('text/plain');
                    const parts = draggedData.split('|'); // Dividiamo la stringa
                    const tipo = parts[0];

                    if (tipo === 'nuova_nave') {
                      const offset = parseInt(parts[1], 10);
                      // Se ho afferrato il pezzo 2 e lo lascio nella colonna 5, 
                      // la nave deve inziare nella colonna 3!
                      onClick(i, j - offset); 

                    } else if (tipo === 'nave_piazzata') {
                      const idNave = parseInt(parts[1], 10);
                      const offset = parseInt(parts[2], 10);
                      if (spostaNave) {
                        spostaNave(idNave, i, j, offset); // Passiamo l'offset alla funzione
                      }
                    }
                  }
                }}
                className={`cella cella-gioco ${statoClasse} ${isRadar ? 'is-radar' : ''}`}
                title={`${lettere[j]}${i + 1}`}
              >
                {cella === 2 && <IconaAcqua />}
                {cella === 3 && <IconaX />}
                {cella === 4 && <IconaFuoco />}
              </div>
            );
          })}
        </div>
      ))}

      {/* OVERLAY INTERATTIVI DELLE NAVI */}
      {!isRadar && naviPiazzate.map(nave => {
        const top = 8 + 42 + nave.riga * 42 + 1; 
        const left = 8 + 42 + nave.col * 42 + 1;
        const width = nave.isVerticale ? 40 : nave.size * 42 - 2;
        const height = nave.isVerticale ? nave.size * 42 - 2 : 40;
        
        return (
          <div 
            key={nave.id} 
            className={`nave-overlay ${!isPronto ? 'interattiva' : ''}`} 
            style={{ top: `${top}px`, left: `${left}px`, width: `${width}px`, height: `${height}px`, cursor: !isPronto ? 'grab' : 'default' }}//l'ultima aggiunta: se stiamo trascinando le navi divenano intagibili
            onClick={() => !isPronto && ruotaNave(nave.id)}
            title={!isPronto ? "Trascina per spostare, clicca per ruotare" : ""}
            draggable={!isPronto}
            // Calcolo il pezzo, tenendo conto anche della rotazione!
            onMouseDown={(e) => {
              if (!isPronto) {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                // Se è verticale calcoliamo l'offset sulla Y, altrimenti sulla X
                const offset = nave.isVerticale ? Math.floor(y / 42) : Math.floor(x / 42);
                e.currentTarget.dataset.offset = offset;
              }
            }}
            onDragStart={(e) => {
              if (!isPronto) {
                // Passiamo al browser l'ID univoco di questa specifica nave!
                const offset = e.currentTarget.dataset.offset || 0;
                // Passiamo "tipo_azione|ID|offset"
                e.dataTransfer.setData('text/plain', `nave_piazzata|${nave.id}|${offset}`);
              }
            }}
            onDragOver={(e) => {
              if (!isPronto) e.preventDefault(); 
            }}
            onDrop={(e) => {
              if (!isPronto) {
                e.preventDefault();
                e.stopPropagation(); // Evita conflitti con la griglia sotto

                // 1. Calcoliamo dove si trova il mouse dentro la nave-scudo
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                // 2. Troviamo la cella della griglia che si nasconde sotto al mouse!
                const cellaDropRiga = nave.isVerticale ? nave.riga + Math.floor(y / 42) : nave.riga;
                const cellaDropColonna = nave.isVerticale ? nave.col : nave.col + Math.floor(x / 42);

                // 3. Recuperiamo i dati
                const draggedData = e.dataTransfer.getData('text/plain');
                if (!draggedData) return;
                
                const parts = draggedData.split('|');
                const tipo = parts[0];

                // 4. Passiamo le coordinate esatte alla funzione, proprio come se avessimo colpito l'acqua!
                if (tipo === 'nuova_nave') {
                  const offset = parseInt(parts[1], 10);
                  onClick(cellaDropRiga, cellaDropColonna - offset);
                } else if (tipo === 'nave_piazzata') {
                  const idNaveSpostata = parseInt(parts[1], 10);
                  const offset = parseInt(parts[2], 10);
                  if (spostaNave) spostaNave(idNaveSpostata, cellaDropRiga, cellaDropColonna, offset);
                }
              }
            }}
          >
            <IconaNave stile={{ transform: nave.isVerticale ? 'rotate(90deg)' : 'none' }} />
            
            {/* BOTTONE 'X' PER RIPRENDERE LA NAVE */}
            {!isPronto && (
              <div 
                className="btn-rimuovi-nave" 
                title="Riprendi Nave"
                onClick={(e) => {
                  e.stopPropagation(); // Evita di ruotare mentre la rimuovi!
                  riprendiNave(nave.id);
                }}
              >
                ✖
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BattagliaNavale;