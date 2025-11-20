import { prisma } from '../lib/prisma'

async function testPrisma() {
  try {
    console.log('🔍 Test de connexion Prisma...\n')
    
    // Test simple
    const count = await prisma.user.count()
    console.log(`✅ Connexion Prisma OK! Nombre d'utilisateurs: ${count}\n`)
    
    // Lister les utilisateurs
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    })
    
    console.log(`📋 Utilisateurs existants (${users.length}):`)
    users.forEach((user) => {
      console.log(`   - ${user.username} (${user.email}) - ${user.role}`)
    })
  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
    console.error('   Code:', error.code)
    console.error('   Stack:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

testPrisma()

