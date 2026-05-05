<?php
// Fonctions pour les discussions (posts)
// Dépend de : config/config.php


// Recuperer la liste des discussions
// Paramètres :
//   $category filtre par catégorie ('' = toutes)
//   $limit    nombre maximum de résultats
//   $offset   décalage pour la pagination

function get_posts(string $category = '', int $limit = 20, int $offset = 0): array
{
    $db  = get_db();
    $sql = 'SELECT p.id, p.title, p.category, p.created_at,
                   u.username AS author,
                   (SELECT COUNT(*) FROM replies r WHERE r.post_id = p.id) AS reply_count,
                   (SELECT COALESCE(SUM(value), 0) FROM votes v WHERE v.post_id = p.id AND v.reply_id IS NULL) AS score
            FROM posts p
            JOIN users u ON u.id = p.user_id';

    $params = [];

    if ($category !== '' && array_key_exists($category, CATEGORIES)) {
        $sql     .= ' WHERE p.category = ?';
        $params[] = $category;
    }

    $sql .= ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    $params[] = $limit;
    $params[] = $offset;

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}


// Récupère une discussion par son ID
// Retourne un tableau associatif, ou null si introuvable.
function get_post(int $id): ?array
{
    $db   = get_db();
    $stmt = $db->prepare(
        'SELECT p.*, u.username AS author,
                (SELECT COALESCE(SUM(value), 0) FROM votes v WHERE v.post_id = p.id AND v.reply_id IS NULL) AS score
         FROM posts p
         JOIN users u ON u.id = p.user_id
         WHERE p.id = ?'
    );
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ?: null;
}



// Crée une nouvelle discussion
// Retourne l'ID de la nouvelle discussion.
// Lève une exception si les données sont invalides.
function create_post(int $user_id, string $title, string $body, string $category): int
{
    if (!array_key_exists($category, CATEGORIES)) {
        throw new InvalidArgumentException('Catégorie invalide.');
    }

    $title = trim($title);
    $body  = trim($body);

    if (strlen($title) < 3) {
        throw new InvalidArgumentException('Le titre doit faire au moins 3 caractères.');
    }
    if (strlen($body) < 10) {
        throw new InvalidArgumentException('Le message doit faire au moins 10 caractères.');
    }

    $db   = get_db();
    $stmt = $db->prepare(
        'INSERT INTO posts (user_id, title, body, category) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$user_id, $title, $body, $category]);
    return (int) $db->lastInsertId();
}


// Supprime une discussion (auteur uniquement)
// Retourne true si supprimé, false si non trouvé ou non autorisé.
function delete_post(int $post_id, int $requesting_user_id): bool
{
    $db   = get_db();
    $stmt = $db->prepare('SELECT user_id FROM posts WHERE id = ?');
    $stmt->execute([$post_id]);
    $post = $stmt->fetch();

    if (!$post || (int) $post['user_id'] !== $requesting_user_id) {
        return false;
    }

    $db->prepare('DELETE FROM posts WHERE id = ?')->execute([$post_id]);
    return true;
}