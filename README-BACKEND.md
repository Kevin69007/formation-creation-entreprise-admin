# Backend - Formation Création d'Entreprise

Backend Next.js avec Prisma et Supabase pour la gestion de la base de données, l'authentification, les profils utilisateurs et la progression des leçons.

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

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# JWT Authentication
JWT_SECRET="your-very-secret-jwt-key-change-in-production"
# Générer une clé : openssl rand -base64 32

# Next.js
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
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

- `npm run dev` - Démarrer le serveur de développement
- `npm run build` - Construire l'application pour la production
- `npm run start` - Démarrer le serveur de production
- `npm run prisma:generate` - Générer le client Prisma
- `npm run prisma:migrate` - Créer et appliquer les migrations
- `npm run prisma:studio` - Ouvrir Prisma Studio
- `npm run prisma:push` - Pousser le schéma vers la base de données (dev uniquement)

## Structure du projet

```
formation-entreprise-backend/
├── app/
│   └── api/                    # Routes API
│       ├── auth/               # Authentification
│       │   ├── login/          # POST - Connexion
│       │   ├── register/       # POST - Enregistrement
│       │   └── me/             # GET - Utilisateur actuel
│       ├── users/              # Gestion des utilisateurs
│       │   ├── [username]/     # GET - Profil utilisateur
│       │   └── [username]/profile/  # PUT - Mettre à jour profil
│       ├── progress/           # Progression des leçons
│       └── users/              # GET/POST - Liste/Créer (admin)
├── lib/                        # Utilitaires
│   ├── prisma.ts              # Client Prisma
│   ├── supabase.ts            # Clients Supabase
│   ├── auth.ts                # Utilitaires JWT et authentification
│   └── middleware.ts          # Middleware d'authentification
├── prisma/
│   └── schema.prisma          # Schéma de base de données
└── public/                     # Fichiers statiques
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

```typescript
import { prisma } from '@/lib/prisma'

// Exemple d'utilisation
const users = await prisma.user.findMany()
```

### Authentification

```typescript
import { hashPassword, verifyPassword, generateToken } from '@/lib/auth'

// Hasher un mot de passe
const hashed = await hashPassword('password123')

// Vérifier un mot de passe
const isValid = await verifyPassword('password123', hashed)

// Générer un token JWT
const token = generateToken({ userId: '...', username: '...', role: '...' })
```

### Client Supabase

```typescript
import { supabase, supabaseAdmin } from '@/lib/supabase'

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

```typescript
import { prisma } from './lib/prisma'
import { hashPassword } from './lib/auth'

async function createAdmin() {
  const hashedPassword = await hashPassword('admin2024')
  await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })
}
```

