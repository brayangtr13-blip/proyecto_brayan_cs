// src/hooks/useProducts.js
// HOOKS del inventario: conectan las vistas con ProductController.
// Patrón de los efectos: pedir → si la vista sigue abierta ("activo"), guardar el resultado.
import { useCallback, useEffect, useState } from 'react'
import ProductController from '../controllers/ProductController'

// Lista con filtros { q, categoria, estado }. Cada vez que cambian, se vuelve a pedir la lista.
const useProducts = (filtros) => {
  const [products, setProducts] = useState([])
  const categories = useCategories() // se piden una sola vez
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0) // subirla = volver a cargar (después de una acción)

  const { q, categoria, estado } = filtros
  useEffect(() => {
    let activo = true
    ProductController.getProducts({ q, categoria, estado }).then((result) => {
      if (!activo) return
      setProducts(result.success ? result.data : [])
      setError(result.success ? '' : result.error)
      setLoading(false)
    })
    return () => {
      activo = false
    }
  }, [q, categoria, estado, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  // Dar de baja o reactivar y recargar la lista
  const toggleActive = async (producto) => {
    const result = await ProductController.setActive(producto)
    if (result.success) reload()
    return result
  }

  return { products, categories, loading, error, reload, toggleActive }
}

// Un producto con su kárdex (para la ficha y el formulario de edición)
export const useProduct = (codigo) => {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let activo = true
    ProductController.getProduct(codigo).then((result) => {
      if (!activo) return
      setProduct(result.success ? result.data : null)
      setError(result.success ? '' : result.error)
      setLoading(false)
    })
    return () => {
      activo = false
    }
  }, [codigo, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  // Entrada o ajuste: si sale bien, se recarga para ver el stock y el kárdex nuevos
  const addMovement = async (mov) => {
    const result = await ProductController.addMovement(codigo, mov)
    if (result.success) reload()
    return result
  }

  return { product, loading, error, reload, addMovement }
}

// Solo las categorías (para el formulario, sin pedir toda la lista de productos)
export const useCategories = () => {
  const [categories, setCategories] = useState([])
  useEffect(() => {
    let activo = true
    ProductController.getCategories().then((result) => {
      if (activo && result.success) setCategories(result.data)
    })
    return () => {
      activo = false
    }
  }, [])
  return categories
}

// Alertas de stock, ya ordenadas por gravedad
export const useStockAlerts = () => {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    ProductController.getAlerts().then((result) => {
      if (!activo) return
      setAlerts(result.success ? result.data : [])
      setError(result.success ? '' : result.error)
      setLoading(false)
    })
    return () => {
      activo = false
    }
  }, [])

  return { alerts, loading, error }
}

export default useProducts
