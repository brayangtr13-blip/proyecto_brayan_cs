// src/hooks/useSales.js
// HOOKS de ventas: lista con filtros, una venta y el punto de venta (carrito).
// Patrón de los efectos: pedir → si la vista sigue abierta ("activo"), guardar el resultado.
import { useCallback, useEffect, useState } from 'react'
import SaleController from '../controllers/SaleController'
import CashController from '../controllers/CashController'
import ProductController from '../controllers/ProductController'

// Lista de ventas con filtros { desde, hasta, idCajero, idMetodo, factura }
const useSales = (filtros) => {
  const [sales, setSales] = useState([])
  const [methods, setMethods] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)

  const { desde, hasta, idCajero, idMetodo, factura } = filtros
  useEffect(() => {
    let activo = true
    SaleController.getSales({ desde, hasta, idCajero, idMetodo, factura }).then((result) => {
      if (!activo) return
      setSales(result.success ? result.data : [])
      setError(result.success ? '' : result.error)
      setLoading(false)
    })
    return () => {
      activo = false
    }
  }, [desde, hasta, idCajero, idMetodo, factura, version])

  useEffect(() => {
    let activo = true
    SaleController.getPaymentMethods().then((result) => {
      if (activo && result.success) setMethods(result.data)
    })
    return () => {
      activo = false
    }
  }, [])

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  const anular = async (id, tipo, motivo) => {
    const result = await SaleController.anularVenta(id, tipo, motivo)
    if (result.success) reload()
    return result
  }

  return { sales, methods, loading, error, reload, anular }
}

// Una venta con su detalle
export const useSale = (id) => {
  const [sale, setSale] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    SaleController.getSale(id).then((result) => {
      if (!activo) return
      setSale(result.success ? result.data : null)
      setError(result.success ? '' : result.error)
      setLoading(false)
    })
    return () => {
      activo = false
    }
  }, [id])

  return { sale, loading, error }
}

// Punto de venta: turno del cajero, productos activos, métodos de pago y el carrito
export const usePos = () => {
  const [shift, setShift] = useState(null)
  const [products, setProducts] = useState([])
  const [methods, setMethods] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let activo = true
    Promise.all([CashController.getMyShift(), ProductController.getProducts({ estado: 'activos' }), SaleController.getPaymentMethods()])
      .then(([turno, productos, metodos]) => {
        if (!activo) return
        setShift(turno.success ? turno.data : null)
        setProducts(productos.success ? productos.data : [])
        setMethods(metodos.success ? metodos.data : [])
        setError(turno.success ? '' : turno.error)
        setLoading(false)
      })
    return () => {
      activo = false
    }
  }, [version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  // Agregar: si ya está en el carrito suma la cantidad; nunca más de lo que hay en stock
  const agregar = (producto, cantidad = 1) => {
    const enCarrito = items.find((i) => i.codigo === producto.codigo)?.cantidad ?? 0
    const error = SaleController.validarCantidad(producto, enCarrito + cantidad)
    if (error) return error
    setItems(enCarrito
      ? items.map((i) => (i.codigo === producto.codigo ? { ...i, cantidad: i.cantidad + cantidad } : i))
      : [...items, { codigo: producto.codigo, nombre: producto.nombre, precio: producto.precioUnitario, cantidad, stock: producto.stockActual }])
    return null
  }

  const cambiarCantidad = (codigo, cantidad) => {
    const producto = products.find((p) => p.codigo === codigo)
    if (cantidad <= 0) {
      setItems(items.filter((i) => i.codigo !== codigo))
      return null
    }
    const error = SaleController.validarCantidad(producto, cantidad)
    if (error) return error
    setItems(items.map((i) => (i.codigo === codigo ? { ...i, cantidad } : i)))
    return null
  }

  const quitar = (codigo) => setItems(items.filter((i) => i.codigo !== codigo))
  const limpiar = () => setItems([])

  const abrirCaja = async (base) => {
    const result = await CashController.openShift(base)
    if (result.success) reload()
    return result
  }

  // Al registrar, se vacía el carrito y se recargan los productos (el stock cambió)
  const registrar = async (idMetodoPago, recibido) => {
    const result = await SaleController.registrarVenta(items, idMetodoPago, recibido)
    if (result.success) {
      setItems([])
      reload()
    }
    return result
  }

  return {
    shift, products, methods, items, loading, error,
    total: SaleController.calcularTotal(items),
    agregar, cambiarCantidad, quitar, limpiar, abrirCaja, registrar
  }
}

export default useSales
