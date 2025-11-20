import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/middleware'
import { hashPassword } from '@/lib/auth'

// GET /api/users - Liste tous les utilisateurs (admin uniquement)
export async function GET(request: NextRequest) {
  try {
    const auth = requireAdmin(request)
    if (!auth) {
      return createForbiddenResponse('Accès admin requis')
    }

    const users = await prisma.user.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ users }, { status: 200 })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des utilisateurs' },
      { status: 500 }
    )
  }
}

// POST /api/users - Créer un étudiant (admin uniquement)
export async function POST(request: NextRequest) {
  try {
    const auth = requireAdmin(request)
    if (!auth) {
      return createForbiddenResponse('Accès admin requis')
    }

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

    // Créer l'étudiant
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
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        enrollmentDate: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Compte étudiant créé avec succès',
        user,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating student:', error)

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Un utilisateur avec ces informations existe déjà' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création du compte étudiant' },
      { status: 500 }
    )
  }
}
