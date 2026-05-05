<?php
// config/config.php — Constantes globales et connexion à la base de données
// Ce fichier doit être inclus EN PREMIER dans chaque page PHP.

// -- Nom du site --
define('SITE_NAME', 'Forum');

// -- URL de base du site (sans slash final) --
// Adaptez cette valeur à votre serveur local.
define('BASE_URL', 'http://localhost/projet-web');

// -- Paramètres de connexion à la base de données --
define('DB_HOST',    'localhost');
define('DB_NAME',    'forum_db');
define('DB_USER',    'max');
define('DB_PASS',    'Azerty77');
define('DB_CHARSET', 'utf8mb4');

// -- Catégories (définies par l'administrateur, non modifiables par les utilisateurs) --
define('CATEGORIES', [
    'proterozoique' => 'Protérozoïque',
    'paleozoique'   => 'Paléozoïque',
    'mesozoique'    => 'Mésozoïque',
    //'new'    => 'New',
]);

// -- Durée de la session en secondes (1 heure) --
define('SESSION_LIFETIME', 3600);

// -- Intervalle de polling AJAX en millisecondes --
define('POLL_INTERVAL_MS', 3000);



// get_db() — Retourne une instance PDO (connexion à la BDD)
// appeler get_db() partout où on a besoin de la base.

function get_db(): PDO
{
    static $pdo = null; // static = la variable est conservée entre les appels

    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST
             . ';dbname='    . DB_NAME
             . ';charset='   . DB_CHARSET;

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,  // Lance des exceptions en cas d'erreur
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,        // Retourne des tableaux associatifs
            PDO::ATTR_EMULATE_PREPARES   => false,                   // Vraies requêtes préparées
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            die('<h1>Erreur de connexion à la base de données.</h1>');
        }
    }

    return $pdo;
}



// start_session() démarre la session PHP de manière sécurisée
// a appeler une seule fois en haut de chaque page.
function start_session(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params([
            'lifetime' => SESSION_LIFETIME,
            'httponly' => true,   // Inaccessible au JavaScript (protection XSS)
            'samesite' => 'Lax', // Protection CSRF basique
        ]);
        session_start();
    }
}
