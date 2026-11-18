// src/models/UserModel.js
// MODELO: CRUD de usuarios contra JSON Server. Devuelve siempre { success, data | error }.
import httpService from '../services/httpService'
import API_CONFIG from '../config/api'

const URL = API_CONFIG.ENDPOINTS.USERS

// Nunca se entrega el hash de la contraseña a las vistas (json-server-auth sí lo envía)
const sinPassword = ({ password: _password, ...user }) => user

const fallo = (error) => ({
  success: false,
  error: /failed to fetch/i.test(error.message) ? 'No hay conexión con el servidor. ¿Está encendido JSON Server?' : error.message
})

class UserModel {
  // GET /users?_sort=nombre → lista ordenada por nombre
  static async getAllUsers() {
    try {
      const users = await httpService.get(`${URL}?_sort=nombre&_order=asc`)
      return { success: true, data: users.map(sinPassword) }
    } catch (error) {
      return fallo(error)
    }
  }

  // GET /users/:id
  static async getUserById(id) {
    try {
      const user = await httpService.get(`${URL}/${id}`)
      return { success: true, data: sinPassword(user) }
    } catch (error) {
      if (error.status === 404) return { success: false, error: 'El usuario no existe.' }
      return fallo(error)
    }
  }

  // POST /users → json-server-auth cifra la contraseña y responde { accessToken, user }
  static async createUser(userData) {
    try {
      const { user } = await httpService.post(URL, userData)
      return { success: true, data: user }
    } catch (error) {
      if (/email already exists/i.test(error.message)) return { success: false, error: 'Ya hay una cuenta con ese correo.' }
      return fallo(error)
    }
  }

  // PATCH /users/:id → cambia solo los campos enviados (PUT reemplazaría el registro completo)
  static async updateUser(id, cambios) {
    try {
      const user = await httpService.patch(`${URL}/${id}`, cambios)
      return { success: true, data: sinPassword(user) }
    } catch (error) {
      return fallo(error)
    }
  }

  // GET /roles → para el selector de rol del formulario
  static async getRoles() {
    try {
      return { success: true, data: await httpService.get(API_CONFIG.ENDPOINTS.ROLES, false) }
    } catch (error) {
      return fallo(error)
    }
  }

  // DELETE /users/:id
  static async deleteUser(id) {
    try {
      await httpService.delete(`${URL}/${id}`)
      return { success: true }
    } catch (error) {
      return fallo(error)
    }
  }
}

export default UserModel
