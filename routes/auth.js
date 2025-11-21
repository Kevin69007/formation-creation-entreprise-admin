// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
//const prisma = require('../lib/prisma');
const { authenticateToken } = require('../middleware/auth');
const { db } = require('../lib/db');

const router = express.Router();

// ✅ INSCRIPTION
router.post('/register', async (req, res) => {
  try {
    const { email, username, password, firstName, lastName, enrollmentDate } = req.body;

    // Vérification des champs requis
    if (!email || !username || !password) {
      return res.status(400).json({ 
        error: 'Email, username et mot de passe sont obligatoires' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Le mot de passe doit contenir au moins 6 caractères' 
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'Un utilisateur avec cet email ou username existe déjà' 
      });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Création de l'utilisateur
    const user = await db.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : null,
        role: 'STUDENT', // valeur par défaut (selon le schéma Prisma)
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        enrollmentDate: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Génération du token JWT
    const token = jwt.sign(
      { 
        userId: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      token,
      user
    });

  } catch (error) {
    console.error('Erreur inscription:', error);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// ✅ CONNEXION
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Nom d\'utilisateur et mot de passe requis' 
      });
    }

    // Rechercher l'utilisateur par username ou email
    const user = await db.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'Nom d\'utilisateur ou mot de passe incorrect' 
      });
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Nom d\'utilisateur ou mot de passe incorrect' 
      });
    }

    // Mettre à jour les informations de connexion
    const now = new Date();
    await db.user.update({
      where: { id: user.id },
      data: {
        lastLogin: now,
        lastActivity: now,
        sessionCount: { increment: 1 },
        firstLogin: user.firstLogin || now,
      },
    });

    // Générer le token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      }
    );

    // Retourner les informations de l'utilisateur (sans le mot de passe)
    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: userWithoutPassword,
    });

  } catch (error) {
    console.error('Error in login:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de la connexion' 
    });
  }
});

// ✅ DECONNEXION (symbolique, à améliorer avec blacklist si besoin)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    res.json({ message: 'Déconnexion réussie' });
  } catch (error) {
    console.error('Erreur déconnexion:', error);
    res.status(500).json({ error: 'Erreur lors de la déconnexion' });
  }
});

// ✅ VERIFICATION DU TOKEN
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Erreur vérification:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// ✅ GET CURRENT USER (ME)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        enrollmentDate: true,
        firstLogin: true,
        lastLogin: true,
        lastActivity: true,
        sessionCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error('Error in me:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

module.exports = router;
