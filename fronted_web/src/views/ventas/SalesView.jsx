// src/views/ventas/SalesView.jsx
// VISTA: historial de ventas (listar_ventas.html) con filtros y anulación (solo administrador).
import { useState } from 'react'
import { Link } from 'react-router-dom'
import useSales from '../../hooks/useSales'
import useUsers from '../../hooks/useUsers'
import SaleController from '../../controllers/SaleController'
import AuthController from '../../controllers/AuthController'
import { ROUTES } from '../../config/routes'
import { formatoPesos } from '../../utils/helpers'
import AlertMessage from '../common/AlertMessage'
import LoadingSpinner from '../common/LoadingSpinner'

const campo = 'rounded-xl border border-borde bg-card px-3 py-2.5 outline-none focus:border-acc focus:ring-2 focus:ring-acc/30'
const ESTADO = { pagada: 'bg-ok/10 text-ok', pendiente: 'bg-warn/10 text-warn', anulada: 'bg-err/10 text-err' }

const SalesView = () => {
  const esAdmin = AuthController.isAdmin()
  const [filtros, setFiltros] = useState({ desde: '', hasta: '', idCajero: '', idMetodo: '', factura: '' })
  const { sales, methods, loading, error, anular } = useSales(filtros)
  const { users } = useUsers() // para el filtro de cajero (solo lo usa el administrador)
  const [mensaje, setMensaje] = useState(null)
  const [aAnular, setAAnular] = useState(null)

  const cambiarFiltro = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value })
  const cajeros = users.filter((u) => ['administrador', 'cajero'].includes(u.role))

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-titulo text-2xl text-nav">Ventas</h1>
          <p className="text-t2">{sales.length} ventas · {formatoPesos(SaleController.totalPagadas(sales))} cobrados (sin anuladas ni domicilios pendientes)</p>
        </div>
        <Link to={ROUTES.POS} className="rounded-xl bg-acc px-4 py-2.5 font-sub text-white hover:bg-pri">Registrar venta</Link>
      </div>

      <div className={`grid gap-3 rounded-2xl border border-borde bg-card p-4 sm:grid-cols-2 ${esAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
        <label className="grid gap-1 font-medium">Desde<input type="date" name="desde" value={filtros.desde} onChange={cambiarFiltro} className={campo} /></label>
        <label className="grid gap-1 font-medium">Hasta<input type="date" name="hasta" value={filtros.hasta} onChange={cambiarFiltro} className={campo} /></label>
        {esAdmin && (
          <label className="grid gap-1 font-medium">Cajero
            <select name="idCajero" value={filtros.idCajero} onChange={cambiarFiltro} className={campo}>
              <option value="">Todos</option>
              {cajeros.map((u) => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}
            </select>
          </label>
        )}
        <label className="grid gap-1 font-medium">Método de pago
          <select name="idMetodo" value={filtros.idMetodo} onChange={cambiarFiltro} className={campo}>
            <option value="">Todos</option>
            {methods.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </label>
        <label className="grid gap-1 font-medium">N.º de factura<input type="number" min={1} name="factura" value={filtros.factura} onChange={cambiarFiltro} placeholder="Ej: 4" className={campo} /></label>
      </div>

      <AlertMessage type="error" message={error} />
      {mensaje && <AlertMessage type={mensaje.type} message={mensaje.message} />}
      {aAnular && <FormularioAnulacion venta={aAnular} cancelar={() => setAAnular(null)}
        confirmar={async (tipo, motivo) => {
          const result = await anular(aAnular.id, tipo, motivo)
          if (result.success) {
            setAAnular(null)
            setMensaje({ type: 'success', message: result.message })
          }
          return result
        }} />}

      {loading ? <LoadingSpinner /> : sales.length === 0 ? (
        <p className="rounded-2xl border border-borde bg-card p-6 text-center text-t2">No hay ventas con esos filtros.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-borde bg-card">
          <table className="w-full min-w-[820px] text-left">
            <thead className="border-b border-borde font-sub text-xs uppercase tracking-wider text-t2">
              <tr>
                <th className="px-4 py-3">Factura</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Hora</th>
                <th className="px-4 py-3">Cajero</th><th className="px-4 py-3">Método</th><th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Estado</th><th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((v) => (
                <tr key={v.id} className="border-b border-borde last:border-0">
                  <td className="px-4 py-3 font-semibold tabular-nums">#{v.id}</td>
                  <td className="px-4 py-3 tabular-nums">{v.fecha.slice(0, 10)}</td>
                  <td className="px-4 py-3 tabular-nums text-t2">{v.fecha.slice(11, 16)}</td>
                  <td className="px-4 py-3">{v.cajero}</td>
                  <td className="px-4 py-3">{v.metodo}{v.esDomicilio && <span className="ml-2 text-sm text-t2">· domicilio</span>}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatoPesos(v.total)}</td>
                  <td className="px-4 py-3"><span className={`rounded-lg px-2 py-1 text-sm font-medium capitalize ${ESTADO[v.estado]}`}>{v.estado}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link to={ROUTES.SALE_DETAIL(v.id)} className="rounded-lg border border-borde px-3 py-1.5 text-sm font-medium hover:border-acc hover:text-acc">Ver</Link>
                      {esAdmin && v.estado !== 'anulada' && !v.esDomicilio && (
                        <button type="button" onClick={() => { setMensaje(null); setAAnular(v) }}
                          className="rounded-lg border border-borde px-3 py-1.5 text-sm font-medium hover:border-err hover:text-err">Anular</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

// HU04: anulación o devolución (CU022) con motivo de al menos 10 caracteres
const FormularioAnulacion = ({ venta, cancelar, confirmar }) => {
  const [tipo, setTipo] = useState('anulacion')
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)
    const result = await confirmar(tipo, motivo)
    setGuardando(false)
    if (!result.success) setError(result.error)
  }

  return (
    <form onSubmit={handleSubmit} role="alertdialog" aria-label={`Anular factura #${venta.id}`} className="grid gap-3 rounded-2xl border border-err/30 bg-err/5 p-5">
      <h2 className="font-sub text-lg text-err">Anular factura #{venta.id} · {formatoPesos(venta.total)}</h2>
      <p className="text-t2">La venta queda en el historial como anulada y sus productos vuelven al inventario.</p>
      <AlertMessage type="error" message={error} />
      <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
        <label className="grid gap-1 font-medium">Tipo
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={campo}>
            <option value="anulacion">Anulación</option>
            <option value="devolucion">Devolución</option>
          </select>
        </label>
        <label className="grid gap-1 font-medium">Motivo
          <input value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={200} placeholder="Mínimo 10 caracteres" className={campo} />
        </label>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={cancelar} className="rounded-xl border border-borde px-4 py-2 font-medium">Cancelar</button>
        <button type="submit" disabled={guardando} className="rounded-xl bg-err px-4 py-2 font-medium text-white disabled:opacity-60">
          {guardando ? 'Anulando…' : 'Anular venta'}
        </button>
      </div>
    </form>
  )
}

export default SalesView
