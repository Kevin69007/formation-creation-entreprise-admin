// routes/admin.js
const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Middleware pour vérifier que l'utilisateur est admin
router.use(authenticateToken);
router.use(authorize('ADMIN'));

// Obtenir toutes les statistiques
router.get('/stats', async (req, res) => {
  try {
    // Statistiques utilisateurs
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ 
      where: { status: true } 
    });
    const totalAdmins = await prisma.user.count({ 
      where: { role: 'ADMIN' } 
    });
    const totalApprenants = await prisma.user.count({ 
      where: { role: 'APPRENANT' } 
    });

    // Statistiques de progression
    const totalProgressions = await prisma.progression.count({
      where: { completed: true }
    });
    const totalTitres = await prisma.titre.count();
    const avgProgress = totalUsers > 0 ? Math.round((totalProgressions / (totalUsers * totalTitres)) * 100) : 0;

    // Modules disponibles
    const totalModules = await prisma.module.count();

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        totalAdmins,
        totalApprenants,
        avgProgress,
        totalModules
      }
    });
  } catch (error) {
    console.error('Erreur statistiques:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Obtenir tous les utilisateurs avec leurs progressions
router.get('/users', async (req, res) => {
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
        },
        formationAssignments: {
          include: {
            formation: {
              select: {
                titre: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Formater les données pour le frontend
    const formattedUsers = users.map(user => {
      const completedLessons = user.progressions.filter(p => p.completed).length;
      const totalLessons = prisma.titre.count(); // Total des titres disponibles
      const completionRate = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.username, // À adapter selon votre modèle
        lastName: '', // À adapter selon votre modèle
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        completed_lessons: completedLessons,
        completion_rate: completionRate,
        last_activity: user.updatedAt,
        progress: user.progressions.reduce((acc, progression) => {
          if (progression.titre) {
            const key = `module_${progression.titre.module.id}_lesson_${progression.titre.id}`;
            acc[key] = {
              completed: progression.completed,
              completedAt: progression.completedAt
            };
          }
          return acc;
        }, {})
      };
    });

    res.json({ users: formattedUsers });
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Créer un nouvel étudiant
router.post('/users', async (req, res) => {
  try {
    const { firstName, lastName, email, username, password, enrollmentDate } = req.body;

    // Validation
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
    const existingUser = await prisma.user.findFirst({
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

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: 'APPRENANT',
        status: true
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

    res.status(201).json({
      message: 'Étudiant créé avec succès',
      user
    });

  } catch (error) {
    console.error('Erreur création étudiant:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Mettre à jour un étudiant
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, username, status } = req.body;

    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier les doublons (sauf l'utilisateur actuel)
    if (email || username) {
      const duplicateUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(email ? [{ email }] : []),
                ...(username ? [{ username }] : [])
              ]
            }
          ]
        }
      });

      if (duplicateUser) {
        return res.status(400).json({ 
          error: 'Email ou username déjà utilisé' 
        });
      }
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(email && { email }),
        ...(username && { username }),
        ...(status !== undefined && { status })
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
      message: 'Utilisateur mis à jour avec succès',
      user: updatedUser
    });

  } catch (error) {
    console.error('Erreur mise à jour utilisateur:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Supprimer un utilisateur
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Empêcher la suppression de soi-même
    if (existingUser.id === req.user.userId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    // Supprimer l'utilisateur (les relations seront supprimées via CASCADE)
    await prisma.user.delete({
      where: { id }
    });

    res.json({ message: 'Utilisateur supprimé avec succès' });

  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Obtenir les détails d'un utilisateur
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        progressions: {
          include: {
            titre: {
              include: {
                module: {
                  include: {
                    formation: {
                      select: {
                        titre: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        formationAssignments: {
          include: {
            formation: {
              select: {
                titre: true,
                description: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Calculer les statistiques de progression
    const totalTitres = await prisma.titre.count();
    const completedLessons = user.progressions.filter(p => p.completed).length;
    const completionRate = totalTitres > 0 ? Math.round((completedLessons / totalTitres) * 100) : 0;

    // Formater les données de progression
    const progress = {};
    user.progressions.forEach(progression => {
      if (progression.titre) {
        const moduleId = progression.titre.module.id;
        const titreId = progression.titre.id;
        const key = `module_${moduleId}_lesson_${titreId}`;
        
        progress[key] = {
          completed: progression.completed,
          completedAt: progression.completedAt,
          titre: progression.titre.nom,
          module: progression.titre.module.titre,
          formation: progression.titre.module.formation.titre
        };
      }
    });

    const userDetails = {
      ...user,
      completed_lessons: completedLessons,
      completion_rate: completionRate,
      progress,
      total_lessons: totalTitres
    };

    res.json({ user: userDetails });

  } catch (error) {
    console.error('Erreur détails utilisateur:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Exporter les données en CSV
router.get('/export/csv', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        username: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        progressions: {
          where: { completed: true },
          select: {
            titre: {
              select: {
                nom: true,
                module: {
                  select: {
                    titre: true
                  }
                }
              }
            },
            completedAt: true
          }
        }
      }
    });

    // Générer le CSV
    let csv = 'Username,Email,Role,Status,Inscription,Leçons Terminées,Dernière Activité\n';
    
    users.forEach(user => {
      const completedLessons = user.progressions.length;
      const lastActivity = user.progressions.length > 0 
        ? new Date(user.progressions[0].completedAt).toLocaleDateString('fr-FR')
        : 'Jamais';
      
      csv += `"${user.username}","${user.email}","${user.role}","${user.status ? 'Actif' : 'Inactif'}","${new Date(user.createdAt).toLocaleDateString('fr-FR')}","${completedLessons}","${lastActivity}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=utilisateurs.csv');
    res.send(csv);

  } catch (error) {
    console.error('Erreur export CSV:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export' });
  }
});

module.exports = router;