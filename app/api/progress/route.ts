import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, createUnauthorizedResponse } from '@/lib/middleware'

// POST /api/progress - Mettre à jour la progression d'une leçon
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (!auth) {
      return createUnauthorizedResponse()
    }

    const body = await request.json()
    const { moduleId, lessonId, completed, timeSpent } = body

    if (!moduleId || !lessonId) {
      return NextResponse.json(
        { error: 'moduleId et lessonId requis' },
        { status: 400 }
      )
    }

    // Mettre à jour ou créer la progression
    const lessonProgress = await prisma.lessonProgress.upsert({
      where: {
        userId_moduleId_lessonId: {
          userId: auth.userId,
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
        userId: auth.userId,
        moduleId,
        lessonId,
        completed: completed || false,
        completedAt: completed ? new Date() : null,
        timeSpent: timeSpent || null,
      },
    })

    // Mettre à jour lastActivity de l'utilisateur
    await prisma.user.update({
      where: { id: auth.userId },
      data: { lastActivity: new Date() },
    })

    // Calculer les statistiques
    const allProgress = await prisma.lessonProgress.findMany({
      where: { userId: auth.userId },
    })

    const completedLessons = allProgress.filter(p => p.completed).length
    const totalLessons = 77 // Total des leçons dans la formation

    return NextResponse.json(
      {
        success: true,
        message: 'Progression mise à jour',
        progress: lessonProgress,
        stats: {
          completedLessons,
          totalLessons,
          completionRate: Math.round((completedLessons / totalLessons) * 100 * 10) / 10,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating progress:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la progression' },
      { status: 500 }
    )
  }
}

// GET /api/progress - Obtenir toute la progression de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (!auth) {
      return createUnauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    // Un utilisateur peut voir sa propre progression, ou un admin peut voir n'importe quelle progression
    let targetUserId = auth.userId

    if (username && username !== auth.username) {
      if (auth.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Accès refusé' },
          { status: 403 }
        )
      }

      const targetUser = await prisma.user.findUnique({
        where: { username },
      })

      if (!targetUser) {
        return NextResponse.json(
          { error: 'Utilisateur non trouvé' },
          { status: 404 }
        )
      }

      targetUserId = targetUser.id
    }

    const allProgress = await prisma.lessonProgress.findMany({
      where: { userId: targetUserId },
      orderBy: [
        { moduleId: 'asc' },
        { lessonId: 'asc' },
      ],
    })

    const completedLessons = allProgress.filter(p => p.completed).length
    const totalLessons = 77

    return NextResponse.json(
      {
        progress: allProgress,
        stats: {
          completedLessons,
          totalLessons,
          completionRate: Math.round((completedLessons / totalLessons) * 100 * 10) / 10,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching progress:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la progression' },
      { status: 500 }
    )
  }
}

