// src/controllers/UserController.js
// CONTROLADOR: valida el formulario (respuesta inmediata) y prepara los datos para el modelo.
// Capítulo IV: las reglas de negocio las hace cumplir el servidor y MySQL:
//  - solo el administrador entra a /api/users (authorizeRoles)
//  - documento y correo únicos (UNIQUE), un solo administrador (triggers)
//  - no se borra un usuario con ventas (llave foránea) ni la propia cuenta
import UserModel from '../models/UserModel'
import { isRequired, isValidDocument, isValidEmail, isValidPassword, isValidPhone } from '../utils/validators'

class UserController {
  static async getUsers() {
    return UserModel.getAllUsers()
  }

  static async getRoles() {
    return UserModel.getRoles()
  }

  // En edición la contraseña es opcional (vacía = no se cambia)
  static validar(datos, { esNuevo }) {
    const fields = {}
    if (!isValidDocument(datos.documento)) fields.documento = 'El documento tiene de 6 a 10 dígitos.'
    if (!isRequired(datos.nombre)) fields.nombre = 'Escribe el nombre.'
    if (!isRequired(datos.apellido)) fields.apellido = 'Escribe el apellido.'
    if (!isValidEmail(datos.email)) fields.email = 'El correo no tiene un formato válido.'
    if (!isValidPhone(datos.telefono)) fields.telefono = 'El celular tiene 10 dígitos y empieza por 3.'
    if (!isRequired(datos.role)) fields.role = 'Elige un rol.'
    if ((esNuevo || datos.password) && !isValidPassword(datos.password)) fields.password = 'Mínimo 8 caracteres, con letras y números.'
    return fields
  }

  // Solo los campos que se guardan; la contraseña va solo si se escribió
  static limpiar(datos) {
    const limpio = {
      documento: datos.documento,
      nombre: datos.nombre.trim(),
      apellido: datos.apellido.trim(),
      email: datos.email.trim().toLowerCase(),
      telefono: datos.telefono || null,
      role: datos.role
    }
    if (datos.password) limpio.password = datos.password
    return limpio
  }

  static async createUser(datos) {
    const fields = this.validar(datos, { esNuevo: true })
    if (Object.keys(fields).length) return { success: false, error: 'Revisa los campos marcados.', fields }
    return UserModel.createUser(this.limpiar(datos))
  }

  static async updateUser(id, datos) {
    const fields = this.validar(datos, { esNuevo: false })
    if (Object.keys(fields).length) return { success: false, error: 'Revisa los campos marcados.', fields }
    return UserModel.updateUser(id, this.limpiar(datos))
  }

  static async toggleActive(user) {
    return UserModel.updateUser(user.id, { activo: !user.activo })
  }

  static async deleteUser(user) {
    return UserModel.deleteUser(user.id)
  }
}

export default UserController
