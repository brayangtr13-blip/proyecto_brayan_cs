// src/models/AuthModel.js
// MODELO: habla con /auth del backend Express. Capítulo IV: no guarda nada en el navegador;
// la cookie HttpOnly la crea y la borra el servidor. Devuelve siempre { success, data | error }.
import httpService from '../services/httpService'
import API_CONFIG from '../config/api'

const { LOGIN, REGISTER, ME, LOGOUT } = API_CONFIG.ENDPOINTS

const fallo = (error) => ({ success: false, error: error.message, fields: error.fields, status: error.status })

class AuthModel {
  // POST /auth/login → el servidor responde el usuario y deja la cookie con el JWT
  static async login(credentials) {
    try {
      const { data } = await httpService.post(LOGIN, {
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password
      })
      return { success: true, user: data }
    } catch (error) {
      return fallo(error) // contraseña mala, cuenta inactiva o bloqueada: el mensaje lo da el servidor
    }
  }

  // POST /auth/register → la cuenta queda inactiva hasta que el administrador la active
  static async register(userData) {
    try {
      const { message, data } = await httpService.post(REGISTER, {
        documento: userData.documento,
        nombre: userData.nombre.trim(),
        apellido: userData.apellido.trim(),
        email: userData.email.trim().toLowerCase(),
        telefono: userData.telefono || null,
        password: userData.password
      })
      return { success: true, user: data, message }
    } catch (error) {
      return fallo(error)
    }
  }

  // IV.8: GET /auth/me → ¿hay sesión? El navegador no puede leer la cookie, así que pregunta al servidor
  static async me() {
    try {
      const { data } = await httpService.get(ME)
      return { success: true, user: data }
    } catch (error) {
      return fallo(error) // 401 = no hay sesión (o venció)
    }
  }

  // IV.9: POST /auth/logout → el servidor borra la cookie
  static async logout() {
    try {
      await httpService.post(LOGOUT)
      return { success: true }
    } catch (error) {
      return fallo(error)
    }
  }
}

export default AuthModel
