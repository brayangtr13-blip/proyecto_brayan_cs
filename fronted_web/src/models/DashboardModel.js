// src/models/DashboardModel.js
// MODELO: trae los datos crudos que el dashboard resume (usuarios y roles del backend Express)
import httpService from '../services/httpService'
import API_CONFIG from '../config/api'

class DashboardModel {
  static async getData() {
    try {
      const [users, roles] = await Promise.all([
        httpService.get(API_CONFIG.ENDPOINTS.USERS),
        httpService.get(API_CONFIG.ENDPOINTS.ROLES)
      ])
      return { success: true, data: { users: users.data, roles: roles.data } }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}

export default DashboardModel
