// src/models/AuditModel.js
// MODELO: escribe en log_auditoria (RNF04). Cada acción importante deja quién, qué y cuándo.
import httpService from '../services/httpService'
import API_CONFIG from '../config/api'

// 'AAAA-MM-DD HH:MM:SS' en hora local, como las columnas DATETIME de MySQL
export const fechaActual = () => new Date().toLocaleString('sv-SE').replace('T', ' ')

class AuditModel {
  static async registrar({ idUsuario, idModulo, accion, detalle }) {
    try {
      await httpService.post(API_CONFIG.ENDPOINTS.AUDIT_LOG, {
        id_usuario: idUsuario, id_modulo: idModulo, accion, detalle, ip: null, fecha: fechaActual()
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message } // la auditoría no debe tumbar la acción principal
    }
  }
}

export default AuditModel
