CREATE DATABASE IF NOT EXISTS forum_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE forum_db;

-- Utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username     VARCHAR(50)  NOT NULL UNIQUE,
    motdepasse   VARCHAR(255) NOT NULL,           
    created_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Discussions (posts)
CREATE TABLE IF NOT EXISTS posts (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED NOT NULL,
    title      VARCHAR(255) NOT NULL,
    body       TEXT         NOT NULL,
    category   VARCHAR(50)  NOT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Réponses (replies), avec support de l'imbrication via parent_id
CREATE TABLE IF NOT EXISTS replies (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id    INT UNSIGNED NOT NULL,
    user_id    INT UNSIGNED NOT NULL,
    parent_id  INT UNSIGNED NULL DEFAULT NULL,   -- NULL = réponse de premier niveau
    body       TEXT         NOT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id)   REFERENCES posts(id)   ON DELETE CASCADE,
    FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES replies(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Votes (un vote par utilisateur par cible)
CREATE TABLE IF NOT EXISTS votes (
    id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id   INT UNSIGNED NOT NULL,
    post_id   INT UNSIGNED NOT NULL,
    reply_id  INT UNSIGNED NULL DEFAULT NULL,   -- NULL = vote sur le post lui-même
    value     TINYINT      NOT NULL,            -- 1 (upvote) ou -1 (downvote)
    UNIQUE KEY unique_vote (user_id, post_id, reply_id),
    FOREIGN KEY (user_id)  REFERENCES users(id)   ON DELETE CASCADE,
    FOREIGN KEY (post_id)  REFERENCES posts(id)   ON DELETE CASCADE,
    FOREIGN KEY (reply_id) REFERENCES replies(id) ON DELETE CASCADE
) ENGINE=InnoDB;
