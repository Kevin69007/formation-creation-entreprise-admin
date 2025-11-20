# Guide d'Intégration Frontend

Ce guide explique comment intégrer le backend Next.js avec votre frontend existant.

## Configuration

### URL du Backend

Par défaut, le backend tourne sur `http://localhost:3000`. Assurez-vous que le backend est démarré avant d'utiliser ces API.

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

### ⚠️ Important : CORS et fichiers locaux

Si vous ouvrez votre fichier HTML directement dans l navigateur (file://), vous rencontrerez des erreurs CORS. 

**Solutions :**

1. **Utiliser un serveur local** (recommandé) :
   ```bash
   # Avec Python
   python -m http.server 8080
   
   # Avec Node.js (http-server)
   npx http-server -p 8080
   
   # Avec PHP
   php -S localhost:8080
   ```
   Puis accédez à votre fichier via `http://localhost:8080/index.html`

2. **Le middleware CORS est déjà configuré** dans `middleware.ts` pour autoriser toutes les origines en développement.

3. **Pour la production**, modifiez `middleware.ts` pour restreindre aux origines autorisées.

## Authentification

### 1. Connexion (Login)

```javascript
async function login(username, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Sauvegarder le token
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('username', data.user.username);
      localStorage.setItem('userRole', data.user.role);
      localStorage.setItem('isLoggedIn', 'true');
      
      // Rediriger selon le rôle
      if (data.user.role === 'ADMIN') {
        window.location.href = 'admin/index.html';
      } else {
        window.location.href = 'dashboard.html';
      }
    } else {
      alert(data.error || 'Erreur de connexion');
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la connexion');
  }
}
```

### 2. Enregistrement (Register)

```javascript
async function register(userData) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        enrollmentDate: userData.enrollmentDate,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Sauvegarder le token
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('username', data.user.username);
      localStorage.setItem('userRole', data.user.role);
      localStorage.setItem('isLoggedIn', 'true');
      
      window.location.href = 'dashboard.html';
    } else {
      alert(data.error || 'Erreur lors de l\'enregistrement');
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de l\'enregistrement');
  }
}
```

### 3. Vérifier l'authentification actuelle

```javascript
async function checkAuth() {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    window.location.href = 'index.html';
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.user;
    } else {
      // Token invalide, rediriger vers la page de connexion
      localStorage.removeItem('authToken');
      localStorage.removeItem('username');
      localStorage.removeItem('userRole');
      localStorage.removeItem('isLoggedIn');
      window.location.href = 'index.html';
      return null;
    }
  } catch (error) {
    console.error('Erreur:', error);
    return null;
  }
}
```

## Profil Utilisateur

### 1. Obtenir le profil d'un utilisateur

```javascript
async function getUserProfile(username) {
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await fetch(`${API_BASE_URL}/users/${username}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.user;
    } else {
      const error = await response.json();
      console.error('Erreur:', error.error);
      return null;
    }
  } catch (error) {
    console.error('Erreur:', error);
    return null;
  }
}
```

### 2. Mettre à jour le profil

```javascript
async function updateProfile(username, profileData) {
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await fetch(`${API_BASE_URL}/users/${username}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return data.user;
    } else {
      alert(data.error || 'Erreur lors de la mise à jour');
      return null;
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la mise à jour du profil');
    return null;
  }
}
```

## Progression des Leçons

### 1. Mettre à jour la progression d'une leçon

```javascript
async function updateLessonProgress(moduleId, lessonId, completed, timeSpent = null) {
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await fetch(`${API_BASE_URL}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        moduleId,
        lessonId,
        completed,
        timeSpent,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return data;
    } else {
      console.error('Erreur:', data.error);
      return null;
    }
  } catch (error) {
    console.error('Erreur:', error);
    return null;
  }
}
```

### 2. Obtenir toute la progression

```javascript
async function getUserProgress(username = null) {
  const token = localStorage.getItem('authToken');
  const url = username 
    ? `${API_BASE_URL}/progress?username=${username}`
    : `${API_BASE_URL}/progress`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      const error = await response.json();
      console.error('Erreur:', error.error);
      return null;
    }
  } catch (error) {
    console.error('Erreur:', error);
    return null;
  }
}
```

## Gestion des Étudiants (Admin uniquement)

### 1. Créer un étudiant

```javascript
async function createStudent(studentData) {
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        username: studentData.username,
        email: studentData.email,
        password: studentData.password,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        enrollmentDate: studentData.enrollmentDate,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return data.user;
    } else {
      alert(data.error || 'Erreur lors de la création');
      return null;
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la création de l\'étudiant');
    return null;
  }
}
```

### 2. Obtenir tous les utilisateurs

```javascript
async function getAllUsers() {
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.users;
    } else {
      const error = await response.json();
      console.error('Erreur:', error.error);
      return [];
    }
  } catch (error) {
    console.error('Erreur:', error);
    return [];
  }
}
```

## Fonction utilitaire pour les requêtes authentifiées

```javascript
async function authenticatedFetch(url, options = {}) {
  const token = localStorage.getItem('authToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expiré ou invalide
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'index.html';
    return null;
  }

  return response;
}
```

## Exemple d'utilisation complète

```javascript
// Dans votre fichier index.html (page de connexion)
function valide_connexion() {
  const username = document.getElementById('login').value.trim();
  const password = document.getElementById('password').value;
  
  if (!username || !password) {
    alert('Veuillez remplir tous les champs');
    return;
  }
  
  login(username, password);
}

// Dans votre fichier profile.html
async function loadUserProfile() {
  const username = localStorage.getItem('username');
  if (!username) return;
  
  const user = await getUserProfile(username);
  if (user) {
    // Remplir les champs du formulaire
    document.getElementById('firstName').value = user.firstName || '';
    document.getElementById('lastName').value = user.lastName || '';
    document.getElementById('email').value = user.email || '';
  }
}

async function saveProfile(event) {
  event.preventDefault();
  
  const username = localStorage.getItem('username');
  const formData = new FormData(event.target);
  
  const profileData = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
  };
  
  const updatedUser = await updateProfile(username, profileData);
  if (updatedUser) {
    alert('Profil mis à jour avec succès !');
  }
}
```

