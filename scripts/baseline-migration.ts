/**
 * Script pour baseler une migration sur l'état actuel de la base de données
 * Utilisez ce script si votre base de données a déjà une structure
 * et que vous voulez synchroniser Prisma avec l'état actuel
 */

import { execSync } from 'child_process'
import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

async function main() {
  console.log('🔍 Vérification de l\'état de la base de données...\n')

  try {
    // 1. Créer une migration vide
    console.log('📝 Création d\'une migration vide...')
    const migrationName = await question('Nom de la migration (ex: init): ') || 'init'
    
    execSync(`npx prisma migrate dev --name ${migrationName} --create-only`, {
      stdio: 'inherit',
    })

    // 2. Synchroniser le schéma avec la base de données
    console.log('\n🔄 Synchronisation du schéma avec la base de données...')
    execSync('npx prisma db pull', { stdio: 'inherit' })

    // 3. Marquer la migration comme appliquée
    console.log('\n✅ Marquage de la migration comme appliquée...')
    execSync(`npx prisma migrate resolve --applied ${migrationName}`, {
      stdio: 'inherit',
    })

    console.log('\n✅ Migration baseline terminée avec succès!')
    console.log('💡 Vous pouvez maintenant modifier le schéma et créer de nouvelles migrations.')
  } catch (error: any) {
    console.error('\n❌ Erreur lors de la baseline:', error.message)
    process.exit(1)
  } finally {
    rl.close()
  }
}

main()

