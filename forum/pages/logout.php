<?php
// Déconnexion de l'utilisateur

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/auth.php';

// La session est déjà démarrée par index.php

logout_user();

// Redirection vers la page d'accueil après déconnexion
header('Location: ' . BASE_URL . '/index.php');
exit;
