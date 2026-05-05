**Instructions pour le serveur (ngrok)**

Les tests de la version multijoueur ont été effectués avec ngrok. Les instructions suivantes permettent de reproduire les conditions de test.

* Créer un compte ngrok pour pouvoir mettre en place le serveur et installer ngrok (de préférence sous environnement virtuel).

    * Création de l'environnment virtuel :

        `python3 -m venv om_env>`  

        Si une erreur survient (Error: [Errno 1] Operation not permitted: 'lib'), faire cela à la place :

        `mkdir -p venv/lib64`
        `python3 -m vnv --copies venv/`

    * Pour activer l'environnement :
    
       `source <nom_env>/bin/activate`
    
    * Pour le desactiver :

        `deactivate`
    
    * Pour installer les paquets dans l'environnement virtuel via le fichier requirements.txt :

        `python -m pip install -r server/requirements.txt`
    

    * Installer ngrok :

        `curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc \
        | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null \
        && echo "deb https://ngrok-agent.s3.amazonaws.com bookworm main" \
        | sudo tee /etc/apt/sources.list.d/ngrok.list \
        && sudo apt update \
        && sudo apt install ngrok`
    
    * Ajouter l'authoken au fichier de configuration :

        `ngrok config add-authtoken 3DGktryZ6KcuRbVFQeb0NLqsMxj_5gwv6xM92ZUBx9thsY2hs`

* Lancer le serveur à partir du fichier app.py et créer le tunnel avc ngrok.

    * Lancer le fichier python dans un terminal :

        `python3 server/app.py`
    
    * Dans un autre terminal, lancer la commande suivante :

        `ngrok http 5000`

* Après cette étape, il suffit que chaque joueur lance le fichier VBL_game.html dans son navigateur.