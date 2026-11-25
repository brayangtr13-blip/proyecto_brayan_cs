// src/models/AuthModel.js
// MODELO: habla con la API (/login, /register) y guarda o lee la sesión. No valida formularios.
import httpService from '../services/httpService'
import storageService from '../services/storageService'
import jwtService from '../services/jwtService'
import API_CONFIG from '../config/api'
import { USER_ROLES } from '../config/constants'

// json-server-auth responde 400 con textos en inglés: se traducen para el usuario
const traducirError = (mensaje) => {
  if (/incorrect password|cannot find user/i.test(mensaje)) return 'El correo o la contraseña no coinciden.'
  if (/email already exists/i.test(mensaje)) return 'Ya hay una cuenta con ese correo.'
  if (/failed to fetch/i.test(mensaje)) return 'No hay conexión con el servidor. ¿Está encendido JSON Server?'
  return mensaje
}

class AuthModel {
  // POST /login → { accessToken, user }
  static async login(credentials) {
    try {
      const { accessToken, user } = await httpService.post(
        API_CONFIG.ENDPOINTS.LOGIN,
        { email: credentials.email.trim().toLowerCase(), password: credentials.password },
        false // el login no lleva token
      )
      // Regla de Control Store: una cuenta inactiva no puede entrar
      if (user.activo === false) {
        return { success: false, error: 'Tu cuenta está inactiva. Pide al administrador que la active.' }
      }
      storageService.setToken(accessToken)
      storageService.setUser(user)
      storageService.setUserRole(user.role)
      return { success: true, token: accessToken, user }
    } catch (error) {
      return { success: false, error: traducirError(error.message) }
    }
  }

  // POST /register → crea la cuenta (json-server-auth cifra la contraseña con bcrypt)
  static async register(userData) {
    try {
      const { user } = await httpService.post(
        API_CONFIG.ENDPOINTS.REGISTER,
        {
          email: userData.email.trim().toLowerCase(),
          password: userData.password,
          documento: userData.documento,
          nombre: userData.nombre.trim(),
          apellido: userData.apellido.trim(),
          telefono: userData.telefono || null,
          role: USER_ROLES.CAJERO, // toda cuenta nueva empieza como cajero; el admin cambia el rol
          activo: true
        },
        false
      )
      return { success: true, user }
    } catch (error) {
      return { success: false, error: traducirError(error.message) }
    }
  }

  // ¿Esta es la contraseña de este correo? Se pregunta a POST /login, que la compara con bcrypt.
  // No se guarda el token que responde: la sesión actual sigue igual.
  static async verifyPassword(email, password) {
    try {
      await httpService.post(API_CONFIG.ENDPOINTS.LOGIN, { email, password }, false)
      return true
    } catch {
      return false
    }
  }

  // PATCH /users/:id con la contraseña nueva: json-server-auth la cifra con bcrypt antes de guardarla
  static async changePassword(idUsuario, password) {
    try {
      await httpService.patch(API_CONFIG.ENDPOINTS.USER_BY_ID.replace(':id', idUsuario), { password })
      return { success: true }
    } catch (error) {
      return { success: false, error: traducirError(error.message) }
    }
  }

  // El JWT no se puede "apagar" en el servidor: cerrar sesión es borrarlo del navegador
  static async logout() {
    storageService.clearSession()
    return { success: true }
  }

  // Hay sesión si existe el token y no ha vencido; si venció, se limpia
  static isAuthenticated() {
    const token = storageService.getToken()
    if (!token) return false
    if (!jwtService.verifyToken(token)) {
      storageService.clearSession()
      return false
    }
    return true
  }

  static getCurrentUser() {
    return storageService.getUser()
  }

  static getCurrentToken() {
    return storageService.getToken()
  }
}

export default AuthModel
