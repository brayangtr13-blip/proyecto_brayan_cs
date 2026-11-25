// src/models/UserModel.js
// MODELO: CRUD de usuarios contra el backend Express (/api/users). Devuelve siempre { success, data | error }.
import httpService from '../services/httpService'
import API_CONFIG from '../config/api'

const { USERS, ROLES } = API_CONFIG.ENDPOINTS

// El mensaje y los errores por campo los manda el servidor (validaciones, triggers, llaves foráneas)
const fallo = (error) => ({ success: false, error: error.message, fields: error.fields, status: error.status })

class UserModel {
  static async getAllUsers() {
    try {
      const { data } = await httpService.get(USERS)
      return { success: true, data }
    } catch (error) {
      return fallo(error)
    }
  }

  static async getUserById(id) {
    try {
      const { data } = await httpService.get(`${USERS}/${id}`)
      return { success: true, data }
    } catch (error) {
      return fallo(error)
    }
  }

  static async getRoles() {
    try {
      const { data } = await httpService.get(ROLES)
      return { success: true, data }
    } catch (error) {
      return fallo(error)
    }
  }

  // POST /users → el servidor cifra la contraseña con bcrypt y la guarda en contrasena_hash
  static async createUser(userData) {
    try {
      const { data } = await httpService.post(USERS, userData)
      return { success: true, data }
    } catch (error) {
      return fallo(error)
    }
  }

  // PATCH /users/:id → cambia solo los campos enviados
  static async updateUser(id, cambios) {
    try {
      const { data } = await httpService.patch(`${USERS}/${id}`, cambios)
      return { success: true, data }
    } catch (error) {
      return fallo(error)
    }
  }

  static async deleteUser(id) {
    try {
      await httpService.delete(`${USERS}/${id}`)
      return { success: true }
    } catch (error) {
      return fallo(error)
    }
  }
}

export default UserModel
