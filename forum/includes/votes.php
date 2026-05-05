<?php

// Fonctions pour les votes (upvote / downvote)
// votes(id, user_id, post_id, reply_id NULLABLE, value TINYINT)
// UNIQUE KEY sur (user_id, post_id, reply_id)

// Enregistre ou annule un vote
// Retourne le nouveau score total de la cible.

function cast_vote(int $user_id, string $target, int $target_id, int $value): int
{
    if (!in_array($value, [1, -1], true)) {
        throw new InvalidArgumentException('Valeur de vote invalide.');
    }
    if (!in_array($target, ['post', 'reply'], true)) {
        throw new InvalidArgumentException('Cible invalide.');
    }

    $db = get_db();

    // Déterminer post_id et reply_id selon la cible
    if ($target === 'post') {
        $post_id_val  = $target_id;
        $reply_id_val = null;
    } else {
        // Pour un vote sur une réponse, on a besoin du post_id (clé étrangère)
        $stmt = $db->prepare('SELECT post_id FROM replies WHERE id = ?');
        $stmt->execute([$target_id]);
        $row = $stmt->fetch();
        if (!$row) {
            throw new InvalidArgumentException('Réponse introuvable.');
        }
        $post_id_val  = (int) $row['post_id'];
        $reply_id_val = $target_id;
    }

    // Chercher un vote existant (<=> est l'opérateur d'égalité NULL-safe en MySQL)
    $stmt = $db->prepare(
        'SELECT id, value FROM votes
         WHERE user_id = ? AND post_id = ? AND reply_id <=> ?'
    );
    $stmt->execute([$user_id, $post_id_val, $reply_id_val]);
    $existing = $stmt->fetch();

    if ($existing) {
        if ((int) $existing['value'] === $value) {
            // Même vote → on annule (toggle)
            $db->prepare('DELETE FROM votes WHERE id = ?')->execute([$existing['id']]);
        } else {
            // Vote différent → on met à jour
            $db->prepare('UPDATE votes SET value = ? WHERE id = ?')
               ->execute([$value, $existing['id']]);
        }
    } else {
        // Nouveau vote → on insère
        $db->prepare(
            'INSERT INTO votes (user_id, post_id, reply_id, value) VALUES (?, ?, ?, ?)'
        )->execute([$user_id, $post_id_val, $reply_id_val, $value]);
    }

    // Retourner le score mis à jour
    return get_score($target, $target_id, $post_id_val);
}


// Retourner le score actuel d'un post ou d'une réponse
function get_score(string $target, int $target_id, ?int $post_id = null): int
{
    $db = get_db();

    if ($target === 'post') {
        $stmt = $db->prepare(
            'SELECT COALESCE(SUM(value), 0) AS score FROM votes
             WHERE post_id = ? AND reply_id IS NULL'
        );
        $stmt->execute([$target_id]);
    } else {
        $stmt = $db->prepare(
            'SELECT COALESCE(SUM(value), 0) AS score FROM votes WHERE reply_id = ?'
        );
        $stmt->execute([$target_id]);
    }

    return (int) $stmt->fetchColumn();
}

// retourne le vote de l'utilisateur sur une cible -1, 0 ou 1.

function user_vote(int $user_id, string $target, int $target_id): int
{
    $db = get_db();

    if ($target === 'post') {
        $stmt = $db->prepare(
            'SELECT value FROM votes WHERE user_id = ? AND post_id = ? AND reply_id IS NULL'
        );
        $stmt->execute([$user_id, $target_id]);
    } else {
        $stmt = $db->prepare(
            'SELECT value FROM votes WHERE user_id = ? AND reply_id = ?'
        );
        $stmt->execute([$user_id, $target_id]);
    }

    return (int) ($stmt->fetchColumn() ?: 0);
}
