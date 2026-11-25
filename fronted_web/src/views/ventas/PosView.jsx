// src/views/ventas/PosView.jsx
// VISTA: punto de venta (registrar_venta.html). Sin turno abierto, primero se abre la caja con su base.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { usePos } from '../../hooks/useSales'
import SaleController from '../../controllers/SaleController'
import { ROUTES } from '../../config/routes'
import { METODO_EFECTIVO } from '../../config/constants'
import { formatoFecha, formatoPesos } from '../../utils/helpers'
import AlertMessage from '../common/AlertMessage'
import LoadingSpinner from '../common/LoadingSpinner'
import Comprobante from './Comprobante'

const campo = (conError) =>
  `w-full rounded-xl border bg-card px-4 py-2.5 outline-none focus:ring-2 focus:ring-acc/30 ${conError ? 'border-err' : 'border-borde focus:border-acc'}`

const PosView = () => {
  const pos = usePos()
  if (pos.loading) return <LoadingSpinner />
  if (pos.error) return <AlertMessage type="error" message={pos.error} />
  return pos.shift ? <Caja pos={pos} /> : <AbrirCaja abrirCaja={pos.abrirCaja} />
}

// HU05: abrir turno con el dinero con el que empieza la caja
const AbrirCaja = ({ abrirCaja }) => {
  const [base, setBase] = useState('20000')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)
    const result = await abrirCaja(base)
    setGuardando(false)
    if (!result.success) setError(result.error)
  }

  return (
    <section className="mx-auto grid max-w-md gap-4">
      <h1 className="font-titulo text-2xl text-nav">Abrir caja</h1>
      <form onSubmit={handleSubmit} noValidate className="grid gap-4 rounded-2xl border border-borde bg-card p-6">
        <p className="text-t2">Cuenta el dinero con el que empiezas el turno. Al cerrar, el administrador lo compara con lo que haya en el cajón.</p>
        <AlertMessage type="error" message={error} />
        <label className="grid gap-1 font-medium">
          Base inicial (COP)
          <input type="number" min={0} inputMode="numeric" value={base} onChange={(e) => setBase(e.target.value)} className={campo(error)} />
        </label>
        <button type="submit" disabled={guardando} className="rounded-xl bg-acc py-3 font-sub text-white transition hover:bg-pri disabled:opacity-60">
          {guardando ? 'Abriendo…' : 'Abrir caja'}
        </button>
      </form>
    </section>
  )
}

