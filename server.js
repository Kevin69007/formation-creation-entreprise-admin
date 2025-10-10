// server.js

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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// 🚨 Protection contre les abus (Rate limiting)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // Limite chaque IP à 100 requêtes par fenêtre de 15 min
});
app.use(limiter);

// 📦 Parse les requêtes JSON
app.use(express.json());

// 📁 Définition des routes principales
app.use('/api/auth', authRoutes);   // => /api/auth/register, /api/auth/login, etc.
app.use('/api/users', userRoutes);  // => routes pour les utilisateurs
app.use('/api/admin', adminRoutes); // => routes pour l'admin

// ✅ Route de test du serveur
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
