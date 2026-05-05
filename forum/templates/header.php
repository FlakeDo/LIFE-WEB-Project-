<?php

// templates/header.php — En-tête HTML commun à toutes les pages

$page_title    = $page_title    ?? SITE_NAME;
$load_realtime = $load_realtime ?? false;
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Le polling interval est lu par realtime.js via cette balise meta -->
    <meta name="poll-interval" content="<?= POLL_INTERVAL_MS ?>">
    <title><?= htmlspecialchars($page_title) ?> — <?= SITE_NAME ?></title>
    <link rel="stylesheet" href="<?= BASE_URL ?>/css/style.css">
</head>
<body>


<header class="site-header">
    <a href="<?= BASE_URL ?>/index.php" class="site-logo"><?= SITE_NAME ?></a>

    <!-- Authentification : affichage conditionnel selon l'état de connexion -->
    <div class="auth-nav">
        <?php if (is_logged_in()): ?>
            <span class="user-badge">👤 <?= htmlspecialchars(current_username()) ?></span>
            <a href="<?= BASE_URL ?>/index.php?page=create_post" class="btn btn-primary">Nouvelle discussion</a>
            <a href="<?= BASE_URL ?>/index.php?page=logout" class="btn btn-secondary">Déconnexion</a>
        <?php else: ?>
            <a href="<?= BASE_URL ?>/index.php?page=login" class="btn btn-secondary">Connexion</a>
            <a href="<?= BASE_URL ?>/index.php?page=register" class="btn btn-primary">Inscription</a>
        <?php endif; ?>
    </div>

    <!-- Navigation par catégories -->
    <nav class="main-nav">
        <a href="<?= BASE_URL ?>/index.php" class="nav-link">Toutes</a>
        <?php foreach (CATEGORIES as $slug => $label): ?>
            <a href="<?= BASE_URL ?>/index.php?category=<?= urlencode($slug) ?>"
               class="nav-link <?= (($_GET['category'] ?? '') === $slug) ? 'active' : '' ?>">
                <?= htmlspecialchars($label) ?>
            </a>
        <?php endforeach; ?>
    </nav>    
</header>

<main class="site-main">

<!-- Injection de BASE_URL pour que les scripts JS puissent construire des URLs -->
<script>const BASE_URL = "<?= BASE_URL ?>";</script>
<script src="<?= BASE_URL ?>/js/forum.js"></script>
<?php if ($load_realtime): ?>
<script src="<?= BASE_URL ?>/js/realtime.js"></script>
<?php endif; ?>


