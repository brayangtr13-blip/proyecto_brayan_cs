// src/models/AuditModel.js
// MODELO: escribe y lee log_auditoria (RNF04). Cada acción importante deja quién, qué y cuándo.
import httpService from '../services/httpService'
import API_CONFIG from '../config/api'

// 'AAAA-MM-DD HH:MM:SS' en hora local, como las columnas DATETIME de MySQL
export const fechaActual = () => new Date().toLocaleString('sv-SE').replace('T', ' ')

const nombreCompleto = (u) => `${u.nombre} ${u.apellido ?? ''}`.trim()

class AuditModel {
  // Lee el log completo y lo une con users y modulos (como un JOIN). Solo lectura: no hay editar ni borrar.
  static async getLog() {
    try {
      const { AUDIT_LOG, USERS, MODULES } = API_CONFIG.ENDPOINTS
      const [eventos, usuarios, modulos] = await Promise.all([AUDIT_LOG, USERS, MODULES].map((ruta) => httpService.get(ruta)))
      return {
        success: true,
        data: {
          eventos: eventos.map((e) => {
            const usuario = usuarios.find((u) => u.id === e.id_usuario)
            return {
              id: e.id, fecha: e.fecha, accion: e.accion, detalle: e.detalle ?? '', ip: e.ip ?? '—',
              idUsuario: e.id_usuario, usuario: usuario ? nombreCompleto(usuario) : 'Desconocido', rol: usuario?.role ?? 'sin sesión',
              idModulo: e.id_modulo, modulo: modulos.find((m) => m.id === e.id_modulo)?.nombre ?? '—'
            }
          }),
          usuarios: usuarios.map((u) => ({ id: u.id, nombre: nombreCompleto(u) })), // sin el hash de la contraseña
          modulos: modulos.map((m) => ({ id: m.id, nombre: m.nombre }))
        }
      }
    } catch (error) {
      return { success: false, error: /failed to fetch/i.test(error.message) ? 'No hay conexión con el servidor. ¿Está encendido JSON Server?' : error.message }
    }
  }

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
