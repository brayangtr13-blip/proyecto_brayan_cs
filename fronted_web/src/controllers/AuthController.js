// src/controllers/AuthController.js
// CONTROLADOR: valida lo que escribe el usuario antes de llamar al modelo (respuesta inmediata).
// Capítulo IV: el servidor vuelve a validar todo; las reglas de verdad viven allá.
import AuthModel from '../models/AuthModel'
import { USER_ROLES } from '../config/constants'
import { isRequired, isValidDocument, isValidEmail, isValidPassword, isValidPhone } from '../utils/validators'

class AuthController {
  static async handleLogin(credentials) {
    if (!isRequired(credentials.email) || !isRequired(credentials.password)) {
      return { success: false, error: 'Escribe tu correo y tu contraseña.' }
    }
    if (!isValidEmail(credentials.email)) {
      return { success: false, error: 'El correo no tiene un formato válido.' }
    }
    return AuthModel.login(credentials)
  }

  // Registro: errores por campo para mostrarlos junto a cada input
  static async handleRegister(userData) {
    const errores = {}
    if (!isValidDocument(userData.documento)) errores.documento = 'El documento tiene de 6 a 10 dígitos.'
    if (!isRequired(userData.nombre)) errores.nombre = 'Escribe tu nombre.'
    if (!isRequired(userData.apellido)) errores.apellido = 'Escribe tu apellido.'
    if (!isValidEmail(userData.email)) errores.email = 'El correo no tiene un formato válido.'
    if (!isValidPhone(userData.telefono)) errores.telefono = 'El celular tiene 10 dígitos y empieza por 3.'
    if (!isValidPassword(userData.password)) errores.password = 'Mínimo 8 caracteres, con letras y números.'
    if (userData.password !== userData.confirmPassword) errores.confirmPassword = 'Las contraseñas no coinciden.'

    if (Object.keys(errores).length > 0) {
      return { success: false, error: 'Revisa los campos marcados.', fields: errores }
    }
    return AuthModel.register(userData)
  }

  static async handleLogout() {
    return AuthModel.logout()
  }

  // IV.8: ¿hay sesión? Lo responde el servidor leyendo la cookie
  static async checkSession() {
    return AuthModel.me()
  }

  static isAdmin(user) {
    return user?.role === USER_ROLES.ADMIN
  }
}

export default AuthController
