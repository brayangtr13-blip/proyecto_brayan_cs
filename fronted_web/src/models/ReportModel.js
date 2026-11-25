// src/models/ReportModel.js
// MODELO de reportes: SOLO LEE. Trae las colecciones de JSON Server y las une como harían los JOIN
// del backend real. Patrón Adapter: columnas de MySQL (id_metodo_pago) → objetos de la vista (idMetodoPago).
import httpService from '../services/httpService'
import API_CONFIG from '../config/api'
import { USER_ROLES } from '../config/constants'

const {
  SALES, SALE_DETAILS, PAYMENT_METHODS, PRODUCTS, CATEGORIES, MOVEMENTS,
  USERS, ROLES, DELIVERIES, NEIGHBORHOODS, CUSTOMERS, AUDIT_LOG
} = API_CONFIG.ENDPOINTS

const fallo = (error) => ({
  success: false,
  status: error.status,
  error: /failed to fetch/i.test(error.message) ? 'No hay conexión con el servidor. ¿Está encendido JSON Server?' : error.message
})

const nombreCompleto = (p) => (p ? `${p.nombre} ${p.apellido ?? ''}`.trim() : '—')

// El motivo de una anulación quedó en log_auditoria: "Anuló la venta #7 por $X. Motivo: ..."
const motivoAnulacion = (idVenta, registros) => {
  const registro = registros.filter((r) => r.accion === 'anular' && new RegExp(`venta #${idVenta}\\b`).test(r.detalle)).pop()
  if (!registro) return 'No registrado'
  const texto = registro.detalle.includes('Motivo:')
    ? registro.detalle.split('Motivo:').pop()
    : registro.detalle.replace(/^.*?#\d+[.,]?/, '')
  return texto.trim() || 'No registrado'
}

class ReportModel {
  // Todo lo que usan los reportes, en una sola carga (son pocos datos de prueba)
  static async getData() {
    try {
      const [ventas, detalle, metodos, productos, categorias, movimientos, usuarios, roles, domicilios, barrios, clientes, registros] =
        await Promise.all([SALES, SALE_DETAILS, PAYMENT_METHODS, PRODUCTS, CATEGORIES, MOVEMENTS, USERS, ROLES,
          DELIVERIES, NEIGHBORHOODS, CUSTOMERS, AUDIT_LOG].map((ruta) => httpService.get(ruta)))

      const nombreDe = (id) => nombreCompleto(usuarios.find((u) => u.id === id))
      const categoriaDe = (id) => categorias.find((c) => c.id === id)?.nombre ?? '—'

      return {
        success: true,
        data: {
          metodos: metodos.map((m) => ({ id: m.id, nombre: m.nombre, activo: m.activo })),
          categorias: categorias.map((c) => ({ id: c.id, nombre: c.nombre })),
          barrios: barrios.map((b) => ({ id: b.id, nombre: b.nombre })),
          roles: roles.map((r) => ({ id: r.id, nombre: r.nombre })),

          ventas: ventas.map((v) => ({
            id: v.id, fecha: v.fecha, total: v.total, estado: v.estado,
            idUsuario: v.id_usuario, vendedor: nombreDe(v.id_usuario),
            idMetodoPago: v.id_metodo_pago, metodo: metodos.find((m) => m.id === v.id_metodo_pago)?.nombre ?? '—',
            detalle: detalle.filter((d) => d.id_venta === v.id).map((d) => ({ codigo: d.codigo_producto, cantidad: d.cantidad, precio: d.precio_venta })),
            motivo: v.estado === 'anulada' ? motivoAnulacion(v.id, registros) : ''
          })),

          productos: productos.map((p) => ({
            codigo: p.codigo_producto, nombre: p.nombre, idCategoria: p.id_categoria, categoria: categoriaDe(p.id_categoria),
            precio: p.precio_unitario, stock: p.stock_actual, stockMinimo: p.stock_minimo, activo: p.activo
          })),

          movimientos: movimientos.map((m) => ({
            id: m.id, fecha: m.fecha, codigo: m.codigo_producto, tipo: m.tipo, cantidad: m.cantidad,
            idUsuario: m.id_usuario, usuario: nombreDe(m.id_usuario), observacion: m.observacion ?? ''
          })),

          // Nunca se pasa el hash de la contraseña a las vistas
          usuarios: usuarios.map((u) => ({
            id: u.id, documento: u.documento, nombre: u.nombre, apellido: u.apellido, nombreCompleto: nombreCompleto(u),
            email: u.email, telefono: u.telefono, rol: u.role, activo: u.activo
          })),

          pedidos: domicilios.map((d) => {
            const venta = ventas.find((v) => v.id === d.id_venta)
            return {
              id: d.id, fecha: venta?.fecha ?? d.fecha_asignacion, estado: d.estado,
              cliente: nombreCompleto(clientes.find((c) => c.id === venta?.id_cliente)),
              idBarrio: d.id_barrio, barrio: barrios.find((b) => b.id === d.id_barrio)?.nombre ?? '—',
              idDomiciliario: d.id_domiciliario, domiciliario: d.id_domiciliario ? nombreDe(d.id_domiciliario) : 'Sin asignar',
              total: venta?.total ?? 0, costoEnvio: d.costo_envio ?? 0,
              fechaAsignacion: d.fecha_asignacion, fechaEntrega: d.fecha_entrega
            }
          }),

          domiciliarios: usuarios.filter((u) => u.role === USER_ROLES.DOMICILIARIO).map((u) => ({ id: u.id, nombre: nombreCompleto(u) }))
        }
      }
    } catch (error) {
      return fallo(error)
    }
  }
}

export default ReportModel
