<?php
// Création d'une nouvelle discussion

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/posts.php';

// La session est déjà démarrée par index.php

// Seuls les utilisateurs connectés peuvent créer une discussion
require_login();

$error = '';

// Traitement du formulaire soumis en POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title    = trim($_POST['title']    ?? '');
    $body     = trim($_POST['body']     ?? '');
    $category = trim($_POST['category'] ?? '');

    if ($title === '' || $body === '' || $category === '') {
        $error = 'Veuillez remplir tous les champs.';
    } else {
        try {
            // create_post() valide les données et insère en base
            $post_id = create_post(current_user_id(), $title, $body, $category);

            // Redirection vers la discussion nouvellement créée
            header('Location: ' . BASE_URL . '/index.php?page=post&id=' . $post_id);
            exit;
        } catch (InvalidArgumentException $e) {
            $error = $e->getMessage();
        }
    }
}

$page_title = 'Nouvelle discussion';
require_once __DIR__ . '/../templates/header.php';
?>

<div class="create-post-page">
    <h1>Nouvelle discussion</h1>

    <?php if ($error !== ''): ?>
        <div class="alert alert-error"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>

    <form action="<?= BASE_URL ?>/index.php?page=create_post" method="post" class="post-form">
        <div class="form-group">
            <label for="title">Titre (min. 3 caractères)</label>
            <input type="text"
                   id="title"
                   name="title"
                   value="<?= htmlspecialchars($_POST['title'] ?? '') ?>"
                   required
                   minlength="3"
                   placeholder="Titre de votre discussion">
        </div>

        <div class="form-group">
            <label for="category">Catégorie</label>
            <select id="category" name="category" required>
                <option value="">-- Choisissez une catégorie --</option>
                <?php foreach (CATEGORIES as $slug => $label): ?>
                    <option value="<?= htmlspecialchars($slug) ?>"
                            <?= (($_POST['category'] ?? '') === $slug) ? 'selected' : '' ?>>
                        <?= htmlspecialchars($label) ?>
                    </option>
                <?php endforeach; ?>
            </select>
        </div>

        <div class="form-group">
            <label for="body">Message (min. 10 caractères)</label>
            <textarea id="body"
                      name="body"
                      rows="8"
                      required
                      minlength="10"
                      placeholder="Rédigez votre message..."><?= htmlspecialchars($_POST['body'] ?? '') ?></textarea>
        </div>

        <button type="submit" class="btn btn-primary">Publier la discussion</button>
        <a href="<?= BASE_URL ?>/index.php" class="btn btn-secondary">Annuler</a>
    </form>
</div>

<?php require_once __DIR__ . '/../templates/footer.php'; ?>
