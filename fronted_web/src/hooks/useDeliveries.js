// src/hooks/useDeliveries.js
// HOOKS de domicilios: lista, un pedido, registrar pedido (carrito) y simulador del chatbot.
// Patrón de los efectos: pedir → si la vista sigue abierta ("activo"), guardar el resultado.
import { useCallback, useEffect, useState } from 'react'
import DeliveryController from '../controllers/DeliveryController'
import DeliveryNotifications from '../controllers/DeliveryNotifications'
import ProductController from '../controllers/ProductController'
import SaleController from '../controllers/SaleController'
import AuthController from '../controllers/AuthController'

// Lista de pedidos (el domiciliario solo recibe los suyos) y domiciliarios para asignar
const useDeliveries = () => {
  const [deliveries, setDeliveries] = useState([])
  const [couriers, setCouriers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let activo = true
    const pedidos = DeliveryController.getDeliveries()
    const domiciliarios = AuthController.isAdmin() ? DeliveryController.getCouriers() : Promise.resolve({ success: true, data: [] })
    Promise.all([pedidos, domiciliarios]).then(([p, d]) => {
      if (!activo) return
      setDeliveries(p.success ? p.data : [])
      setCouriers(d.success ? d.data : [])
      setError(p.success ? '' : p.error)
      setLoading(false)
    })
    return () => {
      activo = false
    }
  }, [version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  const conRecarga = (accion) => async (...args) => {
    const result = await accion(...args)
    if (result.success) reload()
    return result
  }

  return {
    deliveries, couriers, loading, error, reload,
    asignar: conRecarga((pedido, idDomiciliario) => DeliveryController.asignar(pedido, idDomiciliario)),
    cambiarEstado: conRecarga((pedido, estado, motivo, observacion) => DeliveryController.cambiarEstado(pedido, estado, motivo, observacion, deliveries))
  }
}

// Un pedido con sus productos e histórico
export const useDelivery = (id) => {
  const [delivery, setDelivery] = useState(null)
  const [couriers, setCouriers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let activo = true
    const domiciliarios = AuthController.isAdmin() ? DeliveryController.getCouriers() : Promise.resolve({ success: true, data: [] })
    Promise.all([DeliveryController.getDelivery(id), domiciliarios]).then(([result, d]) => {
      if (!activo) return
      setDelivery(result.success ? result.data : null)
      setCouriers(d.success ? d.data : [])
      setError(result.success ? '' : result.error)
      setLoading(false)
    })
    return () => {
      activo = false
    }
  }, [id, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  const conRecarga = async (promesa) => {
    const result = await promesa
    if (result.success) reload()
    return result
  }

  return {
    delivery, couriers, loading, error,
    cambiarEstado: (estado, motivo, observacion) => conRecarga(DeliveryController.cambiarEstado(delivery, estado, motivo, observacion)),
    asignar: (idDomiciliario) => conRecarga(DeliveryController.asignar(delivery, idDomiciliario))
  }
}

// Registrar pedido por teléfono: productos, barrios, métodos de pago y el carrito
export const useNewDelivery = () => {
  const [catalogos, setCatalogos] = useState({ products: [], barrios: [], methods: [] })
  const [items, setItems] = useState([])

  useEffect(() => {
    let activo = true
    Promise.all([ProductController.getProducts({ estado: 'activos' }), DeliveryController.getNeighborhoods(), SaleController.getPaymentMethods()])
      .then(([p, b, m]) => {
        if (activo) setCatalogos({ products: p.data ?? [], barrios: b.data ?? [], methods: m.data ?? [] })
      })
    return () => {
      activo = false
    }
  }, [])

  // Misma regla del punto de venta: nunca más de lo que hay en stock
  const agregar = (producto, cantidad = 1) => {
    const enPedido = items.find((i) => i.codigo === producto.codigo)?.cantidad ?? 0
    const error = SaleController.validarCantidad(producto, enPedido + cantidad)
    if (error) return error
    setItems(enPedido
      ? items.map((i) => (i.codigo === producto.codigo ? { ...i, cantidad: i.cantidad + cantidad } : i))
      : [...items, { codigo: producto.codigo, nombre: producto.nombre, precio: producto.precioUnitario, cantidad }])
    return null
  }

  const quitar = (codigo) => setItems(items.filter((i) => i.codigo !== codigo))

  return {
    ...catalogos, items, total: SaleController.calcularTotal(items), agregar, quitar,
    buscarCliente: (telefono) => DeliveryController.findCustomer(telefono),
    registrar: (datos) => DeliveryController.registrarPedido({ ...datos, items })
  }
}

// Simulador del chatbot: clientes, sus pedidos y los mensajes que el sistema les envió
export const useChatbot = () => {
  const [clientes, setClientes] = useState([])
  const [pedidos, setPedidos] = useState([])

  useEffect(() => {
    let activo = true
    Promise.all([DeliveryController.getCustomers(), DeliveryController.getDeliveries()]).then(([c, p]) => {
      if (!activo) return
      setClientes(c.data ?? [])
      setPedidos(p.data ?? [])
    })
    return () => {
      activo = false
    }
  }, [])

  return {
    clientes,
    mensajesDe: (telefono) => DeliveryNotifications.mensajesDe(telefono),
    responder: (texto, telefono) => DeliveryNotifications.responderConsulta(texto, telefono, pedidos)
  }
}

export default useDeliveries
