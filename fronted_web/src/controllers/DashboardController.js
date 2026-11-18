// src/controllers/DashboardController.js
// CONTROLADOR: convierte los datos crudos en indicadores. Solo el administrador ve cifras de cuentas.
import DashboardModel from '../models/DashboardModel'
import AuthController from './AuthController'
import { USER_ROLES } from '../config/constants'

class DashboardController {
  static async getStats() {
    if (!AuthController.hasAnyRole([USER_ROLES.ADMIN])) return { success: true, data: null }

    const result = await DashboardModel.getData()
    if (!result.success) return result

    const { users, roles } = result.data
    const activos = users.filter((u) => u.activo).length
    // Cuántas cuentas hay de cada rol, sin mostrar roles vacíos
    const porRol = roles
      .map((r) => ({ rol: r.nombre, cantidad: users.filter((u) => u.role === r.nombre).length }))
      .filter((r) => r.cantidad > 0)
      .sort((a, b) => b.cantidad - a.cantidad)

    return {
      success: true,
      data: { total: users.length, activos, inactivos: users.length - activos, roles: porRol.length, porRol }
    }
  }
}

export default DashboardController
