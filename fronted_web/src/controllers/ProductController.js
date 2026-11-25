// src/controllers/ProductController.js
// CONTROLADOR: reglas del inventario que trae inventario_servicio.js del prototipo.
// JSON Server solo guarda datos (no tiene lógica): las reglas de negocio y de rol se aplican aquí.
import ProductModel from '../models/ProductModel'
import AuthController from './AuthController'
import { USER_ROLES } from '../config/constants'
import { isRequired } from '../utils/validators'

// Roles según rol_permiso: el cajero ve y registra; editar, dar de baja y ajustar es del administrador
const VER_Y_REGISTRAR = [USER_ROLES.ADMIN, USER_ROLES.CAJERO]
const SIN_PERMISO = { success: false, error: 'Tu rol no tiene permiso para esta acción.' }

const esEnteroNoNegativo = (v) => String(v ?? '').trim() !== '' && Number.isInteger(Number(v)) && Number(v) >= 0
const esNumero = (v) => String(v ?? '').trim() !== '' && Number.isFinite(Number(v))

// Como Formato.normalizar del prototipo: sin tildes y en minúscula ("Lácteos" → "lacteos")
const normalizar = (texto) => String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

class ProductController {
  // CS-17 del prototipo: AGOTADO manda sobre BAJO; justo en el mínimo también es alerta
  static nivelStock(producto) {
    if (producto.stockActual === 0) return 'agotado'
    if (producto.stockActual <= producto.stockMinimo) return 'bajo'
    return 'normal'
  }

  // CS-17: los más graves primero: agotados y, entre ellos, los más lejos de su mínimo
  static ordenarAlertas(productos) {
    return [...productos].sort((a, b) => {
      if (a.stockActual === 0 && b.stockActual !== 0) return -1
      if (b.stockActual === 0 && a.stockActual !== 0) return 1
      return (b.stockMinimo - b.stockActual) - (a.stockMinimo - a.stockActual)
    })
  }

  // Kárdex con saldos, como en consultar_producto.html: db.json guarda solo la cantidad de cada
  // movimiento; el saldo se reconstruye desde el stock actual hacia atrás (lista: más reciente primero)
  static kardexConSaldos(producto) {
    let resultante = producto.stockActual
    return (producto.movimientos ?? []).map((m) => {
      const conSigno = m.tipo === 'entrada' ? m.cantidad : -m.cantidad
      const fila = { ...m, conSigno, stockResultante: resultante, stockAnterior: resultante - conSigno }
      resultante -= conSigno
      return fila
    })
  }

  // Ganancia por unidad y margen (%), para la ficha del producto
  static ganancia(producto) {
    const valor = producto.precioUnitario - producto.precioCompra
    const margen = producto.precioUnitario > 0 ? Math.round((valor / producto.precioUnitario) * 100) : 0
    return { valor, margen }
  }

  static puedeAdministrar() {
    return AuthController.isAdmin()
  }

  // CS-14 del prototipo: el buscador cubre código, nombre y categoría (sin importar tildes)
  static async getProducts({ q = '', categoria = '', estado = 'activos' } = {}) {
    if (!AuthController.hasAnyRole(VER_Y_REGISTRAR)) return SIN_PERMISO
    const result = await ProductModel.getProducts()
    if (!result.success) return result
    const texto = normalizar(q.trim())
    const data = result.data.filter((p) =>
      (!texto || p.codigo.includes(texto) || normalizar(p.nombre).includes(texto) || normalizar(p.categoria).includes(texto)) &&
      (!categoria || p.idCategoria === Number(categoria)) &&
      (estado === 'todos' || (estado === 'activos' ? p.activo : !p.activo))
    )
    return { success: true, data }
  }

  // Alertas: productos activos con stock en o por debajo del mínimo (como la vista vw_inventario_stock_bajo)
  static async getAlerts() {
    const result = await this.getProducts({ estado: 'activos' })
    if (!result.success) return result
    const alertas = result.data
      .filter((p) => p.stockActual <= p.stockMinimo)
      .map((p) => ({ ...p, faltan: p.stockMinimo - p.stockActual }))
    return { success: true, data: this.ordenarAlertas(alertas) }
  }

  static async getProduct(codigo) {
    if (!AuthController.hasAnyRole(VER_Y_REGISTRAR)) return SIN_PERMISO
    return ProductModel.getProduct(codigo)
  }

  static getCategories() {
    return ProductModel.getCategories()
  }

  // Validación del formulario (las mismas reglas de la base: CHECK y trigger de precios)
  static validar(d, { esNuevo }) {
    const fields = {}
    if (esNuevo && !/^\d{6,20}$/.test(String(d.codigo ?? ''))) fields.codigo = 'El código de barras tiene de 6 a 20 dígitos.'
    if (!isRequired(d.nombre)) fields.nombre = 'Escribe el nombre del producto.'
    if (!(Number(d.idCategoria) > 0)) fields.idCategoria = 'Elige una categoría.'
    if (!(esNumero(d.precioCompra) && Number(d.precioCompra) >= 0)) fields.precioCompra = 'El precio de compra es 0 o más.'
    if (!(esNumero(d.precioUnitario) && Number(d.precioUnitario) > 0)) fields.precioUnitario = 'El precio de venta debe ser mayor que 0.'
    if (!fields.precioCompra && !fields.precioUnitario && Number(d.precioUnitario) < Number(d.precioCompra)) {
      fields.precioUnitario = 'El precio de venta no puede ser menor que el de compra.'
    }
    if (esNuevo && !esEnteroNoNegativo(d.stockActual)) fields.stockActual = 'El stock inicial es un número entero, 0 o más.'
    if (!esEnteroNoNegativo(d.stockMinimo)) fields.stockMinimo = 'El stock mínimo es un número entero, 0 o más.'
    return fields
  }

