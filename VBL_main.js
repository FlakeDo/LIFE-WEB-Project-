// ===================
// Constantes
// ===================


// ---------------------------------------------------
// Gestion de la récupération du choix d'un joueur

const readline = require('node:readline');

// C'est un peu obscur mais pas trop besoin de s'en soucier, le final n'utilisera pas la console.
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function askQuestion(query) {
    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            resolve(answer.trim().toLowerCase());
        });
    });
}

// ---------------------------------------------------



const GAME_PHASES = {
    "trade": `Phase d'Échange : \nA tour de rôle, vous pouvez échanger votre carte. Vous avez trois possibilités :\n\
                I - Gardez votre carte ('keep')\n\
                II - Echanger votre carte avec la rivière ('river 1' ou 'river 2')\n\
                III - Echanger votre carte avec celle du joueur suivant ('trade')\n\
(Le dernier joueur ne peut échanger sa carte qu'avec la première carte de la pioche)\n\n\
Tapez 'help' pour des informations supplémentaires.\n`,

    "reveal": `\nPhase de Révélation : \nLes cartes sont révélées. On applique les effets des cartes et les pouvoirs \n\
éventuels, rivière comprise.\n\
Le joueur qui possède la carte de valeur la plus basse perd une vie, sans prendre en compte la rivière.\n`
}

const RULES = `Bienvenue !\n\
Dans ce jeu, vous incarnez une créature préhistorique qui doit survivre aux catastrophes naturelles. A chaque manche, chaque \n\
joueur reçoit une carte d'une valeur comprise entre 1 et 11 et le joueur qui possède la carte de plus faible valeur à la fin\n\
de la manche perd une vie. Le premier joueur à ne plus avoir de vie a perdu, tous les autres joueurs sont des vainqueurs.\n\
Chaque manche contient deux phases :\n\
- Une phase d'échange\n\
- Une phase de révélation\n\
Attention ! Les effets de certaines cartes peuvent influencer la résolution de la manche lors de la révélation des cartes ...\n\n\
Bon courage !\n`;

const HELP_TEXT = `\nEffets des cartes :\n\
1] La carte 1 vaut 12 si la carte 11 est l'une des cartes visibles lors de la phase de révélation.\n\
3] Le joueur qui a la carte de plus basse valeur est protégé. Le joueur possédant la 2e carte de plus basse valeur non protégée perd donc une vie.\n\
4] Dès que la carte 4 apparaît dans la rivière, les joueurs possédant une carte de valeur 6 ou plus sont révélés.\n\
5] Dès que la carte 5 apparaît dans la rivière, une seconde carte est immédiatement rajoutée à la rivière pour cette manche.\n\
7] Le joueur possédant la deuxième carte de plus basse valeur perd également une vie.\n\
8] Les joueurs possédant une carte de valeur comprise entre 5 et 7 sont protégés.\n\
11] La nuit tombe, la carte 1 devient 12.\n\n`;

const CARD_EFFECTS = {
    1:  "twelve_if_night",
    2:  "none",
    3:  "protect_lowest",
    4:  "reveal_six_or_more",
    5:  "widen_river",
    6:  "none",
    7:  "hurt_two_lowest",
    8:  "protect_five_to_seven",
    9:  "none",
    10: "none",
    11: "set_night"
}

// L'ordre dans lequel les effets doivent être appliqués lors de la révélation.
const EFFECT_ORDER = [11, 1, 8, 3];


// ==========
// Classes
// ==========

class Dinosaur {
    constructor(name, hp, effect, effect_desc) {
        this.name = name;
        this.health_points = hp;
        this.effect = effect;
        this.effect_desc = effect_desc;
    }
}

const DINOSAURS = [
    new Dinosaur("Defaut", 3, true, "N'a pas de pouvoir particulier.")
];


class Card {
    constructor(value) {
        this.value = value;

        this.is_in_river = false
        this.is_protected = false
    }

    reset() {
        /* 
        Réinitialise l'état de la carte pour une nouvelle manche. 
        */

        this.is_in_river = false;
        this.is_protected = false;
        if (this.value == 12) {    // On rétablit la carte 1 si elle avait été transformée.
            this.value = 1;
        }
    }
}


class Player {
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


function effect_priority(item) {
            /*
            Tri selon l'ordre de priorité des effets. Utile pour l'application des effets ( apply_effects() ) dans la classe Gamestate.
            */

            let card = item[0];

            if (EFFECT_ORDER.includes(card.value)) {
                return EFFECT_ORDER.indexOf(card.value);
            }
            else {
                return EFFECT_ORDER.length; // Sans ; ??
            }
        }


class GameState {
    /*
    Gère l'état de la patie.
    */

