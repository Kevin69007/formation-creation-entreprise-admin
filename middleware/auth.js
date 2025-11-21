const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// Middleware d'authentification
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.warn('🔒 Accès refusé : aucun token fourni');
    return res.status(401).json({ error: 'Token d\'accès requis' });
  }

  try {
    // Vérifier le token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`🔑 Token valide pour l'utilisateur ID: ${decoded.userId}`);

    // Vérifier que l'utilisateur existe toujours et est actif
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, status: true, role: true }
    });

    if (!user || !user.status) {
      console.warn(`🚫 Utilisateur inactif ou inexistant: ID ${decoded.userId}`);
      return res.status(401).json({ error: 'Utilisateur non trouvé ou désactivé' });
    }

    req.user = {
      userId: decoded.userId,
      username: decoded.username || decoded.email, // Support pour les anciens tokens
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.warn('⏰ Token expiré');
      return res.status(401).json({ error: 'Token expiré' });
    }

    console.error('❌ Erreur de vérification du token:', error);
    return res.status(403).json({ error: 'Token invalide' });
  }
};

// Middleware d'autorisation
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.warn('🚫 Tentative d’accès sans authentification');
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    if (!roles.includes(req.user.role)) {
      console.warn(`🚫 Accès interdit: rôle '${req.user.role}' ne fait pas partie de ${roles}`);
      return res.status(403).json({ error: 'Accès non autorisé pour votre rôle' });
    }

    console.log(`✅ Autorisation confirmée pour le rôle: ${req.user.role}`);
    next();
  };
};

// Middleware de vérification de propriété
const checkOwnership = (model) => {
  return async (req, res, next) => {
    try {
      const resource = await prisma[model].findUnique({
        where: { id: req.params.id },
        select: { userId: true }
      });

      if (!resource) {
        console.warn(`❓ Ressource ${model} non trouvée: ID ${req.params.id}`);
        return res.status(404).json({ error: 'Ressource non trouvée' });
      }

      if (resource.userId !== req.user.userId && req.user.role !== 'ADMIN') {
        console.warn(`🚫 Propriété refusée: utilisateur ${req.user.userId} n’est pas propriétaire`);
        return res.status(403).json({ error: 'Accès non autorisé' });
      }

      console.log(`✅ Propriété vérifiée: accès accordé à l'utilisateur ${req.user.userId}`);
      next();
    } catch (error) {
      console.error(`❌ Erreur lors de la vérification de la propriété sur ${model}:`, error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  };
};

module.exports = {
  authenticateToken,
  authorize,
  checkOwnership
};
