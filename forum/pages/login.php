<?php
// Page de connexion

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/auth.php';

// La session est déjà démarrée par index.php

// Si déjà connecté, rediriger vers l'accueil
if (is_logged_in()) {
    header('Location: ' . BASE_URL . '/index.php');
    exit;
}

$error = '';

// Traitement du formulaire soumis en POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($username === '' || $password === '') {
        $error = 'Veuillez remplir tous les champs.';
    } else {
        $result = login_user($username, $password);

        if (isset($result['ok'])) {
            // Connexion réussie → redirection vers l'accueil
            header('Location: ' . BASE_URL . '/index.php');
            exit;
        } else {
            $error = $result['error'];
        }
    }
}

$page_title = 'Connexion';
require_once __DIR__ . '/../templates/header.php';
?>

<div class="auth-page">
    <h1>Connexion</h1>

    <?php if ($error !== ''): ?>
        <div style="color: red;" class="alert alert-error"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>

    <!--
        Le formulaire est envoyé en POST vers la même URL.
        index.php recharge cette page, le bloc POST ci-dessus s'exécute.
    -->
    <form action="<?= BASE_URL ?>/index.php?page=login" method="post" class="auth-form">
        <div class="form-group">
            <label for="username">Pseudo</label>
            <input type="text"
                   id="username"
                   name="username"
                   value="<?= htmlspecialchars($_POST['username'] ?? '') ?>"
                   required
                   autocomplete="username"
                   placeholder="Votre pseudo">
        </div>

        <div class="form-group">
            <label for="password">Mot de passe</label>
            <input type="password"
                   id="password"
                   name="password"
                   required
                   autocomplete="current-password"
                   placeholder="Votre mot de passe">
        </div>

        <button type="submit" class="btn btn-primary btn-full">Se connecter</button>
    </form>

    <p class="auth-switch">
        Pas encore de compte ?
        <a href="<?= BASE_URL ?>/index.php?page=register">Inscrivez-vous</a>
    </p>
</div>

<?php require_once __DIR__ . '/../templates/footer.php'; ?>
