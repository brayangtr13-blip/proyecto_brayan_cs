// config/keys.js
// Datos del JWT y de la cookie que lo guarda. La clave nunca sale del servidor.
require('dotenv').config({ quiet: true });

if (!process.env.JWT_SECRET) {
  throw new Error('Falta JWT_SECRET en el archivo .env (copia .env.example como .env).');
}

module.exports = {
  secretOrKey: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  cookieName: 'cs_token',
  // HttpOnly: JavaScript del navegador no puede leerla (protege contra robo por XSS)
  // SameSite=Lax: no se envía desde otros sitios (protege contra CSRF)
  // Secure: solo por HTTPS; en desarrollo (http://localhost) va en false
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000 // 8 horas, igual que el JWT
  }
};
