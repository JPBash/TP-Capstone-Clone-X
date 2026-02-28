# Documentation API - Clone X (JSON Server)

Base URL locale:

```txt
http://localhost:3000
```

## Ressources

### `GET /users`
Retourne la liste des utilisateurs.

### `GET /users?email=<email>`
Recherche utilisateur par email (utilisé pour la connexion).

### `POST /users`
Crée un nouvel utilisateur.

Exemple payload:

```json
{
  "name": "Jane Doe",
  "username": "@janedoe",
  "email": "jane@example.com",
  "password": "123456",
  "bio": "Frontend dev",
  "avatarColor": "#577590"
}
```

### `GET /tweets`
Retourne la timeline globale.

### `POST /tweets`
Ajoute un tweet.

Exemple payload:

```json
{
  "userId": 1,
  "content": "Hello world",
  "likes": 0,
  "createdAt": "2026-02-28T12:00:00.000Z"
}
```

### `PATCH /tweets/:id` et `DELETE /tweets/:id`
Disponibles avec JSON Server pour évolution future (édition/suppression).

## Authentification simulée

Aucune session serveur. La logique frontend:

1. Connexion: `GET /users?email=...`
2. Vérification locale du mot de passe
3. Sauvegarde utilisateur dans `localStorage`

## Contraintes frontend

- Formulaire tweet visible uniquement si utilisateur connecté.
- Profil accessible uniquement si connecté.
- Limite de 280 caractères côté client.
