// src/models/CashModel.js
// MODELO: turnos de caja (tabla arqueo_caja) en JSON Server.
import httpService from '../services/httpService'
import API_CONFIG from '../config/api'
import { fechaActual } from './AuditModel'

const { CASH, USERS, SALES } = API_CONFIG.ENDPOINTS

const fallo = (error) => ({
  success: false,
  status: error.status,
  error: /failed to fetch/i.test(error.message) ? 'No hay conexión con el servidor. ¿Está encendido JSON Server?' : error.message
})

// Adapter. "diferencia" es una columna calculada en MySQL: aquí también se calcula (contado − base − efectivo)
const aTurno = (f, usuarios = []) => {
  const u = usuarios.find((x) => x.id === f.id_usuario)
  return {
    id: f.id,
    idUsuario: f.id_usuario,
    cajero: u ? `${u.nombre} ${u.apellido}` : '—',
    fechaApertura: f.fecha_apertura,
    fechaCierre: f.fecha_cierre,
    montoInicial: f.monto_inicial,
    montoFinal: f.monto_final,
    totalVentas: f.total_ventas,
    totalEfectivo: f.total_efectivo,
    diferencia: f.monto_final === null ? null : f.monto_final - f.monto_inicial - f.total_efectivo,
    observacion: f.observacion
  }
}

class CashModel {
  // Todos los turnos (abiertos y cerrados) con el nombre del cajero
  static async getShifts() {
    try {
      const [filas, usuarios] = await Promise.all([httpService.get(`${CASH}?_sort=fecha_apertura&_order=desc`), httpService.get(USERS)])
      return { success: true, data: filas.map((f) => aTurno(f, usuarios)) }
    } catch (error) {
      return fallo(error)
    }
  }

  // Ventas de un turno (para el resumen del cierre)
  static async getShiftSales(idArqueo) {
    try {
      const ventas = await httpService.get(`${SALES}?id_arqueo=${idArqueo}`)
      return { success: true, data: ventas.map((v) => ({ id: v.id, idMetodoPago: v.id_metodo_pago, total: v.total, estado: v.estado })) }
    } catch (error) {
      return fallo(error)
    }
  }

  // Abrir turno: fecha_cierre vacía significa que el turno sigue abierto
  static async openShift({ idUsuario, montoInicial }) {
    try {
      const fila = await httpService.post(CASH, {
        id_usuario: idUsuario, fecha_apertura: fechaActual(), fecha_cierre: null, monto_inicial: montoInicial,
        monto_final: null, total_ventas: null, total_efectivo: null, observacion: null
      })
      return { success: true, data: aTurno(fila) }
    } catch (error) {
      return fallo(error)
    }
  }

  static async closeShift(id, { montoFinal, totalVentas, totalEfectivo, observacion }) {
    try {
      const fila = await httpService.patch(`${CASH}/${id}`, {
        fecha_cierre: fechaActual(), monto_final: montoFinal, total_ventas: totalVentas,
        total_efectivo: totalEfectivo, observacion: observacion || null
      })
      return { success: true, data: aTurno(fila) }
    } catch (error) {
      return fallo(error)
    }
  }
}

export default CashModel
