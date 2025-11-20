# Guide d'utilisation Postman

Ce guide vous explique comment tester l'API de formation entreprise avec Postman.

## 📥 Importation de la collection

1. Ouvrez Postman
2. Cliquez sur **Import** (en haut à gauche)
3. Sélectionnez le fichier `postman-collection.json`
4. La collection "Formation Entreprise API" apparaîtra dans votre workspace

## ⚙️ Configuration de l'environnement

### Variables d'environnement

La collection utilise des variables pour faciliter les tests :

- `base_url` : URL de base de l'API (par défaut: `http://localhost:3000`)
- `token` : Token JWT (sauvegardé automatiquement après login)
- `userId` : ID de l'utilisateur connecté
- `username` : Nom d'utilisateur (par défaut: `admin`)

### Configuration manuelle

1. Dans Postman, cliquez sur **Environments** (à gauche)
2. Créez un nouvel environnement ou utilisez "Globals"
3. Ajoutez les variables :
   - `base_url` = `http://localhost:3000`
   - `token` = (sera rempli automatiquement après login)
   - `username` = `admin` ou `apprenant`

## 🚀 Démarrage du serveur

Avant de tester, assurez-vous que le serveur est démarré :

```bash
npm run dev
```

Le serveur sera accessible sur `http://localhost:3000`

## 📋 Endpoints disponibles

### 🔐 Authentification

#### 1. Login - Admin
- **Méthode:** `POST`
- **URL:** `{{base_url}}/api/auth/login`
- **Body:**
```json
{
    "username": "admin",
    "password": "admin123"
}
```
- **Réponse:** Retourne un token JWT (sauvegardé automatiquement dans la variable `token`)

#### 2. Login - Apprenant
- **Méthode:** `POST`
- **URL:** `{{base_url}}/api/auth/login`
- **Body:**
```json
{
    "username": "apprenant",
    "password": "apprenant123"
}
```

#### 3. Register
- **Méthode:** `POST`
- **URL:** `{{base_url}}/api/auth/register`
- **Body:**
```json
{
    "username": "nouveau_user",
    "email": "nouveau@example.com",
    "password": "password123",
    "firstName": "Nouveau",
    "lastName": "Utilisateur"
}
```

#### 4. Get Current User (Me)
- **Méthode:** `GET`
- **URL:** `{{base_url}}/api/auth/me`
- **Headers:** `Authorization: Bearer {{token}}`
- **Description:** Retourne les informations de l'utilisateur connecté

### 👥 Utilisateurs

#### 1. Liste tous les utilisateurs (Admin uniquement)
- **Méthode:** `GET`
- **URL:** `{{base_url}}/api/users`
- **Headers:** `Authorization: Bearer {{token}}`
- **Description:** Retourne la liste de tous les utilisateurs (nécessite le rôle ADMIN)

#### 2. Créer un étudiant (Admin uniquement)
- **Méthode:** `POST`
- **URL:** `{{base_url}}/api/users`
- **Headers:** `Authorization: Bearer {{token}}`
- **Body:**
```json
{
    "username": "etudiant1",
    "email": "etudiant1@formation.com",
    "password": "password123",
    "firstName": "Étudiant",
    "lastName": "Un",
    "enrollmentDate": "2024-01-15T00:00:00.000Z"
}
```

#### 3. Get User by Username
- **Méthode:** `GET`
- **URL:** `{{base_url}}/api/users/{{username}}`
- **Headers:** `Authorization: Bearer {{token}}`
- **Description:** Retourne les informations d'un utilisateur spécifique

#### 4. Update User Profile
- **Méthode:** `PUT`
- **URL:** `{{base_url}}/api/users/{{username}}/profile`
- **Headers:** `Authorization: Bearer {{token}}`
- **Body:**
```json
{
    "firstName": "Jean",
    "lastName": "Dupont"
}
```

### 📊 Progression

#### 1. Mettre à jour la progression
- **Méthode:** `POST`
- **URL:** `{{base_url}}/api/progress`
- **Headers:** `Authorization: Bearer {{token}}`
- **Body:**
```json
{
    "moduleId": "module1",
    "lessonId": "lesson1",
    "completed": true,
    "timeSpent": 3600
}
```

