<?php

// ajax/add_reply.php reçoit une nouvelle réponse, retourne du JSON

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/replies.php';

start_session();

header('Content-Type: application/json');

// Refuser toute méthode autre que POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée.']);
    exit;
}

// Vérifier que l'utilisateur est connecté
if (!is_logged_in()) {
    http_response_code(401);
    echo json_encode(['error' => 'Vous devez être connecté pour répondre.']);
    exit;
}

$post_id   = isset($_POST['post_id'])   ? (int)  $_POST['post_id']   : 0;
$body      = isset($_POST['body'])      ? trim($_POST['body'])        : '';
$parent_id = isset($_POST['parent_id']) ? (int)  $_POST['parent_id'] : null;

if ($post_id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'post_id invalide.']);
    exit;
}

if ($body === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Le corps de la réponse est vide.']);
    exit;
}

try {
    $reply_id = add_reply($post_id, current_user_id(), $body, $parent_id ?: null);

    // Retourner la nouvelle réponse pour que JS l'affiche immédiatement
    echo json_encode([
        'ok'    => true,
        'reply' => [
            'id'         => $reply_id,
            'body'       => $body,
            'author'     => current_username(),
            'parent_id'  => $parent_id ?: null,
            'created_at' => date('Y-m-d H:i:s'),
            'score'      => 0,
        ]
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}
