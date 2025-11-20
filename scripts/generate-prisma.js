const { execSync } = require('child_process');
const path = require('path');

try {
  console.log('Generating Prisma Client...');
  // Utiliser node pour exécuter directement le fichier Prisma
  const prismaPath = path.join(__dirname, '..', 'node_modules', 'prisma', 'build', 'index.js');
  execSync(`node "${prismaPath}" generate`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  console.log('Prisma Client generated successfully!');
} catch (error) {
  console.error('Error generating Prisma Client:', error.message);
  // Ne pas faire échouer le build si Prisma generate échoue
  // Le client pourrait déjà être généré
  process.exit(0);
}

