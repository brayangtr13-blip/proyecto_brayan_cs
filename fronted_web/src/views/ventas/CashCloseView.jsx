// src/views/ventas/CashCloseView.jsx
// VISTA: cierre de caja (cierre_caja.html). Solo el administrador cierra (RF18): elige el turno,
// ve lo recaudado por método, cuenta el efectivo y la diferencia se calcula sola.
import { useState } from 'react'
import useCash, { useShiftSummary } from '../../hooks/useCash'
import CashController from '../../controllers/CashController'
import { formatoFecha, formatoPesos } from '../../utils/helpers'
import AlertMessage from '../common/AlertMessage'
import LoadingSpinner from '../common/LoadingSpinner'

const campo = (conError) =>
  `w-full rounded-xl border bg-card px-4 py-2.5 outline-none focus:ring-2 focus:ring-acc/30 ${conError ? 'border-err' : 'border-borde focus:border-acc'}`

// Negativo = faltante (rojo), positivo = sobrante (ámbar), cero = cuadrada (verde)
const colorDiferencia = (d) => (d < 0 ? 'text-err' : d > 0 ? 'text-warn' : 'text-ok')
const textoDiferencia = (d) => (d < 0 ? 'Faltante' : d > 0 ? 'Sobrante' : 'Caja cuadrada')

