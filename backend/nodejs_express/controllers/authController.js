// controllers/authController.js
// Sesión: login (crea la cookie con el JWT), registro, quién soy (/me) y logout (borra la cookie)
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const keys = require('../config/keys');
const { isValidEmail, isRequired, validarUsuario } = require('../utils/validators');
const { responderErrorBD } = require('../utils/errores');

// Mismo mensaje si el correo no existe o la contraseña falla: no revela qué cuentas existen
const CREDENCIALES_MALAS = 'El correo o la contraseña no coinciden.';

// bcrypt.compare lanza error si el hash guardado no es de bcrypt: se trata como contraseña incorrecta
const coincide = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
};

// Quita del usuario los datos internos antes de enviarlo al navegador
const publico = ({ contrasena_hash: _h, intentos_fallidos: _i, bloqueado: _b, ...user }) => user;

module.exports = {
  async login(req, res) {
    const email = String(req.body.email ?? '').trim().toLowerCase();
    const password = String(req.body.password ?? '');
    if (!isRequired(email) || !isRequired(password)) {
      return res.status(400).json({ success: false, message: 'Escribe tu correo y tu contraseña.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'El correo no tiene un formato válido.' });
    }

    try {
      const user = await User.findByEmailForLogin(email);
      if (!user) return res.status(401).json({ success: false, message: CREDENCIALES_MALAS });

      // El bloqueo se revisa antes de la contraseña: mientras dure, ni la correcta sirve
      if (user.bloqueado) {
        return res.status(423).json({ success: false, message: 'Cuenta bloqueada por 15 minutos tras 3 intentos fallidos.' });
      }
      if (!(await coincide(password, user.contrasena_hash))) {
        await User.registerFailedLogin(user.id);
        const quedan = 3 - (user.intentos_fallidos + 1);
        const aviso = quedan > 0 ? ` Te quedan ${quedan} intento(s).` : ' La cuenta quedó bloqueada 15 minutos.';
        return res.status(401).json({ success: false, message: CREDENCIALES_MALAS + aviso });
      }
      if (!user.activo) {
        return res.status(403).json({ success: false, message: 'Tu cuenta está inactiva. Pide al administrador que la active.' });
      }

      await User.resetFailedLogins(user.id);
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, keys.secretOrKey, { expiresIn: keys.expiresIn });

      // IV.4: el JWT viaja en una cookie HttpOnly; el JavaScript del navegador nunca lo ve
      res.cookie(keys.cookieName, token, keys.cookieOptions);
      return res.status(200).json({ success: true, message: 'Sesión iniciada.', data: publico(user) });
    } catch (err) {
      return responderErrorBD(res, err);
    }
  },

  // Registro público: la cuenta nace como cajero e INACTIVA; el administrador la activa
  async register(req, res) {
    const fields = validarUsuario(req.body, { esNuevo: true });
    if (Object.keys(fields).length) {
      return res.status(400).json({ success: false, message: 'Revisa los campos marcados.', fields });
    }
    try {
      const idRol = await User.findRoleId('cajero');
      const user = await User.create({
        documento: req.body.documento,
        nombre: req.body.nombre.trim(),
        apellido: req.body.apellido.trim(),
        email: req.body.email.trim().toLowerCase(),
        telefono: req.body.telefono,
        password: req.body.password,
        idRol,
        activo: false
      });
      return res.status(201).json({ success: true, message: 'Cuenta creada. Un administrador debe activarla.', data: user });
    } catch (err) {
      return responderErrorBD(res, err);
    }
  },

  // IV.8: el frontend pregunta "¿quién soy?" porque ya no puede leer el token (está en la cookie)
  async me(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user || !user.activo) {
        res.clearCookie(keys.cookieName, { ...keys.cookieOptions, maxAge: undefined });
        return res.status(401).json({ success: false, message: 'Tu cuenta ya no está activa.' });
      }
      return res.status(200).json({ success: true, data: user });
    } catch (err) {
      return responderErrorBD(res, err);
    }
  },

  // IV.9: cerrar sesión = el servidor borra la cookie
  logout(req, res) {
    res.clearCookie(keys.cookieName, { ...keys.cookieOptions, maxAge: undefined });
    return res.status(200).json({ success: true, message: 'Sesión cerrada.' });
  }
};
