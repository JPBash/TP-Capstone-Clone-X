<<<<<<< HEAD
# TP-Capstone-Clone-X
=======
# Capstone 1 - Clone X (Frontend) 

Prototype frontend inspiré de X/Twitter, réalisé en HTML/CSS/JavaScript vanilla avec JSON Server comme backend simulé.

## Fonctionnalités livrées

- Authentification simulée (inscription + connexion) via `/users`
- Persistance de session avec `localStorage`
- Timeline dynamique via `/tweets`
- Publication de tweet (280 caractères max)
- Profil utilisateur protégé (infos + tweets personnels)
- Bonus: like/unlike local, toggle thème, recherche dans le feed

## Lancer le projet

### 1) Démarrer JSON Server

```bash
npx json-server --watch db.json --port 3000
```

### 2) Servir le frontend

Depuis le dossier projet, lancez un serveur statique (au choix):

```bash
npx serve .
```

Puis ouvrez l'URL affichée (ex: `http://localhost:3001`).

## Comptes de test

- `jpierrebash@example.com` / `123456`
- `joetshilombo@example.com` / `123456`
- `akocikomola@example.com` / `123456`

## Structure

- `index.html`: structure UI + templates des vues
- `styles.css`: styles globaux inspirés de la maquette
- `app.js`: logique DOM, auth, timeline, profil, filtres
- `db.json`: données JSON Server (users/tweets)

## Déploiement

Déployez le frontend sur Netlify / Vercel / GitHub Pages.

---

## 🗄️ Partie 2 : Base de données (PostgreSQL)

Le projet inclut désormais une modélisation complète de la base de données relationnelle.

### Structure de la base
- **users** : Profils utilisateurs (id, pseudo, email, password, bio, avatar).
- **tweets** : Publications (id, user_id, content, created_at).
- **likes** : Gestion des réactions (Table de liaison N:N).
- **follows** : Abonnements entre utilisateurs (Relation réflexive).

### Modélisation (Draw.io)
Retrouvez le dictionnaire de données, le MCD et le MLD ici : 
👉 [Lien vers mon fichier Draw.io : https://drive.google.com/file/d/1XB1z27qfOVCN8GJz3nM4uN5ZtouI1tDW/view?usp=sharing ]

### Instructions d'exécution
1. Ouvrez **pgAdmin 4**.
2. Créez une nouvelle base de données nommée `clone_x`.
3. Ouvrez le **Query Tool** sur cette base.
4. Copiez le contenu du fichier `database.sql` situé à la racine du projet.
5. Appuyez sur **F5** pour créer les tables et insérer les données de test.
6. Pour vérifier, exécutez : `SELECT * FROM users;`

### ✅ Validation PostgreSQL (Captures d'écran)

**Exécution du script :**
![Succès SQL](screenshots/query_success.png)

**Données insérées (Table Users) :**
![Table Users](screenshots/select_users.png)