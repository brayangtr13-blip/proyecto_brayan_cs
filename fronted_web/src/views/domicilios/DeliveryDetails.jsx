// src/views/domicilios/DeliveryDetails.jsx
// VISTA: consultar un pedido (consultar_pedido.html): productos, totales, recorrido, histórico
// y el cambio de estado que el rol permite (lo decide DeliveryStates, no la pantalla).
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useDelivery } from '../../hooks/useDeliveries'
import DeliveryStates, { TEXTO_ESTADO } from '../../controllers/DeliveryStates'
import AuthController from '../../controllers/AuthController'
import { ROUTES } from '../../config/routes'
import { formatoPesos } from '../../utils/helpers'
import AlertMessage from '../common/AlertMessage'
import LoadingSpinner from '../common/LoadingSpinner'
import Recorrido, { EtiquetaEstado } from './EstadoPedido'

const Dato = ({ titulo, children }) => (
  <div><dt className="text-sm text-t2">{titulo}</dt><dd className="font-medium">{children || '—'}</dd></div>
)

const DeliveryDetails = () => {
  const { id } = useParams()
  const { delivery: p, couriers, loading, error, cambiarEstado, asignar } = useDelivery(id)
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [motivo, setMotivo] = useState('')
  const [observacion, setObservacion] = useState('')
  const [mensaje, setMensaje] = useState(null)
  const [guardando, setGuardando] = useState(false)

  if (loading) return <LoadingSpinner />
  const esAdmin = AuthController.isAdmin()
  const volver = esAdmin ? ROUTES.DELIVERIES : ROUTES.MY_DELIVERIES
  if (!p) {
    return (
      <section className="grid gap-4">
        <Link to={volver} className="text-sm text-t2 hover:text-acc">← Volver</Link>
        <AlertMessage type="error" message={error} />
      </section>
    )
  }

  const opciones = DeliveryStates.siguientes(p.estado, AuthController.getUserRole())

  const mostrar = (result) => {
    setMensaje(result.success ? { type: 'success', message: result.message } : { type: 'error', message: result.error })
    if (result.success) {
      setNuevoEstado('')
      setMotivo('')
      setObservacion('')
    }
  }

  const guardarEstado = async (e) => {
    e.preventDefault()
    if (!nuevoEstado) return setMensaje({ type: 'error', message: 'Elige el nuevo estado.' })
    setGuardando(true)
    const result = await cambiarEstado(nuevoEstado, motivo, observacion)
    setGuardando(false)
    mostrar(result)
  }

  const handleAsignar = async (idDomiciliario) => {
    if (idDomiciliario) mostrar(await asignar(idDomiciliario))
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to={volver} className="text-sm text-t2 hover:text-acc">← Volver</Link>
          <h1 className="mt-1 font-titulo text-2xl text-nav">Pedido #{p.id}</h1>
          <p className="text-t2">Registrado el {p.fechaPedido} · venta #{p.idVenta}</p>
        </div>
        <EtiquetaEstado estado={p.estado} />
      </div>

      {mensaje && <AlertMessage type={mensaje.type} message={mensaje.message} />}

      <div className="rounded-2xl border border-borde bg-card p-5"><Recorrido estado={p.estado} /></div>

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="grid content-start gap-4">
          {/* Cliente y entrega */}
          <dl className="grid gap-3 rounded-2xl border border-borde bg-card p-5 sm:grid-cols-2">
            <h2 className="font-sub text-lg text-nav sm:col-span-2">Cliente y entrega</h2>
            <Dato titulo="Cliente">{p.cliente}</Dato>
            <Dato titulo="Teléfono">{p.telefonoCliente}</Dato>
            <Dato titulo="Dirección de entrega">{p.direccionEntrega}</Dato>
            <Dato titulo="Barrio">{p.barrio}</Dato>
            <Dato titulo="Quién recibe (teléfono)">{p.telefonoContacto}</Dato>
            <Dato titulo="Domiciliario">{p.domiciliario ?? <span className="text-warn">Sin asignar</span>}</Dato>
            {p.observacion && <div className="sm:col-span-2"><Dato titulo="Observaciones">{p.observacion}</Dato></div>}
          </dl>

          {/* Productos (detalle_venta de la venta del pedido) */}
          <div className="grid gap-3 rounded-2xl border border-borde bg-card p-5">
            <h2 className="font-sub text-lg text-nav">Productos</h2>
            <ul className="grid gap-2">
              {p.productos.map((i) => (
                <li key={i.codigo} className="flex justify-between gap-3 rounded-xl bg-fondo px-4 py-2.5">
                  <span><strong>{i.cantidad} ×</strong> {i.producto} <span className="text-sm text-t2">({formatoPesos(i.precio)})</span></span>
                  <strong className="tabular-nums">{formatoPesos(i.subtotal)}</strong>
                </li>
              ))}
            </ul>
            <p className="flex justify-between text-t2"><span>Productos</span><span className="tabular-nums">{formatoPesos(p.totalProductos)}</span></p>
            <p className="flex justify-between text-t2"><span>Envío</span><span className="tabular-nums">{formatoPesos(p.costoEnvio)}</span></p>
            <p className="flex justify-between border-t border-borde pt-3 font-sub text-xl text-nav">
              <span>Total a cobrar · {p.metodo}</span><span className="tabular-nums">{formatoPesos(p.totalProductos + p.costoEnvio)}</span>
            </p>
          </div>
        </div>

        <div className="grid content-start gap-4">
          {/* Asignar (solo admin, mientras el pedido no termine) */}
          {esAdmin && !DeliveryStates.esFinal(p.estado) && (
            <label className="grid gap-2 rounded-2xl border border-borde bg-card p-5 font-medium">
              <span className="font-sub text-lg text-nav">{p.domiciliario ? 'Reasignar domiciliario' : 'Asignar domiciliario'}</span>
              <select value="" onChange={(e) => handleAsignar(e.target.value)} className="rounded-xl border border-borde bg-card px-4 py-2.5">
                <option value="">Elige un domiciliario…</option>
                {couriers.filter((d) => d.activo && d.id !== p.idDomiciliario).map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
              </select>
            </label>
          )}

          {/* Cambiar estado: solo aparecen los estados que este rol puede poner desde el actual */}
          {opciones.length > 0 && (
            <form onSubmit={guardarEstado} className="grid gap-3 rounded-2xl border border-borde bg-card p-5">
              <h2 className="font-sub text-lg text-nav">Cambiar estado</h2>
              <select value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)} aria-label="Nuevo estado" className="rounded-xl border border-borde bg-card px-4 py-2.5">
                <option value="">Elige el nuevo estado</option>
                {opciones.map((e) => <option key={e} value={e}>{TEXTO_ESTADO[e]}</option>)}
              </select>
              {nuevoEstado === 'cancelado' && (
                <label className="grid gap-1 font-medium">Motivo de la cancelación
                  <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej: el cliente no contestó" className="rounded-xl border border-borde bg-card px-4 py-2.5" />
                </label>
              )}
              <label className="grid gap-1 font-medium">Observación (opcional)
                <input value={observacion} onChange={(e) => setObservacion(e.target.value)} className="rounded-xl border border-borde bg-card px-4 py-2.5" />
              </label>
              <button type="submit" disabled={guardando} className={`rounded-xl py-2.5 font-sub text-white disabled:opacity-60 ${nuevoEstado === 'cancelado' ? 'bg-err' : 'bg-acc hover:bg-pri'}`}>
                {guardando ? 'Guardando…' : 'Guardar estado'}
              </button>
            </form>
          )}
          {DeliveryStates.esFinal(p.estado) && (
            <p className="rounded-2xl border border-borde bg-card p-5 text-t2">Este pedido ya está {TEXTO_ESTADO[p.estado].toLowerCase()} y no se puede modificar.</p>
          )}

          {/* Histórico (log_auditoria del módulo Domicilios) */}
          <div className="grid gap-3 rounded-2xl border border-borde bg-card p-5">
            <h2 className="font-sub text-lg text-nav">Histórico</h2>
            {p.historial.length === 0 && <p className="text-t2">Sin movimientos registrados.</p>}
            <ol className="grid gap-3 border-l-2 border-borde pl-4">
              {p.historial.map((h) => (
                <li key={h.id}>
                  <p className="font-medium">{h.detalle}</p>
                  <p className="text-sm text-t2">{h.fecha} · {h.usuario}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DeliveryDetails
