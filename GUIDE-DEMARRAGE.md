# Guide de Démarrage Rapide

## 🚀 Installation et Configuration

### Étape 1 : Configuration Supabase

1. Allez sur [https://supabase.com](https://supabase.com) et créez un compte
2. Créez un nouveau projet
3. Dans les paramètres du projet → Database, récupérez :
   - L'URL de connexion PostgreSQL (Connection string)
   - L'URL du projet (Project URL)
   - La clé API anonyme (anon/public key)
   - La clé API service role (service_role key)

### Étape 2 : Configuration des variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
# Remplacez [PASSWORD] par le mot de passe de votre base de données Supabase
# Remplacez [PROJECT_REF] par la référence de votre projet Supabase
# Remplacez [REGION] par votre région (ex: eu-west-2)

# URL de connexion via pooling (pour l'application)
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# URL de connexion directe (pour les migrations Prisma)
# IMPORTANT: Utilisez db.[PROJECT_REF].supabase.co pour la connexion directe, pas le pooler
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# Remplacez [PROJECT_REF] par la référence de votre projet
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="votre-clé-anon-ici"
SUPABASE_SERVICE_ROLE_KEY="votre-clé-service-role-ici"

# JWT Secret pour l'authentification (générer avec : openssl rand -base64 32)
JWT_SECRET="votre-clé-jwt-secrète-ici"
JWT_EXPIRES_IN="7d"

# Port du serveur Express (optionnel, par défaut 5000)
PORT=5000
```

### Étape 3 : Initialisation de la base de données

```bash
# Générer le client Prisma
npm run prisma:generate

# Créer et appliquer la première migration
npm run prisma:migrate

# (Optionnel) Visualiser la base de données
npm run prisma:studio
```

Lors de la première migration, Prisma vous demandera un nom pour la migration. Utilisez par exemple : `init`

### Étape 4 : Créer un compte administrateur

```bash
# Créer un compte admin avec les valeurs par défaut
npm run create:admin

# Ou avec des paramètres personnalisés
npm run create:admin <username> <email> <password>
```

Exemple :
```bash
npm run create:admin admin admin@formation.com admin2024
```

### Étape 5 : Démarrer le serveur de développement

```bash
npm run dev
```

Le serveur sera accessible sur [http://localhost:5000](http://localhost:5000) (ou le port défini dans `PORT`)

Les endpoints API seront disponibles sur `http://localhost:5000/api`

## 🔐 Authentification

Le système utilise JWT (JSON Web Tokens) pour l'authentification. Après une connexion réussie, vous recevrez un token que vous devrez inclure dans les headers de vos requêtes :

```
Authorization: Bearer <votre-token>
```

Le token est valide pendant 7 jours par défaut.

## 📝 Modifier le schéma de base de données

1. Modifiez le fichier `prisma/schema.prisma`
2. Créez une nouvelle migration :
   ```bash
   npm run prisma:migrate
   ```
3. Le client Prisma sera automatiquement régénéré

## 🔗 Utilisation depuis le frontend

### Exemple de requête API

```javascript
// Depuis votre frontend (projet principal)
const response = await fetch('http://localhost:5000/api/users', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('authToken'),
  },
});

const data = await response.json();
console.log(data.users);
```

### Créer un utilisateur

```javascript
const response = await fetch('http://localhost:5000/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('authToken'),
  },
  body: JSON.stringify({
    username: 'user123',
    email: 'user@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
  }),
});

const data = await response.json();
console.log(data.user);
```

## 🛠️ Commandes utiles

- `npm run dev` - Démarrer le serveur de développement Express
- `npm run start` - Démarrer le serveur de production Express
- `npm run prisma:generate` - Régénérer le client Prisma
- `npm run prisma:migrate` - Créer/appliquer les migrations
- `npm run prisma:studio` - Ouvrir l'interface Prisma Studio
- `npm run prisma:push` - Pousser le schéma (dev uniquement, sans migrations)

## 📚 Ressources

- [Documentation Express.js](https://expressjs.com/)
- [Documentation Prisma](https://www.prisma.io/docs)
- [Documentation Supabase](https://supabase.com/docs)

