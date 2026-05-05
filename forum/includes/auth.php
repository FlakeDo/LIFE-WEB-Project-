<?php
// includes/auth.php fonctions d'authentification
// dépend deconfig/config.php (toujours inclus en premier)

// is_logged_in() — Vérifie si l'utilisateur est connecté
// retourne true si une session utilisateur est active.

function is_logged_in(): bool
{
    return isset($_SESSION['user_id']);
}

// Rediriger vers la page de connexion si non connecté
// a placer en haut de toute page qui nécessite une connexion.

function require_login(): void
{
    if (!is_logged_in()) {
        header('Location: ' . BASE_URL . '/index.php?page=login');
        exit;
    }
}

// Retourner l'ID de l'utilisateur connecté
// retourne null si personne n'est connecté.

function current_user_id(): ?int
{
    return isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : null;
}


// Retourner le pseudo de l'utilisateur connecté
// retourne null si personne n'est connecté.

function current_username(): ?string
{
    return $_SESSION['username'] ?? null;
}

// Inscrire un nouvel utilisateur

function register_user(string $username, string $password): array
{
    // Validation des longueurs
    if (strlen($username) < 3) {
        return ['error' => 'Le nom d\'utilisateur doit faire au moins 3 caractères.'];
    }
    if (strlen($password) < 6) {
        return ['error' => 'Le mot de passe doit faire au moins 6 caractères.'];
    }

    $db = get_db();

    // Vérification de l'unicité du pseudo
    $stmt = $db->prepare('SELECT id FROM users WHERE username = ?');
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        return ['error' => 'Ce nom d\'utilisateur est déjà pris.'];
    }

    // Hachage du mot de passe
    $hash = password_hash($password, PASSWORD_BCRYPT);

    // Insertion en base 
    $stmt = $db->prepare('INSERT INTO users (username, motdepasse) VALUES (?, ?)');
    $stmt->execute([$username, $hash]);

    return ['ok' => true];
}


// Connecter un utilisateur existant

function login_user(string $username, string $password): array
{
    $db   = get_db();

    // Récupère le hash depuis la colonne "motdepasse"
    $stmt = $db->prepare('SELECT id, motdepasse FROM users WHERE username = ?');
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    // comparer le mot de passe en clair avec le hash
    if (!$user || !password_verify($password, $user['motdepasse'])) {
        return ['error' => 'Identifiants incorrects.'];
    }

    // Régénère l'ID de session pour éviter la fixation de session
    session_regenerate_id(true);

    $_SESSION['user_id']  = (int) $user['id'];
    $_SESSION['username'] = $username;

    return ['ok' => true];
}


// Deconnecter l'utilisateur courant

function logout_user(): void
{
    $_SESSION = [];
    session_destroy();
}
