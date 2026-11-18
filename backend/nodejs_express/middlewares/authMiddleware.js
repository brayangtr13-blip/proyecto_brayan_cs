// middlewares/authMiddleware.js
// Protege rutas: verifica el JWT y el rol antes de llegar al controlador
const jwt = require('jsonwebtoken');
const keys = require('../config/keys');

// Lee el token de la cookie HttpOnly (web). Acepta también "Authorization: Bearer" para la app móvil.
function verifyToken(req, res, next) {
  const encabezado = req.headers.authorization;
  const token = req.cookies?.[keys.cookieName] || (encabezado?.startsWith('Bearer ') ? encabezado.slice(7) : null);

  if (!token) {
    return res.status(401).json({ success: false, message: 'Inicia sesión para continuar.' });
  }

  jwt.verify(token, keys.secretOrKey, (err, decoded) => {
    if (err) {
      const vencido = err.name === 'TokenExpiredError';
      return res.status(401).json({
        success: false,
        message: vencido ? 'La sesión venció. Inicia sesión de nuevo.' : 'La sesión no es válida.'
      });
    }
    req.user = decoded; // { id, email, role } para los siguientes middlewares y controladores
    next();
  });
}

// authorizeRoles(['administrador']): solo deja pasar a esos roles
function authorizeRoles(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado: se requiere rol ${roles.join(' o ')}.`
      });
    }
    next();
  };
}

module.exports = { verifyToken, authorizeRoles };
