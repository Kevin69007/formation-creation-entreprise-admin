import 'dotenv/config'
import { Pool } from 'pg'

async function testConnection() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    console.error('❌ DATABASE_URL n\'est pas défini dans le fichier .env')
    process.exit(1)
  }

  console.log('🔍 Test de connexion à la base de données...')
  console.log('📍 URL (masquée):', connectionString.replace(/:[^:@]+@/, ':****@'))

  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 10000, // 10 secondes
  })

  try {
    const client = await pool.connect()
    console.log('✅ Connexion réussie!')
    
    const result = await client.query('SELECT version()')
    console.log('📊 Version PostgreSQL:', result.rows[0].version)
    
    client.release()
    await pool.end()
    console.log('✅ Test terminé avec succès')
    process.exit(0)
  } catch (error: any) {
    console.error('❌ Erreur de connexion:')
    console.error('   Message:', error.message)
    console.error('   Code:', error.code)
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('\n💡 Suggestions:')
      console.error('   1. Vérifiez que votre projet Supabase n\'est pas en pause')
      console.error('   2. Vérifiez que l\'URL de connexion est correcte')
      console.error('   3. Vérifiez que vous utilisez l\'URL directe (port 5432) et non pgbouncer')
      console.error('   4. Vérifiez votre connexion internet')
    }
    
    await pool.end()
    process.exit(1)
  }
}

testConnection()

