# Backend - Formation Création d'Entreprise

Backend Express.js avec Prisma et PostgreSQL pour la gestion de la base de données, l'authentification, les profils utilisateurs et la progression des leçons.

## Configuration

### 1. Variables d'environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
# Database (Supabase PostgreSQL)
# URL de connexion via pooling (pour l'application)
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

# URL de connexion directe (pour les migrations Prisma)
# IMPORTANT: Utilisez db.[PROJECT_REF].supabase.co pour la connexion directe, pas le pooler
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# Supabase (optionnel, si vous utilisez Supabase)
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# JWT Authentication
JWT_SECRET="your-very-secret-jwt-key-change-in-production"
# Générer une clé : openssl rand -base64 32
JWT_EXPIRES_IN="7d"

# Port du serveur Express (optionnel, par défaut 5000)
PORT=5000
```

### 2. Configuration Supabase

1. Créez un projet sur [Supabase](https://supabase.com)
2. Récupérez votre URL de projet et vos clés API dans les paramètres du projet
3. Pour la `DATABASE_URL`, utilisez la connection string PostgreSQL depuis les paramètres de base de données

### 3. Initialisation de la base de données

```bash
# Générer le client Prisma
npm run prisma:generate

# Créer les migrations
npm run prisma:migrate

# (Optionnel) Ouvrir Prisma Studio pour visualiser la base de données
npm run prisma:studio
```

## Scripts disponibles

- `npm run dev` - Démarrer le serveur de développement Express
- `npm run start` - Démarrer le serveur de production Express
- `npm run prisma:generate` - Générer le client Prisma
- `npm run prisma:migrate` - Créer et appliquer les migrations
- `npm run prisma:studio` - Ouvrir Prisma Studio
- `npm run prisma:push` - Pousser le schéma vers la base de données (dev uniquement)

## Structure du projet

```
formation-entreprise-backend/
├── routes/                     # Routes API Express
│   ├── auth.js               # Authentification
│   ├── users.js              # Gestion des utilisateurs
│   ├── progress.js           # Progression des leçons
│   └── admin.js              # Routes admin
├── lib/                       # Utilitaires
│   ├── db.js                 # Client Prisma
│   ├── prisma.js             # Client Prisma alternatif
│   └── supabase.ts           # Clients Supabase (optionnel)
├── middleware/                # Middleware Express
│   └── auth.js               # Middleware d'authentification
├── prisma/
│   └── schema.prisma          # Schéma de base de données
├── scripts/                   # Scripts utilitaires
└── server.js                  # Point d'entrée du serveur Express
```

## API Endpoints

### Authentification

- `POST /api/auth/login` - Connexion (username/email + password)
- `POST /api/auth/register` - Enregistrement d'un nouvel utilisateur
- `GET /api/auth/me` - Obtenir l'utilisateur actuel (nécessite token)

### Utilisateurs

- `GET /api/users` - Liste tous les utilisateurs (admin uniquement)
- `POST /api/users` - Créer un étudiant (admin uniquement)
- `GET /api/users/[username]` - Obtenir un utilisateur
- `PUT /api/users/[username]/profile` - Mettre à jour le profil

### Progression

- `POST /api/progress` - Mettre à jour la progression d'une leçon
- `GET /api/progress` - Obtenir toute la progression (optionnel: ?username=...)

Tous les endpoints (sauf login/register) nécessitent un token JWT dans le header :
```
Authorization: Bearer <token>
```

Pour plus de détails sur l'intégration avec le frontend, consultez [INTEGRATION-FRONTEND.md](./INTEGRATION-FRONTEND.md).

## Modèles de données

### User
- `id` (UUID)
- `username` (unique)
- `email` (unique)
- `password` (hashé avec bcrypt)
- `firstName`, `lastName`
- `role` (STUDENT | ADMIN)
- `enrollmentDate`, `firstLogin`, `lastLogin`, `lastActivity`
- `sessionCount`

### LessonProgress
- `id` (UUID)
- `userId` (relation vers User)
- `moduleId`, `lessonId`
- `completed` (boolean)
- `completedAt` (DateTime)
- `timeSpent` (Int, en secondes)

## Utilisation

### Client Prisma

```javascript
const { db } = require('./lib/db')

// Exemple d'utilisation
const users = await db.user.findMany()
```

### Authentification

```javascript
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// Hasher un mot de passe
const hashed = await bcrypt.hash('password123', 12)

// Vérifier un mot de passe
const isValid = await bcrypt.compare('password123', hashed)

// Générer un token JWT
const token = jwt.sign(
  { userId: '...', username: '...', role: '...' },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
)
```

### Client Supabase (optionnel)

```javascript
const { supabase, supabaseAdmin } = require('./lib/supabase')

// Client pour le frontend
const { data, error } = await supabase.from('table').select('*')

// Client admin pour le backend
if (supabaseAdmin) {
  const { data, error } = await supabaseAdmin.from('table').select('*')
}
```

## Créer un compte admin initial

Après avoir créé la base de données, vous pouvez créer un compte admin via Prisma Studio ou directement en base :

```sql
-- Note: Le mot de passe doit être hashé avec bcrypt
-- Utilisez un outil en ligne ou un script pour générer le hash
INSERT INTO users (id, username, email, password, role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin',
  'admin@example.com',
  '$2a$10$...', -- Hash bcrypt du mot de passe
  'ADMIN',
  NOW(),
  NOW()
);
```

Ou utilisez un script Node.js :

```javascript
const { db } = require('./lib/db')
const bcrypt = require('bcryptjs')

async function createAdmin() {
  const hashedPassword = await bcrypt.hash('admin2024', 12)
  await db.user.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })
}
```

