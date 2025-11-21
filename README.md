# Backend API - Formation Entreprise

Backend Express.js avec Prisma et PostgreSQL pour la gestion de la base de données, l'authentification, les profils utilisateurs et la progression des leçons.

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

The server will start on `http://localhost:5000` (or the port specified in the `PORT` environment variable).

All API endpoints are available under `/api/*`.

## Configuration

See [README-BACKEND.md](./README-BACKEND.md) for detailed configuration instructions.

## API Endpoints

- `/api/auth/*` - Authentication routes
- `/api/users/*` - User management routes
- `/api/progress/*` - Progress tracking routes
- `/api/admin/*` - Admin routes

For more details, see [GUIDE-POSTMAN.md](./GUIDE-POSTMAN.md) and [INTEGRATION-FRONTEND.md](./INTEGRATION-FRONTEND.md).