#### 2. Get Progress (Current User)
- **Méthode:** `GET`
- **URL:** `{{base_url}}/api/progress`
- **Headers:** `Authorization: Bearer {{token}}`
- **Description:** Retourne toute la progression de l'utilisateur connecté

#### 3. Get Progress by Username (Admin)
- **Méthode:** `GET`
- **URL:** `{{base_url}}/api/progress?username={{username}}`
- **Headers:** `Authorization: Bearer {{token}}`
- **Description:** Retourne la progression d'un utilisateur spécifique (admin uniquement)

## 🔑 Authentification JWT

Tous les endpoints (sauf `/api/auth/login` et `/api/auth/register`) nécessitent un token JWT.

### Comment obtenir le token

1. Exécutez la requête **Login - Admin** ou **Login - Apprenant**
2. Le token sera automatiquement sauvegardé dans la variable `{{token}}`
3. Les autres requêtes utiliseront automatiquement ce token

### Utilisation manuelle du token

Si vous voulez utiliser le token manuellement, ajoutez ce header :

```
Authorization: Bearer <votre-token>
```

## 📝 Exemples de tests

### Scénario 1 : Connexion en tant qu'admin

1. Exécutez **Login - Admin**
2. Vérifiez que le token est sauvegardé (dans les variables d'environnement)
3. Exécutez **Get Current User (Me)** pour vérifier votre identité
4. Exécutez **Liste tous les utilisateurs** pour voir tous les utilisateurs

### Scénario 2 : Créer un nouvel étudiant (en tant qu'admin)

1. Connectez-vous en tant qu'admin (voir Scénario 1)
2. Exécutez **Créer un étudiant (Admin)**
3. Modifiez le body avec les informations du nouvel étudiant
4. Vérifiez la réponse pour confirmer la création

### Scénario 3 : Mettre à jour la progression (en tant qu'apprenant)

1. Exécutez **Login - Apprenant**
2. Exécutez **Mettre à jour la progression** avec les données d'une leçon
3. Exécutez **Get Progress (Current User)** pour voir votre progression

## ⚠️ Codes de statut HTTP

- `200` : Succès
- `201` : Créé avec succès
- `400` : Requête invalide (champs manquants ou invalides)
- `401` : Non autorisé (token manquant ou invalide)
- `403` : Accès refusé (permissions insuffisantes)
- `404` : Ressource non trouvée
- `409` : Conflit (utilisateur existe déjà)
- `500` : Erreur serveur

## 🐛 Dépannage

### Erreur 401 (Unauthorized)
- Vérifiez que vous avez bien exécuté une requête de login
- Vérifiez que le token est bien sauvegardé dans les variables
- Vérifiez que le header `Authorization: Bearer {{token}}` est présent

### Erreur 403 (Forbidden)
- Vérifiez que vous utilisez le bon compte (admin pour certaines routes)
- Certaines routes nécessitent le rôle ADMIN

### Le serveur ne répond pas
- Vérifiez que le serveur est démarré : `npm run dev`
- Vérifiez que l'URL de base est correcte : `http://localhost:3000`
- Vérifiez les logs du serveur pour voir les erreurs

## 📚 Comptes de test

Deux comptes sont disponibles pour les tests :

### Admin
- **Username:** `admin`
- **Email:** `admin@formation.com`
- **Password:** `admin123`
- **Role:** ADMIN

### Apprenant
- **Username:** `apprenant`
- **Email:** `apprenant@formation.com`
- **Password:** `apprenant123`
- **Role:** STUDENT

## 💡 Astuces

1. **Tests automatiques** : Les requêtes de login sauvegardent automatiquement le token dans les variables d'environnement
2. **Variables dynamiques** : Utilisez `{{username}}` dans les URLs pour tester avec différents utilisateurs
3. **Collection Runner** : Utilisez le Collection Runner pour exécuter tous les tests en séquence
4. **Environnements multiples** : Créez différents environnements pour dev, staging, production