const CashCloseView = () => {
  const { abiertos, cerrados, loading, error, cerrar } = useCash()
  const [idTurno, setIdTurno] = useState('')
  const [mensaje, setMensaje] = useState(null)

  const turno = abiertos.find((t) => t.id === Number(idTurno)) ?? null

  if (loading) return <LoadingSpinner />

  return (
    <section className="grid gap-4">
      <div>
        <h1 className="font-titulo text-2xl text-nav">Cierre de caja</h1>
        <p className="text-t2">Cuenta el efectivo del cajón: la diferencia sale de contado − base − ventas en efectivo.</p>
      </div>
      <AlertMessage type="error" message={error} />
      {mensaje && <AlertMessage type={mensaje.type} message={mensaje.message} />}

      {abiertos.length === 0 ? (
        <p className="rounded-2xl border border-borde bg-card p-6 text-center text-t2">No hay turnos abiertos para cerrar.</p>
      ) : (
        <label className="grid max-w-md gap-1 font-medium">
          Turno que vas a cerrar
          <select value={idTurno} onChange={(e) => { setIdTurno(e.target.value); setMensaje(null) }} className={campo(false)}>
            <option value="">Elige un turno abierto</option>
            {abiertos.map((t) => <option key={t.id} value={t.id}>#{t.id} · {t.cajero} · desde {formatoFecha(t.fechaApertura)}</option>)}
          </select>
        </label>
      )}

      {turno && (
        <FormularioCierre key={turno.id} turno={turno}
          cerrar={async (contado, observacion) => {
            const result = await cerrar(turno, contado, observacion)
            if (result.success) {
              setIdTurno('')
              setMensaje({ type: 'success', message: `Turno #${turno.id} cerrado. ${textoDiferencia(result.diferencia)}: ${formatoPesos(result.diferencia)}.` })
            }
            return result
          }} />
      )}

      <div className="overflow-x-auto rounded-2xl border border-borde bg-card">
        <h2 className="border-b border-borde px-5 py-4 font-sub text-lg text-nav">Cierres anteriores</h2>
        <table className="w-full min-w-[860px] text-left">
          <thead className="border-b border-borde font-sub text-xs uppercase tracking-wider text-t2">
            <tr>
              <th className="px-4 py-3">Turno</th><th className="px-4 py-3">Cajero</th><th className="px-4 py-3">Apertura</th><th className="px-4 py-3">Cierre</th>
              <th className="px-4 py-3 text-right">Ventas</th><th className="px-4 py-3 text-right">Contado</th><th className="px-4 py-3 text-right">Diferencia</th><th className="px-4 py-3">Observación</th>
            </tr>
          </thead>
          <tbody>
            {cerrados.map((t) => (
              <tr key={t.id} className="border-b border-borde last:border-0">
                <td className="px-4 py-3 font-semibold">#{t.id}</td>
                <td className="px-4 py-3">{t.cajero}</td>
                <td className="px-4 py-3 text-sm text-t2">{formatoFecha(t.fechaApertura)}</td>
                <td className="px-4 py-3 text-sm text-t2">{formatoFecha(t.fechaCierre)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatoPesos(t.totalVentas)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatoPesos(t.montoFinal)}</td>
                <td className={`px-4 py-3 text-right font-semibold tabular-nums ${colorDiferencia(t.diferencia)}`}>{formatoPesos(t.diferencia)}</td>
                <td className="px-4 py-3 text-t2">{t.observacion ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

const FormularioCierre = ({ turno, cerrar }) => {
  const resumen = useShiftSummary(turno)
  const [contado, setContado] = useState('')
  const [observacion, setObservacion] = useState('')
  const [fields, setFields] = useState({})
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  if (!resumen) return <LoadingSpinner />
  const diferencia = contado === '' ? null : CashController.calcularDiferencia(turno, resumen, contado)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)
    const result = await cerrar(contado, observacion)
    setGuardando(false)
    if (!result.success) {
      setError(result.error)
      setFields(result.fields ?? {})
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-borde bg-card p-5">
        <h2 className="font-sub text-lg text-nav">Recaudo por método de pago</h2>
        <p className="text-sm text-t2">
          {resumen.numeroVentas} {resumen.numeroVentas === 1 ? 'venta pagada' : 'ventas pagadas'} en el turno #{turno.id}
        </p>
        <ul className="mt-3 grid gap-2">
          {resumen.porMetodo.length === 0 && <li className="text-t2">Este turno no tiene ventas pagadas.</li>}
          {resumen.porMetodo.map((m) => (
            <li key={m.id} className="flex justify-between rounded-xl bg-fondo px-4 py-2.5">
              <span>{m.nombre} <span className="text-sm text-t2">· {m.cantidad}</span></span>
              <strong className="tabular-nums">{formatoPesos(m.total)}</strong>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex justify-between border-t border-borde pt-3 font-sub"><span>Total vendido</span><span>{formatoPesos(resumen.totalVentas)}</span></p>
      </div>

      <div className="grid content-start gap-3 rounded-2xl border border-borde bg-card p-5">
        <h2 className="font-sub text-lg text-nav">Cuadre de caja</h2>
        <AlertMessage type="error" message={error} />
        <p className="flex justify-between"><span className="text-t2">Base inicial</span><span className="tabular-nums">{formatoPesos(turno.montoInicial)}</span></p>
        <p className="flex justify-between"><span className="text-t2">+ Ventas en efectivo</span><span className="tabular-nums">{formatoPesos(resumen.totalEfectivo)}</span></p>
        <p className="flex justify-between font-semibold"><span>= Efectivo esperado</span><span className="tabular-nums">{formatoPesos(resumen.efectivoEsperado)}</span></p>
        <label className="grid gap-1 font-medium">
          Efectivo contado en caja
          <input type="number" min={0} inputMode="numeric" value={contado} onChange={(e) => setContado(e.target.value)} className={campo(fields.contado)} />
          {fields.contado && <span className="text-sm font-normal text-err">{fields.contado}</span>}
        </label>
        {diferencia !== null && (
          <p className={`flex justify-between rounded-xl bg-fondo px-4 py-3 font-sub ${colorDiferencia(diferencia)}`}>
            <span>{textoDiferencia(diferencia)}</span><span className="tabular-nums">{formatoPesos(diferencia)}</span>
          </p>
        )}
        <label className="grid gap-1 font-medium">
          Observaciones {diferencia !== null && diferencia !== 0 && <span className="text-sm font-normal text-err">(obligatoria si hay diferencia)</span>}
          <textarea value={observacion} onChange={(e) => setObservacion(e.target.value)} rows={2} maxLength={255}
            placeholder="Explica el faltante o sobrante" className={campo(fields.observacion)} />
          {fields.observacion && <span className="text-sm font-normal text-err">{fields.observacion}</span>}
        </label>
        <button type="submit" disabled={guardando} className="rounded-xl bg-acc py-3 font-sub text-white transition hover:bg-pri disabled:opacity-60">
          {guardando ? 'Cerrando…' : `Cerrar turno #${turno.id}`}
        </button>
      </div>
    </form>
  )
}

export default CashCloseView
