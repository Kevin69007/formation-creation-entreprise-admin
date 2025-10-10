// routes/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        formationAssignments: {
          include: {
            formation: {
              select: {
                id: true,
                titre: true,
                description: true,
                image: true
              }
            }
          }
        },
        progressions: {
          include: {
            titre: {
              select: {
                id: true,
                nom: true,
                module: {
                  select: {
                    titre: true,
                    formation: {
                      select: {
                        titre: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { username, email } = req.body;

    // Vérifier si le nouveau username ou email existe déjà
    if (username || email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: req.user.userId } },
            {
              OR: [
                ...(username ? [{ username }] : []),
                ...(email ? [{ email }] : [])
              ]
            }
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({ 
          error: 'Username ou email déjà utilisé' 
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        ...(username && { username }),
        ...(email && { email }),
        updatedAt: new Date()
      },
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

    res.json({ 
      message: 'Profil mis à jour avec succès', 
      user: updatedUser 
    });
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Mot de passe actuel et nouveau mot de passe requis' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' 
      });
    }

    // Récupérer l'utilisateur avec le mot de passe
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { password: true }
    });

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }

    // Hasher le nouveau mot de passe
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date()
      }
    });

    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get all users (admin only)
router.get('/', authenticateToken, authorize('ADMIN'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            formationAssignments: true,
            progressions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ users });
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Update user role (admin only)
router.patch('/:id/role', authenticateToken, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'APPRENANT'].includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { 
        role,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        createdAt: true
      }
    });

    res.json({ 
      message: 'Rôle mis à jour avec succès', 
      user 
    });
  } catch (error) {
    console.error('Erreur mise à jour rôle:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Toggle user status (admin only)
router.patch('/:id/status', authenticateToken, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        createdAt: true
      }
    });

    res.json({ 
      message: `Utilisateur ${status ? 'activé' : 'désactivé'} avec succès`, 
      user 
    });
  } catch (error) {
    console.error('Erreur changement statut:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get user statistics (admin only)
router.get('/stats', authenticateToken, authorize('ADMIN'), async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalAdmins = await prisma.user.count({ where: { role: 'ADMIN' } });
    const totalApprenants = await prisma.user.count({ where: { role: 'APPRENANT' } });
    const activeUsers = await prisma.user.count({ where: { status: true } });

    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true
      }
    });

    res.json({
      stats: {
        totalUsers,
        totalAdmins,
        totalApprenants,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers
      },
      recentUsers
    });
  } catch (error) {
    console.error('Erreur statistiques:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;