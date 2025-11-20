import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, createUnauthorizedResponse } from '@/lib/middleware'

// PUT /api/users/[username]/profile - Mettre à jour le profil
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const auth = requireAuth(request)
    if (!auth) {
      return createUnauthorizedResponse()
    }

    const { username } = await params

    // Un utilisateur peut modifier son propre profil, ou un admin peut modifier n'importe quel profil
    if (auth.username !== username && auth.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { firstName, lastName, email } = body

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Cette adresse email est déjà utilisée' },
          { status: 409 }
        )
      }
    }

    // Mettre à jour le profil
    const updatedUser = await prisma.user.update({
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
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Profil mis à jour avec succès',
        user: updatedUser,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error updating profile:', error)

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Cette adresse email est déjà utilisée' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    )
  }
}

