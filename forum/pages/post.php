<?php
// Page d'une discussion et ses réponses

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/posts.php';
require_once __DIR__ . '/../includes/replies.php';
require_once __DIR__ . '/../includes/votes.php';

// La session est déjà démarrée par index.php

// Récupérer l'ID du post depuis l'URL
$post_id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

if ($post_id <= 0) {
    header('Location: ' . BASE_URL . '/index.php');
    exit;
}

// Récupérer le post
$post = get_post($post_id);

if ($post === null) {
    http_response_code(404);
    $page_title = 'Discussion introuvable';
    require_once __DIR__ . '/../templates/header.php';
    echo '<p class="error">Cette discussion n\'existe pas ou a été supprimée.</p>';
    require_once __DIR__ . '/../templates/footer.php';
    exit;
}

// Récupérer toutes les réponses (depuis le début, since_id = 0)
$replies = get_replies($post_id, 0);

// Vote de l'utilisateur sur le post (pour affichage)
$my_post_vote = is_logged_in() ? user_vote(current_user_id(), 'post', $post_id) : 0;

$page_title    = htmlspecialchars($post['title']);
$load_realtime = true; // Active le polling AJAX pour les nouvelles réponses

require_once __DIR__ . '/../templates/header.php';
?>

<!-- data-post-id est lu par realtime.js pour savoir quelle discussion surveiller -->
<div class="post-thread" data-post-id="<?= (int) $post['id'] ?>">

    <!-- ── En-tête du post ── -->
    <article class="post-full">
        <div class="post-top">
            <!-- Contrôles de vote sur le post -->
            <div class="vote-controls" data-target="post" data-id="<?= (int) $post['id'] ?>">
                <button class="btn-upvote   <?= $my_post_vote ===  1 ? 'active' : '' ?>"
                        <?= !is_logged_in() ? 'disabled title="Connectez-vous pour voter"' : '' ?>>▲</button>
                <span class="score"><?= (int) $post['score'] ?></span>
                <button class="btn-downvote <?= $my_post_vote === -1 ? 'active' : '' ?>"
                        <?= !is_logged_in() ? 'disabled title="Connectez-vous pour voter"' : '' ?>>▼</button>
            </div>

            <div class="post-content">
                <h1 class="post-title"><?= htmlspecialchars($post['title']) ?></h1>

                <div class="post-meta">
                    <span class="category-badge">
                        <?= htmlspecialchars(CATEGORIES[$post['category']] ?? $post['category']) ?>
                    </span>
                    <span>par <strong><?= htmlspecialchars($post['author']) ?></strong></span>
                    <span><?= htmlspecialchars($post['created_at']) ?></span>
                </div>

                <div class="post-body">
                    <?= nl2br(htmlspecialchars($post['body'])) ?>
                </div>
            </div>
        </div>
    </article>

    <!-- ── Section des réponses ── -->
    <section class="replies-section">
        <h2><?= count($replies) ?> réponse(s)</h2>

        <!-- La liste des réponses — realtime.js y ajoute les nouvelles réponses -->
        <div id="reply-list">
            <?php foreach ($replies as $reply):
                $my_reply_vote = is_logged_in()
                    ? user_vote(current_user_id(), 'reply', (int) $reply['id'])
                    : 0;
            ?>
                <article class="reply-card" data-reply-id="<?= (int) $reply['id'] ?>">
                    <div class="vote-controls" data-target="reply" data-id="<?= (int) $reply['id'] ?>">
                        <button class="btn-upvote   <?= $my_reply_vote ===  1 ? 'active' : '' ?>"
                                <?= !is_logged_in() ? 'disabled title="Connectez-vous pour voter"' : '' ?>>▲</button>
                        <span class="score"><?= (int) $reply['score'] ?></span>
                        <button class="btn-downvote <?= $my_reply_vote === -1 ? 'active' : '' ?>"
                                <?= !is_logged_in() ? 'disabled title="Connectez-vous pour voter"' : '' ?>>▼</button>
                    </div>

                    <div class="reply-content">
                        <div class="reply-meta">
                            <strong><?= htmlspecialchars($reply['author']) ?></strong>
                            <time><?= htmlspecialchars($reply['created_at']) ?></time>
                            <?php if ($reply['parent_id']): ?>
                                <span class="reply-indent"><== réponse imbriquée</span>
                            <?php endif; ?>
                        </div>

                        <div class="reply-body">
                            <?= nl2br(htmlspecialchars($reply['body'])) ?>
                        </div>

                        <?php if (is_logged_in()): ?>
                            <button class="btn-reply-to btn-link"
                                    data-reply-id="<?= (int) $reply['id'] ?>">
                                Répondre
                            </button>
                        <?php endif; ?>
                    </div>
                </article>
            <?php endforeach; ?>
        </div><!-- #reply-list -->

        <!-- ── Formulaire d'ajout de réponse (utilisateurs connectés uniquement) ── -->
        <?php if (is_logged_in()): ?>
            <div class="reply-form">
                <h3>Ajouter une réponse</h3>

                <!-- Champ caché : ID du post -->
                <input type="hidden" id="reply-post-id" value="<?= (int) $post['id'] ?>">

                <!-- Champ caché : ID de la réponse parente (pour les réponses imbriquées) -->
                <input type="hidden" id="reply-parent-id" value="">

                <!-- Indicateur "Vous répondez à ..." -->
                <span id="replying-to-label" style="display:none;"></span>
                <button id="cancel-reply-to" style="display:none;">✕ Annuler</button>

                <textarea id="reply-body"
                          rows="4"
                          placeholder="Votre réponse..."></textarea>

                <button id="submit-reply" class="btn btn-primary">Envoyer</button>
            </div>
        <?php else: ?>
            <p class="login-prompt">
                <a href="<?= BASE_URL ?>/index.php?page=login">Connectez-vous</a>
                pour participer à la discussion.
            </p>
        <?php endif; ?>
    </section>

</div><!-- .post-thread -->

<?php require_once __DIR__ . '/../templates/footer.php'; ?>
