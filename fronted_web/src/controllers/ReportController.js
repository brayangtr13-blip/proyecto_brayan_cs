// src/controllers/ReportController.js
// CONTROLADOR de reportes (Módulo 5, RF26 a RF30). Es reportes_servicio.js del prototipo:
// todos los cálculos en un solo lugar; las vistas solo filtran y dibujan. No guarda nada:
// trabaja sobre lo que trae ReportModel, como un SELECT con GROUP BY en la base.
import ReportModel from '../models/ReportModel'
import AuthController from './AuthController'
import { USER_ROLES } from '../config/constants'

// rol_permiso: reportes.ventas y reportes.inventario (admin y cajero); domicilios y usuarios (solo admin)
export const PERMISOS_REPORTES = {
  ventas: [USER_ROLES.ADMIN, USER_ROLES.CAJERO],
  inventario: [USER_ROLES.ADMIN, USER_ROLES.CAJERO],
  domicilios: [USER_ROLES.ADMIN],
  usuarios: [USER_ROLES.ADMIN]
}

export const TEXTO_ESTADO_PEDIDO = { pendiente: 'Pendiente', asignado: 'Asignado', en_camino: 'En camino', entregado: 'Entregado', cancelado: 'Cancelado' }

// ---------- Utilidades de fechas y sumas ----------
const aFecha = (texto) => new Date(String(texto).replace(' ', 'T'))
const dosDigitos = (n) => String(n).padStart(2, '0')
const diaDe = (f) => `${f.getFullYear()}-${dosDigitos(f.getMonth() + 1)}-${dosDigitos(f.getDate())}`

// "2026-09-23 09:40:30" → "2026-09-23" (los <input type="date"> usan ese formato)
export const fechaLocal = (texto) => String(texto).slice(0, 10)

const enRango = (texto, desde, hasta) => {
  const dia = fechaLocal(texto)
  return (!desde || dia >= desde) && (!hasta || dia <= hasta)
}

const sumar = (lista, campo) => lista.reduce((s, x) => s + (typeof campo === 'function' ? campo(x) : x[campo]), 0)

