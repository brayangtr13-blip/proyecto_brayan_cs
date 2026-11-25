// src/models/SaleModel.js
// MODELO: ventas, detalle_venta y metodos_pago en JSON Server. Reemplaza a ventas_datos.js del prototipo.
// Patrón Adapter: db.json usa las columnas de MySQL (id_metodo_pago); las vistas, camelCase (idMetodoPago).
import httpService from '../services/httpService'
import API_CONFIG from '../config/api'
import { fechaActual } from './AuditModel'

const { SALES, SALE_DETAILS, PAYMENT_METHODS, USERS, PRODUCTS, CUSTOMERS, DELIVERIES, AUDIT_LOG } = API_CONFIG.ENDPOINTS

const fallo = (error) => ({
  success: false,
  status: error.status,
  error: /failed to fetch/i.test(error.message) ? 'No hay conexión con el servidor. ¿Está encendido JSON Server?' : error.message
})

const nombreCompleto = (u) => (u ? `${u.nombre} ${u.apellido ?? ''}`.trim() : '—')

// ---------- Adapter ----------
const aVenta = (f, { usuarios = [], metodos = [], clientes = [], domicilios = [] } = {}) => ({
  id: f.id,
  idUsuario: f.id_usuario,
  cajero: nombreCompleto(usuarios.find((u) => u.id === f.id_usuario)),
  idArqueo: f.id_arqueo,
  idCliente: f.id_cliente,
  cliente: f.id_cliente ? nombreCompleto(clientes.find((c) => c.id === f.id_cliente)) : null,
  idMetodoPago: f.id_metodo_pago,
  metodo: metodos.find((m) => m.id === f.id_metodo_pago)?.nombre ?? '—',
  fecha: f.fecha,
  total: f.total,
  estado: f.estado,
  // Una venta con domicilio se cancela desde el módulo Domicilios, no se anula aquí
  esDomicilio: domicilios.some((d) => d.id_venta === f.id)
})

class SaleModel {
  static async getPaymentMethods() {
    try {
      const metodos = await httpService.get(`${PAYMENT_METHODS}?activo=true`)
      return { success: true, data: metodos.map((m) => ({ id: m.id, nombre: m.nombre })) }
    } catch (error) {
      return fallo(error)
    }
  }

  // Todas las ventas con cajero, método y si es domicilio (más reciente primero)
  static async getSales() {
    try {
      const [ventas, usuarios, metodos, domicilios] = await Promise.all([
        httpService.get(`${SALES}?_sort=fecha&_order=desc`),
        httpService.get(USERS),
        httpService.get(PAYMENT_METHODS),
        httpService.get(DELIVERIES)
      ])
      return { success: true, data: ventas.map((v) => aVenta(v, { usuarios, metodos, domicilios })) }
    } catch (error) {
      return fallo(error)
    }
  }

  // Una venta con sus renglones (detalle_venta) y, si fue anulada, el registro de log_auditoria
  static async getSale(id) {
    try {
      const [venta, detalle, productos, usuarios, metodos, clientes, domicilios, anulaciones] = await Promise.all([
        httpService.get(`${SALES}/${id}`),
        httpService.get(`${SALE_DETAILS}?id_venta=${id}`),
        httpService.get(PRODUCTS),
        httpService.get(USERS),
        httpService.get(PAYMENT_METHODS),
        httpService.get(CUSTOMERS),
        httpService.get(`${DELIVERIES}?id_venta=${id}`),
        httpService.get(`${AUDIT_LOG}?accion=anular`)
      ])
      const renglones = detalle.map((d) => ({
        codigo: d.codigo_producto,
        producto: productos.find((p) => p.id === d.codigo_producto)?.nombre ?? d.codigo_producto,
        cantidad: d.cantidad,
        precio: d.precio_venta,
        subtotal: d.cantidad * d.precio_venta // columna calculada de detalle_venta
      }))
      const registro = anulaciones.find((a) => a.detalle?.includes(`venta #${id} `))
      const anulacion = registro
        ? { fecha: registro.fecha, usuario: nombreCompleto(usuarios.find((u) => u.id === registro.id_usuario)), detalle: registro.detalle }
        : null
      return { success: true, data: { ...aVenta(venta, { usuarios, metodos, clientes, domicilios }), detalle: renglones, anulacion } }
    } catch (error) {
      if (error.status === 404) return { success: false, status: 404, error: 'Venta no encontrada.' }
      return fallo(error)
    }
  }

  // Encabezado de la venta; JSON Server le asigna el id (el número de factura)
  static async createSale({ idUsuario, idArqueo, idMetodoPago, total }) {
    try {
      const fila = await httpService.post(SALES, {
        id_usuario: idUsuario, id_arqueo: idArqueo, id_cliente: null, id_metodo_pago: idMetodoPago,
        fecha: fechaActual(), total, estado: 'pagada'
      })
      return { success: true, data: aVenta(fila) }
    } catch (error) {
      return fallo(error)
    }
  }

  // Un renglón de detalle_venta (el subtotal no se guarda: es cantidad × precio)
  static async addDetail({ idVenta, codigo, cantidad, precio }) {
    try {
      await httpService.post(SALE_DETAILS, { id_venta: idVenta, codigo_producto: codigo, cantidad, precio_venta: precio })
      return { success: true }
    } catch (error) {
      return fallo(error)
    }
  }

  static async setStatus(id, estado) {
    try {
      const fila = await httpService.patch(`${SALES}/${id}`, { estado })
      return { success: true, data: aVenta(fila) }
    } catch (error) {
      return fallo(error)
    }
  }
}

export default SaleModel
