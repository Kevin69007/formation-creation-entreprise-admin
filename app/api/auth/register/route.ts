import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, password, firstName, lastName, enrollmentDate } = body

    // Validation des champs requis
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Nom d\'utilisateur, email et mot de passe requis' },
        { status: 400 }
      )
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Adresse email invalide' },
        { status: 400 }
      )
    }

    // Validation du mot de passe
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: existingUser.username === username 
          ? 'Ce nom d\'utilisateur existe déjà'
          : 'Cette adresse email est déjà utilisée' },
        { status: 409 }
      )
    }

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(password)

    // Créer l'utilisateur
    const now = new Date()
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        role: 'STUDENT',
        enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : now,
        firstLogin: null,
        sessionCount: 0,
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
        message: 'Compte créé avec succès',
        token,
        user: userWithoutPassword,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error in register:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Un utilisateur avec ces informations existe déjà' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création du compte' },
      { status: 500 }
    )
  }
}

