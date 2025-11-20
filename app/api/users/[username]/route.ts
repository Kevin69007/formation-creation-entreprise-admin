import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, createUnauthorizedResponse } from '@/lib/middleware'

// GET /api/users/[username] - Obtenir un utilisateur
export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const auth = requireAuth(request)
    if (!auth) {
      return createUnauthorizedResponse()
    }

    const { username } = params

    // Un utilisateur peut voir son propre profil, ou un admin peut voir n'importe quel profil
    if (auth.username !== username && auth.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      )
    }

    const user = await prisma.user.findUnique({
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
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user }, { status: 200 })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'utilisateur' },
      { status: 500 }
    )
  }
}

