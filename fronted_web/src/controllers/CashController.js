// src/controllers/CashController.js
// CONTROLADOR: turnos de caja (CS-22 · HU05) con las reglas de ventas_servicio.js del prototipo.
// rol_permiso: abrir turno y vender = ventas.registrar (admin y cajero); cerrar caja = solo administrador (RF18).
import CashModel from '../models/CashModel'
import SaleModel from '../models/SaleModel'
import AuditModel from '../models/AuditModel'
import AuthController from './AuthController'
import { METODO_EFECTIVO, MODULOS, USER_ROLES } from '../config/constants'
import { formatoPesos } from '../utils/helpers'

const VENDEN = [USER_ROLES.ADMIN, USER_ROLES.CAJERO]
const SIN_PERMISO = { success: false, error: 'Tu rol no tiene permiso para esta acción.' }

class CashController {
  static usuarioActual() {
    return AuthController.getAuthState().currentUser
  }

  static puedeCerrar() {
    return AuthController.isAdmin()
  }

  // El turno abierto (sin fecha_cierre) del usuario conectado, o null
  static async getMyShift() {
    if (!AuthController.hasAnyRole(VENDEN)) return SIN_PERMISO
    const result = await CashModel.getShifts()
    if (!result.success) return result
    const id = this.usuarioActual()?.id
    return { success: true, data: result.data.find((t) => t.idUsuario === id && !t.fechaCierre) ?? null }
  }

  // HU05: abrir turno con su base; un usuario no puede tener dos turnos abiertos
  static async openShift(montoInicial) {
    if (!AuthController.hasAnyRole(VENDEN)) return SIN_PERMISO
    const base = Number(montoInicial)
    if (String(montoInicial ?? '').trim() === '' || !(base >= 0)) {
      return { success: false, error: 'Escribe una base válida (0 o más).', fields: { montoInicial: 'Escribe una base válida (0 o más).' } }
    }
    const actual = await this.getMyShift()
    if (!actual.success) return actual
    if (actual.data) return { success: false, error: 'Ya tienes un turno abierto.' }

    const usuario = this.usuarioActual()
    const result = await CashModel.openShift({ idUsuario: usuario.id, montoInicial: base })
    if (result.success) {
      await AuditModel.registrar({ idUsuario: usuario.id, idModulo: MODULOS.VENTAS, accion: 'abrir_caja', detalle: `Abrió el turno #${result.data.id} con base de ${formatoPesos(base)}` })
    }
    return result
  }

  // CU027: lo recaudado en el turno por método de pago. Solo suman las ventas pagadas
  // (ni las anuladas ni los domicilios pendientes de entregar).
  static async getSummary(turno) {
    const [ventas, metodos] = await Promise.all([CashModel.getShiftSales(turno.id), SaleModel.getPaymentMethods()])
    if (!ventas.success) return ventas
    const pagadas = ventas.data.filter((v) => v.estado === 'pagada')
    const porMetodo = (metodos.data ?? [])
      .map((m) => {
        const delMetodo = pagadas.filter((v) => v.idMetodoPago === m.id)
        return { id: m.id, nombre: m.nombre, cantidad: delMetodo.length, total: delMetodo.reduce((s, v) => s + v.total, 0) }
      })
      .filter((m) => m.cantidad > 0)
    const totalVentas = pagadas.reduce((s, v) => s + v.total, 0)
    const totalEfectivo = porMetodo.find((m) => m.id === METODO_EFECTIVO)?.total ?? 0
    return { success: true, data: { porMetodo, totalVentas, totalEfectivo, numeroVentas: pagadas.length, efectivoEsperado: turno.montoInicial + totalEfectivo } }
  }

  // Misma fórmula que la columna calculada arqueo_caja.diferencia: negativo = faltante, positivo = sobrante
  static calcularDiferencia(turno, resumen, contado) {
    return Number(contado) - turno.montoInicial - resumen.totalEfectivo
  }

  // Turnos abiertos de todos los cajeros (los que el administrador puede cerrar) e histórico de cierres
  static async getShifts() {
    const result = await CashModel.getShifts()
    if (!result.success) return result
    const usuario = this.usuarioActual()
    const visibles = this.puedeCerrar() ? result.data : result.data.filter((t) => t.idUsuario === usuario?.id)
    return {
      success: true,
      data: {
        abiertos: visibles.filter((t) => !t.fechaCierre),
        cerrados: visibles.filter((t) => t.fechaCierre).sort((a, b) => b.fechaCierre.localeCompare(a.fechaCierre))
      }
    }
  }

  // HU05: cerrar un turno. Con diferencia, la observación es obligatoria. Después no se modifica.
  static async closeShift(turno, contado, observacion) {
    if (!this.puedeCerrar()) return { success: false, error: 'Solo el administrador puede cerrar la caja.' }
    if (turno.fechaCierre) return { success: false, error: 'Ese turno ya está cerrado.' }
    if (String(contado ?? '').trim() === '' || !(Number(contado) >= 0)) {
      return { success: false, error: 'Escribe el efectivo contado.', fields: { contado: 'Escribe el efectivo contado (0 o más).' } }
    }
    const resumen = await this.getSummary(turno)
    if (!resumen.success) return resumen
    const diferencia = this.calcularDiferencia(turno, resumen.data, contado)
    const nota = String(observacion ?? '').trim()
    if (diferencia !== 0 && !nota) {
      return { success: false, error: 'Explica la diferencia antes de cerrar.', fields: { observacion: 'Explica el faltante o sobrante.' } }
    }

    const result = await CashModel.closeShift(turno.id, {
      montoFinal: Number(contado), totalVentas: resumen.data.totalVentas, totalEfectivo: resumen.data.totalEfectivo, observacion: nota
    })
    if (result.success) {
      await AuditModel.registrar({
        idUsuario: this.usuarioActual().id, idModulo: MODULOS.VENTAS, accion: 'cerrar_caja',
        detalle: `Cerró el turno #${turno.id} de ${turno.cajero} con diferencia de ${formatoPesos(diferencia)}`
      })
    }
    return result.success ? { ...result, diferencia } : result
  }
}

export default CashController
