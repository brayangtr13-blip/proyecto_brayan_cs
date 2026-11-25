// src/controllers/DeliveryController.js
// CONTROLADOR de domicilios (CS-35 a CS-38) con las reglas de domicilios_servicio.js del prototipo.
// rol_permiso: el administrador ve, registra, asigna y actualiza; el domiciliario ve y actualiza
// solo sus pedidos; el cajero no tiene permisos de domicilios.
import DeliveryModel from '../models/DeliveryModel'
import SaleModel from '../models/SaleModel'
import ProductModel from '../models/ProductModel'
import AuditModel, { fechaActual } from '../models/AuditModel'
import AuthController from './AuthController'
import SaleController from './SaleController'
import DeliveryStates, { TEXTO_ESTADO } from './DeliveryStates'
import './DeliveryNotifications' // registra el oyente de notificaciones (patrón Observer)
import Eventos from '../utils/eventos'
import { MODULOS, USER_ROLES } from '../config/constants'
import { isRequired } from '../utils/validators'

const VEN_PEDIDOS = [USER_ROLES.ADMIN, USER_ROLES.DOMICILIARIO] // domicilios.ver
const SIN_PERMISO = { success: false, error: 'Tu rol no tiene permiso para esta acción.' }

const minutosEntre = (a, b) => (new Date(b.replace(' ', 'T')) - new Date(a.replace(' ', 'T'))) / 60000

class DeliveryController {
  static usuarioActual() {
    return AuthController.getAuthState().currentUser
  }

  static rolActual() {
    return AuthController.getUserRole()
  }

  static esAdmin() {
    return AuthController.isAdmin()
  }

  static auditar(accion, idPedido, detalle) {
    return AuditModel.registrar({ idUsuario: this.usuarioActual().id, idModulo: MODULOS.DOMICILIOS, accion, detalle: `Pedido #${idPedido}: ${detalle}` })
  }

