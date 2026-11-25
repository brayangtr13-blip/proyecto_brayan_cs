// src/controllers/SaleController.js
// CONTROLADOR: ventas (CS-18 a CS-21 · HU01–HU04) con las reglas de ventas_servicio.js del prototipo.
// JSON Server solo guarda datos: aquí se valida todo ANTES de guardar algo, para no dejar
// una venta a medias ni stock descontado sin venta (en un backend real sería una transacción).
import SaleModel from '../models/SaleModel'
import ProductModel from '../models/ProductModel'
import AuditModel from '../models/AuditModel'
import AuthController from './AuthController'
import CashController from './CashController'
import { METODO_EFECTIVO, MODULOS, USER_ROLES } from '../config/constants'
import { formatoPesos } from '../utils/helpers'

const VER_Y_VENDER = [USER_ROLES.ADMIN, USER_ROLES.CAJERO] // ventas.ver y ventas.registrar
const SIN_PERMISO = { success: false, error: 'Tu rol no tiene permiso para esta acción.' }

const normalizar = (texto) => String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Fecha local AAAA-MM-DD de un texto 'AAAA-MM-DD HH:MM:SS' (para comparar con <input type="date">)
const dia = (fecha) => String(fecha).slice(0, 10)

class SaleController {
  static usuarioActual() {
    return AuthController.getAuthState().currentUser
  }

  // RF17 y rol_permiso: solo el administrador anula ventas
  static puedeAnularRol() {
    return AuthController.isAdmin()
  }

  // HU04: por qué una venta no se puede anular (null = sí se puede)
  static razonNoAnulable(venta) {
    if (!this.puedeAnularRol()) return 'Solo el administrador puede anular ventas.'
    if (venta.estado === 'anulada') return 'La venta ya está anulada.'
    if (venta.esDomicilio) return 'Es un pedido a domicilio: se cancela desde Domicilios.'
    return null
  }

  // ---------- Punto de venta (HU01) ----------

  // Código exacto (lector de barras) o parte del nombre, sin importar tildes
  static buscarProducto(texto, productos) {
    const valor = String(texto ?? '').trim()
    if (!valor) return undefined
    return productos.find((p) => p.codigo === valor.split('·')[0].trim())
      ?? productos.find((p) => normalizar(p.nombre).includes(normalizar(valor)))
  }

  // Sin inactivos, sin stock 0 y sin superar el stock. Devuelve null o el mensaje.
  static validarCantidad(producto, cantidad) {
    if (!producto.activo) return `${producto.nombre} está dado de baja.`
    if (producto.stockActual === 0) return `${producto.nombre} no tiene stock.`
    if (cantidad > producto.stockActual) return `Stock insuficiente de ${producto.nombre}: solo hay ${producto.stockActual} unidades.`
    return null
  }

  // Sin columna de IVA en la base: total = suma de subtotales (precios con IVA incluido)
  static calcularTotal(items) {
    return items.reduce((suma, i) => suma + i.cantidad * i.precio, 0)
  }

  // Cambio solo para efectivo; null si lo recibido no alcanza
  static calcularCambio(total, recibido) {
    const valor = Number(recibido)
    return valor >= total ? valor - total : null
  }

  static async getPaymentMethods() {
    return SaleModel.getPaymentMethods()
  }

  // HU01: registrar la venta. Primero se valida TODO y solo después se guarda.
  static async registrarVenta(items, idMetodoPago, recibido) {
    if (!AuthController.hasAnyRole(VER_Y_VENDER)) return SIN_PERMISO
    const turno = await CashController.getMyShift()
    if (!turno.success) return turno
    if (!turno.data) return { success: false, error: 'Abre la caja antes de vender.' }
    if (items.length === 0) return { success: false, error: 'Agrega al menos un producto.' }
    if (!idMetodoPago) return { success: false, error: 'Elige el método de pago.' }

    // Stock más reciente desde el servidor (otro cajero pudo vender mientras tanto)
    const productos = await ProductModel.getProducts()
    if (!productos.success) return productos
    for (const item of items) {
      const producto = productos.data.find((p) => p.codigo === item.codigo)
      const error = producto ? this.validarCantidad(producto, item.cantidad) : `${item.nombre} ya no existe.`
      if (error) return { success: false, error }
    }
    const total = this.calcularTotal(items)
    const efectivo = Number(idMetodoPago) === METODO_EFECTIVO
    if (efectivo && this.calcularCambio(total, recibido) === null) {
      return { success: false, error: 'El valor recibido no alcanza para el total.', fields: { recibido: 'No alcanza para el total.' } }
    }

    // Validado: venta → detalle → descontar stock con su salida en el kárdex → auditoría
    const usuario = this.usuarioActual()
    const venta = await SaleModel.createSale({ idUsuario: usuario.id, idArqueo: turno.data.id, idMetodoPago: Number(idMetodoPago), total })
    if (!venta.success) return venta
    for (const item of items) {
      const producto = productos.data.find((p) => p.codigo === item.codigo)
      await SaleModel.addDetail({ idVenta: venta.data.id, codigo: item.codigo, cantidad: item.cantidad, precio: item.precio })
      await ProductModel.updateProduct(item.codigo, { stockActual: producto.stockActual - item.cantidad })
      await ProductModel.addMovement({ codigo: item.codigo, idUsuario: usuario.id, tipo: 'salida', cantidad: item.cantidad, observacion: `Venta #${venta.data.id}` })
    }
    await AuditModel.registrar({ idUsuario: usuario.id, idModulo: MODULOS.VENTAS, accion: 'registrar', detalle: `Registró la venta #${venta.data.id} por ${formatoPesos(total)}` })

    return { success: true, data: { ...venta.data, total }, cambio: efectivo ? this.calcularCambio(total, recibido) : null }
  }

