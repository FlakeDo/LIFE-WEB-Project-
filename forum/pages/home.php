<?php
// Page d'accueil : liste des discussions

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/posts.php';

// La session est déjà démarrée par index.php

// Filtre par catégorie ('' = toutes)
$category = $_GET['category'] ?? '';

// Vérification que la catégorie est valide (sinon on ignore le filtre)
if ($category !== '' && !array_key_exists($category, CATEGORIES)) {
    $category = '';
}

// Récupérer les discussions depuis la base de données
$posts = get_posts($category);

$page_title = $category !== '' ? htmlspecialchars(CATEGORIES[$category]) : 'Toutes les discussions';

require_once __DIR__ . '/../templates/header.php';
?>

<section class="feed">
    <div class="feed-header">
        <h1><?= $page_title ?></h1>

        <?php if (is_logged_in()): ?>
            <a href="<?= BASE_URL ?>/index.php?page=create_post" class="btn btn-primary">
                + Nouvelle discussion
            </a>
        <?php endif; ?>
    </div>

    <!-- Filtres de catégories -->
    <div class="category-filters">
        <a href="<?= BASE_URL ?>/index.php" class="chip <?= $category === '' ? 'active' : '' ?>">
            Toutes
        </a>
        <?php foreach (CATEGORIES as $slug => $label): ?>
            <a href="<?= BASE_URL ?>/index.php?category=<?= urlencode($slug) ?>"
               class="chip <?= $category === $slug ? 'active' : '' ?>">
                <?= htmlspecialchars($label) ?>
            </a>
        <?php endforeach; ?>
    </div>

    <?php if (empty($posts)): ?>
        <p class="empty-state">Aucune discussion pour le moment. Soyez le premier à en créer une !</p>
    <?php else: ?>
        <ul class="post-list">
            <?php foreach ($posts as $post): ?>
                <li class="post-card">
                    <!-- Score de votes -->
                    <div class="post-score">
                        <span class="score-number"><?= (int) $post['score'] ?></span>
                        <span class="score-label">pts</span>
                    </div>

                    <!-- Contenu de la carte -->
                    <div class="post-info">
                        <a href="<?= BASE_URL ?>/index.php?page=post&id=<?= (int) $post['id'] ?>"
                           class="post-title">
                            <?= htmlspecialchars($post['title']) ?>
                        </a>

                        <div class="post-meta">
                            <span class="category-badge">
                                <?= htmlspecialchars(CATEGORIES[$post['category']] ?? $post['category']) ?>
                            </span>
                            <span>par <strong><?= htmlspecialchars($post['author']) ?></strong></span>
                            <span><?= htmlspecialchars($post['created_at']) ?></span>
                            <span><?= (int) $post['reply_count'] ?> réponse(s)</span>
                        </div>
                    </div>
                </li>
            <?php endforeach; ?>
        </ul>
    <?php endif; ?>
</section>

<?php require_once __DIR__ . '/../templates/footer.php'; ?>
