<?php
// Routeur principal du site
// Toutes les pages passent par ici via ?page=xxx.
// Si aucun paramètre n'est fourni, la page d'accueil est affichée.


require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/includes/auth.php';

start_session();

// Récupérer le paramètre de page depuis l'URL (défaut : 'home')
$page = $_GET['page'] ?? 'home';

// Liste des pages autorisées (whitelist)
$allowed_pages = ['home', 'post', 'create_post', 'login', 'register', 'logout'];

if (!in_array($page, $allowed_pages, true)) {
    http_response_code(404);
    require_once __DIR__ . '/templates/header.php';
    echo '<h1>404 — Page introuvable</h1>';
    require_once __DIR__ . '/templates/footer.php';
    exit;
}

// Charger le fichier de page correspondant
require __DIR__ . '/pages/' . $page . '.php';