const Caja = ({ pos }) => {
  const { currentUser } = useAuth()
  const [busqueda, setBusqueda] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [idMetodo, setIdMetodo] = useState(String(METODO_EFECTIVO))
  const [recibido, setRecibido] = useState('')
  const [aviso, setAviso] = useState('')
  const [fields, setFields] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [ultima, setUltima] = useState(null) // comprobante de la venta recién registrada

  const efectivo = Number(idMetodo) === METODO_EFECTIVO
  const cambio = efectivo && recibido !== '' ? SaleController.calcularCambio(pos.total, recibido) : null

  // Buscar por código (lector de barras + Enter) o por nombre, y agregar al carrito
  const agregar = (e) => {
    e.preventDefault()
    const producto = SaleController.buscarProducto(busqueda, pos.products)
    if (!producto) return setAviso('No encontramos ese producto.')
    const error = pos.agregar(producto, Math.max(1, Number(cantidad) || 1))
    setAviso(error ?? '')
    if (!error) {
      setBusqueda('')
      setCantidad('1')
    }
  }

  const cobrar = async () => {
    setGuardando(true)
    const items = pos.items
    const result = await pos.registrar(idMetodo, recibido)
    setGuardando(false)
    setFields(result.fields ?? {})
    if (!result.success) return setAviso(result.error)
    setAviso('')
    setUltima({
      venta: { ...result.data, cajero: `${currentUser.nombre} ${currentUser.apellido}`, metodo: pos.methods.find((m) => m.id === Number(idMetodo))?.nombre },
      renglones: items, cambio: result.cambio, recibido: efectivo ? Number(recibido) : null
    })
    setRecibido('')
  }

  if (ultima) {
    return (
      <section className="grid gap-4">
        <AlertMessage type="success" message={`Venta #${ultima.venta.id} registrada.`} />
        <Comprobante venta={ultima.venta} renglones={ultima.renglones} cambio={ultima.cambio} recibido={ultima.recibido} />
        <div className="flex justify-center gap-3">
          <button type="button" onClick={() => setUltima(null)} className="rounded-xl bg-acc px-5 py-2.5 font-sub text-white hover:bg-pri">Nueva venta</button>
          <Link to={ROUTES.SALE_DETAIL(ultima.venta.id)} className="rounded-xl border border-borde px-5 py-2.5 font-medium">Ver factura</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-titulo text-2xl text-nav">Registrar venta</h1>
          <p className="text-t2">Turno #{pos.shift.id} abierto {formatoFecha(pos.shift.fechaApertura)} · base {formatoPesos(pos.shift.montoInicial)}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        {/* Buscar y carrito */}
        <div className="grid content-start gap-4">
          <form onSubmit={agregar} className="grid gap-3 rounded-2xl border border-borde bg-card p-4 sm:grid-cols-[1fr_100px_auto]">
            <label className="grid gap-1 font-medium">
              Producto
              <input list="productos-pos" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} autoFocus
                placeholder="Escanea el código o busca por nombre" className={campo(false)} />
              <datalist id="productos-pos">
                {pos.products.map((p) => <option key={p.codigo} value={`${p.codigo} · ${p.nombre}`} />)}
              </datalist>
            </label>
            <label className="grid gap-1 font-medium">
              Cantidad
              <input type="number" min={1} value={cantidad} onChange={(e) => setCantidad(e.target.value)} className={campo(false)} />
            </label>
            <button type="submit" className="self-end rounded-xl bg-acc px-5 py-2.5 font-sub text-white hover:bg-pri">Agregar</button>
          </form>

          <AlertMessage type="error" message={aviso} />

          <div className="overflow-x-auto rounded-2xl border border-borde bg-card">
            <table className="w-full min-w-[560px] text-left">
              <thead className="border-b border-borde font-sub text-xs uppercase tracking-wider text-t2">
                <tr>
                  <th className="px-4 py-3">Código</th><th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3 text-right">Precio unit.</th><th className="px-4 py-3 text-center">Cantidad</th>
                  <th className="px-4 py-3 text-right">Subtotal</th><th className="px-4 py-3" aria-label="Quitar" />
                </tr>
              </thead>
              <tbody>
                {pos.items.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-t2">Agrega productos para empezar la venta.</td></tr>
                )}
                {pos.items.map((i) => (
                  <tr key={i.codigo} className="border-b border-borde last:border-0">
                    <td className="px-4 py-3 tabular-nums text-t2">{i.codigo}</td>
                    <td className="px-4 py-3 font-semibold">{i.nombre}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatoPesos(i.precio)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button type="button" aria-label={`Quitar una unidad de ${i.nombre}`} onClick={() => setAviso(pos.cambiarCantidad(i.codigo, i.cantidad - 1) ?? '')}
                          className="size-8 rounded-lg border border-borde font-bold hover:border-acc">−</button>
                        <span className="w-6 text-center tabular-nums">{i.cantidad}</span>
                        <button type="button" aria-label={`Agregar una unidad de ${i.nombre}`} onClick={() => setAviso(pos.cambiarCantidad(i.codigo, i.cantidad + 1) ?? '')}
                          className="size-8 rounded-lg border border-borde font-bold hover:border-acc">+</button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatoPesos(i.cantidad * i.precio)}</td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => pos.quitar(i.codigo)} className="text-sm text-err hover:underline">Quitar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resumen de cobro */}
        <div className="grid content-start gap-4 rounded-2xl border border-borde bg-card p-5">
          <h2 className="font-sub text-lg text-nav">Resumen de cobro</h2>
          <p className="flex items-baseline justify-between">
            <span className="text-t2">{pos.items.reduce((s, i) => s + i.cantidad, 0)} unidades</span>
            <span className="font-sub text-3xl text-nav tabular-nums">{formatoPesos(pos.total)}</span>
          </p>
          <label className="grid gap-1 font-medium">
            Método de pago
            <select value={idMetodo} onChange={(e) => setIdMetodo(e.target.value)} className={campo(false)}>
              {pos.methods.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </label>
          {efectivo && (
            <label className="grid gap-1 font-medium">
              Valor recibido
              <input type="number" min={0} inputMode="numeric" value={recibido} onChange={(e) => setRecibido(e.target.value)} className={campo(fields.recibido)} />
              {cambio !== null && <span className="font-semibold text-ok">Cambio: {formatoPesos(cambio)}</span>}
              {recibido !== '' && cambio === null && <span className="text-sm font-normal text-err">No alcanza para el total.</span>}
            </label>
          )}
          <button type="button" onClick={cobrar} disabled={guardando || pos.items.length === 0}
            className="rounded-xl bg-acc py-3 font-sub text-white transition hover:bg-pri disabled:opacity-60">
            {guardando ? 'Registrando…' : 'Registrar venta'}
          </button>
          <button type="button" onClick={pos.limpiar} disabled={pos.items.length === 0} className="rounded-xl border border-borde py-2.5 font-medium disabled:opacity-50">
            Limpiar orden
          </button>
        </div>
      </div>
    </section>
  )
}

export default PosView
