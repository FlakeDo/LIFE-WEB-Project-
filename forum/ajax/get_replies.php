<?php
// ajax/get_replies.php Retourne les nouvelles réponses en JSON

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/replies.php';

start_session();

header('Content-Type: application/json');

$post_id  = isset($_GET['post_id'])  ? (int) $_GET['post_id']  : 0;
$since_id = isset($_GET['since_id']) ? (int) $_GET['since_id'] : 0;

if ($post_id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'post_id manquant.']);
    exit;
}

$replies = get_replies($post_id, $since_id);

// Le tableau est retourné directement JS itère dessus pour construire le HTML
echo json_encode(['replies' => $replies]);
