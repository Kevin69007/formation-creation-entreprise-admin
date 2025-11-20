import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Nom d\'utilisateur et mot de passe requis' },
        { status: 400 }
      )
    }

    // Rechercher l'utilisateur par username ou email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username },
        ],
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Nom d\'utilisateur ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Vérifier le mot de passe
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Nom d\'utilisateur ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Mettre à jour les informations de connexion
    const now = new Date()
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: now,
        lastActivity: now,
        sessionCount: { increment: 1 },
        firstLogin: user.firstLogin || now,
      },
    })

    // Générer le token JWT
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    })

    // Retourner les informations de l'utilisateur (sans le mot de passe)
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      {
        success: true,
        message: 'Connexion réussie',
        token,
        user: userWithoutPassword,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in login:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la connexion' },
      { status: 500 }
    )
  }
}

