// src/views/domicilios/MyDeliveriesView.jsx
// VISTA: pedidos del domiciliario (mis_pedidos.html). El controlador ya filtra: solo llegan los suyos.
// Acciones rápidas: "Salir a entregar" (asignado → en camino) y "Confirmar entrega" (en camino → entregado).
import { useState } from 'react'
import { Link } from 'react-router-dom'
import useDeliveries from '../../hooks/useDeliveries'
import DeliveryController from '../../controllers/DeliveryController'
import { ROUTES } from '../../config/routes'
import { formatoPesos } from '../../utils/helpers'
import AlertMessage from '../common/AlertMessage'
import LoadingSpinner from '../common/LoadingSpinner'
import Recorrido, { EtiquetaEstado } from './EstadoPedido'

const ACCION = {
  asignado: { estado: 'en_camino', texto: 'Salir a entregar' },
  en_camino: { estado: 'entregado', texto: 'Confirmar entrega' }
}

const MyDeliveriesView = () => {
  const { deliveries, loading, error, cambiarEstado } = useDeliveries()
  const [pestana, setPestana] = useState('activos')
  const [mensaje, setMensaje] = useState(null)
  const [ocupado, setOcupado] = useState(null)

  if (loading) return <LoadingSpinner />

  const activos = deliveries.filter((p) => ['asignado', 'en_camino'].includes(p.estado))
  const terminados = deliveries.filter((p) => ['entregado', 'cancelado'].includes(p.estado))
  const visibles = pestana === 'activos' ? activos : terminados

  const avanzar = async (pedido) => {
    setOcupado(pedido.id)
    const result = await cambiarEstado(pedido, ACCION[pedido.estado].estado, '', '')
    setOcupado(null)
    setMensaje(result.success ? { type: 'success', message: result.message } : { type: 'error', message: result.error })
  }

  return (
    <section className="grid gap-4">
      <div>
        <h1 className="font-titulo text-2xl text-nav">Mis pedidos</h1>
        <p className="text-t2">{activos.length} por entregar</p>
      </div>

      <div className="flex gap-2" role="tablist" aria-label="Mis pedidos">
        {[['activos', 'Por entregar', activos.length], ['terminados', 'Entregados y cancelados', terminados.length]].map(([clave, texto, n]) => (
          <button key={clave} type="button" role="tab" aria-selected={pestana === clave} onClick={() => setPestana(clave)}
            className={`rounded-full border px-4 py-1.5 font-medium transition ${pestana === clave ? 'border-acc bg-acc text-white' : 'border-borde bg-card text-t2 hover:border-acc'}`}>
            {texto} <span className="opacity-75">{n}</span>
          </button>
        ))}
      </div>

      <AlertMessage type="error" message={error} />
      {mensaje && <AlertMessage type={mensaje.type} message={mensaje.message} />}

      {visibles.length === 0 ? (
        <p className="rounded-2xl border border-borde bg-card p-6 text-center text-t2">
          {pestana === 'activos' ? 'No tienes pedidos por entregar.' : 'Aún no tienes pedidos terminados.'}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
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
                <p className="font-semibold">{p.cliente} · {p.telefonoContacto || p.telefonoCliente}</p>
                <p className="text-t2">{p.direccionEntrega} · {p.barrio}</p>
                {p.observacion && <p className="text-sm text-t2">Nota: {p.observacion}</p>}
                <p className="mt-1 font-medium">Cobrar {formatoPesos(p.totalProductos + p.costoEnvio)} · {p.metodo}</p>
              </div>
              <Recorrido estado={p.estado} />
              <div className="flex flex-wrap gap-2">
                <Link to={ROUTES.DELIVERY_DETAIL(p.id)} className="rounded-lg border border-borde px-3 py-1.5 text-sm font-medium hover:border-acc hover:text-acc">Ver detalle</Link>
                {ACCION[p.estado] && (
                  <button type="button" onClick={() => avanzar(p)} disabled={ocupado === p.id}
                    className="flex-1 rounded-lg bg-acc px-3 py-1.5 font-sub text-white hover:bg-pri disabled:opacity-60">
                    {ocupado === p.id ? 'Guardando…' : ACCION[p.estado].texto}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default MyDeliveriesView
