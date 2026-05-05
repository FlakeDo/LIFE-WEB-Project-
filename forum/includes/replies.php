<?php
// Fonctions pour les réponses (replies)


// Récupère les réponses d'une discussion
// Retourne un tableau de réponses avec auteur et score.
function get_replies(int $post_id, int $since_id = 0): array
{
    $db   = get_db();
    $stmt = $db->prepare(
        'SELECT r.id, r.body, r.created_at, r.parent_id,
                u.username AS author,
                (SELECT COALESCE(SUM(value), 0) FROM votes v WHERE v.reply_id = r.id) AS score
         FROM replies r
         JOIN users u ON u.id = r.user_id
         WHERE r.post_id = ? AND r.id > ?
         ORDER BY r.created_at ASC'
    );
    $stmt->execute([$post_id, $since_id]);
    return $stmt->fetchAll();
}


// Ajoute une réponse à une discussion
// Retourne l'ID de la nouvelle réponse.
// Lève une exception si les données sont invalides.

function add_reply(int $post_id, int $user_id, string $body, ?int $parent_id = null): int
{
    $body = trim($body);

    if (strlen($body) < 1) {
        throw new InvalidArgumentException('La réponse est vide.');
    }

    $db    = get_db();

    // Vérifier que la discussion existe bien
    $check = $db->prepare('SELECT id FROM posts WHERE id = ?');
    $check->execute([$post_id]);
    if (!$check->fetch()) {
        throw new InvalidArgumentException('Discussion introuvable.');
    }

    $stmt = $db->prepare(
        'INSERT INTO replies (post_id, user_id, parent_id, body) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$post_id, $user_id, $parent_id, $body]);
    return (int) $db->lastInsertId();
}
