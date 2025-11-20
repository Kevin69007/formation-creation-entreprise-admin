# Guide de Migration : Admin API vers Next.js API

Ce guide explique comment migrer le panneau d'administration de `admin/api.php` vers l'API Next.js.

## 🔍 Problème actuel

Le fichier `admin/index.html` utilise encore `api.php` qui ne fonctionne pas avec les fichiers locaux (erreur CORS `file://`).

## ✅ Solution : Utiliser l'API Next.js

### Étape 1 : Vérifier que le backend Next.js est démarré

```bash
cd formation-entreprise-backend
npm run dev
```

Le serveur doit être accessible sur `http://localhost:3000`

### Étape 2 : Modifier `admin/index.html`

Remplacez tous les appels à `api.php` par des appels à l'API Next.js via `api-client.js`.

#### Exemple : Créer un étudiant

**Avant (ligne 635) :**
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

**Après :**
```javascript
// Utiliser api-client.js (déjà inclus dans le projet)
const apiClient = window.apiClient;

try {
    const response = await apiClient.createStudent({
        username: studentData.username,
        email: studentData.email,
        password: studentData.password,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        enrollmentDate: studentData.enrollmentDate
    });
    
    if (response.success) {
        alert('Compte étudiant créé avec succès !');
        resetForm();
        refreshStudents();
    }
} catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la création du compte: ' + error.message);
}
```

#### Exemple : Obtenir tous les utilisateurs

**Avant (ligne 212) :**
```javascript
const response = await fetch('api.php?action=get_all_users');
```

**Après :**
```javascript
const apiClient = window.apiClient;

try {
    const response = await apiClient.getAllUsers();
    // response.users contient la liste des utilisateurs
    displayUsers(response.users);
} catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la récupération des utilisateurs');
}
```

### Étape 3 : S'assurer que `api-client.js` est inclus

Dans `admin/index.html`, ajoutez avant la fermeture de `</body>` :

```html
<script src="../api-client.js"></script>
```

### Étape 4 : Utiliser un serveur HTTP (pas file://)

**Option A : Utiliser XAMPP Apache**

1. Copiez le dossier `FORMATION-CREATION-ENTREPRISE-main` dans `C:\xampp\htdocs\`
2. Accédez via `http://localhost/FORMATION-CREATION-ENTREPRISE-main/admin/index.html`

**Option B : Utiliser un serveur Node.js simple**

```bash
# Dans le dossier FORMATION-CREATION-ENTREPRISE-main
npx http-server -p 8080 -c-1
```

Puis accédez à `http://localhost:8080/admin/index.html`

## 📋 Mapping des fonctions

| Ancien (api.php) | Nouveau (api-client.js) |
|------------------|-------------------------|
| `api.php?action=get_all_users` | `apiClient.getAllUsers()` |
| `api.php` avec `action: 'create_student'` | `apiClient.createStudent(data)` |
| `api.php?action=export_csv` | À implémenter (ou utiliser directement l'API) |

## 🔧 Corrections à apporter dans `admin/index.html`

### 1. Fonction `createStudentAccount` (ligne ~635)

```javascript
async function createStudentAccount(studentData) {
    const apiClient = window.apiClient;
    const submitBtn = document.querySelector('#studentForm button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.textContent = 'Création en cours...';
    submitBtn.disabled = true;
    
    try {
        const response = await apiClient.createStudent({
            username: studentData.username,
            email: studentData.email,
            password: studentData.password,
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            enrollmentDate: studentData.enrollmentDate
        });
        
        if (response.success) {
            alert('Compte étudiant créé avec succès !');
            resetForm();
            refreshStudents();
        } else {
            alert('Erreur lors de la création du compte: ' + (response.error || 'Erreur inconnue'));
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la création du compte: ' + error.message);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}
```

### 2. Fonction `refreshStudents` (ligne ~212)

```javascript
async function refreshStudents() {
    const apiClient = window.apiClient;
    
    try {
        const response = await apiClient.getAllUsers();
        const users = response.users || [];
        
        // Filtrer seulement les étudiants (role === 'STUDENT')
        const students = users.filter(user => user.role === 'STUDENT');
        
        // Afficher les étudiants dans le tableau
        displayStudents(students);
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la récupération des étudiants');
    }
}
```

### 3. Export CSV

Pour l'export CSV, vous pouvez soit :
- Créer un endpoint dans l'API Next.js
- Ou générer le CSV côté client avec les données récupérées

## ⚠️ Important : Authentification

Toutes les requêtes admin nécessitent un token JWT. Assurez-vous que :

1. L'utilisateur est connecté en tant qu'admin
2. Le token est sauvegardé dans `localStorage.getItem('token')`
3. `api-client.js` inclut automatiquement le token dans les headers

## 🧪 Test

1. Démarrez le backend Next.js : `npm run dev`
2. Démarrez un serveur HTTP pour le frontend
3. Connectez-vous en tant qu'admin
4. Testez la création d'un étudiant
5. Vérifiez que les étudiants s'affichent correctement

## 📝 Notes

- Le fichier `api-client.js` est déjà configuré pour utiliser `http://localhost:3000/api`
- Le middleware CORS est déjà configuré pour autoriser toutes les origines en développement
- En production, modifiez `middleware.ts` pour restreindre les origines autorisées