  // Solo los campos que se guardan, con números de verdad (los inputs entregan texto)
  static limpiar(d, { esNuevo }) {
    const limpio = {
      nombre: d.nombre.trim(),
      descripcion: d.descripcion?.trim() || '',
      idCategoria: Number(d.idCategoria),
      precioCompra: Number(d.precioCompra),
      precioUnitario: Number(d.precioUnitario),
      stockMinimo: Number(d.stockMinimo),
      unidadMedida: d.unidadMedida?.trim() || ''
    }
    if (esNuevo) {
      limpio.codigo = String(d.codigo).trim()
      limpio.stockActual = Number(d.stockActual)
      limpio.activo = true
    }
    return limpio
  }

  static idUsuarioActual() {
    return AuthController.getAuthState().currentUser?.id
  }

  // Registrar: el código no se repite y el stock inicial queda en el kárdex como "Inventario inicial"
  static async createProduct(datos) {
    if (!AuthController.hasAnyRole(VER_Y_REGISTRAR)) return SIN_PERMISO
    const fields = this.validar(datos, { esNuevo: true })
    if (Object.keys(fields).length) return { success: false, error: 'Revisa los campos marcados.', fields }

    const existe = await ProductModel.getProduct(String(datos.codigo).trim())
    if (existe.success) {
      const mensaje = 'Ya existe un producto con ese código de barras.'
      return { success: false, error: mensaje, fields: { codigo: mensaje } }
    }

    const producto = this.limpiar(datos, { esNuevo: true })
    const result = await ProductModel.createProduct(producto)
    if (result.success && producto.stockActual > 0) {
      await ProductModel.addMovement({
        codigo: producto.codigo, idUsuario: this.idUsuarioActual(), tipo: 'entrada',
        cantidad: producto.stockActual, observacion: 'Inventario inicial'
      })
    }
    return result.success ? { ...result, message: 'Producto registrado.' } : result
  }

  // Editar: el stock NO se cambia aquí (solo con movimientos, para que el kárdex cuadre)
  static async updateProduct(codigo, datos) {
    if (!this.puedeAdministrar()) return SIN_PERMISO
    const fields = this.validar(datos, { esNuevo: false })
    if (Object.keys(fields).length) return { success: false, error: 'Revisa los campos marcados.', fields }
    const result = await ProductModel.updateProduct(codigo, this.limpiar(datos, { esNuevo: false }))
    return result.success ? { ...result, message: 'Producto actualizado.' } : result
  }

  // Baja lógica: activo = false (no se borra, porque tiene ventas y kárdex asociados)
  static async setActive(producto) {
    if (!this.puedeAdministrar()) return SIN_PERMISO
    const result = await ProductModel.updateProduct(producto.codigo, { activo: !producto.activo })
    return result.success ? { ...result, message: producto.activo ? 'Producto dado de baja.' : 'Producto reactivado.' } : result
  }

  // Movimiento: entrada suma, ajuste resta (merma, vencido, dañado).
  // JSON Server no tiene transacciones: por eso primero se valida todo y luego se guardan
  // el stock nuevo y el renglón del kárdex. (El backend real lo hace en una sola transacción.)
  static async addMovement(codigo, mov) {
    if (!this.puedeAdministrar()) return SIN_PERMISO
    const fields = {}
    if (!['entrada', 'ajuste'].includes(mov.tipo)) fields.tipo = 'Elige entrada o ajuste.'
    if (!(Number.isInteger(Number(mov.cantidad)) && Number(mov.cantidad) > 0)) fields.cantidad = 'La cantidad es un número entero mayor que 0.'
    if (!isRequired(mov.observacion)) fields.observacion = 'Escribe el motivo.'
    if (Object.keys(fields).length) return { success: false, error: 'Revisa los campos marcados.', fields }

    const actual = await ProductModel.getProduct(codigo) // stock más reciente, no el de la pantalla
    if (!actual.success) return actual
    const cantidad = Number(mov.cantidad)
    const nuevoStock = actual.data.stockActual + (mov.tipo === 'entrada' ? cantidad : -cantidad)
    if (nuevoStock < 0) {
      const mensaje = `El ajuste dejaría el stock negativo: solo hay ${actual.data.stockActual} unidad(es).`
      return { success: false, error: mensaje, fields: { cantidad: mensaje } }
    }

    const result = await ProductModel.updateProduct(codigo, { stockActual: nuevoStock })
    if (!result.success) return result
    await ProductModel.addMovement({ codigo, idUsuario: this.idUsuarioActual(), tipo: mov.tipo, cantidad, observacion: mov.observacion.trim() })
    return { success: true, data: result.data, message: mov.tipo === 'entrada' ? 'Entrada registrada.' : 'Ajuste registrado.' }
  }
}

export default ProductController
