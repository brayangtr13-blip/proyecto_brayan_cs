// models/user.js
// MODELO: SQL de la tabla usuarios (con su rol). Los "?" son consultas preparadas: evitan inyección SQL.
const db = require('../config/config');
const bcrypt = require('bcryptjs');

const User = {};

// Columnas públicas: nunca se selecciona contrasena_hash salvo para el login
const COLUMNAS = `
  u.id_usuario AS id, u.documento, u.nombre, u.apellido, u.email, u.telefono,
  r.nombre AS role, u.activo, u.fecha_registro AS fechaRegistro`;

// MySQL guarda activo como 1/0; la API lo entrega como true/false
const formatear = (fila) => (fila ? { ...fila, activo: fila.activo === 1 } : null);

User.findAll = async () => {
  const [filas] = await db.query(
    `SELECT ${COLUMNAS} FROM usuarios u JOIN roles r ON r.id_rol = u.id_rol ORDER BY u.nombre, u.apellido`
  );
  return filas.map(formatear);
};

User.findById = async (id) => {
  const [filas] = await db.query(
    `SELECT ${COLUMNAS} FROM usuarios u JOIN roles r ON r.id_rol = u.id_rol WHERE u.id_usuario = ?`,
    [id]
  );
  return formatear(filas[0]);
};

// Solo para el login: incluye el hash y los datos del bloqueo
User.findByEmailForLogin = async (email) => {
  const [filas] = await db.query(
    `SELECT ${COLUMNAS}, u.contrasena_hash, u.intentos_fallidos,
            (u.bloqueado_hasta IS NOT NULL AND u.bloqueado_hasta > NOW()) AS bloqueado
       FROM usuarios u JOIN roles r ON r.id_rol = u.id_rol
      WHERE u.email = ?`,
    [email]
  );
  return filas[0] ? { ...formatear(filas[0]), bloqueado: filas[0].bloqueado === 1 } : null;
};

// Intento fallido: el trigger trg_usuarios_bloqueo_bu bloquea 15 minutos al llegar a 3
User.registerFailedLogin = async (id) => {
  await db.query('UPDATE usuarios SET intentos_fallidos = intentos_fallidos + 1 WHERE id_usuario = ?', [id]);
};

// Login correcto: reinicia el contador (el trigger quita el bloqueo)
User.resetFailedLogins = async (id) => {
  await db.query('UPDATE usuarios SET intentos_fallidos = 0 WHERE id_usuario = ?', [id]);
};

// Busca el id del rol a partir de su nombre (el frontend envía "cajero", la tabla guarda id_rol)
User.findRoleId = async (nombreRol) => {
  const [filas] = await db.query('SELECT id_rol FROM roles WHERE nombre = ?', [nombreRol]);
  return filas[0]?.id_rol ?? null;
};

User.findAllRoles = async () => {
  const [filas] = await db.query('SELECT id_rol AS id, nombre FROM roles ORDER BY id_rol');
  return filas;
};

User.create = async (user) => {
  const hash = await bcrypt.hash(user.password, 10);
  const [res] = await db.query(
    `INSERT INTO usuarios (documento, nombre, apellido, email, telefono, id_rol, contrasena_hash, activo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [user.documento, user.nombre, user.apellido, user.email, user.telefono || null, user.idRol, hash, user.activo ? 1 : 0]
  );
  return User.findById(res.insertId);
};

// Actualiza solo los campos que llegan (como el PATCH del frontend)
User.update = async (id, user) => {
  const campos = [];
  const valores = [];
  const agregar = (columna, valor) => {
    campos.push(`${columna} = ?`);
    valores.push(valor);
  };

  if (user.documento !== undefined) agregar('documento', user.documento);
  if (user.nombre !== undefined) agregar('nombre', user.nombre);
  if (user.apellido !== undefined) agregar('apellido', user.apellido);
  if (user.email !== undefined) agregar('email', user.email);
  if (user.telefono !== undefined) agregar('telefono', user.telefono || null);
  if (user.idRol !== undefined) agregar('id_rol', user.idRol);
  if (user.activo !== undefined) agregar('activo', user.activo ? 1 : 0);
  if (user.password) agregar('contrasena_hash', await bcrypt.hash(user.password, 10));

  if (campos.length > 0) {
    valores.push(id);
    await db.query(`UPDATE usuarios SET ${campos.join(', ')} WHERE id_usuario = ?`, valores);
  }
  return User.findById(id);
};

User.delete = async (id) => {
  const [res] = await db.query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
  return res.affectedRows > 0;
};

module.exports = User;
