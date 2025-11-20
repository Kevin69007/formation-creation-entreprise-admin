import 'dotenv/config'
import { Pool } from 'pg'

async function testDirectConnection() {
  const directUrl = process.env.DIRECT_URL
  const databaseUrl = process.env.DATABASE_URL

  console.log('🔍 Test des connexions à Supabase...\n')

  if (!directUrl) {
    console.error('❌ DIRECT_URL n\'est pas défini dans le fichier .env')
    console.error('   DIRECT_URL est nécessaire pour les migrations Prisma')
    process.exit(1)
  }

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL n\'est pas défini dans le fichier .env')
    process.exit(1)
  }

  console.log('📍 DIRECT_URL (masquée):', directUrl.replace(/:[^:@]+@/, ':****@'))
  console.log('📍 DATABASE_URL (masquée):', databaseUrl.replace(/:[^:@]+@/, ':****@'))
  console.log('')

  // Test 1: Connexion directe (pour migrations)
  console.log('🔍 Test 1: Connexion directe (DIRECT_URL) - Port 5432...')
  const directPool = new Pool({
    connectionString: directUrl,
    connectionTimeoutMillis: 10000,
  })

  try {
    const directClient = await directPool.connect()
    console.log('✅ Connexion directe réussie!')
    
    const result = await directClient.query('SELECT version()')
    console.log('📊 Version PostgreSQL:', result.rows[0].version.split(',')[0])
    
    directClient.release()
    await directPool.end()
    console.log('✅ Test connexion directe terminé avec succès\n')
  } catch (error: any) {
    console.error('❌ Erreur de connexion directe:')
    console.error('   Message:', error.message)
    console.error('   Code:', error.code)
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('\n💡 Suggestions pour DIRECT_URL:')
      console.error('   1. Vérifiez que votre projet Supabase n\'est pas en pause')
      console.error('   2. Vérifiez que l\'URL utilise le port 5432 (connexion directe)')
      console.error('   3. Vérifiez que le format est: postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-[REGION].pooler.supabase.com:5432/postgres')
      console.error('   4. Assurez-vous que le mot de passe est correct dans l\'URL')
    }
    
    await directPool.end()
  }

  // Test 2: Connexion pooling (pour application)
  console.log('🔍 Test 2: Connexion pooling (DATABASE_URL) - Port 6543...')
  const poolPool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10000,
  })

  try {
    const poolClient = await poolPool.connect()
    console.log('✅ Connexion pooling réussie!')
    
    const result = await poolClient.query('SELECT version()')
    console.log('📊 Version PostgreSQL:', result.rows[0].version.split(',')[0])
    
    poolClient.release()
    await poolPool.end()
    console.log('✅ Test connexion pooling terminé avec succès\n')
  } catch (error: any) {
    console.error('❌ Erreur de connexion pooling:')
    console.error('   Message:', error.message)
    console.error('   Code:', error.code)
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('\n💡 Suggestions pour DATABASE_URL:')
      console.error('   1. Vérifiez que votre projet Supabase n\'est pas en pause')
      console.error('   2. Vérifiez que l\'URL utilise le port 6543 avec pgbouncer=true')
      console.error('   3. Vérifiez que le format est: postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true')
    }
    
    await poolPool.end()
  }

  console.log('✅ Tests terminés')
}

testDirectConnection().catch(console.error)