const etiquetaDia = (dia) => aFecha(`${dia} 00:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })

// Llave del grupo para el gráfico: día, semana (lunes de esa semana) o mes
const llaveGrupo = (texto, agrupacion) => {
  const f = aFecha(texto)
  if (agrupacion === 'mes') {
    return { llave: `${f.getFullYear()}-${dosDigitos(f.getMonth() + 1)}`, etiqueta: f.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }) }
  }
  if (agrupacion === 'semana') {
    const lunes = diaDe(new Date(f.getFullYear(), f.getMonth(), f.getDate() - ((f.getDay() + 6) % 7)))
    return { llave: lunes, etiqueta: `Semana del ${etiquetaDia(lunes)}` }
  }
  const dia = fechaLocal(texto)
  return { llave: dia, etiqueta: etiquetaDia(dia) }
}

// Agrupa una lista: [{ llave, etiqueta, items }] en orden de llave (como GROUP BY ... ORDER BY)
const agrupar = (lista, fnLlave) => {
  const mapa = {}
  lista.forEach((x) => {
    const g = fnLlave(x)
    mapa[g.llave] ??= { llave: g.llave, etiqueta: g.etiqueta, items: [] }
    mapa[g.llave].items.push(x)
  })
  return Object.keys(mapa).sort().map((k) => mapa[k])
}

// Entrada suma; salida y ajuste restan (así guarda ProductController los ajustes)
const signo = (m) => (m.tipo === 'entrada' ? Math.abs(m.cantidad) : -Math.abs(m.cantidad))

// Una entrada que devuelve stock de una venta anulada o un pedido cancelado es un "reverso"
const esReverso = (m) => m.tipo === 'entrada' && /^(Anulaci|Devoluci|Cancelaci)/i.test(m.observacion)

class ReportController {
  static async getData() {
    return ReportModel.getData()
  }

  static puedeVer(reporte) {
    return AuthController.hasAnyRole(PERMISOS_REPORTES[reporte])
  }

  // Rango inicial de un reporte: desde el registro más antiguo hasta hoy (para que no salga vacío)
  static rangoInicial(fechas) {
    const hoy = diaDe(new Date())
    return { desde: fechas.length ? fechas.map(fechaLocal).sort()[0] : hoy, hasta: hoy }
  }

  // ---------- RF26 / RF27 · Ventas ----------

  // El cajero solo ve sus ventas, igual que en el módulo de Ventas
  static ventasVisibles(ventas) {
    if (AuthController.isAdmin()) return ventas
    const yo = AuthController.getAuthState().currentUser?.id
    return ventas.filter((v) => v.idUsuario === yo)
  }

  // SELECT ... FROM ventas WHERE fecha BETWEEN ... (separa pagadas y anuladas)
  static ventasDelPeriodo(ventas, f) {
    const lista = this.ventasVisibles(ventas)
      .filter((v) => enRango(v.fecha, f.desde, f.hasta) && (!f.idUsuario || v.idUsuario === f.idUsuario) && (!f.idMetodoPago || v.idMetodoPago === f.idMetodoPago))
      .sort((a, b) => aFecha(a.fecha) - aFecha(b.fecha))
    // Solo se cuentan las pagadas: un domicilio pendiente todavía no es plata recibida
    return { pagadas: lista.filter((v) => v.estado === 'pagada'), anuladas: lista.filter((v) => v.estado === 'anulada') }
  }

  // Total, número de ventas y ticket promedio (sin anuladas)
  static resumenVentas(pagadas) {
    const total = sumar(pagadas, 'total')
    return { total, cantidad: pagadas.length, ticket: pagadas.length ? total / pagadas.length : 0 }
  }

  static ventasPorPeriodo(pagadas, agrupacion) {
    return agrupar(pagadas, (v) => llaveGrupo(v.fecha, agrupacion))
      .map((g) => ({ etiqueta: g.etiqueta, valor: sumar(g.items, 'total'), cantidad: g.items.length }))
  }

  // Salen los métodos activos (aunque tengan $0) y los inactivos que sí tengan ventas en el periodo
  static ventasPorMetodo(pagadas, metodos) {
    return metodos
      .filter((m) => m.activo || pagadas.some((v) => v.idMetodoPago === m.id))
      .map((m) => {
        const delMetodo = pagadas.filter((v) => v.idMetodoPago === m.id)
        return { id: m.id, etiqueta: m.nombre, valor: sumar(delMetodo, 'total'), cantidad: delMetodo.length }
      })
  }

  // SUM(detalle_venta.cantidad) GROUP BY producto, del más vendido al menos vendido
  static productosVendidos(pagadas, productos) {
    const mapa = {}
    pagadas.forEach((v) => v.detalle.forEach((d) => {
      mapa[d.codigo] ??= { codigo: d.codigo, unidades: 0, valor: 0 }
      mapa[d.codigo].unidades += d.cantidad
      mapa[d.codigo].valor += d.cantidad * d.precio
    }))
    return Object.values(mapa)
      .map((p) => ({ ...p, etiqueta: productos.find((x) => x.codigo === p.codigo)?.nombre ?? p.codigo }))
      .sort((a, b) => b.unidades - a.unidades || b.valor - a.valor)
  }

  // ---------- RF28 / RF29 · Inventario ----------

  // Kárdex con stock anterior y resultante. Se calcula hacia atrás desde el stock actual:
  // stock antes del primer movimiento = stock actual − suma de todos sus movimientos.
  static kardexCompleto(movimientos, productos) {
    const todos = [...movimientos].sort((a, b) => aFecha(a.fecha) - aFecha(b.fecha) || a.id - b.id)
    const saldo = {}
    productos.forEach((p) => {
      saldo[p.codigo] = p.stock - sumar(todos.filter((m) => m.codigo === p.codigo), signo)
    })
    return todos.map((m) => {
      const producto = productos.find((p) => p.codigo === m.codigo)
      const anterior = saldo[m.codigo] ?? 0
      saldo[m.codigo] = anterior + signo(m)
      return {
        id: m.id, fecha: m.fecha, codigo: m.codigo, producto: producto?.nombre ?? m.codigo, idCategoria: producto?.idCategoria,
        tipo: esReverso(m) ? 'reverso' : m.tipo, cantidad: signo(m), anterior, resultante: saldo[m.codigo],
        usuario: m.usuario, observacion: m.observacion
      }
    })
  }

  static kardex(base, f) {
    return base.filter((r) => enRango(r.fecha, f.desde, f.hasta) && (!f.codigo || r.codigo === f.codigo) &&
      (!f.idCategoria || r.idCategoria === f.idCategoria) &&
      (!f.tipo || r.tipo === f.tipo || (f.tipo === 'entrada' && r.tipo === 'reverso')))
  }

  static resumenKardex(renglones) {
    const entradas = sumar(renglones.filter((r) => r.cantidad > 0), 'cantidad')
    const salidas = -sumar(renglones.filter((r) => r.cantidad < 0), 'cantidad')
    return { entradas, salidas, saldo: entradas - salidas }
  }

  static stockBajo(p) {
    return p.activo && p.stock <= p.stockMinimo
  }

  // Rotación = unidades que salieron por ventas o entregas, menos las que volvieron (reversos)
  static rotacion(base, productos, f) {
    const renglones = this.kardex(base, { desde: f.desde, hasta: f.hasta })
    return productos
      .filter((p) => p.activo && (!f.idCategoria || p.idCategoria === f.idCategoria))
      .map((p) => {
        const suyos = renglones.filter((r) => r.codigo === p.codigo)
        const vendidas = -sumar(suyos.filter((r) => r.tipo === 'salida'), 'cantidad') - sumar(suyos.filter((r) => r.tipo === 'reverso'), 'cantidad')
        return { codigo: p.codigo, etiqueta: p.nombre, valor: Math.max(0, vendidas) }
      })
  }

  // Unidades totales en inventario al inicio del periodo y al final de cada día con movimientos
  static evolucionStock(base, productos, f) {
    const todos = this.kardex(base, { idCategoria: f.idCategoria })
    const saldo = {}
    productos.filter((p) => !f.idCategoria || p.idCategoria === f.idCategoria).forEach((p) => {
      const primero = todos.find((r) => r.codigo === p.codigo)
      saldo[p.codigo] = primero ? primero.anterior : p.stock
    })
    const total = () => sumar(Object.values(saldo), (v) => v)
    todos.forEach((r) => { if (f.desde && fechaLocal(r.fecha) < f.desde) saldo[r.codigo] = r.resultante })
    const enPeriodo = todos.filter((r) => enRango(r.fecha, f.desde, f.hasta))
    if (!enPeriodo.length) return []
    const puntos = [{ etiqueta: 'Inicio del periodo', valor: total() }]
    agrupar(enPeriodo, (r) => llaveGrupo(r.fecha, 'dia')).forEach((g) => {
      g.items.forEach((r) => { saldo[r.codigo] = r.resultante })
      puntos.push({ etiqueta: g.etiqueta, valor: total() })
    })
    return puntos
  }

  static entradasYSalidasPorDia(base, f) {
    return agrupar(this.kardex(base, f), (r) => llaveGrupo(r.fecha, 'dia')).map((g) => ({
      etiqueta: g.etiqueta,
      entradas: sumar(g.items.filter((r) => r.cantidad > 0), 'cantidad'),
      salidas: -sumar(g.items.filter((r) => r.cantidad < 0), 'cantidad')
    }))
  }

  // ---------- Usuarios ----------

  // Total vendido y número de ventas por vendedor (los que pueden vender: admin y cajeros)
  static ventasPorVendedor(ventas, usuarios, f) {
    const { pagadas } = this.ventasDelPeriodo(ventas, f)
    return usuarios
      .filter((u) => [USER_ROLES.ADMIN, USER_ROLES.CAJERO].includes(u.rol))
      .map((u) => {
        const suyas = pagadas.filter((v) => v.idUsuario === u.id)
        return { id: u.id, etiqueta: u.nombreCompleto, valor: sumar(suyas, 'total'), cantidad: suyas.length }
      })
      .sort((a, b) => b.valor - a.valor)
  }

  static usuariosPorRol(usuarios, roles) {
    return roles.map((r) => {
      const delRol = usuarios.filter((u) => u.rol === r.nombre)
      return { id: r.id, etiqueta: r.nombre.charAt(0).toUpperCase() + r.nombre.slice(1), valor: delRol.length, usuarios: delRol }
    }).filter((r) => r.valor > 0)
  }

  // ---------- RF30 · Domicilios ----------

  static pedidosDelPeriodo(pedidos, f) {
    return pedidos
      .filter((p) => enRango(p.fecha, f.desde, f.hasta) && (!f.estado || p.estado === f.estado) &&
        (!f.idDomiciliario || p.idDomiciliario === f.idDomiciliario) && (!f.idBarrio || p.idBarrio === f.idBarrio))
      .sort((a, b) => aFecha(a.fecha) - aFecha(b.fecha))
  }

  static resumenDomicilios(pedidos) {
    const entregados = pedidos.filter((p) => p.estado === 'entregado')
    const conTiempo = entregados.filter((p) => p.fechaAsignacion && p.fechaEntrega)
    const minutos = conTiempo.length
      ? sumar(conTiempo, (p) => (aFecha(p.fechaEntrega) - aFecha(p.fechaAsignacion)) / 60000) / conTiempo.length
      : null
    return {
      total: pedidos.length,
      entregados: entregados.length,
      cancelados: pedidos.filter((p) => p.estado === 'cancelado').length,
      enCurso: pedidos.filter((p) => ['pendiente', 'asignado', 'en_camino'].includes(p.estado)).length,
      valorProductos: sumar(entregados, 'total'),
      valorEnvios: sumar(entregados, 'costoEnvio'),
      minutosPromedio: minutos === null ? null : Math.round(minutos)
    }
  }

  static pedidosPorEstado(pedidos) {
    return Object.keys(TEXTO_ESTADO_PEDIDO).map((e) => ({ id: e, etiqueta: TEXTO_ESTADO_PEDIDO[e], valor: pedidos.filter((p) => p.estado === e).length }))
  }

  static pedidosPorDomiciliario(pedidos, domiciliarios) {
    return domiciliarios.map((d) => {
      const suyos = pedidos.filter((p) => p.idDomiciliario === d.id)
      return { id: d.id, etiqueta: d.nombre, valor: suyos.filter((p) => p.estado === 'entregado').length, asignados: suyos.length }
    }).sort((a, b) => b.valor - a.valor || b.asignados - a.asignados)
  }

  static pedidosPorBarrio(pedidos, barrios) {
    return barrios.map((b) => ({ id: b.id, etiqueta: b.nombre, valor: pedidos.filter((p) => p.idBarrio === b.id).length }))
      .filter((b) => b.valor > 0)
      .sort((a, b) => b.valor - a.valor)
  }
}

export default ReportController
