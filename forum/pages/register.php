<?php
// Page d'inscription

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/auth.php';

// La session est déjà démarrée par index.php

// Si déjà connecté, rediriger vers l'accueil
if (is_logged_in()) {
    header('Location: ' . BASE_URL . '/index.php');
    exit;
}

$error   = '';
$success = '';

// Traitement du formulaire soumis en POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username  = trim($_POST['username']  ?? '');
    $password  = $_POST['password']       ?? '';
    $password2 = $_POST['password2']      ?? '';

    if ($username === '' || $password === '' || $password2 === '') {
        $error = 'Veuillez remplir tous les champs.';
    } elseif ($password !== $password2) {
        $error = 'Les mots de passe ne correspondent pas.';
    } else {
        $result = register_user($username, $password);

        if (isset($result['ok'])) {
            // Inscription réussie
            login_user($username, $password);
            header('Location: ' . BASE_URL . '/index.php');
            exit;
        } else {
            $error = $result['error'];
        }
    }
}

$page_title = 'Inscription';
require_once __DIR__ . '/../templates/header.php';
?>

<div class="auth-page">
    <h1>Créer un compte</h1>

    <?php if ($error !== ''): ?>
        <div class="alert alert-error"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>

    <form action="<?= BASE_URL ?>/index.php?page=register" method="post" class="auth-form">
        <div class="form-group">
            <label for="username">Pseudo (min. 3 caractères)</label>
            <input type="text"
                   id="username"
                   name="username"
                   value="<?= htmlspecialchars($_POST['username'] ?? '') ?>"
                   required
                   minlength="3"
                   autocomplete="username"
                   placeholder="Choisissez un pseudo">
        </div>

        <div class="form-group">
            <label for="password">Mot de passe (min. 6 caractères)</label>
            <input type="password"
                   id="password"
                   name="password"
                   required
                   minlength="6"
                   autocomplete="new-password"
                   placeholder="Choisissez un mot de passe">
        </div>

        <div class="form-group">
            <label for="password2">Confirmer le mot de passe</label>
            <input type="password"
                   id="password2"
                   name="password2"
                   required
                   minlength="6"
                   autocomplete="new-password"
                   placeholder="Répétez le mot de passe">
        </div>

        <button type="submit" class="btn btn-primary btn-full">Créer mon compte</button>
    </form>

    <p class="auth-switch">
        Déjà un compte ?
        <a href="<?= BASE_URL ?>/index.php?page=login">Se connecter</a>
    </p>
</div>

<?php require_once __DIR__ . '/../templates/footer.php'; ?>
