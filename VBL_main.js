// ===================
// Constantes
// ===================

const GAME_PHASES = {
    "trade": "Phase d'Échange : \nA tour de rôle, vous pouvez échanger votre carte. Vous avez trois possibilités :\n\
                I - Gardez votre carte ('keep')\n\
                II - Echanger votre carte avec la rivière ('river 1' ou 'river 2')\n\
                III - Echanger votre carte avec celle du joueur suivant ('trade')\n\
(Le dernier joueur ne peut échanger sa carte qu'avec la première carte de la pioche)\n\n\
Tapez 'help' pour des informations supplémentaires.\n",

    "reveal": "\nPhase de Révélation : \nLes cartes sont révélées. On applique les effets des cartes et les pouvoirs \n\
éventuels, rivière comprise.\n\
Le joueur qui possède la carte de valeur la plus basse perd une vie, sans prendre en compte la rivière.\n"
}

const RULES = "Bienvenue !\n\
Dans ce jeu, vous incarnez une créature préhistorique qui doit survivre aux catastrophes naturelles. A chaque manche, chaque \n\
joueur reçoit une carte d'une valeur comprise entre 1 et 11 et le joueur qui possède la carte de plus faible valeur à la fin\n\
de la manche perd une vie. Le premier joueur à ne plus avoir de vie a perdu, tous les autres joueurs sont des vainqueurs.\n\
Chaque manche contient deux phases :\n\
- Une phase d'échange\n\
- Une phase de révélation\n\
Attention ! Les effets de certaines cartes peuvent influencer la résolution de la manche lors de la révélation des cartes ...\n\n\
Bon courage !\n";

const HELP_TEXT = "\nEffets des cartes :\n\
1] La carte 1 vaut 12 si la carte 11 est l'une des cartes visibles lors de la phase de révélation.\n\
3] Le joueur qui a la carte de plus basse valeur est protégé. Le joueur possédant la 2e carte de plus basse valeur non protégée perd donc une vie.\n\
4] Dès que la carte 4 apparaît dans la rivière, les joueurs possédant une carte de valeur 6 ou plus sont révélés.\n\
5] Dès que la carte 5 apparaît dans la rivière, une seconde carte est immédiatement rajoutée à la rivière pour cette manche.\n\
7] Le joueur possédant la deuxième carte de plus basse valeur perd également une vie.\n\
8] Les joueurs possédant une carte de valeur comprise entre 5 et 7 sont protégés.\n\
11] La nuit tombe, la carte 1 devient 12.\n\n";

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
    Dinosaur("Defaut", 3, True, "N'a pas de pouvoir particulier.")
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
        this.health_points = self.dino.health_points;
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

class GameState {
    /*
    Gère l'état de la patie.
    */

    constructor(n_players, names = null) {
        if (n_players < 3 || n_players > 6) {
            window.alert("Nombre de joueurs invalide (min 3, max 6).");
        }

        this.is_in_game = false;
        this.is_night = false;           // Réinitialisé à chaque manche dans reset_round().
        this.phase = "trade";

        this.deck = [];

        // Construction du deck : une carte par valeur de 1 à 11.
        for (i = 0 ; i < 11 ; i++) {
            this.deck.push(i + 1);
        }
        this.deck_index = 0;

        this.river = [];

        // Initialisation des joueurs.
        let names = (names) ? names : [];
        this.players = [];
        for (i = 0 ; i < n_players ; i++) {
            let name = (i < names.length) ? names[i] : "J ${i + 1}";
            this.players.push(Player(name));
        }

        this.nb_players = n_players;
    }

    // Gestion de la partie.

    start() {
        /* 
        Point d'entrée : affiche les règles et lance la boucle de jeu. 
        */

        console.log("\nPartie commencée !\n");
        console.log(RULES);

        this.is_in_game = true;

        while (this.is_in_game) {
            console.log(GAME_PHASES[this.phase]);
            if (this.phase == "trade") {
                this.reset_round();
                this.phase = this.resolve_trade();
            }
            else {
                this.phase = this.resolve_reveal();
                if (!self.is_in_game) {break;}    // Une condition de fin peut survenir dans resolve_reveal.
            }
        }
    }

    game_over(loser_i) {
        /*
        Déclenche la fin de la partie.
        */

        console.log(
            "Le joueur ${loser_id} n'a pas survécu à cette manche. \n\
            Tous les joueurs restants sont déclarés vainqueurs !\n\nFin de partie ...\n"
        );
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
        for (let card in this.deck) {
            card.reset();
        }
    }

    deal_cards() {
        /*
        Distribue une carte à chaque joueur.
        */

        for (let player in this.players) {
            player.card = this.deck[this.deck_index];
            this.deck_index += 1;
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
        this.deck_index += 1;    // Incrémenté avant l'appel éventuel de _widen_river.

        if (card.value == 4) {
            self.reveal_six_or_more();
        }
        else if (card.value == 5) {
            self.widen_river();
        }
    }

    // ====================
    // Phase d'échange
    // ====================

    resolve_trade() {
        /*
        Gère la phase d'échange pour chaque joueur.
        */

        this.deal_cards();
        this.add_river();

        for (let [player_index, player] of this.players.entries()) {
            this.player_turn(player_index, player);
        }

        return "reveal";     // À la fin du tour de tous les joueurs, on passe àla phase de révélation.
    }

    player_turn(player_index, player) {
        /*
        Boucle d'interaction pour le tour d'un joueur.
        */

        while (true) {
            this.display_player_info(player);
            let choice = window.prompt("Faits votre choix", "Taper 'help' pour obtenir une liste des commandes");

            if (choice == "keep") {
                break;
            }
            else if (choice == "river 1") {
                this.exchange_with_river(player, 0);
                break;
            }
            else if (choice == "river 2" && this.river.length == 2) {
                this.exchange_with_river(player, 1);
                break;
            }
            else if (choice == "trade") {
                this.do_trade(player_index, player);
                break;
            }
            else if (choice == "help") {
                this.display_help();
            }
            else {
                console.log("\nOption invalide.\n");
            }
        }
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
}