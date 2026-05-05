// Configuration 
// URL ngrok active à remplacer avant chaque tests.
const SERVER = "https://darkened-stifle-enchilada.ngrok-free.dev";

//Il faut ajouter le header suivant pour éviter d'avoir une erreur lors des tests 
// avec ngrok.
function ngrokFetch(url, options={}) {
  options.headers = {
    ...options.headers,
    "ngrok-skip-browser-warning" : "true"
  };
  return fetch(url, options);
}

let MY_ID = null;

// UI 
const ui = {
  log(msg, cls = "log-event") {
    const div = document.createElement("div");
    div.className = cls; div.textContent = msg;
    const el = document.getElementById("log");
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
  },

  render(state) {
    document.getElementById("phase-banner").textContent =
      state.phase === "trade" ? "Phase d'échange" : "Phase de révélation";

    // Rivière
    const riverEl = document.getElementById("river-cards");
    riverEl.innerHTML = "";
    for (const val of state.river) {
      const d = document.createElement("div");
      d.className = "river-card"; d.textContent = val;
      riverEl.appendChild(d);
    }

    // Joueurs
    const row = document.getElementById("players-row");
    row.innerHTML = "";
    for (const p of state.players) {
      const block = document.createElement("div");
      block.className = "player-block" +
        (p.is_active ? " active" : "") +
        (p.hp <= 0 ? " eliminated" : "");

      const cardDiv = document.createElement("div");
      cardDiv.className = "p-card" +
        (p.card !== null ? " revealed" : "") +
        (p.protected ? " protected" : "");
      cardDiv.textContent = p.card !== null ? p.card : "";

      block.innerHTML = `<div class="p-name">${p.id}</div>
                         <div class="p-hp">❤️ ${p.hp}</div>`;
      block.appendChild(cardDiv);
      row.appendChild(block);
    }

    // Boutons d'action (uniquement si c'est le tour du joueur)
    const isMyTurn = state.active_player === MY_ID
                     && state.phase === "trade"
                     && !state.game_over;
    const btnContainer = document.getElementById("action-buttons");
    btnContainer.innerHTML = "";

    if (isMyTurn) {
      const actions = ["Suivant", "Rivière 1"];
      if (state.river.length === 2) actions.push("Rivière 2");
      actions.push("Échanger");

      const MAP = {
        "Suivant": "keep", "Rivière 1": "river 1",
        "Rivière 2": "river 2", "Échanger": "trade"
      };
      for (const label of actions) {
        const btn = document.createElement("button");
        btn.textContent = label;
        btn.onclick = () => sendAction(MAP[label]);
        btnContainer.appendChild(btn);
      }
      document.getElementById("active-name").textContent = MY_ID;
      const myCard = state.players.find(p => p.id === MY_ID)?.card;
      document.getElementById("active-card-display").textContent =
        myCard !== null ? myCard : "?";
    } else {
      document.getElementById("active-name").textContent =
        state.active_player || "—";
      document.getElementById("active-card-display").textContent = "";
    }

    // Game over
    if (state.game_over) {
      const survivors = state.players
        .filter(p => p.hp > 0).map(p => p.id);
      document.getElementById("gameover-title").textContent =
        `${state.loser} est éliminé !`;
      document.getElementById("gameover-body").textContent =
        `Vainqueurs : ${survivors.join(", ")}`;
      document.getElementById("gameover").style.display = "flex";
    }
  },

  syncLog(entries) {
    const el = document.getElementById("log");
    el.innerHTML = "";
    for (const msg of entries) {
      const d = document.createElement("div");
      d.className = msg[1]; d.textContent = msg[0];
      el.appendChild(d);
    }
    el.scrollTop = el.scrollHeight;
  },

  showGameOver(loserId, survivors) {
    document.getElementById("gameover-title").textContent = `${loserId} est éliminé !`; // On rempli les sections vides du html par ls infos qui vont bien
    document.getElementById("gameover-body").textContent =
      survivors.length ? `Vainqueurs : ${survivors.join(", ")}` : "";
    document.getElementById("gameover").style.display = "flex";
  },

  showHelp(label) {
    const title = document.getElementById("help-title");
    const body  = document.getElementById("help-body");
 
    if (label === "rules") {
      title.textContent = "Règles du Jeu";
      body.innerHTML = `
        <p class="help-intro">Dans ce jeu, vous incarnez une créature préhistorique qui doit survivre aux catastrophes naturelles.</p>
        <p>À chaque manche, chaque joueur reçoit une carte d'une valeur comprise entre <strong>1 et 11</strong>.
        Le joueur qui possède la carte de plus faible valeur à la fin de la manche <span class="help-dmg">perd une vie</span>.
        Le premier joueur à ne plus avoir de vie a perdu — tous les autres sont déclarés vainqueurs.</p>
 
        <h3 class="help-section-title">Déroulement d'une manche</h3>
        <div class="help-phases">
          <div class="help-phase">
            <div class="help-phase-num">I</div>
            <div>
              <strong>Phase d'échange</strong>
              <p>À tour de rôle, chaque joueur peut garder sa carte, l'échanger avec la rivière, ou l'échanger avec le joueur suivant.</p>
            </div>
          </div>
          <div class="help-phase">
            <div class="help-phase-num">II</div>
            <div>
              <strong>Phase de révélation</strong>
              <p>Les cartes sont retournées. Les effets s'appliquent, puis le joueur avec la carte la plus basse perd une vie.</p>
            </div>
          </div>
        </div>
 
        <p class="help-warning">Les effets de certaines cartes peuvent influencer la résolution de la manche !</p>
      `;
    }
    else if (label === "cards-help") {
      title.textContent = "Effets des Cartes";
      body.innerHTML = `
        <p class="help-intro">Certaines cartes possèdent des effets spéciaux qui s'activent dans la rivière ou lors de la révélation.</p>
        <div class="help-cards">
          <div class="help-card-row">
            <div class="help-card-badge">1</div>
            <div><strong>Météorite</strong><br>
            Si la carte <strong>11</strong> est visible lors de la révélation, cette carte vaut <strong>12</strong>.</div>
          </div>
          <div class="help-card-row">
            <div class="help-card-badge protect">3</div>
            <div><strong>Glaciation</strong><br>
            La carte de plus basse valeur est <span class="help-prot">protégée</span>. C'est donc le joueur avec la <em>deuxième</em> carte la plus basse qui perd une vie.</div>
          </div>
          <div class="help-card-row">
            <div class="help-card-badge">4</div>
            <div><strong>Canicule</strong> <span class="help-river-tag">Rivière</span><br>
            Dès que cette carte apparaît dans la rivière, les joueurs possédant une carte de valeur <strong>6 ou plus</strong> sont révélés.</div>
          </div>
          <div class="help-card-row">
            <div class="help-card-badge">5</div>
            <div><strong>Inondation</strong> <span class="help-river-tag">Rivière</span><br>
            Dès que cette carte apparaît dans la rivière, une <strong>seconde carte</strong> est immédiatement ajoutée à la rivière.</div>
          </div>
          <div class="help-card-row">
            <div class="help-card-badge dmg">7</div>
            <div><strong>Ouragan</strong><br>
            Le joueur possédant la <span class="help-dmg">deuxième carte la plus basse</span> perd également une vie.</div>
          </div>
          <div class="help-card-row">
            <div class="help-card-badge protect">8</div>
            <div><strong>Séisme</strong><br>
            Les joueurs possédant une carte de valeur <span class="help-prot">5, 6 ou 7</span> sont protégés.</div>
          </div>
          <div class="help-card-row">
            <div class="help-card-badge night">11</div>
            <div><strong>Nuit</strong><br>
            La nuit tombe — la carte <strong>1</strong> devient <strong>12</strong> pour cette manche.</div>
          </div>
        </div>
      `;
    }
 
    document.getElementById("helpers-display").style.display = "flex";
  },
 
  hideHelp(label) {
    document.getElementById("helpers-display").style.display = "none";
  }

};

