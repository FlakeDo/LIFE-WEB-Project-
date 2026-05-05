'''
Dans la version multijoueur, le principe reste le même. On utilise juste un
serveur Python qui gère les actions à la place du js. Le serveur renvoit un 
état qui est interprété et affiché par le js.

Les différentes demandes sont :
/join - Rejoindre une partie
/start - Lancer un partie
/state - Récupérer l'état du jeu
/action - Envoyer une action

Format d l'état JSON :
{
"phase" : "<phase actuelle>",
"active_player" : "<joueur actuel>",
"river" : [<contenu de la rivière, int liste>],
"players" : [
    {"id" : "<id joueur 1>", "hp" : <pts de vie>, "card" : <carte>, "is_active" : <booléen>},
    {...},
    ...
],
"log" : ["<résumé de l'action à afficher dans la console>"],
"game_over" : <booléen>,
}
'''

from flask import Flask, request, jsonify, make_response
import random, threading

app = Flask(__name__)
lock = threading.Lock()


def cors(data, status=200):
    '''Construit une réponse JSON avec les headers CORS nécessaires pour
    contourner les restrictions navigateur et l'avertissement ngrok.'''
    response = make_response(jsonify(data), status)
    response.headers["Access-Control-Allow-Origin"]  = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, ngrok-skip-browser-warning"
    response.headers["ngrok-skip-browser-warning"]   = "true"
    return response

@app.before_request
def handle_options():
    '''Répond aux requêtes preflight OPTIONS envoyées par le navigateur
    avant chaque requête cross-origin.'''
    if request.method == "OPTIONS":
        return cors({})



'''
Bonjour je suis M. rioual, je suis venu aux 
urgences il y a deux jours pour une fracture du cartilage
et des points de suture à l'oreille, et on m'a dit qu'il 
fallait absolument que je vois l'ORL en ce début de 
semaine, aujourd'hui ou demain. Ca serait possible ?
'''

# Le reste est en grande partie repris du prototype écrit en Python, avec les 
# modifications nécessaires pour effectuer des demandes. La classe gamestate est 
# globalment remplacée par un état de la partie qui est modifié puis envoyé au 
# js.

# === CONSTANTES ===

CARD_EFFECTS = {
    1:"twelve_if_night", 
    2:"none", 
    3:"protect_lowest",
    4:"reveal_six_or_more", 
    5:"widen_river", 
    6:"none",
    7:"hurt_two_lowest", 
    8:"protect_five_to_seven",
    9:"none", 
    10:"none", 
    11:"set_night"
}

EFFECT_ORDER = [11, 1, 8, 3]

# État de la partie :
state = {
    "started": False,
    "players": [],       # [{"id", "hp", "card_value", "card_protected"}]
    "river": [],         # [{"value", "protected"}]
    "deck": [],
    "deck_index": 0,
    "phase": "waiting",  # waiting | trade | reveal
    "active_index": 0,
    "is_night": False,
    "log": [],
    "game_over": False,
    "loser": None,
    "survivors": []
}

def log(msg, cls = "log-event"):
    '''Ajoute un message a afficher dans la console. Seulement
    50 messags sont sauvgardés.'''

    state["log"].append([msg, cls])
    if len(state["log"]) > 50:
        state["log"].pop(0)


def shuffle_deck():
    '''Créé un deck pour le jeu et le mélange. Le deck est une liste de 
    dictionnaires cette fois, chacun représentant une carte.'''

    state["deck"] = [{"value": i+1, "protected": False, "in_river": False} for i in range(11)]
    random.shuffle(state["deck"])
    state["deck_index"] = 0


def get_card(value):
    '''Récupère le dictionnaire de la carte correspondant à la valeur dans le deck.'''

    for c in state["deck"]:
        if c["value"] == value:
            return c
    return None

def reset_round():
    '''Réinitialise l'état de la partie pour démarer un nouveau round.'''

    state["is_night"] = False
    state["river"] = []
    shuffle_deck()
    for c in state["deck"]:
        c["protected"] = False
    # Distribution
    for p in state["players"]:
        p["card_value"] = state["deck"][state["deck_index"]]["value"]
        state["deck_index"] += 1
        p["card_protected"] = False
    add_river()

