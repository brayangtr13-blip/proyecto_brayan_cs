// src/controllers/UserController.js
// CONTROLADOR: reglas de negocio de usuarios antes de llamar al modelo.
// json-server-auth solo exige sesión; las reglas por rol se aplican aquí (en Express pasarán al servidor).
import UserModel from '../models/UserModel'
import AuthController from './AuthController'
import { USER_ROLES } from '../config/constants'
import { isRequired, isValidDocument, isValidEmail, isValidPassword, isValidPhone } from '../utils/validators'

const SOLO_ADMIN = { success: false, error: 'Solo el administrador puede gestionar usuarios.' }

class UserController {
  static puedeGestionar() {
    return AuthController.hasAnyRole([USER_ROLES.ADMIN])
  }

  static async getUsers() {
    if (!this.puedeGestionar()) return SOLO_ADMIN
    return UserModel.getAllUsers()
  }

  static async getUser(id) {
    if (!this.puedeGestionar()) return SOLO_ADMIN
    return UserModel.getUserById(id)
  }

  static async getRoles() {
    return UserModel.getRoles()
  }

  // Valida el formulario. En edición la contraseña es opcional (vacía = no se cambia).
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

  // Reglas que necesitan la lista actual: documento único y un solo administrador
  static async reglasDeNegocio(datos, idActual) {
    const lista = await UserModel.getAllUsers()
    if (!lista.success) return { error: lista.error }
    const fields = {}
    if (lista.data.some((u) => u.documento === datos.documento && u.id !== idActual)) {
      fields.documento = 'Ya hay una cuenta con ese documento.'
    }
    const adminActual = lista.data.find((u) => u.role === USER_ROLES.ADMIN)
    if (datos.role === USER_ROLES.ADMIN && adminActual && adminActual.id !== idActual) {
      fields.role = 'Ya existe un administrador: el sistema admite solo uno.'
    }
    if (adminActual?.id === idActual && datos.role !== USER_ROLES.ADMIN) {
      fields.role = 'El administrador no puede cambiar de rol: el sistema quedaría sin administrador.'
    }
    return { fields }
  }

  // Deja solo los campos que se guardan, con el formato de db.json
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
    if (!this.puedeGestionar()) return SOLO_ADMIN
    const fields = this.validar(datos, { esNuevo: true })
    if (Object.keys(fields).length) return { success: false, error: 'Revisa los campos marcados.', fields }
    const reglas = await this.reglasDeNegocio(datos)
    if (reglas.error) return { success: false, error: reglas.error }
    if (Object.keys(reglas.fields).length) return { success: false, error: 'Revisa los campos marcados.', fields: reglas.fields }
    return UserModel.createUser({ ...this.limpiar(datos), activo: true })
  }

  static async updateUser(id, datos) {
    if (!this.puedeGestionar()) return SOLO_ADMIN
    const fields = this.validar(datos, { esNuevo: false })
    if (Object.keys(fields).length) return { success: false, error: 'Revisa los campos marcados.', fields }
    const reglas = await this.reglasDeNegocio(datos, id)
    if (reglas.error) return { success: false, error: reglas.error }
    if (Object.keys(reglas.fields).length) return { success: false, error: 'Revisa los campos marcados.', fields: reglas.fields }
    return UserModel.updateUser(id, this.limpiar(datos))
  }

  // Activar o inactivar: el administrador nunca se inactiva (nadie podría reactivar cuentas)
  static async toggleActive(user) {
    if (!this.puedeGestionar()) return SOLO_ADMIN
    if (user.role === USER_ROLES.ADMIN) return { success: false, error: 'No se puede inactivar al administrador.' }
    return UserModel.updateUser(user.id, { activo: !user.activo })
  }

  static async deleteUser(user) {
    if (!this.puedeGestionar()) return SOLO_ADMIN
    if (user.role === USER_ROLES.ADMIN) return { success: false, error: 'No se puede eliminar al administrador.' }
    if (user.id === AuthController.getAuthState().currentUser?.id) return { success: false, error: 'No puedes eliminar tu propia cuenta.' }
    return UserModel.deleteUser(user.id)
  }
}

export default UserController
