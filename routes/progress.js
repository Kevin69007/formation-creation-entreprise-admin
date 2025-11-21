// routes/progress.js
const express = require('express');
const { authenticateToken, authorize } = require('../middleware/auth');
const { db } = require('../lib/db');

const router = express.Router();

// POST /api/progress - Mettre à jour la progression d'une leçon
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { moduleId, lessonId, completed, timeSpent } = req.body;

    if (!moduleId || !lessonId) {
      return res.status(400).json({ 
        error: 'moduleId et lessonId requis' 
      });
    }

    // Mettre à jour ou créer la progression
    const lessonProgress = await db.lessonProgress.upsert({
      where: {
        userId_moduleId_lessonId: {
          userId: req.user.userId,
          moduleId,
          lessonId,
        },
      },
      update: {
        completed: completed !== undefined ? completed : undefined,
        completedAt: completed ? new Date() : undefined,
        timeSpent: timeSpent !== undefined ? timeSpent : undefined,
      },
      create: {
        userId: req.user.userId,
        moduleId,
        lessonId,
        completed: completed || false,
        completedAt: completed ? new Date() : null,
        timeSpent: timeSpent || null,
      },
    });

    // Mettre à jour lastActivity de l'utilisateur
    await db.user.update({
      where: { id: req.user.userId },
      data: { lastActivity: new Date() },
    });

    // Calculer les statistiques
    const allProgress = await db.lessonProgress.findMany({
      where: { userId: req.user.userId },
    });

    const completedLessons = allProgress.filter(p => p.completed).length;
    const totalLessons = 77; // Total des leçons dans la formation

    return res.status(200).json({
      success: true,
      message: 'Progression mise à jour',
      progress: lessonProgress,
      stats: {
        completedLessons,
        totalLessons,
        completionRate: Math.round((completedLessons / totalLessons) * 100 * 10) / 10,
      },
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de la mise à jour de la progression' 
    });
  }
});

// GET /api/progress - Obtenir toute la progression de l'utilisateur
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { username } = req.query;

    // Un utilisateur peut voir sa propre progression, ou un admin peut voir n'importe quelle progression
    let targetUserId = req.user.userId;

    if (username && username !== req.user.username) {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Accès refusé' });
      }

      const targetUser = await db.user.findUnique({
        where: { username },
      });

      if (!targetUser) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      targetUserId = targetUser.id;
    }

    const allProgress = await db.lessonProgress.findMany({
      where: { userId: targetUserId },
      orderBy: [
        { moduleId: 'asc' },
        { lessonId: 'asc' },
      ],
    });

    const completedLessons = allProgress.filter(p => p.completed).length;
    const totalLessons = 77;

    return res.status(200).json({
      progress: allProgress,
      stats: {
        completedLessons,
        totalLessons,
        completionRate: Math.round((completedLessons / totalLessons) * 100 * 10) / 10,
      },
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de la récupération de la progression' 
    });
  }
});

module.exports = router;

