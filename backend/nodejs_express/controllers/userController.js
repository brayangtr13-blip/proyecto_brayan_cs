// controllers/userController.js
// CRUD de usuarios. Las rutas ya exigen rol administrador (authorizeRoles); aquí van las demás reglas.
const User = require('../models/user');
const { validarUsuario } = require('../utils/validators');
const { responderErrorBD } = require('../utils/errores');

const noExiste = (res) => res.status(404).json({ success: false, message: 'El usuario no existe.' });

// Normaliza el cuerpo: textos sin espacios extra, correo en minúscula y rol convertido a id_rol
async function prepararDatos(body) {
  const datos = { ...body };
  if (datos.nombre !== undefined) datos.nombre = String(datos.nombre).trim();
  if (datos.apellido !== undefined) datos.apellido = String(datos.apellido).trim();
  if (datos.email !== undefined) datos.email = String(datos.email).trim().toLowerCase();
  if (datos.role !== undefined) {
    datos.idRol = await User.findRoleId(datos.role);
    if (!datos.idRol) return { error: { role: 'El rol no existe.' } };
  }
  return { datos };
}

module.exports = {
  async getAllUsers(req, res) {
    try {
      return res.status(200).json({ success: true, data: await User.findAll() });
    } catch (err) {
      return responderErrorBD(res, err);
    }
  },

  async getUserById(req, res) {
    try {
      const user = await User.findById(req.params.id);
      return user ? res.status(200).json({ success: true, data: user }) : noExiste(res);
    } catch (err) {
      return responderErrorBD(res, err);
    }
  },

  async getRoles(req, res) {
    try {
      return res.status(200).json({ success: true, data: await User.findAllRoles() });
    } catch (err) {
      return responderErrorBD(res, err);
    }
  },

  async createUser(req, res) {
    const fields = validarUsuario(req.body, { esNuevo: true });
    if (!req.body.role) fields.role = 'Elige un rol.';
    if (Object.keys(fields).length) return res.status(400).json({ success: false, message: 'Revisa los campos marcados.', fields });
    try {
      const { datos, error } = await prepararDatos(req.body);
      if (error) return res.status(400).json({ success: false, message: 'Revisa los campos marcados.', fields: error });
      const user = await User.create({ ...datos, activo: true });
      return res.status(201).json({ success: true, message: 'Usuario creado.', data: user });
    } catch (err) {
      return responderErrorBD(res, err); // documento/correo repetido o segundo administrador (trigger)
    }
  },

  // PATCH: cambia solo lo que llega (datos, rol, contraseña o activo)
  async updateUser(req, res) {
    const id = Number(req.params.id);
    const fields = validarUsuario(req.body, { esNuevo: false });
    if (Object.keys(fields).length) return res.status(400).json({ success: false, message: 'Revisa los campos marcados.', fields });
    if (id === req.user.id && req.body.activo === false) {
      return res.status(409).json({ success: false, message: 'No puedes inactivar tu propia cuenta.' });
    }
    try {
      if (!(await User.findById(id))) return noExiste(res);
      const { datos, error } = await prepararDatos(req.body);
      if (error) return res.status(400).json({ success: false, message: 'Revisa los campos marcados.', fields: error });
      const user = await User.update(id, datos);
      return res.status(200).json({ success: true, message: 'Usuario actualizado.', data: user });
    } catch (err) {
      return responderErrorBD(res, err); // el trigger protege al administrador único
    }
  },

  async deleteUser(req, res) {
    const id = Number(req.params.id);
    if (id === req.user.id) {
      return res.status(409).json({ success: false, message: 'No puedes eliminar tu propia cuenta.' });
    }
    try {
      const borrado = await User.delete(id);
      return borrado ? res.status(200).json({ success: true, message: 'Usuario eliminado.' }) : noExiste(res);
    } catch (err) {
      return responderErrorBD(res, err); // administrador (trigger) o con ventas asociadas (FK)
    }
  }
};
