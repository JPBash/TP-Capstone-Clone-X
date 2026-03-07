-- 1. On nettoie tout pour éviter les erreurs de "déjà existant"
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS tweets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Création de la table users (avec ses colonnes, sans point-virgule au milieu !)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    bio VARCHAR(160),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Création de la table tweets
CREATE TABLE tweets (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content VARCHAR(280) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Insertion de tes données de test (pour tes captures d'écran)
INSERT INTO users (username, email, password, bio) VALUES
('JPBash', 'jpierrebash@example.com', '123456', 'Développeur du Clone X'),
('JoeT', 'joetshilombo@example.com', '123456', 'Passionné de tech');

INSERT INTO tweets (user_id, content) VALUES
(1, 'Ma base de données PostgreSQL est enfin prête ! 🚀'),
(2, 'Le prototype avance bien, bravo à l''équipe.');