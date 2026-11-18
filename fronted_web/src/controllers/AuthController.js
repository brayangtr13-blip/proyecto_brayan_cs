// src/controllers/AuthController.js
// CONTROLADOR: valida lo que escribe el usuario y coordina al modelo. No toca la API directamente.
import AuthModel from '../models/AuthModel'
import { isRequired, isValidDocument, isValidEmail, isValidPassword, isValidPhone } from '../utils/validators'

class AuthController {
  // Login: primero validar (sin gastar una petición), luego pedir al modelo
  static async handleLogin(credentials) {
    if (!isRequired(credentials.email) || !isRequired(credentials.password)) {
      return { success: false, error: 'Escribe tu correo y tu contraseña.' }
    }
    if (!isValidEmail(credentials.email)) {
      return { success: false, error: 'El correo no tiene un formato válido.' }
    }
    return AuthModel.login(credentials)
  }

  // Registro: devuelve los errores por campo para mostrarlos junto a cada input
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

  // Estado actual de la sesión (lo usa useAuth al montar)
  static getAuthState() {
    return {
      isAuthenticated: AuthModel.isAuthenticated(),
      currentUser: AuthModel.getCurrentUser(),
      currentToken: AuthModel.getCurrentToken()
    }
  }

  static getUserRole() {
    return AuthModel.getCurrentUser()?.role ?? null
  }

  // ¿El usuario tiene alguno de estos roles? Ej.: hasAnyRole(['administrador', 'cajero'])
  static hasAnyRole(allowedRoles) {
    return allowedRoles.includes(this.getUserRole())
  }
}

export default AuthController
