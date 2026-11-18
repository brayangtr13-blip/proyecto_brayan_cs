// utils/validators.js
// Las mismas reglas del frontend, otra vez en el servidor: nunca se confía solo en el navegador
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v ?? '').trim());
const isValidPassword = (v) => String(v ?? '').length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v);
const isValidDocument = (v) => /^\d{6,10}$/.test(String(v ?? ''));
const isValidPhone = (v) => !v || /^3\d{9}$/.test(String(v));
const isRequired = (v) => String(v ?? '').trim().length > 0;

// Valida los datos de un usuario; en edición los campos que no llegan no se revisan
function validarUsuario(datos, { esNuevo }) {
  const fields = {};
  const revisar = (campo) => esNuevo || datos[campo] !== undefined;
  if (revisar('documento') && !isValidDocument(datos.documento)) fields.documento = 'El documento tiene de 6 a 10 dígitos.';
  if (revisar('nombre') && !isRequired(datos.nombre)) fields.nombre = 'Escribe el nombre.';
  if (revisar('apellido') && !isRequired(datos.apellido)) fields.apellido = 'Escribe el apellido.';
  if (revisar('email') && !isValidEmail(datos.email)) fields.email = 'El correo no tiene un formato válido.';
  if (!isValidPhone(datos.telefono)) fields.telefono = 'El celular tiene 10 dígitos y empieza por 3.';
  if ((esNuevo || datos.password) && !isValidPassword(datos.password)) fields.password = 'Mínimo 8 caracteres, con letras y números.';
  return fields;
}

module.exports = { isValidEmail, isRequired, validarUsuario };