  // HU06: tiempo transcurrido desde que se recibió el pedido
  static tiempoTranscurrido(fecha) {
    if (!fecha) return ''
    const minutos = Math.floor(minutosEntre(fecha, fechaActual()))
    if (minutos < 1) return 'hace un momento'
    if (minutos < 60) return `hace ${minutos} min`
    const horas = Math.floor(minutos / 60)
    if (horas < 24) return `hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`
    const dias = Math.floor(horas / 24)
    return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`
  }

  // Promedio real de minutos entre asignación y entrega (para el "llegará en unos X minutos")
  static tiempoPromedioEntrega(pedidos) {
    const entregados = pedidos.filter((p) => p.fechaAsignacion && p.fechaEntrega)
    if (entregados.length === 0) return null
    return Math.round(entregados.reduce((s, p) => s + minutosEntre(p.fechaAsignacion, p.fechaEntrega), 0) / entregados.length)
  }

  // HU05: pedidos activos de cada domiciliario, para repartir la carga
  static cargaDe(idDomiciliario, pedidos) {
    return pedidos.filter((p) => p.idDomiciliario === idDomiciliario && ['asignado', 'en_camino'].includes(p.estado)).length
  }

  // El administrador ve todos; el domiciliario, solo los asignados a él (HU05)
  static async getDeliveries() {
    if (!AuthController.hasAnyRole(VEN_PEDIDOS)) return SIN_PERMISO
    const result = await DeliveryModel.getDeliveries()
    if (!result.success) return result
    const usuario = this.usuarioActual()
    return { success: true, data: this.esAdmin() ? result.data : result.data.filter((p) => p.idDomiciliario === usuario.id) }
  }

  static async getDelivery(id) {
    if (!AuthController.hasAnyRole(VEN_PEDIDOS)) return SIN_PERMISO
    const result = await DeliveryModel.getDelivery(id)
    if (!result.success) return result
    if (!this.esAdmin() && result.data.idDomiciliario !== this.usuarioActual().id) return { success: false, status: 404, error: 'El pedido no existe.' }
    return result
  }

  static getNeighborhoods() {
    return DeliveryModel.getNeighborhoods()
  }

  static getCouriers() {
    return DeliveryModel.getCouriers()
  }

  static getCustomers() {
    return DeliveryModel.getCustomers()
  }

  static findCustomer(telefono) {
    return DeliveryModel.findCustomerByPhone(String(telefono).trim())
  }

  // ---------- Registrar pedido (CS-35 · HU04) ----------
  // Se valida todo antes de guardar: cliente, barrio con cobertura, productos con stock y método de pago.
  // El stock NO se descuenta aquí: se descuenta al entregar (hasta ahí el pedido se puede cancelar).
  static async registrarPedido(datos) {
    if (!this.esAdmin()) return SIN_PERMISO
    const fields = {}
    if (!isRequired(datos.cliente.nombre)) fields.nombre = 'Escribe el nombre del cliente.'
    if (!/^3\d{9}$/.test(String(datos.cliente.telefono))) fields.telefono = 'El celular tiene 10 dígitos y empieza por 3.'
    if (!isRequired(datos.direccionEntrega)) fields.direccionEntrega = 'Escribe la dirección de entrega.'
    if (!/^3\d{9}$/.test(String(datos.telefonoContacto))) fields.telefonoContacto = 'El teléfono de quien recibe tiene 10 dígitos.'
    if (!datos.idMetodoPago) fields.idMetodoPago = 'Elige el método de pago.'
    if (Object.keys(fields).length) return { success: false, error: 'Revisa los campos marcados.', fields }
    if (datos.items.length === 0) return { success: false, error: 'Agrega al menos un producto al pedido.' }

    const barrios = await DeliveryModel.getNeighborhoods()
    const barrio = barrios.data?.find((b) => b.id === Number(datos.idBarrio))
    if (!barrio || !barrio.activo) return { success: false, error: 'Elige un barrio dentro de la cobertura de domicilios.', fields: { idBarrio: 'Barrio sin cobertura.' } }

    const productos = await ProductModel.getProducts()
    if (!productos.success) return productos
    for (const item of datos.items) {
      const error = SaleController.validarCantidad(productos.data.find((p) => p.codigo === item.codigo), item.cantidad)
      if (error) return { success: false, error }
    }

    // Cliente: si el teléfono ya existe se actualiza su dirección; si no, se crea (clientes.telefono es UNIQUE)
    const existente = await DeliveryModel.findCustomerByPhone(datos.cliente.telefono)
    const cliente = await DeliveryModel.saveCustomer({ ...datos.cliente, id: existente.data?.id, idBarrio: Number(datos.cliente.idBarrio) || barrio.id })
    if (!cliente.success) return cliente

    // Venta pendiente (se paga contra entrega), su detalle y el domicilio con la tarifa de hoy del barrio
    const usuario = this.usuarioActual()
    const total = SaleController.calcularTotal(datos.items)
    const venta = await SaleModel.createSale({ idUsuario: usuario.id, idMetodoPago: Number(datos.idMetodoPago), total, idCliente: cliente.data.id, estado: 'pendiente' })
    if (!venta.success) return venta
    for (const item of datos.items) {
      await SaleModel.addDetail({ idVenta: venta.data.id, codigo: item.codigo, cantidad: item.cantidad, precio: item.precio })
    }
    const pedido = await DeliveryModel.createDelivery({
      idVenta: venta.data.id, idBarrio: barrio.id, direccionEntrega: datos.direccionEntrega.trim(),
      telefonoContacto: datos.telefonoContacto, costoEnvio: barrio.costoDomicilio, observacion: datos.observacion?.trim()
    })
    if (!pedido.success) return pedido
    await this.auditar('registrar', pedido.data.id, `Registrado por teléfono (venta #${venta.data.id}) · Pendiente`)
    return { success: true, data: { id: pedido.data.id, costoEnvio: barrio.costoDomicilio, total } }
  }

  // ---------- Asignar domiciliario (CS-36 · HU05) ----------
  static async asignar(pedidoEnPantalla, idDomiciliario) {
    if (!this.esAdmin()) return SIN_PERMISO
    const actual = await DeliveryModel.getDelivery(pedidoEnPantalla.id) // estado más reciente, no el de la pantalla
    if (!actual.success) return actual
    const pedido = actual.data
    if (DeliveryStates.esFinal(pedido.estado)) return { success: false, error: 'Este pedido ya terminó y no se puede reasignar.' }
    const domiciliarios = await DeliveryModel.getCouriers()
    const domiciliario = domiciliarios.data?.find((d) => d.id === Number(idDomiciliario))
    if (!domiciliario || !domiciliario.activo) return { success: false, error: 'Solo se puede asignar a un domiciliario activo.' }
    if (domiciliario.id === pedido.idDomiciliario) return { success: false, error: `El pedido ya está asignado a ${domiciliario.nombre}.` }

    // Al asignar, "pendiente" pasa solo a "asignado"; en una reasignación el estado se conserva
    const estadoNuevo = pedido.estado === 'pendiente' ? 'asignado' : pedido.estado
    const result = await DeliveryModel.updateDelivery(pedido.id, { idDomiciliario: domiciliario.id, estado: estadoNuevo, fechaAsignacion: fechaActual() })
    if (!result.success) return result
    const texto = pedido.domiciliario ? `Reasignado de ${pedido.domiciliario} a ${domiciliario.nombre}` : `Asignado a ${domiciliario.nombre}`
    await this.auditar('asignar', pedido.id, texto)
    Eventos.publicar('estadoCambiado', { pedido: { ...pedido, domiciliario: domiciliario.nombre }, estadoAnterior: pedido.estado, estadoNuevo })
    return { success: true, message: `Pedido #${pedido.id}: ${texto.toLowerCase()}.` }
  }

  // ---------- Cambiar estado (CS-37 · HU06) ----------
  // Las reglas de transición y de rol son de la máquina de estados (patrón State).
  static async cambiarEstado(pedidoEnPantalla, nuevoEstado, motivo, observacion, todos = []) {
    if (!AuthController.hasAnyRole(VEN_PEDIDOS)) return SIN_PERMISO
    const actual = await DeliveryModel.getDelivery(pedidoEnPantalla.id) // con sus productos y el estado más reciente
    if (!actual.success) return actual
    const pedido = actual.data
    const error = DeliveryStates.validar(pedido, nuevoEstado, this.rolActual(), this.usuarioActual().id)
    if (error) return { success: false, error }
    if (nuevoEstado === 'cancelado' && !isRequired(motivo)) {
      return { success: false, error: 'Escribe el motivo de la cancelación.', fields: { motivo: 'El motivo es obligatorio.' } }
    }

    const usuario = this.usuarioActual()
    // El stock sale al ENTREGAR. Si la venta ya estaba pagada (pedidos de los datos de prueba), su stock
    // ya había salido en caja: no se descuenta dos veces.
    if (nuevoEstado === 'entregado' && pedido.estadoVenta === 'pendiente') {
      const productos = await ProductModel.getProducts()
      if (!productos.success) return productos
      for (const r of pedido.productos) {
        const falta = SaleController.validarCantidad(productos.data.find((p) => p.codigo === r.codigo), r.cantidad)
        if (falta) return { success: false, error: `No se puede entregar: ${falta}` }
      }
      for (const r of pedido.productos) {
        const producto = productos.data.find((p) => p.codigo === r.codigo)
        await ProductModel.updateProduct(r.codigo, { stockActual: producto.stockActual - r.cantidad })
        await ProductModel.addMovement({ codigo: r.codigo, idUsuario: usuario.id, tipo: 'salida', cantidad: r.cantidad, observacion: `Domicilio #${pedido.id} (venta #${pedido.idVenta})` })
      }
    }
    // Al cancelar, si la venta ya estaba pagada su stock había salido: vuelve al inventario
    if (nuevoEstado === 'cancelado' && pedido.estadoVenta === 'pagada') {
      const productos = await ProductModel.getProducts()
      for (const r of pedido.productos) {
        const producto = productos.data?.find((p) => p.codigo === r.codigo)
        if (producto) await ProductModel.updateProduct(r.codigo, { stockActual: producto.stockActual + r.cantidad })
        await ProductModel.addMovement({ codigo: r.codigo, idUsuario: usuario.id, tipo: 'entrada', cantidad: r.cantidad, observacion: `Cancelación del domicilio #${pedido.id}` })
      }
    }

    const cambios = { estado: nuevoEstado }
    if (nuevoEstado === 'entregado') cambios.fechaEntrega = fechaActual()
    const result = await DeliveryModel.updateDelivery(pedido.id, cambios)
    if (!result.success) return result
    // La venta sigue al pedido: entregado = pagada (contra entrega), cancelado = anulada
    if (nuevoEstado === 'entregado') await SaleModel.setStatus(pedido.idVenta, 'pagada')
    if (nuevoEstado === 'cancelado') await SaleModel.setStatus(pedido.idVenta, 'anulada')

    const detalle = [motivo?.trim() && `Motivo: ${motivo.trim()}`, observacion?.trim()].filter(Boolean).join(' · ')
    await this.auditar(nuevoEstado === 'cancelado' ? 'cancelar' : 'actualizar', pedido.id,
      `${TEXTO_ESTADO[pedido.estado]} → ${TEXTO_ESTADO[nuevoEstado]}${detalle ? ` · ${detalle}` : ''}`)
    Eventos.publicar('estadoCambiado', {
      pedido, estadoAnterior: pedido.estado, estadoNuevo: nuevoEstado, motivo: motivo?.trim(),
      minutos: this.tiempoPromedioEntrega(todos) ?? 30
    })
    return { success: true, message: `Pedido #${pedido.id}: ${TEXTO_ESTADO[nuevoEstado].toLowerCase()}.` }
  }
}

export default DeliveryController
