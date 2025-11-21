const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import des routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const progressRoutes = require('./routes/progress');

const app = express();

// 🔐 Sécurité HTTP headers (configuré pour permettre les connexions de développement)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// 🌍 CORS : autoriser le frontend
const allowedOrigins = [
  'http://localhost',
  'http://localhost:3000',
  'http://127.0.0.1:5500', // si tu ouvres le HTML avec Live Server de VS Code
  'https://formation-creation-entreprise.vercel.app', // ← ton futur frontend (ex Vercel)
  process.env.FRONTEND_URL // ← si défini dans le .env (optionnel)
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS bloqué pour l'origine : ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// 🚨 Protection contre les abus (Rate limiting)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // Limite chaque IP à 100 requêtes par 15 min
});
app.use(limiter);

// 📦 Parse les requêtes JSON
app.use(express.json());

// 🏠 Route racine
app.get('/', (req, res) => {
  res.json({
    message: 'API Formation Entreprise Backend',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        verify: 'GET /api/auth/verify'
      },
      users: '/api/users',
      admin: '/api/admin'
    },
    timestamp: new Date().toISOString()
  });
});

// 📁 Définition des routes principales
app.use('/api/auth', authRoutes);     // /api/auth/register, /login, /me, etc.
app.use('/api/users', userRoutes);    // utilisateurs
app.use('/api/admin', adminRoutes);   // admin
app.use('/api/progress', progressRoutes); // progression

// ✅ Route de test
app.get('/api/health', (req, res) => {
  console.log(`[${new Date().toISOString()}] /api/health checked`);
  res.json({
    message: 'Serveur en fonctionnement',
    timestamp: new Date()
  });
});

// 🚫 Gestion des routes non trouvées (404)
app.use((req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.path,
    method: req.method,
    message: 'Vérifiez que l\'URL et la méthode HTTP sont correctes'
  });
});

// 🚀 Lancement du serveur
// Note: Par défaut sur le port 5000 pour Express, mais peut être changé via PORT
// Pour correspondre à la documentation (port 3000), définissez PORT=3000 dans .env
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Serveur Express démarré sur le port ${PORT}`);
  console.log(`📡 API disponible sur http://localhost:${PORT}/api`);
  console.log(`🏠 Route racine: http://localhost:${PORT}/`);
});