def add_river():
    '''Ajoute une carte à la rivière et applique les effets si nécéssaire.'''

    card = state["deck"][state["deck_index"]] # On prend la prochaine carte dans la pioche ...
    card["in_river"] = True
    state["river"].append({"value": card["value"], "protected": False})
    state["deck_index"] += 1
    if card["value"] == 4:
        _reveal_six_or_more()
    elif card["value"] == 5:
        _widen_river()

def get_min_card():
    '''Reeturne la valeur minimum de toutes les cartes en jeu.'''

    vals = [p["card_value"] for p in state["players"]
            if p["card_value"] and not p["card_protected"]]
    return min(vals) if vals else None


# === EFFETS ===

def apply_effects():
    '''Applique les effets des cartes lors de la phase de révélation.'''

    all_cards = [(p["card_value"], "player", p) for p in state["players"]]
    all_cards += [(r["value"], "river", r) for r in state["river"]]
    all_cards.sort(key=lambda x: EFFECT_ORDER.index(x[0])
                   if x[0] in EFFECT_ORDER else len(EFFECT_ORDER))
    for val, _, _ in all_cards:
        if state["game_over"]: break
        effect = CARD_EFFECTS.get(val, "none")
        if effect == "set_night":            _set_night()
        elif effect == "twelve_if_night":    _twelve_if_night()
        elif effect == "protect_five_to_seven": _protect_five_to_seven()
        elif effect == "protect_lowest":     _protect_lowest()
        elif effect == "hurt_two_lowest":    _hurt_two_lowest()

# Effets des cartes -------------------------------------------

def _set_night():
    state["is_night"] = True
    log("La nuit tombe ! (carte 11)", "log-effect")

def _twelve_if_night():
    if state["is_night"]:
        for p in state["players"]:
            if p["card_value"] == 1:
                p["card_value"] = 12
                log(f"La carte de {p['id']} devient 12 !", "log-effect")

def _protect_lowest():
    m = get_min_card()
    for p in state["players"]:
        if p["card_value"] == m:
            p["card_protected"] = True
            log(f"{p['id']} est protégé (carte 3)", "log-protect")

def _protect_five_to_seven():
    for p in state["players"]:
        if p["card_value"] in (5, 6, 7):
            p["card_protected"] = True
            log(f"{p['id']} est protégé (carte 8)", "log-protect")

def _hurt_two_lowest():
    m = get_min_card()
    sec = None
    for p in state["players"]:
        v = p["card_value"]
        if v and v != m and not p["card_protected"]:
            if sec is None or v < sec: sec = v
    if sec:
        for p in state["players"]:
            if p["card_value"] == sec:
                log(f"{p['id']} perd une vie ! (carte 7)", "log-damage")
                _lose_hp(p)

def _reveal_six_or_more():
    names = [p["id"] for p in state["players"] if p.get("card_value", 0) > 5]
    if names: log(f"Carte 4 — joueurs ≥ 6 : {', '.join(names)}", "log-effect")

def _widen_river():
    log("Carte 5 — rivière élargie !", "log-effect")
    add_river()

# --------------------------------------------------------------------------




def _lose_hp(player):
    '''Retire un point de vi à un joueur.'''

    player["hp"] -= 1
    if player["hp"] <= 0:
        state["game_over"] = True
        state["loser"] = player["id"]
        log(f"{player['id']} est éliminé !", "log-damage")

def resolve_reveal():
    '''Résoud la phase de révélation.'''

    apply_effects()
    if state["game_over"]: return
    m = get_min_card()
    nb_protected = sum(1 for p in state["players"] if p["card_protected"])
    if nb_protected == len(state["players"]):
        log("Personne ne perd de vie !", "log-protect")
    else:
        for p in state["players"]:
            if p["card_value"] == m:
                log(f"{p['id']} perd une vie ! (carte la plus basse)", "log-damage")
                _lose_hp(p)
                break

# === DEMANDES ===

@app.route("/join", methods=["POST", "OPTIONS"])
def join():
    '''Demande d'intégration à une partie. Gère les cas où la partie a déjà commencé et où le nom est déjà pris.'''

    with lock:
        if state["started"]:
            return cors({"error": "Partie déjà commencée"}, 403)
        data = request.json
        name = data.get("name", f"J{len(state['players'])+1}")
        if any(p["id"] == name for p in state["players"]):
            return cors({"error": "Nom déjà pris"}, 400)
        state["players"].append({
            "id": name, "hp": 3,
            "card_value": None, "card_protected": False
        })
        log(f"{name} a rejoint la partie.")

        return cors({"player_id": name})

