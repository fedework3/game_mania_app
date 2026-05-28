import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ChatBox from './chat/ChatBox';

function Dashboard() {
  const { logoutGlobal } = useContext(AuthContext);//prenddo logout globale

  return (
    <div className="dashboard-wrapper">
      
      {/* HEADER */}
      <div className="dashboard-header">
        <h1>Game Mania</h1>
        <button onClick={logoutGlobal} className="logout-btn">Esci</button>
      </div>

      {/* CONTENITORE PRINCIPALE */}
      <div className="dashboard-content">

        {/* COLONNA SINISTRA: Catalogo Giochi */}
        <div className="games-column">
          <h2 className="column-title">Scegli un gioco</h2>

          <div className="games-grid">
            
            {/* SLOT 1 */}
            <div className="game-card">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Battleship_St_Vincent_1910.jpg" 
                alt="Battaglia Navale" 
                style={{ width: '200px', height: '150px', border: '5px solid red', display: 'block' }}
                //className="game-img"
              />
              <h3>Battaglia Navale</h3>
              <p>Affonda la flotta nemica prima del tuo avversario.</p>
              <button className="play-btn">Gioca Ora</button>
            </div>

            {/* SLOT 2 */}
            <div className="game-card">
              <div className="game-placeholder">?</div>
              <h3>Prossimamente</h3>
              <p>Nuovo gioco in arrivo a breve.</p>
              <button className="play-btn disabled">Bloccato</button>
            </div>

            {/* SLOT 3 */}
            <div className="game-card">
              <div className="game-placeholder">?</div>
              <h3>Prossimamente</h3>
              <p>Nuovo gioco in arrivo a breve.</p>
              <button className="play-btn disabled">Bloccato</button>
            </div>

            {/* SLOT 4 */}
            <div className="game-card">
              <div className="game-placeholder">?</div>
              <h3>Prossimamente</h3>
              <p>Nuovo gioco in arrivo a breve.</p>
              <button className="play-btn disabled">Bloccato</button>
            </div>

          </div>
        </div>

        {/* COLONNA DESTRA: Chat */}
        <ChatBox />

      </div>
    </div>
  );
}

export default Dashboard; // Esporta il componente