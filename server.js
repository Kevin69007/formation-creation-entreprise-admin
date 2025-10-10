const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import des routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');

const app = express();

// 🔐 Sécurité HTTP headers
app.use(helmet());

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

// 📁 Définition des routes principales
app.use('/api/auth', authRoutes);   // /api/auth/register, /login, etc.
app.use('/api/users', userRoutes);  // utilisateurs
app.use('/api/admin', adminRoutes); // admin

// ✅ Route de test
app.get('/api/health', (req, res) => {
  console.log(`[${new Date().toISOString()}] /api/health checked`);
  res.json({
    message: 'Serveur en fonctionnement',
    timestamp: new Date()
  });
});

// 🚀 Lancement du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
});
