// src/models/DeliveryModel.js
// MODELO: domicilios, clientes y barrios en JSON Server. Reemplaza a domicilios_datos.js del prototipo.
// Patrón Adapter: columnas de MySQL (id_domiciliario) → objetos de la vista (idDomiciliario).
import httpService from '../services/httpService'
import API_CONFIG from '../config/api'
import { MODULOS } from '../config/constants'

const { DELIVERIES, SALES, SALE_DETAILS, CUSTOMERS, NEIGHBORHOODS, USERS, PAYMENT_METHODS, PRODUCTS, AUDIT_LOG } = API_CONFIG.ENDPOINTS

const fallo = (error) => ({
  success: false,
  status: error.status,
  error: /failed to fetch/i.test(error.message) ? 'No hay conexión con el servidor. ¿Está encendido JSON Server?' : error.message
})

const nombreCompleto = (p) => (p ? `${p.nombre} ${p.apellido ?? ''}`.trim() : null)

// ---------- Adapter ----------
const aPedido = (d, { ventas = [], clientes = [], barrios = [], usuarios = [], metodos = [] }) => {
  const venta = ventas.find((v) => v.id === d.id_venta)
  const cliente = clientes.find((c) => c.id === venta?.id_cliente)
  return {
    id: d.id,
    idVenta: d.id_venta,
    fechaPedido: venta?.fecha ?? d.fecha_asignacion,
    cliente: nombreCompleto(cliente) ?? 'Cliente sin registrar',
    telefonoCliente: cliente?.telefono ?? d.telefono_contacto,
    telefonoContacto: d.telefono_contacto,
    direccionEntrega: d.direccion_entrega,
    idBarrio: d.id_barrio,
    barrio: barrios.find((b) => b.id === d.id_barrio)?.nombre ?? '—',
    costoEnvio: d.costo_envio,
    totalProductos: venta?.total ?? 0,
    metodo: metodos.find((m) => m.id === venta?.id_metodo_pago)?.nombre ?? '—',
    estadoVenta: venta?.estado,
    estado: d.estado,
    idDomiciliario: d.id_domiciliario,
    domiciliario: nombreCompleto(usuarios.find((u) => u.id === d.id_domiciliario)),
    fechaAsignacion: d.fecha_asignacion,
    fechaEntrega: d.fecha_entrega,
    observacion: d.observacion
  }
}

// Todo lo que hace falta para armar pedidos legibles (como los JOIN del backend real)
const pedirCatalogos = () => Promise.all([
  httpService.get(SALES), httpService.get(CUSTOMERS), httpService.get(NEIGHBORHOODS),
  httpService.get(USERS), httpService.get(PAYMENT_METHODS)
]).then(([ventas, clientes, barrios, usuarios, metodos]) => ({ ventas, clientes, barrios, usuarios, metodos }))

class DeliveryModel {
  // Todos los pedidos, el más reciente primero
  static async getDeliveries() {
    try {
      const [filas, catalogos] = await Promise.all([httpService.get(`${DELIVERIES}?_sort=id&_order=desc`), pedirCatalogos()])
      return { success: true, data: filas.map((d) => aPedido(d, catalogos)) }
    } catch (error) {
      return fallo(error)
    }
  }

  // Un pedido con sus productos (detalle_venta) y su histórico (log_auditoria del módulo Domicilios)
  static async getDelivery(id) {
    try {
      const [fila, catalogos, productos, registros] = await Promise.all([
        httpService.get(`${DELIVERIES}/${id}`), pedirCatalogos(), httpService.get(PRODUCTS),
        httpService.get(`${AUDIT_LOG}?id_modulo=${MODULOS.DOMICILIOS}&_sort=fecha,id&_order=asc,asc`)
      ])
      const detalle = await httpService.get(`${SALE_DETAILS}?id_venta=${fila.id_venta}`)
      const pedido = aPedido(fila, catalogos)
      pedido.productos = detalle.map((r) => ({
        codigo: r.codigo_producto,
        producto: productos.find((p) => p.id === r.codigo_producto)?.nombre ?? r.codigo_producto,
        cantidad: r.cantidad, precio: r.precio_venta, subtotal: r.cantidad * r.precio_venta
      }))
      // Cada cambio de estado deja en log_auditoria un detalle que empieza por "Pedido #id:"
      pedido.historial = registros
        .filter((r) => r.detalle?.startsWith(`Pedido #${id}:`))
        .map((r) => ({ id: r.id, fecha: r.fecha, accion: r.accion, detalle: r.detalle.replace(`Pedido #${id}: `, ''),
          usuario: nombreCompleto(catalogos.usuarios.find((u) => u.id === r.id_usuario)) ?? 'Sistema' }))
      return { success: true, data: pedido }
    } catch (error) {
      if (error.status === 404) return { success: false, status: 404, error: 'El pedido no existe.' }
      return fallo(error)
    }
  }