// POOLING 
// Le serveur gère l'état de la partie, chaque client (joueur) envoie
// des mises à jour au serveur et l'iterroge pour mettre à jour son
// affichage.

let lastLogLength = 0;

async function poll() {
  if (!MY_ID) return;
  try {
    const res = await ngrokFetch(`${SERVER}/state?player_id=${MY_ID}`);
    const data = await res.json();
    ui.render(data);
    // Mise à jour du log seulement si de nouveaux messages
    if (data.log.length !== lastLogLength) {
      ui.syncLog(data.log);
      lastLogLength = data.log.length;
    }
  } catch (e) { console.error("Polling error:", e); }
}

setInterval(poll, 500); // Le serveur est interrogé toutes les secondes pour mttre à jour l'affichage d'un joueur.

// ACTIONS
async function sendAction(choice) {
  await ngrokFetch(`${SERVER}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player_id: MY_ID, choice })
  });
  poll(); // Mise à jour immédiate après une action
}

// Setup 
// En mode multijoueur réel, chaque machine inscrit uniquement son propre
// joueur. Le bouton "Lancer" n'est utilisé que par l'hôte, une fois que
// tous les joueurs ont rejoint.

const nameInput  = document.getElementById("player-name");
const btnJoin    = document.getElementById("btn-join");
const btnLaunch  = document.getElementById("btn-launch");
const btnAbort  = document.getElementById("btn-abort");
const joinStatus = document.getElementById("join-status");
const btnGameover = document.getElementById("gameover-btn");

btnJoin.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  if (!name) { alert("Entre un nom valide"); return; }

  const res  = await ngrokFetch(`${SERVER}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });
  const data = await res.json();

  if (data.error) { alert(data.error); return; }

  MY_ID = data.player_id;
  joinStatus.textContent = `Tu as rejoint la partie en tant que ${MY_ID}.`;
  btnJoin.disabled    = true;
  nameInput.disabled  = true;
  btnLaunch.disabled  = false;   // L'hôte peut maintenant lancer la partie

  // Démarrer le polling pour voir les autres joueurs rejoindre
  setInterval(poll, 1000);
});