@app.route("/start", methods=["POST", "OPTIONS"])
def start():
    '''Demande de début de la partie. Elle ne peut être effectuée que par le premier joueur et que si un nombre 
    correct de joueurs est dans la partie.'''

    with lock:
        if len(state["players"]) < 3:
            return cors({"error": "Minimum 3 joueurs"}, 400)
        state["started"] = True
        state["phase"] = "trade"
        state["active_index"] = 0
        reset_round()
        state["log"] = []
        log("── Nouvelle manche ──", "log-effect")

        return cors({"ok": True})

@app.route("/state", methods=["GET", "OPTIONS"])
def get_state():
    '''Récupère l'état de la partie.'''

    player_id = request.args.get("player_id")
    with lock:
        players_view = []
        for p in state["players"]:
            is_me = (p["id"] == player_id)
            is_reveal = (state["phase"] == "reveal")
            players_view.append({
                "id": p["id"],
                "hp": p["hp"],
                # Sa carte est visible pour le joueur, ou pendant la révélation
                "card": p["card_value"] if (is_me or is_reveal) else None,
                "protected": p["card_protected"],
                "is_active": state["players"].index(p) == state["active_index"]
            })
        return cors({
            "phase": state["phase"],
            "active_player": state["players"][state["active_index"]]["id"]
                             if state["players"] else None,
            "river": [r["value"] for r in state["river"]],
            "players": players_view,
            "log": state["log"][-20:],
            "game_over": state["game_over"],
            "loser": state["loser"]
        })

@app.route("/action", methods=["POST", "OPTIONS"])
def action():
    '''Demande d'execution d'une action de la part d'un joueur.'''

    with lock:
        data = request.json
        player_id = data.get("player_id")
        choice = data.get("choice")

        if state["game_over"]:
            return cors({"error": "Partie terminée"}, 400)

        active = state["players"][state["active_index"]]
        if active["id"] != player_id:
            return cors({"error": "Ce n'est pas ton tour"}, 403)

        idx = state["active_index"]
        players = state["players"]

        if choice == "keep":
            log(f"{player_id} garde sa carte.")

        elif choice == "river 1":
            old = active["card_value"]
            active["card_value"] = state["river"][0]["value"]
            state["river"][0]["value"] = old
            log(f"{player_id} échange avec la rivière (slot 1).")
            if old == 4: _reveal_six_or_more()
            elif old == 5: _widen_river()

        elif choice == "river 2" and len(state["river"]) == 2:
            old = active["card_value"]
            active["card_value"] = state["river"][1]["value"]
            state["river"][1]["value"] = old
            log(f"{player_id} échange avec la rivière (slot 2).")
            if old == 4: _reveal_six_or_more()
            elif old == 5: _widen_river()

        elif choice == "trade":
            if idx == len(players) - 1:
                active["card_value"] = state["deck"][state["deck_index"]]["value"]
                state["deck_index"] += 1
                log(f"{player_id} échange avec la pioche.")
            else:
                nxt = players[idx + 1]
                active["card_value"], nxt["card_value"] = \
                    nxt["card_value"], active["card_value"]
                log(f"{player_id} échange avec {nxt['id']}.")
        else:
            return cors({"error": "Action invalide"}, 400)

        # Passer au joueur suivant ou changer de phase
        state["active_index"] += 1
        if state["active_index"] >= len(players):
            state["active_index"] = 0
            state["phase"] = "reveal"
            resolve_reveal()
            if not state["game_over"]:
                state["phase"] = "trade"
                reset_round()
                log("── Nouvelle manche ──", "log-effect")

        return cors({"ok": True})

@app.route("/end", methods=["POST", "OPTIONS"])
def end():
    '''Demande de fin de la partie. Réinitialise l'état du jeu et libère les noms des joueurs. 
    Ramène au menu principal.'''

    with lock:
        state["started"] = False
        state["players"] = []
        state["river"] = []
        state["deck"] = []
        state["deck_index"] = 0
        state["phase"] = "waiting"
        state["active_index"] = 0
        state["is_night"] = False
        state["log"] = []
        state["game_over"] = False
        state["loser"] = None

        log("La partie a été annulée. Veuillez appuyer sur le bouton annuler la partie pour retourner au menu précédent.", "log-effect")

        return cors({"ok": True})

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True, port=5000)