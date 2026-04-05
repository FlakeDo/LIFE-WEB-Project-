# WEB-Project
Carried out as a stuying project. The final website will contain HTML, CSS, JS, PHP and AJAX elements.

# Roadmap

\---

## 1\. Phase de Préparation (Semaine 1 - 3 jours)

### Objectifs

* Comprendre les attentes et les contraintes.
* Définir une idée de projet **concrète et réalisable** (sans solution technique détaillée).
* Organiser le travail en binôme.

### Étapes

* **Brainstorming** : Trouvez une idée liée au thème **"histoire(s)"** qui permet :

  * L’interaction entre utilisateurs en temps réel (ex : collaboration, visualisation partagée, actions synchronisées).
  * L’utilisation de toutes les technologies demandées (HTML/CSS/JS/PHP/AJAX).



===

Site qui retrace les différentes périodes ayant eu lieu sur Terre après l'apparition de la vie sur cette dernière.

===



* **Définir les fonctionnalités principales** (3-4 max) :

  * Ex : "Les utilisateurs peuvent ajouter des événements historiques sur une timeline partagée et voir les ajouts des autres en direct."



===

La navigation entre les époques se fera via une montre accessible depuis le haut de l'écran : les périodes seront délimitées dans l'ordre sur le quadrant de la montre et la position de l'aiguille déterminera l'époque de destination.

Pour chaque époque, un petit jeu ou une petite fonctionnalité sera disponible.



Exemples de choses à faire sur le site:

* Placer des images de petites créatures en cliquant sur le site pour "peupler" l'époque. Les créatures ne cacheront pas l'information utile du site (les textes), seront différentes entre les époques, seront vu par les autres utilisateurs du site, et disparaitront après un certain temps. Elles apparaitront à une certaine position, à un angle aléatoire compris entre 45° et -45°.
* Petit jeu des oiseaux à esquiver sur les trois lignes.
* Eviter les météores qui tombent du ciel lors d'une grande extinction.
* Faire une sorte de test de personnalité via un formulaire (pour savoir à quelle catégorie d'animal tu correspondrais lors d'une époque de grande diversité par exemple)



Les mini-jeux auront un tableau des scores où les joueurs pourront comparer leur score avec celui des autres joueurs.

===