btnLaunch.addEventListener("click", async () => {
  const res  = await ngrokFetch(`${SERVER}/start`, { method: "POST" });
  const data = await res.json();
  if (data.error) { alert(data.error); return; }

  document.getElementById("setup").style.display = "none";
  document.getElementById("game").style.display  = "flex";
});

btnAbort.addEventListener("click", async () => {
  const res  = await ngrokFetch(`${SERVER}/end`, { method: "POST" });
  const data = await res.json();
  if (data.error) { alert(data.error); return; }

  // On réinitialise les boutons de la page de setup de la partie :
  joinStatus.textContent = "";
  btnJoin.disabled    = false;
  nameInput.disabled  = false;
  btnLaunch.disabled  = true; 

  document.getElementById("setup").style.display = "flex";
  document.getElementById("game").style.display  = "none";
});

btnGameover.addEventListener("click", async () => {
  const res  = await ngrokFetch(`${SERVER}/end`, { method: "POST" });
  const data = await res.json();
  if (data.error) { alert(data.error); return; }

  // On réinitialise les boutons de la page de setup de la partie :
  joinStatus.textContent = "";
  btnJoin.disabled    = false;
  nameInput.disabled  = false;
  btnLaunch.disabled  = true; 

  document.getElementById("setup").style.display = "flex";
  document.getElementById("game").style.display  = "none";
  document.getElementById("gameover").style.display  = "none";
});

// Boutons d'aide
document.getElementById("rules")
  .addEventListener("click", () => ui.showHelp("rules"));
document.getElementById("cards-help")
  .addEventListener("click", () => ui.showHelp("cards-help"));
document.getElementById("help-close")
  .addEventListener("click", () => ui.hideHelp());