  // ---------- Listar y consultar (HU02, HU03) ----------

  // El cajero solo ve sus ventas; el administrador, todas. Con número de factura se busca en todas las fechas.
  static async getSales(filtros = {}) {
    if (!AuthController.hasAnyRole(VER_Y_VENDER)) return SIN_PERMISO
    const result = await SaleModel.getSales()
    if (!result.success) return result
    const usuario = this.usuarioActual()
    const esAdmin = AuthController.isAdmin()
    const data = result.data.filter((v) => {
      if (!esAdmin && v.idUsuario !== usuario.id) return false
      if (filtros.factura) return v.id === Number(filtros.factura)
      if (filtros.desde && dia(v.fecha) < filtros.desde) return false
      if (filtros.hasta && dia(v.fecha) > filtros.hasta) return false
      if (filtros.idCajero && v.idUsuario !== Number(filtros.idCajero)) return false
      if (filtros.idMetodo && v.idMetodoPago !== Number(filtros.idMetodo)) return false
      return true
    })
    return { success: true, data }
  }

  // HU04: solo suman las ventas pagadas: ni las anuladas ni los domicilios pendientes de entregar
  static totalPagadas(ventas) {
    return ventas.reduce((suma, v) => (v.estado === 'pagada' ? suma + v.total : suma), 0)
  }

  static async getSale(id) {
    if (!AuthController.hasAnyRole(VER_Y_VENDER)) return SIN_PERMISO
    const result = await SaleModel.getSale(id)
    if (!result.success) return result
    // El cajero solo consulta las suyas (misma regla que la lista)
    if (!AuthController.isAdmin() && result.data.idUsuario !== this.usuarioActual()?.id) {
      return { success: false, status: 404, error: 'Venta no encontrada.' }
    }
    return result
  }

  // ---------- Anular (HU04) ----------

  // Anular = cambiar estado + devolver stock con su entrada en el kárdex + auditoría.
  // "devolucion" (CU022) es una anulación con motivo "Devolución". La venta no se borra: queda en el historial.
  static async anularVenta(id, tipo, motivo) {
    const actual = await SaleModel.getSale(id)
    if (!actual.success) return actual
    const venta = actual.data
    const razon = this.razonNoAnulable(venta)
    if (razon) return { success: false, error: razon }
    const texto = String(motivo ?? '').trim()
    if (texto.length < 10) return { success: false, error: 'El motivo debe tener al menos 10 caracteres.', fields: { motivo: 'Mínimo 10 caracteres.' } }

    const usuario = this.usuarioActual()
    const etiqueta = tipo === 'devolucion' ? 'Devolución' : 'Anulación'
    const productos = await ProductModel.getProducts()
    if (!productos.success) return productos
    for (const renglon of venta.detalle) {
      const producto = productos.data.find((p) => p.codigo === renglon.codigo)
      if (producto) await ProductModel.updateProduct(renglon.codigo, { stockActual: producto.stockActual + renglon.cantidad })
      await ProductModel.addMovement({ codigo: renglon.codigo, idUsuario: usuario.id, tipo: 'entrada', cantidad: renglon.cantidad, observacion: `${etiqueta} de la venta #${venta.id}` })
    }
    const result = await SaleModel.setStatus(venta.id, 'anulada')
    if (!result.success) return result
    await AuditModel.registrar({
      idUsuario: usuario.id, idModulo: MODULOS.VENTAS, accion: 'anular',
      detalle: `Anuló la venta #${venta.id} por ${formatoPesos(venta.total)}. Motivo: ${tipo === 'devolucion' ? 'Devolución: ' : ''}${texto}`
    })
    return { success: true, message: `Venta #${venta.id} anulada. El stock volvió al inventario.` }
  }
}

export default SaleController