  static async getNeighborhoods() {
    try {
      const barrios = await httpService.get(`${NEIGHBORHOODS}?_sort=nombre`)
      return { success: true, data: barrios.map((b) => ({ id: b.id, nombre: b.nombre, costoDomicilio: b.costo_domicilio, activo: b.activo })) }
    } catch (error) {
      return fallo(error)
    }
  }

  // Domiciliarios = usuarios con ese rol (para asignar pedidos)
  static async getCouriers() {
    try {
      const usuarios = await httpService.get(`${USERS}?role=domiciliario`)
      return { success: true, data: usuarios.map((u) => ({ id: u.id, nombre: nombreCompleto(u), activo: u.activo })) }
    } catch (error) {
      return fallo(error)
    }
  }

  static async getCustomers() {
    try {
      const clientes = await httpService.get(`${CUSTOMERS}?_sort=nombre`)
      return { success: true, data: clientes.map((c) => ({ id: c.id, nombre: nombreCompleto(c), telefono: c.telefono })) }
    } catch (error) {
      return fallo(error)
    }
  }

  // clientes.telefono es UNIQUE: el teléfono identifica al cliente
  static async findCustomerByPhone(telefono) {
    try {
      const [cliente] = await httpService.get(`${CUSTOMERS}?telefono=${encodeURIComponent(telefono)}`)
      return { success: true, data: cliente ? { id: cliente.id, nombre: cliente.nombre, apellido: cliente.apellido ?? '', telefono: cliente.telefono, direccion: cliente.direccion ?? '', idBarrio: cliente.id_barrio } : null }
    } catch (error) {
      return fallo(error)
    }
  }

  static async saveCustomer(cliente) {
    try {
      const fila = { nombre: cliente.nombre, apellido: cliente.apellido || null, telefono: cliente.telefono, direccion: cliente.direccion || null, id_barrio: cliente.idBarrio }
      const guardado = cliente.id
        ? await httpService.patch(`${CUSTOMERS}/${cliente.id}`, fila)
        : await httpService.post(CUSTOMERS, fila)
      return { success: true, data: { id: guardado.id } }
    } catch (error) {
      return fallo(error)
    }
  }

  static async createDelivery(p) {
    try {
      const fila = await httpService.post(DELIVERIES, {
        id_venta: p.idVenta, id_domiciliario: null, id_barrio: p.idBarrio, direccion_entrega: p.direccionEntrega,
        telefono_contacto: p.telefonoContacto, costo_envio: p.costoEnvio, estado: 'pendiente',
        fecha_asignacion: null, fecha_entrega: null, observacion: p.observacion || null
      })
      return { success: true, data: { id: fila.id } }
    } catch (error) {
      return fallo(error)
    }
  }

  // Solo los campos que llegan (estado, domiciliario, fechas)
  static async updateDelivery(id, cambios) {
    try {
      const mapa = { estado: 'estado', idDomiciliario: 'id_domiciliario', fechaAsignacion: 'fecha_asignacion', fechaEntrega: 'fecha_entrega' }
      const fila = {}
      for (const [clave, columna] of Object.entries(mapa)) if (cambios[clave] !== undefined) fila[columna] = cambios[clave]
      await httpService.patch(`${DELIVERIES}/${id}`, fila)
      return { success: true }
    } catch (error) {
      return fallo(error)
    }
  }
}

export default DeliveryModel
