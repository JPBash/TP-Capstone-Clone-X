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

