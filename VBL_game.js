
// =============================================================
// UI — Gestion de l'affichage

const ui = {
  log(msg, cls = "log-event") {
    /* 
    Gère l'affichage des événements dans la console en bas de l'écran de jeu.
    */

    const division = document.createElement("div");
    division.className = cls;
    division.textContent = msg;
    const logElement = document.getElementById("log");
    logElement.appendChild(division);
    logElement.scrollTop = logElement.scrollHeight;
  },


  render(game) {
    /*
    Gère l'affichage du jeu complet, en gérant les différent éléments interactifs.
    */

    // Bannière de phase - Alterne entre "phase d'échange" et "phase de révélation" en fonction de la phase.
    document.getElementById("phase-banner").textContent = (game.phase === "trade") ? "Phase d'échange" : "Phase de révélation";

    // Rivière - Récupère les cartes présentes dans la rivière à partir de l'objet gamestate et créé une nouvelle division pour chaque carte récupérée.
    const riverElement = document.getElementById("river-cards");
    riverElement.innerHTML = "";  // On réinitialise la rivière à chaque fois, avant d'afficher la nouvelle.
    for (const card of game.river) {
      const division = document.createElement("div");
      division.className = "river-card";
      division.textContent = card.value;
      riverElement.appendChild(division);
    }

    // Joueurs - 
    const row = document.getElementById("players-row");
    row.innerHTML = "";
    for (const [i, player] of game.players.entries()) {
      const block = document.createElement("div");
      block.className = "player-block" + ((i === game.currentPlayerIndex) ? " active" : "") + ((player.health_points <= 0) ? " eliminated" : "");
      block.id = `pb-${i}`;

      // La subdivision représentant la carte du joueur :
      const cardDiv = document.createElement("div");
      cardDiv.className = "p-card" + 
        ((game.phase === "reveal" || i === game.currentPlayerIndex) ? " revealed" : "") + // Gérer si la carte doit être affichée ou non (au tour du joueur et àla phase de révélation)
        ((player.card && player.card.is_protected) ? " protected" : "") +
        ((player.card && player.card.value === 12) ? " twelve" : "");
      cardDiv.textContent = (player.card) ? player.card.value : "?";  // Si la carte est de valeur inconnue, ? est affiché.

      block.innerHTML = `<div class="p-name">${player.id}</div>
                         <div class="p-hp">HP : ${player.health_points}</div>`; // ESSAYER DE METTRE UNE IMAGE POUR LE PTIT COEUR
      block.appendChild(cardDiv);
      row.appendChild(block);
    }
  },


  setActivePlayer(player) {
    /*
    Change le statut du joueur pour actif (le met en surbrillance, révèle sa carte, etc ...).
    */

    document.getElementById("active-name").textContent = player.id;
    document.getElementById("active-card-display").textContent = player.card.value;
  },


  setButtons(labels, callback) {
    /*
    Créé les boutons disponibles pour l'action courante du joueur.
    */

    const container = document.getElementById("action-buttons");
    container.innerHTML = ""; // On réinitialise les boutons à chaque fois pour n'afficher que ceux qui ont du sens.

    for (const label of labels) {
      const button = document.createElement("button");
      button.textContent = label;
      button.onclick = () => callback(label);
      container.appendChild(button);
    }
  },

  clearButtons() {
    document.getElementById("action-buttons").innerHTML = "";
    document.getElementById("active-name").textContent = "—"; // Texte par défaut du joueur actif.
    document.getElementById("active-card-display").textContent = "";
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
 
        <p class="help-warning">⚠ Les effets de certaines cartes peuvent influencer la résolution de la manche !</p>
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
// =============================================================


// -----------------------------------------------
// Constantes

const CARD_EFFECTS = {
  1: "twelve_if_night", 
  2: "none", 
  3: "protect_lowest",
  4: "reveal_six_or_more", 
  5: "widen_river", 
  6: "none",
  7: "hurt_two_lowest", 
  8: "protect_five_to_seven",
  9: "none", 
  10: "none", 
  11: "set_night"
};
const EFFECT_ORDER = [11, 1, 8, 3];

const REGLES = `Bienvenue !\n\
Dans ce jeu, vous incarnez une créature préhistorique qui doit survivre aux catastrophes naturelles. A chaque manche, chaque \n\
joueur reçoit une carte d'une valeur comprise entre 1 et 11 et le joueur qui possède la carte de plus faible valeur à la fin\n\
de la manche perd une vie. Le premier joueur à ne plus avoir de vie a perdu, tous les autres joueurs sont des vainqueurs.\n\
Chaque manche contient deux phases :\n\
- Une phase d'échange\n\
- Une phase de révélation\n\
Attention ! Les effets de certaines cartes peuvent influencer la résolution de la manche lors de la révélation des cartes ...\n\n\
Bon courage !\n`;

const CARDS_HELP = `\nEffets des cartes :\n\
1] La carte 1 vaut 12 si la carte 11 est l'une des cartes visibles lors de la phase de révélation.\n\
3] Le joueur qui a la carte de plus basse valeur est protégé. Le joueur possédant la 2e carte de plus basse valeur non protégée perd donc une vie.\n\
4] Dès que la carte 4 apparaît dans la rivière, les joueurs possédant une carte de valeur 6 ou plus sont révélés.\n\
5] Dès que la carte 5 apparaît dans la rivière, une seconde carte est immédiatement rajoutée à la rivière pour cette manche.\n\
7] Le joueur possédant la deuxième carte de plus basse valeur perd également une vie.\n\
8] Les joueurs possédant une carte de valeur comprise entre 5 et 7 sont protégés.\n\
11] La nuit tombe, la carte 1 devient 12.\n\n`;

function effect_priority(item) {
  /*
  Tri selon l'ordre de priorité des effets. Utile pour l'application des effets ( apply_effects() ) dans la classe Gamestate.
  */

  const card = item[0];
  return (EFFECT_ORDER.includes(card.value))
    ? EFFECT_ORDER.indexOf(card.value)
    : EFFECT_ORDER.length;
}
// -----------------------------------------------


// -------------------------------------------------------------------------------------------------
// Classes

class Dinosaur {
  /*
  Défini un objet dinosaure. Cette fonctionnalité n'est pas implémentée. Chaque dinosaure possède
  une capacité particulière qui peut affecter le cours de la partie. Le dinosaure "defaut" ne
  possède pas de capacité.
  */

  constructor(name, hp, effect, effect_desc) {
    this.name = name; this.health_points = hp;
    this.effect = effect; this.effect_desc = effect_desc;
  }
}
const DINOSAURS = [
  new Dinosaur("Defaut", 3, true, "N'a pas de pouvoir particulier.")
];

class Card {
  /*
  Défini un objet carte.
  */

  constructor(value) {
    this.value = value;
    this.is_in_river = false;
    this.is_protected = false;
  }

  reset() {
    /* 
    Réinitialise l'état de la carte pour une nouvelle manche. 
    */

    this.is_in_river = false;
    this.is_protected = false;
    if (this.value === 12) this.value = 1;  // On rétablit la carte 1 si elle avait été transformée.
  }
}

class Player {
  /*
  Défini un objet joueur.
  */

  constructor(player_id, dino_index = 0) {
    this.id = player_id;
    this.dino = DINOSAURS[dino_index];
    this.health_points = this.dino.health_points;
    this.card = null;
  }

  lose_hp(game_state, amount = 1) {
    /*
    Réduit les points de vie. Déclenche gameOver si le joueur est éliminé.
    Retourne true si le joueur est éliminé, false sinon.
    */

    this.health_points -= amount;
    if (this.health_points <= 0) {
      game_state.game_over(this.id);
      return true;
    }
    return false;
  }
}
// -------------------------------------------------------------------------------------------------


// =================================================================================================
// Classe GameState

class GameState {
  /*
  Gère le déroulement de la partie.
  */

  constructor(n_players, p_names = null) {
    // Contrairement à la version sur terminal, le problème du nombre de joueurs n'est
    // pas géré ici.

    this.is_in_game = false;
    this.is_night = false;
    this.phase = "trade";

    this.currentPlayerIndex = -1;

    // Construction du deck : on ajoute un objet Card pour chaque carte numérotée de 1 à 11
    this.deck = [];
    for (let i = 0; i < 11; i++) this.deck.push(new Card(i + 1));
    this.deck_index = 0;
    this.river = [];

    // Initialisation des joueurs :
    const names = (p_names) ? p_names : [];
    this.players = [];
    for (let i = 0; i < n_players; i++) {
      const name = (i < names.length) ? names[i] : `Joueur n°${i + 1}`;
      this.players.push(new Player(name));
    }
    this.nb_players = n_players;
  }

  
  async start() {
    /* 
    Lance une partie de jeu. Affiche les règles et lance la boucle de jeu.
    */

    // TODO : Afficher les règles dans une certaine fenêtre au démarage de la partie.

    this.is_in_game = true;

    ui.log("Partie commencée !");

    // Boucle de jeu, active tant qu'une condition de fin de jeu n'a pas été rencontrée :
    while (this.is_in_game) {
      if (this.phase === "trade") {
        this.reset_round();
        ui.log("── Phase d'échange ──", "log-effect");
        this.phase = await this.resolve_trade();
      } else {
        ui.log("── Phase de révélation ──", "log-effect");
        this.phase = this.resolve_reveal();
        if (!this.is_in_game) break;  // Si une condition de sortie a été trouvée...
      }
    }
  }

  
  game_over(loser_id) {
    /*
    Gestion de fin de partie. On affiche l'écran de game over.
    */

    ui.log(`${loser_id} n'a pas survécu ! Fin de partie.`, "log-damage");
    this.is_in_game = false;

    // On récupère la liste des survivants (les id de ceux dont les points de vie ne sont pas à 0)
    const survivors = this.players.filter(p => p.health_points > 0).map(p => p.id);

    this.currentPlayerIndex = -1;
    ui.clearButtons();
    ui.render(this);
    ui.showGameOver(loser_id, survivors);
  }


  // Fonction utiles :

  shuffle(deck) {
    /*
    Mélange le deck. Utilise la méthode de Fisher-Yates pour y parvenir. 
    La fonction est appelée à chaque nouvelle manche.
    */

    let cur = deck.length;

    // Tant qu'il reste des cartes à mélanger ...
    while (cur !== 0) {
      // On prend un élément aléatoire ...
      const rand = Math.floor(Math.random() * cur--);

      // ... Et on l'échange avec l'élément actuel.
      [deck[cur], deck[rand]] = [deck[rand], deck[cur]];
    }
  }

  reset_round() {
    /*
    Prépare une nouvelle manche, càd mélange le deck, réinitialise toutes les cartes
    et réinitialise la rivière et la nuit.
    */

    this.is_night = false;
    this.river = [];
    this.shuffle(this.deck);
    this.deck_index = 0;
    for (const card of this.deck) card.reset();
  }

  deal_cards() {
    /*
    Distribue une carte à chaque joueur.
    */

    for (const player of this.players) {
      player.card = this.deck[this.deck_index++];
    }
  }

  add_river() {
    /*
    Pioche la prochaine carte du deck et la place dans la rivière. Déclenche les effets
    immédiatement des carts 4 et 5.
    */

    const card = this.deck[this.deck_index++];  // Deck_index incrémenté avant l'appel éventuel de widen_river.
    card.is_in_river = true;
    this.river.push(card);

    if (card.value === 4) this.reveal_six_or_more();
    else if (card.value === 5) this.widen_river();
  }


  // ---------- Phase d'échange ----------
  async resolve_trade() {
    /*
    Gère la phase d'échange pour chaque joueur. Contrairement à la version terminal, chaque
    joueur choisi ici ses options avec des boutons définis.
    */

    this.deal_cards();
    this.add_river();

    // Pour chaque joueur, on attend son choix avant de passer au suivant
    for (const [idx, player] of this.players.entries()) {
      this.currentPlayerIndex = idx;
      ui.render(this);
      await this.player_turn(idx, player);
    }

    this.currentPlayerIndex = -1;

    return "reveal";  // À la fin du tour de tous les joueurs, on passe à la phase de révélation
  }


  player_turn(player_index, player) {
    /*
    Boucle d'interaction pour le tour d'un joueur. La version terminal attendais de traiter
    une chaine de caractères entrée par le joueur. Ici, on gère le clic de boutons.
    */

    return new Promise((resolve) => {
      ui.log(`Tour de ${player.id}.`, "log-event");
      ui.setActivePlayer(player);

      // Set up des boutons :
      const showButtons = () => {
        const labels = ["Suivant", "Rivière 1"];
        if (this.river.length === 2) labels.push("Rivière 2");
        labels.push("Échanger");

        // On gère le choix du joueur :
        ui.setButtons(labels, (choice) => {
          if (choice === "Suivant") {
            ui.log(`${player.id} garde sa carte.`);
            ui.clearButtons();
            resolve();

          } else if (choice === "Rivière 1") {
            this.exchange_with_river(player, 0);
            ui.log(`${player.id} échange avec la rivière (slot 1).`);
            ui.render(this);

            ui.setActivePlayer(player);      // met à jour la carte affichée
            // On laisse le joueur voir sa nouvelle carte, puis passe au joueur suivant lorsqu'il appuye sur le bouton suivant.
            ui.setButtons(["Suivant"], () => { ui.clearButtons(); resolve(); });

          } else if (choice === "Rivière 2") {
            this.exchange_with_river(player, 1);
            ui.log(`${player.id} échange avec la rivière (slot 2).`);
            ui.render(this);

            ui.setActivePlayer(player);
            // On laisse le joueur voir sa nouvelle carte, puis passe au joueur suivant lorsqu'il appuye sur le bouton suivant.
            ui.setButtons(["Suivant"], () => { ui.clearButtons(); resolve(); });

          } else if (choice === "Échanger") {
            this.do_trade(player_index, player);
            if (player_index === this.nb_players - 1) {
              ui.log(`${player.id} échange avec la pioche.`);
            } else {
              ui.log(`${player.id} échange avec ${this.players[player_index + 1].id}.`);
            }
            ui.render(this);
            ui.setActivePlayer(player);
            // On laisse le joueur voir sa nouvelle carte, puis passe au joueur suivant lorsqu'il appuye sur le bouton suivant.
            ui.setButtons(["Suivant"], () => { ui.clearButtons(); resolve(); });
          }
        });
      };

      showButtons();
    });
  }

  exchange_with_river(player, river_slot) {
    /*
    Echange la carte du joueur avec une carte de la rivière.
    Déclenche les effets immédiats si la nouvelle carte de la rivière est un 4 ou un 5.
    */

    const old = player.card;
    const fromRiver = this.river[river_slot];

    old.is_in_river = true;
    fromRiver.is_in_river = false;

    this.river[river_slot] = old;
    player.card = fromRiver;

    // On déclenche les effets éventuels :
    if (old.value === 4) this.reveal_six_or_more();
    else if (old.value === 5) this.widen_river();
  }

  do_trade(player_index, player) {
    /*
    Echange la carte du joueur avc celle du joueur suivant. Si le joueur
    est le dernier, il échange sa carte avec la première de la pioche.
    */

    if (player_index === this.nb_players - 1) {
      // Le dernier joueur échange sa carte avec la première de la pioche
      player.card = this.deck[this.deck_index++];
    } else {
      const next = this.players[player_index + 1];
      [player.card, next.card] = [next.card, player.card];
    }
  }


  // ---------- Phase de révélation ----------
  resolve_reveal() {
    /*
    Révèle toutes les cartes, applique les effets et désigne le perdant.
    */

    // Les cartes des joueurs sont affichées.
    for (const player of this.players) ui.log(`${player.id} : ${player.card.value}`);
    // La rivière également
    for (const card of this.river) ui.log(`Rivière : ${card.value}`);

    this.apply_effects();
    if (!this.is_in_game) return "end"; 

    ui.render(this);   // affiche les effets des cartes révélées + protections

    const min_card = this.get_min_card(this.players);
    const nb_protected = this.players.filter(p => p.card.is_protected).length;

    if (nb_protected === this.nb_players) {
      ui.log("Personne ne perd de vie !", "log-protect");
    } else {
      for (const player of this.players) {
        if (player.card.value === min_card) {
          ui.log(`${player.id} perd une vie ! (carte la plus basse)`, "log-damage");
          player.lose_hp(this);// Un seul joueur perd une vie ici (si un second joueur doit perdre 
                              // une vie (carte 7), cela s'applique lors de l'appel de apply_effects()).
          break;
        }
      }
    }
    return "trade";
  }

  
  apply_effects() {
    /*
    Construit la liste ordonnée des cartes dont les effets s'appliquent (joueurs + rivière),
    puis applique les effets dans l'ordre défini par EFFECT_ORDER.
    */


    // Pour les cartes dans la rivière, les effets s'appliquent : pour cela, on créé 1 ou 2 joueurs temporaires, un 
    // pour chaque carte de la rivière.
    const all_cards = [];
    for (const p of this.players)  all_cards.push([p.card, "player", p]);
    for (const c of this.river)    all_cards.push([c, "river", null]);
    all_cards.sort((a, b) => effect_priority(a) - effect_priority(b));

    for (const [card] of all_cards) {
      if (!this.is_in_game) break;

      switch (CARD_EFFECTS[card.value]) {
        case "set_night":             
          this.set_night(); break;

        case "twelve_if_night":       
          this.twelve_if_night(); break;

        case "protect_five_to_seven": 
          this.protect_five_to_seven(); break;

        case "protect_lowest":        
          this.protect_lowest(); break;

        case "hurt_two_lowest":       
          this.hurt_two_lowest(); break;

      }
    }
  }

  set_night() {
    /*
    La carte 11 déclenche la nuit pour cette manche.
    */

    this.is_night = true;
    ui.log("La nuit tombe ! (carte 11)", "log-effect");
  }

  twelve_if_night() {
    /*
    Si c'est la nuit, alors la carte 1 devient la carte 12.
    */    

    if (this.is_night) {
      for (const p of this.players) {
        if (p.card.value === 1) {
          p.card.value = 12;
          ui.log(`La carte de ${p.id} devient 12 ! (carte 1 + nuit)`, "log-effect");
        }
      }
    }
  }

  protect_lowest() {
    /*
    Protège la carte la plus faible qui n'est pas déjà protégée.
    */

    const min_val = this.get_min_card(this.players);
    for (const p of this.players) {
      if (p.card.value === min_val) {
        p.card.is_protected = true;
        ui.log(`${p.id} est protégé ! (carte 3)`, "log-protect");
      }
    }
  }

  protect_five_to_seven() {
    /* 
    Les cartes de valeur 5, 6 ou 7 sont protégées.
    */

    for (const p of this.players) {
      if ([5, 6, 7].includes(p.card.value)) {
        p.card.is_protected = true;
        ui.log(`${p.id} est protégé ! (carte 8)`, "log-protect");
      }
    }
  }

  hurt_two_lowest() {
    /*
    Le joueur avec la deuxième carte la plus basse non protégée perd une vie.
    (Le cas du joueur avec la plus basse sera traité par resolve_reveal.)
    */

    const min_val = this.get_min_card(this.players);
    let sec_min = null;
    for (const p of this.players) {
      const v = p.card.value;
      if (v !== 0 && v !== min_val && !p.card.is_protected) {
        if (sec_min === null || v < sec_min) sec_min = v;
      }
    }
    if (sec_min !== null) {
      for (const p of this.players) {
        if (p.card.value === sec_min) {
          ui.log(`${p.id} perd une vie ! (carte 7)`, "log-damage");
          if (p.lose_hp(this)) return;
        }
      }
    }
  }

  reveal_six_or_more() {
    /*
    Effet immédiat de la carte 4 dans la rivière : révèle les joueurs ≥ 6.
    */

    const revealed = this.players.filter(p => p.card && p.card.value > 5).map(p => p.id);
    if (revealed.length) {
      ui.log(`Carte 4 en rivière — joueurs ≥ 6 : ${revealed.join(", ")}`, "log-effect");
    }
  }

  widen_river() {
    /*
    Effet immédiat de la carte 5 dans la rivière : ajoute une carte.
    */

    ui.log("Carte 5 en rivière — une carte de plus !", "log-effect");
    this.add_river();
  }


  get_min_card(players_list) {
    /*
    Retourne la valeur minimale parmi les cartes non protégées des joueurs.
    */

    const values = players_list.filter(p => p.card !== null && !p.card.is_protected).map(p => p.card.value);

    return (values.length)
    ? Math.min(...values) // On utilise spread (...) pour passer les éléments individuelement (sinon, min() ne les reconnais pas comme nombres et renvoit NaN)
    : null;  
  }

  // Plus besoin de display_player_info(), display_all_cards, ces fonction n'étaient qu'utiles dans le cas d'un jeu dans le terminal.
}
// =================================================================================================



// --------------------------------------------------------------------
// Mise en place de l'interface (démarrage du jeu)

const nInput = document.getElementById("n-players");
const playersNames = document.getElementById("name-inputs");

function rebuildPlayersNames() {
  const nb_players = parseInt(nInput.value) || 3;  // Le nombre de joueurs récupéré est sous forme de string, on doit le convertir en int avec la fonction parseInt()
  playersNames.innerHTML = "";  // On réinitialise les précédents noms de joueurs ...
  for (let i = 0; i < nb_players; i++) {
    const player = document.createElement("input");
    player.type = "text";
    player.placeholder = `Joueur ${i + 1}`;   // Si le joueur ne rentre pas de nom, alors son nom sera défini comme Joueur x par défaut. C'est également le texte placeholder de la ligne de saisie.
    player.id = `pname-${i}`;
    playersNames.appendChild(player);
  }
}


nInput.addEventListener("change", rebuildPlayersNames);   // Lorsqu'on
rebuildPlayersNames();

// Initialisation des aides :
document.getElementById("rules").addEventListener("click", () => ui.showHelp("rules"));
document.getElementById("cards-help").addEventListener("click", () => ui.showHelp("cards-help"));
document.getElementById("help-close").addEventListener("click", () => ui.hideHelp());

document.getElementById("btn-start").addEventListener("click", () => {
  const nb_players = parseInt(nInput.value);
  if (nb_players < 3 || nb_players > 6) { alert("Entre 3 et 6 joueurs."); return; }

  const names = [];
  for (let i = 0; i < nb_players; i++) {
    const v = document.getElementById(`pname-${i}`).value.trim();
    names.push(v || `J${i + 1}`);
  }

  document.getElementById("setup").style.display = "none";
  document.getElementById("game").style.display = "flex";

  const game = new GameState(nb_players, names);
  game.start().catch(console.error);
});
// --------------------------------------------------------------------