    constructor(n_players, p_names = null) {
        if (n_players < 3 || n_players > 6) {
            // window.alert("Nombre de joueurs invalide (min 3, max 6).");
        }

        this.is_in_game = false;
        this.is_night = false;           // Réinitialisé à chaque manche dans reset_round().
        this.phase = "trade";

        this.deck = [];

        // Construction du deck : une carte par valeur de 1 à 11.
        for (let i = 0 ; i < 11 ; i++) {
            this.deck.push(new Card(i + 1));
        }
        this.deck_index = 0;

        this.river = [];

        // Initialisation des joueurs.
        let names = (p_names) ? p_names : [];
        this.players = [];
        for (let i = 0 ; i < n_players ; i++) {
            let name = (i < names.length) ? names[i] : `J ${i + 1}`;
            this.players.push(new Player(name));
        }

        this.nb_players = n_players;
    }

    // Gestion de la partie.

    async start() {
        /* 
        Point d'entrée : affiche les règles et lance la boucle de jeu. 
        */

        console.log(`\nPartie commencée !\n`);
        console.log(RULES);

        this.is_in_game = true;

        try {
            while (this.is_in_game) {
                console.log(GAME_PHASES[this.phase]);
                if (this.phase == "trade") {
                    this.reset_round();
                    this.phase = await this.resolve_trade();     // METHODE TERMINAL
                }
                else {
                    this.phase = this.resolve_reveal();
                    if (!this.is_in_game) {break;}    // Une condition de fin peut survenir dans resolve_reveal.
                }
            }
        } catch (error) {
            console.error("UNE ERREUR EST SURVENUE :", error);
        } finally {
            rl.close();  // METHODE TERMINAL On ferme l'interface à la fin de la partie
        }
    }

    game_over(loser_id) {
        /*
        Déclenche la fin de la partie.
        */

        console.log(
            `Le joueur ${loser_id} n'a pas survécu à cette manche. \n\
            Tous les joueurs restants sont déclarés vainqueurs !\n\nFin de partie ...\n`
        );

        rl.close();     // On ferme l'interface pour récupérer les choix des joueurs.

        this.is_in_game = false;
    }

    shuffle(deck) {
        /*
        Mélang le deck. Utilise la méthode de Fisher-Yates.
        */

        let currentIndex = deck.length

        // Tant qu'il reste des cartes à mélanger ...
        while (currentIndex != 0) {
            // On prend un élément aléatoire ...
            let randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // ... Et on l'échange avec l'élément actuel.
            [deck[currentIndex], deck[randomIndex]] = [deck[randomIndex], deck[currentIndex]];
        }
    }

    reset_round() {
        /* 
        Prépare une nouvelle manche, càd mélange le deck, rmet à zero toutes les cartes
        et réinitialise la rivière et la nuit.
        */

        this.is_night = false;
        this.river = [];
        this.shuffle(this.deck);
        this.deck_index = 0;
        for (let card of this.deck) {
            card.reset();
        }
    }

    deal_cards() {
        /*
        Distribue une carte à chaque joueur.
        */

        for (let player of this.players) {
            player.card = this.deck[this.deck_index];
            this.deck_index += 1;

            if (this.deck_index > this.deck.length - 1) {   // Gérer le cas d'erreur où l'indice serait plus grand que la taille du deck.
                console.log(`\nERREUR : INDEX PLUS GRAND QUE LA TAILLE DU DECK.\n`)
            }
        }
    }

    add_river() {
        /*
        Pioche la prochaine carte du deck et la place dans la rivière. Déclenche les effets
        immédiatement des carts 4 et 5.
        */

        let card = this.deck[this.deck_index];
        card.is_in_river = true;
        this.river.push(card);
        this.deck_index += 1;    // Incrémenté avant l'appel éventuel de widen_river.

        if (card.value == 4) {
            this.reveal_six_or_more();
        }
        else if (card.value == 5) {
            this.widen_river();
        }
    }

    // ====================
    // Phase d'échange
    // ====================

    async resolve_trade() {
        /*
        Gère la phase d'échange pour chaque joueur.
        */

        this.deal_cards();
        this.add_river();

        for (let [player_index, player] of this.players.entries()) {
            await this.player_turn(player_index, player);   // METHODE TERMINAL On attend la réponse du joueur.
        }

        return "reveal";     // À la fin du tour de tous les joueurs, on passe à la phase de révélation.
    }