* **Rédiger une charte graphique sommaire** :

  * Couleurs, polices, style "professionnel" (utilisez des outils comme [Coolors](https://coolors.co/) ou [Google Fonts](https://fonts.google.com/)).



===

Couleurs : voir color\_charter.pdf

Polices : Cherry Bomb One (titres) ; Dangrek (corps)

===



* **Créer un repository GitHub** :

  * Initialisez un dépôt avec un `README.md` (noms des membres, description du projet, lien vers le code).
  * Utilisez des branches pour organiser le travail (ex : `main`, `dev`, `feature/login`).



===

Le repo GitHub comporte deux branches : une branche **main**, contenant le code abouti, avec le minimum de bugs, et une branche **dev** utile au développement de nouvelles fonctionnalités avant leur integration au programme principal.

===



### Outils

* **Gestion de projet** : [Trello](https://trello.com/), [Notion](https://www.notion.so/), ou un simple tableau Kanban sur GitHub.
* **Design** : [Figma](https://www.figma.com/) (gratuit) pour les maquettes, [Coolors](https://coolors.co/) pour les palettes de couleurs.
* **Collaboration** : [Discord](https://discord.com/), [Slack](https://slack.com/).

\---

## 2\. Phase de Conception (Semaine 1 - 4 jours)

### Objectifs

* Structurer l’architecture du projet.
* Créer les maquettes et le diagramme d’architecture.

### Étapes

* **Maquettes (wireframes)** :

  * Dessinez à la main ou avec Figma les pages principales (ex : page d’accueil, page de collaboration, formulaire).
* **Diagramme d’architecture** :

  * Schématisez les interactions entre le front (HTML/CSS/JS) et le back (PHP/AJAX).
  * Exemple : "L’utilisateur envoie un événement via un formulaire → PHP traite la requête → AJAX met à jour la timeline pour tous les utilisateurs."
  * Outils : [Draw.io](https://app.diagrams.net/) (gratuit), [Lucidchart](https://www.lucidchart.com/).
* **Arborescence des fichiers** :

  * Organisez vos dossiers (ex : `/css`, `/js`, `/php`, `/assets`).

\---

## 3\. Phase de Développement (Semaine 2-3 - 14 jours)

### Objectifs

* Implémenter les fonctionnalités une par une.
* Tester régulièrement.

### Étapes

* **Semaine 2** :

  * **Frontend (HTML/CSS)** :

    * Créer la structure des pages (ex : header, footer, sections).
    * Appliquer le style (flexbox, grid, responsive design).
  * **JavaScript** :

    * Gérer les événements (clics, soumission de formulaires).
    * Manipuler le DOM pour afficher/mettre à jour du contenu.
  * **PHP** :

    * Créer un formulaire simple (ex : ajout d’un événement).
    * Traiter les données côté serveur (fichiers ou base de données si autorisée).
* **Semaine 3** :

  * **AJAX** :

    * Envoyer/recevoir des données en arrière-plan (ex : mise à jour de la timeline sans recharger la page).
  * **Temps réel** :

    * Utiliser AJAX polling (requêtes périodiques) ou WebSockets (si ambitieux) pour synchroniser les actions entre utilisateurs.
  * **Sessions** :

    * Gérer les utilisateurs connectés (ex : pseudo, historique des actions).

### Outils

* **Éditeur** : [VSCode](https://code.visualstudio.com/) avec extensions (Live Server, PHP Intelephense, Prettier).
* **Test** : [XAMPP](https://www.apachefriends.org/) ou [WAMP](https://www.wampserver.com/) pour un serveur local PHP.
* **Debug** : Console navigateur (F12), [Postman](https://www.postman.com/) pour tester les requêtes AJAX.
* **Collaboration** : Git/GitHub (commits réguliers, messages clairs).

\---

## 4\. Phase de Finalisation (Semaine 4 - 7 jours)

### Objectifs

* Peaufiner le design et les fonctionnalités.
* Préparer le rendu.

### Étapes

* **Tests utilisateurs** :

  * Faites tester le site par des amis (vérifiez la clarté, l’accessibilité, les bugs).
* **Améliorations** :

  * Uniformisez le style, corrigez les bugs, optimisez les performances.
* **Documentation** :

  * Complétez le `README.md` (instructions d’installation, capture d’écran, fonctionnalités).
  * Finalisez le diagramme d’architecture (1 page max).
* **Préparation du rendu** :

  * Archivez le code (ZIP) ou vérifiez le lien GitHub.
  * Exportez le diagramme en PDF/PNG.

### Outils

* **Validation HTML/CSS** : [W3C Validator](https://validator.w3.org/).
* **Accessibilité** : [Wave Evaluation Tool](https://wave.webaim.org/).

\---

## 5\. Chronologie Résumée

|Semaine|Tâches principales|
|-|-|
|1|Brainstorming, maquettes, diagramme, repo GitHub, charte graphique.|
|2|Frontend (HTML/CSS/JS), PHP basique, formulaire.|
|3|AJAX, temps réel, sessions, tests.|
|4|Finalisation, tests utilisateurs, documentation, rendu.|

\---

## 6\. Conseils Généraux

* **Travaillez par petites étapes** : Validez chaque fonctionnalité avant de passer à la suivante.
* **Communiquez** : Faites des points réguliers avec votre binôme (ex : 2x/semaine).
* **Documentez** : Commentez votre code, notez les choix techniques dans le `README.md`.
* **Demandez de l’aide** : Utilisez les forums (Stack Overflow, [MDN Web Docs](https://developer.mozilla.org/)) ou votre enseignant.

\---

