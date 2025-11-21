// routes/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../lib/db');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only) - DOIT être avant /:username
router.get('/', authenticateToken, authorize('ADMIN'), async (req, res) => {
  try {
    const users = await db.user.findMany({
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

// Get current user profile - DOIT être avant /:username
router.get('/profile', authenticateToken, async (req, res) => {
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

// Get user statistics (admin only) - DOIT être avant /:username
router.get('/stats', authenticateToken, authorize('ADMIN'), async (req, res) => {
  try {
    const totalUsers = await db.user.count();
    const totalAdmins = await db.user.count({ where: { role: 'ADMIN' } });
    const totalApprenants = await db.user.count({ where: { role: 'STUDENT' } });
    const activeUsers = await db.user.count({ where: { status: true } });

    const recentUsers = await db.user.findMany({
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

// GET /api/users/:username - Obtenir un utilisateur
router.get('/:username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;

    // Un utilisateur peut voir son propre profil, ou un admin peut voir n'importe quel profil
    const currentUser = await db.user.findUnique({
      where: { id: req.user.userId },
      select: { username: true, role: true }
    });

    if (currentUser.username !== username && currentUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const user = await db.user.findUnique({
      where: { username },
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
    console.error('Error fetching user:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de la récupération de l\'utilisateur' 
    });
  }
});

// PUT /api/users/:username/profile - Mettre à jour le profil
router.put('/:username/profile', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;
    const { firstName, lastName, email } = req.body;

    // Vérifier l'utilisateur actuel
    const currentUser = await db.user.findUnique({
      where: { id: req.user.userId },
      select: { username: true, role: true }
    });

    // Un utilisateur peut modifier son propre profil, ou un admin peut modifier n'importe quel profil
    if (currentUser.username !== username && currentUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Vérifier que l'utilisateur existe
    const existingUser = await db.user.findUnique({
      where: { username },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email && email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return res.status(409).json({ 
          error: 'Cette adresse email est déjà utilisée' 
        });
      }
    }

    // Mettre à jour le profil
    const updatedUser = await db.user.update({
      where: { username },
      data: {
        firstName: firstName !== undefined ? firstName : existingUser.firstName,
        lastName: lastName !== undefined ? lastName : existingUser.lastName,
        email: email !== undefined ? email : existingUser.email,
        lastActivity: new Date(),
      },
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

    return res.status(200).json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Cette adresse email est déjà utilisée' 
      });
    }

    return res.status(500).json({ 
      error: 'Erreur lors de la mise à jour du profil' 
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { username, email } = req.body;

    // Vérifier si le nouveau username ou email existe déjà
    if (username || email) {
      const existingUser = await db.user.findFirst({
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

    const updatedUser = await db.user.update({
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
    const user = await db.user.findUnique({
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

    await db.user.update({
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

// Update user role (admin only)
router.patch('/:id/role', authenticateToken, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'STUDENT'].includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide' });
    }

    const user = await db.user.update({
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

    const user = await db.user.update({
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

module.exports = router;