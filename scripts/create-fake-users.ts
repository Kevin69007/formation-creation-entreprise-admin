import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { hashPassword } from '../lib/auth'

// Créer une instance Prisma avec adaptateur pour ce script
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
})

async function createFakeUsers() {
  try {
    console.log('🔍 Vérification des utilisateurs existants...\n')

    // Données des utilisateurs à créer
    const users = [
      {
        username: 'admin',
        email: 'admin@formation.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'Système',
        role: 'ADMIN' as const,
      },
      {
        username: 'apprenant',
        email: 'apprenant@formation.com',
        password: 'apprenant123',
        firstName: 'Jean',
        lastName: 'Dupont',
        role: 'STUDENT' as const,
      },
    ]

    const createdUsers = []

    for (const userData of users) {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: userData.username },
            { email: userData.email },
          ],
        },
      })

      if (existingUser) {
        console.log(`⚠️  L'utilisateur "${userData.username}" existe déjà`)
        console.log(`   Username: ${existingUser.username}`)
        console.log(`   Email: ${existingUser.email}`)
        console.log(`   Role: ${existingUser.role}\n`)
        continue
      }

      // Hasher le mot de passe
      const hashedPassword = await hashPassword(userData.password)

      // Créer l'utilisateur
      const user = await prisma.user.create({
        data: {
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          enrollmentDate: userData.role === 'STUDENT' ? new Date() : null,
        },
      })

      createdUsers.push(user)

      console.log(`✅ Utilisateur "${userData.username}" créé avec succès !`)
      console.log(`   Username: ${user.username}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Nom complet: ${user.firstName} ${user.lastName}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Mot de passe: ${userData.password}\n`)
    }

    if (createdUsers.length === 0) {
      console.log('ℹ️  Aucun nouvel utilisateur créé (tous existent déjà)')
    } else {
      console.log(`\n✅ ${createdUsers.length} utilisateur(s) créé(s) avec succès !`)
      console.log('\n📋 Résumé des comptes créés:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      createdUsers.forEach((user) => {
        const password = users.find((u) => u.username === user.username)?.password
        console.log(`\n👤 ${user.role === 'ADMIN' ? '🔑 Admin' : '📚 Apprenant'}`)
        console.log(`   Username: ${user.username}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Mot de passe: ${password}`)
      })
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    }
  } catch (error: any) {
    console.error('❌ Erreur lors de la création des utilisateurs:', error.message)
    if (error.code === 'P2002') {
      console.error('   Un utilisateur avec ce nom ou cet email existe déjà')
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

createFakeUsers()

