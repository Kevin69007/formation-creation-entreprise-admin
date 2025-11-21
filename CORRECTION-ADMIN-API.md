# 🔧 Correction : Migration de admin/api.php vers Express.js API

## ❌ Problème

Le fichier `admin/index.html` utilise encore `api.php` qui ne fonctionne pas avec les fichiers locaux (erreur CORS `file://`).

**Erreur actuelle :**
```
Access to fetch at 'file:///C:/xampp/htdocs/FORMATION-CREATION-ENTREPRISE-main/admin/api.php' 
from origin 'null' has been blocked by CORS policy
```

## ✅ Solution rapide

### Option 1 : Utiliser XAMPP Apache (Recommandé)

1. **Copiez votre projet dans htdocs** (si ce n'est pas déjà fait) :
   ```
   C:\xampp\htdocs\FORMATION-CREATION-ENTREPRISE-main\
   ```

2. **Démarrez Apache dans XAMPP**

3. **Accédez via HTTP** :
   ```
   http://localhost/FORMATION-CREATION-ENTREPRISE-main/admin/index.html
   ```

4. **Modifiez `admin/index.html`** pour utiliser l'API Express.js au lieu de `api.php` :

   **Ligne 635 - Remplacer :**
   ```javascript
   fetch('api.php', {
       method: 'POST',
       headers: {
           'Content-Type': 'application/json',
       },
       body: JSON.stringify({
           action: 'create_student',
           studentData: studentData
       })
   })
   ```

   **Par :**
   ```javascript
   // S'assurer que api-client.js est inclus dans la page
   const apiClient = window.apiClient;
   
   apiClient.createStudent({
       username: studentData.username,
       email: studentData.email,
       password: studentData.password,
       firstName: studentData.firstName,
       lastName: studentData.lastName,
       enrollmentDate: studentData.enrollmentDate
   }).then(response => {
       if (response.success) {
           alert('Compte étudiant créé avec succès !');
           resetForm();
           refreshStudents();
       }
   }).catch(error => {
       alert('Erreur: ' + error.message);
   });
   ```

### Option 2 : Migrer complètement vers Express.js API

1. **Ajoutez `api-client.js` dans `admin/index.html`** (avant la fermeture de `</body>`) :
   ```html
   <script src="../api-client.js"></script>
   ```

2. **Remplacez tous les appels `api.php`** par des appels à `apiClient`

3. **Vérifiez que le backend Express.js est démarré** :
   ```bash
   cd formation-entreprise-backend
   npm run dev
   ```

## 📝 Modifications nécessaires dans `admin/index.html`

### 1. Inclure api-client.js

Ajoutez avant `</body>` :
```html
<script src="../api-client.js"></script>
```

### 2. Fonction `createStudentAccount` (ligne ~635)

**Remplacer :**
```javascript
fetch('api.php', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        action: 'create_student',
        studentData: studentData
    })
})
```

**Par :**
```javascript
const apiClient = window.apiClient;
const submitBtn = document.querySelector('#studentForm button[type="submit"]');
const originalText = submitBtn.textContent;

submitBtn.textContent = 'Création en cours...';
submitBtn.disabled = true;

apiClient.createStudent({
    username: studentData.username,
    email: studentData.email,
    password: studentData.password,
    firstName: studentData.firstName,
    lastName: studentData.lastName,
    enrollmentDate: studentData.enrollmentDate
}).then(response => {
    if (response.success) {
        alert('Compte étudiant créé avec succès !');
        resetForm();
        refreshStudents();
    } else {
        alert('Erreur: ' + (response.error || 'Erreur inconnue'));
    }
}).catch(error => {
    console.error('Erreur:', error);
    alert('Erreur lors de la création: ' + error.message);
}).finally(() => {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
});
```

### 3. Fonction `refreshStudents` (ligne ~212)

**Remplacer :**
```javascript
const response = await fetch('api.php?action=get_all_users');
```

**Par :**
```javascript
const apiClient = window.apiClient;
const response = await apiClient.getAllUsers();
const users = response.users || [];
// Filtrer les étudiants
const students = users.filter(user => user.role === 'STUDENT');
```

## 🚀 Étapes de test

1. **Démarrez le backend Express.js** :
   ```bash
   cd formation-entreprise-backend
   npm run dev
   ```

2. **Démarrez Apache dans XAMPP**

3. **Accédez à l'admin** :
   ```
   http://localhost/FORMATION-CREATION-ENTREPRISE-main/admin/index.html
   ```

4. **Connectez-vous en tant qu'admin** :
   - Username: `admin`
   - Password: `admin123`

5. **Testez la création d'un étudiant**

## ⚠️ Important

- **Ne pas ouvrir directement le fichier HTML** (double-clic) - utilisez toujours HTTP
- **Le backend Express.js doit être démarré** sur `http://localhost:5000` (ou le port défini dans `PORT`)
- **Le token JWT doit être sauvegardé** après la connexion (géré automatiquement par `api-client.js`)

## 📚 Voir aussi

- `MIGRATION-ADMIN-API.md` - Guide de migration complet
- `INTEGRATION-FRONTEND.md` - Guide d'intégration frontend
- `GUIDE-POSTMAN.md` - Tester l'API avec Postman

