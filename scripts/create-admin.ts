import { prisma } from '../lib/prisma'
import { hashPassword } from '../lib/auth'

async function createAdmin() {
  const username = process.argv[2] || 'admin'
  const email = process.argv[3] || 'admin@example.com'
  const password = process.argv[4] || 'admin2024'

  try {
    // Vérifier si l'admin existe déjà
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    })

    if (existingAdmin) {
      console.log('❌ Un utilisateur avec ce nom ou cet email existe déjà')
      process.exit(1)
    }

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(password)

    // Créer l'admin
    const admin = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: 'ADMIN',
      },
    })

    console.log('✅ Compte admin créé avec succès !')
    console.log(`   Username: ${admin.username}`)
    console.log(`   Email: ${admin.email}`)
    console.log(`   Role: ${admin.role}`)
    console.log(`   ID: ${admin.id}`)
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()

