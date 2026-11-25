// src/views/domicilios/DeliveriesView.jsx
// VISTA: panel de domicilios del administrador (listar_domicilios.html): pestañas por estado,
// tiempo transcurrido y asignación de domiciliario con su carga de pedidos activos.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import useDeliveries from '../../hooks/useDeliveries'
import DeliveryController from '../../controllers/DeliveryController'
import DeliveryStates, { TEXTO_ESTADO } from '../../controllers/DeliveryStates'
import { ROUTES } from '../../config/routes'
import { formatoPesos } from '../../utils/helpers'
import AlertMessage from '../common/AlertMessage'
import LoadingSpinner from '../common/LoadingSpinner'
import Recorrido, { EtiquetaEstado } from './EstadoPedido'

const PESTANAS = ['todos', 'pendiente', 'asignado', 'en_camino', 'entregado', 'cancelado']

const DeliveriesView = () => {
  const { deliveries, couriers, loading, error, asignar } = useDeliveries()
  const [pestana, setPestana] = useState('todos')
  const [mensaje, setMensaje] = useState(null)

  if (loading) return <LoadingSpinner />

  const visibles = pestana === 'todos' ? deliveries : deliveries.filter((p) => p.estado === pestana)
  const cuenta = (estado) => (estado === 'todos' ? deliveries.length : deliveries.filter((p) => p.estado === estado).length)
  const promedio = DeliveryController.tiempoPromedioEntrega(deliveries)
  const activos = deliveries.filter((p) => ['pendiente', 'asignado', 'en_camino'].includes(p.estado)).length

  const handleAsignar = async (pedido, idDomiciliario) => {
    if (!idDomiciliario) return
    const result = await asignar(pedido, idDomiciliario)
    setMensaje(result.success ? { type: 'success', message: result.message } : { type: 'error', message: result.error })
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-titulo text-2xl text-nav">Domicilios</h1>
          <p className="text-t2">{activos} {activos === 1 ? 'pedido activo' : 'pedidos activos'} · entrega promedio: {promedio === null ? 'sin datos' : `${promedio} min`}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={ROUTES.CHATBOT} className="rounded-xl border border-borde bg-card px-4 py-2.5 font-medium hover:border-acc hover:text-acc">Simulador del chatbot</Link>
          <Link to={ROUTES.DELIVERY_NEW} className="rounded-xl bg-acc px-4 py-2.5 font-sub text-white hover:bg-pri">Registrar pedido</Link>
        </div>
      </div>

      {/* Pestañas por estado (ENUM de domicilios.estado) con su cantidad */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por estado">
        {PESTANAS.map((p) => (
          <button key={p} type="button" role="tab" aria-selected={pestana === p} onClick={() => setPestana(p)}
            className={`rounded-full border px-4 py-1.5 font-medium transition ${pestana === p ? 'border-acc bg-acc text-white' : 'border-borde bg-card text-t2 hover:border-acc'}`}>
            {p === 'todos' ? 'Todos' : TEXTO_ESTADO[p]} <span className="opacity-75">{cuenta(p)}</span>
          </button>
        ))}
      </div>

      <AlertMessage type="error" message={error} />
      {mensaje && <AlertMessage type={mensaje.type} message={mensaje.message} />}

      {visibles.length === 0 ? (
        <p className="rounded-2xl border border-borde bg-card p-6 text-center text-t2">No hay pedidos en este estado.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibles.map((p) => (
            <article key={p.id} className="grid content-start gap-3 rounded-2xl border border-borde bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-titulo text-lg text-nav">#{p.id}</h2>
                  <p className="text-sm text-t2">{DeliveryController.tiempoTranscurrido(p.fechaPedido)}</p>
                </div>
                <EtiquetaEstado estado={p.estado} />
              </div>
              <div>
                <p className="font-semibold">{p.cliente}</p>
                <p className="text-t2">{p.direccionEntrega} · {p.barrio}</p>
                <p className="text-sm text-t2">{formatoPesos(p.totalProductos)} + envío {formatoPesos(p.costoEnvio)} · {p.metodo}</p>
              </div>
              <Recorrido estado={p.estado} />
              <p className="text-sm">{p.domiciliario ? <>Lo lleva <strong>{p.domiciliario}</strong></> : <span className="text-warn">Sin domiciliario</span>}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Link to={ROUTES.DELIVERY_DETAIL(p.id)} className="rounded-lg border border-borde px-3 py-1.5 text-sm font-medium hover:border-acc hover:text-acc">Ver</Link>
                {/* HU05: asignar o reasignar mientras el pedido no haya terminado; se muestra la carga de cada uno */}
                {!DeliveryStates.esFinal(p.estado) && (
                  <select aria-label={`Asignar domiciliario al pedido #${p.id}`} value="" onChange={(e) => handleAsignar(p, e.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-borde bg-card px-2 py-1.5 text-sm">
                    <option value="">{p.domiciliario ? 'Reasignar…' : 'Asignar domiciliario…'}</option>
                    {couriers.filter((d) => d.activo && d.id !== p.idDomiciliario).map((d) => (
                      <option key={d.id} value={d.id}>{d.nombre} · {DeliveryController.cargaDe(d.id, deliveries)} activos</option>
                    ))}
                  </select>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default DeliveriesView
