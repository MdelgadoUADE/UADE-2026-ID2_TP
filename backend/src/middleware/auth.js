/**
 * Middleware de autenticación y autorización
 * 
 * Nota: En un entorno de producción, esto debería usar JWT o sesiones reales.
 * Para el MVP, usamos un enfoque simplificado.
 */

/**
 * Middleware para verificar que el usuario está autenticado
 * En producción, verificaría un token JWT o sesión
 */
function requireAuth(req, res, next) {
  // En el MVP, asumimos que el frontend envía el user_id en headers
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Agregar info del usuario al request
  req.user = {
    user_id: userId,
    role: userRole || 'user'
  };

  next();
}

/**
 * Middleware para verificar que el usuario tiene rol de admin
 */
function requireAdmin(req, res, next) {
  // Primero verificar autenticación
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  // Agregar info del usuario al request
  req.user = {
    user_id: userId,
    role: userRole
  };

  next();
}

/**
 * Middleware para verificar rol específico
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    req.user = {
      user_id: userId,
      role: userRole
    };

    next();
  };
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireRole
};

// Made with Bob