    async player_turn(player_index, player) {
        /*
        Boucle d'interaction pour le tour d'un joueur.
        */

        return new Promise(async (resolve) => {     // METHODE TERMINAL

            while (true) {
                this.display_player_info(player);
                console.log("Faites votre choix", "Taper 'help' pour obtenir une liste des commandes\n");

                let choice = await askQuestion(">> ");  // METHODE TERMINAL

                if (choice == "keep") {
                    resolve();
                    break;
                }
                else if (choice == "river 1") {
                    this.exchange_with_river(player, 0);
                    resolve();
                    break;
                }
                else if (choice == "river 2" && this.river.length == 2) {
                    this.exchange_with_river(player, 1);
                    resolve();
                    break;
                }
                else if (choice == "trade") {
                    this.do_trade(player_index, player);
                    resolve();
                    break;
                }
                else if (choice == "help") {
                    this.display_help();
                }
                else {
                    console.log(`\nOption invalide.\n`);
                }
            }
        });
    }

    exchange_with_river(player, river_slot) {
        /*
        Echange la carte du joueur avec une carte de la rivière.
        Déclenche les effets immédiats si la nouvelle carte de la rivière est un 4 ou un 5.
        */

        let old_player_card = player.card;
        let new_player_card = this.river[river_slot];

        old_player_card.is_in_river = true;
        new_player_card.is_in_river = false;

        this.river[river_slot] = old_player_card;
        player.card = new_player_card;

        // Effets de la nouvelle carte de rivière si déclenchée.
        if (old_player_card.value == 4) {
            this.reveal_six_or_more();
        }
        else if (old_player_card.value == 5) {
            this.widen_river();
        }
    }

    do_trade(player_index, player) {      // METHODE TERMINAL
        /*
        Echange la carte du joueur avc celle du joueur suivant. Si le joueur
        est le dernier, il échange sa carte avec la première de la pioche.
        */

        if (player_index == this.nb_players - 1) {
            // Le dernier joueur échange sa carte avec la première de la pioche.
            player.card = this.deck[this.deck_index];
            this.deck_index++;
        }
        else {
            let next_player  = this.players[player_index + 1];
            let temp = player.card;
            player.card = next_player.card;
            next_player.card = temp;
        }
    }

    // =====================
    // Phase de révélation
    // =====================

    resolve_reveal() {
        /*
        Révèle toutes les cartes, applique les effets et désigne le perdant.
        */

        this.display_all_cards();
        this.apply_effects();

        if (!this.is_in_game) {     // Un effet (carte 7 par ex.) peut avoir terminé la partie.
            return "trade";
        }

        let min_card = this.get_min_card(this.players);

        let nb_protected = 0;
        for (let player of this.players) {
            if (player.card.is_protected) nb_protected++;
        }

        if (nb_protected == this.nb_players) {
            console.log("Personne ne perd de vie !");
        }
        else {
            for (let player of this.players) {
                if (player.card.value == min_card) {
                    console.log(`Le joueur ${player.id} perd une vie !\n`);
                    player.lose_hp(this);
                    break;   // Un seul joueur perd une vie ici (si un second joueur doit perdre 
                            // une vie (carte 7), cela s'applique lors de l'appel de apply_effects()).
                }
            }
        }

        return "trade";
    }

    // ==============================
    // Application des effets :
    // ==============================

    apply_effects() {
        /*
        Construit la liste ordonnée des cartes dont les effets s'appliquent (joueurs + rivière),
        puis applique les effets dans l'ordre défini par EFFECT_ORDER.
        */
       
        // Pour les cartes dans la rivière, les effets s'appliquent : pour cela, on créé 1 ou 2 joueurs temporaires, un 
        // pour chaque carte de la rivière.
        let all_cards = [];
        for (let player of this.players) {
            all_cards.push([player.card, "player", player]);
        }
        for (let card of this.river) {
            all_cards.push([card, "river", null]); // c est supposé être une carte, mais pourrait être une valeur numérique ici (problème de river ?) 
        }


        all_cards.sort((a, b) => effect_priority(a) - effect_priority(b));  // Si c est une valeur numérique, alors all_cards n'est pas bien construit (mélange de types) et posera problème.

        for (let i = 0 ; i < all_cards.length ; i++) {
            if (!this.is_in_game) break;    // Si la partie est déjà terminée, on n'applique pas plus d'effets.
                
            let card = all_cards[i][0];
            let effect = CARD_EFFECTS[card.value];

            switch (effect) {
                case "set_night":
                    this.set_night();
                    break;

                case "twelve_if_night":
                    this.twelve_if_night();
                    break;
                
                case "protect_five_to_seven":
                    this.protect_five_to_seven();
                    break;

                case "protect_lowest":
                    this.protect_lowest();
                    break;

                case "hurt_two_lowest":
                    this.hurt_two_lowest();
                    break;
                
                default:
                    break;
            }
        }
    }

