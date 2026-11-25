// src/models/ProductModel.js
// MODELO: inventario contra JSON Server (colecciones productos, categorias y movimientos_inventario).
// Reemplaza a inventario_datos.js del prototipo: ya no usa localStorage para los datos, usa la API.
// Patrón Adapter: db.json guarda las columnas como en MySQL (stock_actual) y las vistas usan camelCase (stockActual).
import httpService from '../services/httpService'
import API_CONFIG from '../config/api'

const { PRODUCTS, CATEGORIES, MOVEMENTS, USERS } = API_CONFIG.ENDPOINTS

const fallo = (error) => ({
  success: false,
  status: error.status,
  error: /failed to fetch/i.test(error.message) ? 'No hay conexión con el servidor. ¿Está encendido JSON Server?' : error.message
})

// ---------- Adapter: fila de db.json (snake_case) ↔ objeto de la vista (camelCase) ----------

const aProducto = (fila, categorias = []) => ({
  codigo: fila.codigo_producto,
  nombre: fila.nombre,
  descripcion: fila.descripcion,
  idCategoria: fila.id_categoria,
  categoria: categorias.find((c) => c.id === fila.id_categoria)?.nombre ?? '',
  precioCompra: fila.precio_compra,
  precioUnitario: fila.precio_unitario,
  stockActual: fila.stock_actual,
  stockMinimo: fila.stock_minimo,
  unidadMedida: fila.unidad_medida,
  activo: fila.activo
})

// Solo convierte los campos que llegan (sirve para crear y para PATCH)
const aFila = (p) => {
  const mapa = {
    codigo: 'codigo_producto', nombre: 'nombre', descripcion: 'descripcion', idCategoria: 'id_categoria',
    precioCompra: 'precio_compra', precioUnitario: 'precio_unitario', stockActual: 'stock_actual',
    stockMinimo: 'stock_minimo', unidadMedida: 'unidad_medida', activo: 'activo'
  }
  const fila = {}
  for (const [clave, columna] of Object.entries(mapa)) {
    if (p[clave] !== undefined) fila[columna] = p[clave] === '' ? null : p[clave]
  }
  if (p.codigo !== undefined) fila.id = p.codigo // JSON Server necesita "id": es el mismo código de barras
  return fila
}

class ProductModel {
  static async getCategories() {
    try {
      return { success: true, data: await httpService.get(`${CATEGORIES}?_sort=nombre`) }
    } catch (error) {
      return fallo(error)
    }
  }

  // Todos los productos con el nombre de su categoría (como el JOIN del backend real)
  static async getProducts() {
    try {
      const [filas, categorias] = await Promise.all([
        httpService.get(`${PRODUCTS}?_sort=nombre`),
        httpService.get(CATEGORIES)
      ])
      return { success: true, data: filas.map((f) => aProducto(f, categorias)) }
    } catch (error) {
      return fallo(error)
    }
  }

  // Un producto con su kárdex (más reciente primero) y el nombre de quien hizo cada movimiento
  static async getProduct(codigo) {
    try {
      const id = encodeURIComponent(codigo)
      const [fila, categorias, movimientos, usuarios] = await Promise.all([
        httpService.get(`${PRODUCTS}/${id}`),
        httpService.get(CATEGORIES),
        httpService.get(`${MOVEMENTS}?codigo_producto=${id}&_sort=fecha,id&_order=desc,desc`),
        httpService.get(USERS)
      ])
      const nombre = (idUsuario) => {
        const u = usuarios.find((x) => x.id === idUsuario)
        return u ? `${u.nombre} ${u.apellido}` : '—'
      }
      const kardex = movimientos.map((m) => ({
        id: m.id, tipo: m.tipo, cantidad: m.cantidad, observacion: m.observacion, fecha: m.fecha, usuario: nombre(m.id_usuario)
      }))
      return { success: true, data: { ...aProducto(fila, categorias), movimientos: kardex } }
    } catch (error) {
      if (error.status === 404) return { success: false, status: 404, error: 'El producto no existe.' }
      return fallo(error)
    }
  }

  static async createProduct(producto) {
    try {
      const fila = await httpService.post(PRODUCTS, aFila(producto))
      return { success: true, data: aProducto(fila) }
    } catch (error) {
      return fallo(error)
    }
  }

  static async updateProduct(codigo, cambios) {
    try {
      const fila = await httpService.patch(`${PRODUCTS}/${encodeURIComponent(codigo)}`, aFila(cambios))
      return { success: true, data: aProducto(fila) }
    } catch (error) {
      return fallo(error)
    }
  }

  // Un renglón del kárdex con las columnas de movimientos_inventario
  static async addMovement({ codigo, idUsuario, tipo, cantidad, observacion }) {
    try {
      const fecha = new Date().toLocaleString('sv-SE').replace('T', ' ') // 'AAAA-MM-DD HH:MM:SS', hora local
      const fila = await httpService.post(MOVEMENTS, {
        codigo_producto: codigo, id_usuario: idUsuario, tipo, cantidad, observacion, fecha
      })
      return { success: true, data: fila }
    } catch (error) {
      return fallo(error)
    }
  }
}

export default ProductModel
