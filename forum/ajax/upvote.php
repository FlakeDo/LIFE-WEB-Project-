<?php
// ajax/upvote.php enregistre un vote, retourne le nouveau score

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/votes.php';

start_session();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée.']);
    exit;
}

// Seuls les utilisateurs connectés peuvent voter
if (!is_logged_in()) {
    http_response_code(401);
    echo json_encode(['error' => 'Vous devez être connecté pour voter.']);
    exit;
}

$target    = $_POST['target']    ?? '';
$target_id = isset($_POST['target_id']) ? (int) $_POST['target_id'] : 0;
$value     = isset($_POST['value'])     ? (int) $_POST['value']     : 0;

try {
    $new_score = cast_vote(current_user_id(), $target, $target_id, $value);
    echo json_encode(['ok' => true, 'score' => $new_score]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}
