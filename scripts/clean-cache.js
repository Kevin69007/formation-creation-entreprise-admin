const fs = require('fs');
const path = require('path');

function removeDir(dir) {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`✓ Supprimé: ${dir}`);
      return true;
    } catch (error) {
      console.error(`✗ Erreur lors de la suppression de ${dir}:`, error.message);
      return false;
    }
  }
  return false;
}

function removeFile(file) {
  if (fs.existsSync(file)) {
    try {
      fs.unlinkSync(file);
      console.log(`✓ Supprimé: ${file}`);
      return true;
    } catch (error) {
      console.error(`✗ Erreur lors de la suppression de ${file}:`, error.message);
      return false;
    }
  }
  return false;
}

console.log('Vidage du cache...\n');

// Supprimer .next
removeDir('.next');

// Supprimer node_modules/.cache
removeDir('node_modules/.cache');

// Supprimer les fichiers .tsbuildinfo
const files = fs.readdirSync('.').filter(f => f.endsWith('.tsbuildinfo'));
files.forEach(file => removeFile(file));

console.log('\n✓ Cache vidé avec succès!');