    // =======================
    // Effet des cartes :
    // =======================

    set_night() {
        /*
        La carte 11 déclenche la nuit pour cette manche.
        */

        this.is_night = true;
    }

    twelve_if_night() {
        /*
        Si c'est la nuit, alors la carte 1 devient la carte 12.
        */

        if (this.is_night) {
            for (let player of this.players) {
                if (player.card.value == 1) player.card.value = 12;
            }
        }
    }

    protect_lowest() {
        /*
        Protège la carte la plus faible qui n'est pas déjà protégée.
        */

        let min_val = this.get_min_card(this.players);
        for (let player of this.players) {
            if (player.card.value == min_val) {
                player.card.is_protected = true;
            }
        }
    }

    protect_five_to_seven() {
        /* 
        Les cartes de valeur 5, 6 ou 7 sont protégées.
        */

        for (let player of this.players) {
            if ([5, 6, 7].includes(player.card.value)) {
                player.card.is_protected = true;
            }
        }
    }

    hurt_two_lowest() {
        /*
        Le joueur avec la deuxième carte la plus basse non protégée perd une vie.
        (Le cas du joueur avec la plus basse sera traité par resolve_reveal.)
        */

        let min_val = this.get_min_card(this.players);

        let sec_min_val = null;
        for (let player of this.players) {
            let card = player.card;
            if (card.value != 0 && card.value != min_val && !card.is_protected) {
                if (sec_min_val == null || card.value < sec_min_val) {
                    sec_min_val = card.value;
                }
            }
        }

        if (sec_min_val != null) {
            for (let player of this.players) {
                if (player.card.value == sec_min_val) {
                    console.log(`Le joueur ${player.id} perd une vie ! (effet carte 7)\n`)
                    let eliminated = player.lose_hp(this);
                    if (eliminated) return;
                }
            }
        }
    }

    reveal_six_or_more() {
        /*
        Effet immédiat de la carte 4 dans la rivière : révèle les joueurs ≥ 6.
        */

        console.log(`\nLes joueurs possédant une carte de valeur supérieure à 5 sont :`);
        for (let player of this.players) {
            if (player.card && player.card.value > 5) {
                console.log(`  ${player.id}`);
            }
        }
    }

    widen_river() {
        /*
        Effet immédiat de la carte 5 dans la rivière : ajoute une carte.
        */

        this.add_river();
    }

    // ======================
    // Outils
    // ======================

    get_min_card(players_list) {
        /*
        Retourne la valeur minimale parmi les cartes non protégées des joueurs.
        */

        let values = [];
        for (let player of players_list) {

            if (player.card != null && !player.card.is_protected) {
                values.push(player.card.value);
            }
        }

        if (values.length > 0) {
            return Math.min(...values); // On utilise spread (...) pour passer les éléments individuelement (sinon, min() ne les reconnais pas comme nombres et renvoit NaN)
        }
        else {
            return null;
        }
    }

    display_player_info(player) {
        /*
        Affiche les informations utiles au joueur lors de son tour de jeu : Sa carte, ses points de vie restants et la carte déjà présente
        dans la rivière
        */

        console.log(
            `\nJoueur ${player.id}, que souhaites-tu faire ?\n\
            Carte : ${player.card.value} ; Points de vie : ${player.health_points}\n`
        );

        for (let card of this.river) {
            console.log(`Rivière : ${card.value}\n`);
        }
    }

    display_all_cards() {
        /*
        Utilisé à la phase de révélation : révèle toutes les cartes associées à chaque joueur et les points de vie de chacun.
        */
        
        for (let card of this.river) {
            console.log(`\nRivière : ${card.value}`);
        }

        for (let player of this.players) {
            console.log(`  ${player.id} : ${player.card.value} (vie : ${player.health_points})`);
        }
    }

    display_help() {
        /*
        Affiche l'aide à la demande du joueur.
        */

        console.log(RULES);
        console.log(HELP_TEXT);
        console.log("Points de vie des joueurs :");
        for (let player of this.players) {
            console.log(`  ${player.id} : ${player.health_points} hp`);
        }
    }
}


// ==========
// MAIN
// ==========

let game = new GameState(3, []);
game.start().catch(console.error);