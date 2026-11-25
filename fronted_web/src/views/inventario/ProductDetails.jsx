// src/views/inventario/ProductDetails.jsx
// VISTA: ficha del producto (consultar_producto.html) con su kárdex.
// El administrador registra aquí las entradas y ajustes de stock.
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useProduct } from '../../hooks/useProducts'
import ProductController from '../../controllers/ProductController'
import { ROUTES } from '../../config/routes'
import { formatoFecha, formatoPesos } from '../../utils/helpers'
import AlertMessage from '../common/AlertMessage'
import LoadingSpinner from '../common/LoadingSpinner'
import StockBadge from './StockBadge'

const TIPO = { entrada: 'bg-ok/10 text-ok', salida: 'bg-acc/10 text-acc', ajuste: 'bg-warn/10 text-warn' }

const ProductDetails = () => {
  const { codigo } = useParams()
  const { product, loading, error, addMovement } = useProduct(codigo)

  if (loading) return <LoadingSpinner />
  if (!product) return <AlertMessage type="error" message={error || 'El producto no existe.'} />

  const esAdmin = ProductController.puedeAdministrar()
  const { valor, margen } = ProductController.ganancia(product)
  const kardex = ProductController.kardexConSaldos(product)
  const datos = [
    ['Categoría', product.categoria],
    ['Unidad', product.unidadMedida || '—'],
    ['Precio de compra', formatoPesos(product.precioCompra)],
    ['Precio de venta', formatoPesos(product.precioUnitario)],
    ['Ganancia por unidad', `${formatoPesos(valor)} (${margen} %)`],
    ['Stock mínimo', product.stockMinimo]
  ]

  return (
    <section className="grid gap-4">
      <Link to={ROUTES.PRODUCTS} className="text-sm text-t2 hover:text-acc">← Volver al inventario</Link>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        {/* Ficha */}
        <div className="rounded-2xl border border-borde bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-sm text-t2">{product.codigo}</p>
              <h1 className="font-titulo text-2xl text-nav">{product.nombre}</h1>
              {product.descripcion && <p className="mt-1 text-t2">{product.descripcion}</p>}
            </div>
            <div className="text-right">
              <p className="font-sub text-4xl text-nav tabular-nums">{product.stockActual}</p>
              <p className="text-sm text-t2">unidades en stock</p>
              <div className="mt-2">{product.activo ? <StockBadge producto={product} /> : <span className="text-sm text-err">Dado de baja</span>}</div>
            </div>
          </div>
          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            {datos.map(([etiqueta, valorDato]) => (
              <div key={etiqueta} className="rounded-xl bg-fondo px-4 py-3">
                <dt className="font-sub text-xs uppercase tracking-wider text-t2">{etiqueta}</dt>
                <dd className="mt-1 font-semibold tabular-nums">{valorDato}</dd>
              </div>
            ))}
          </dl>
          {esAdmin && (
            <Link to={ROUTES.PRODUCT_EDIT(product.codigo)} className="mt-6 inline-block rounded-xl bg-acc px-5 py-2.5 font-sub text-white hover:bg-pri">
              Editar producto
            </Link>
          )}
        </div>

        {/* Movimiento de stock: solo administrador y producto activo */}
        {esAdmin && product.activo && <FormularioMovimiento addMovement={addMovement} stock={product.stockActual} />}
      </div>

      {/* Kárdex */}
      <div className="rounded-2xl border border-borde bg-card">
        <h2 className="border-b border-borde px-5 py-4 font-sub text-lg text-nav">Kárdex · {kardex.length} movimientos</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-b border-borde font-sub text-xs uppercase tracking-wider text-t2">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 text-right">Cantidad</th>
                <th className="px-4 py-3 text-right">Stock anterior</th>
                <th className="px-4 py-3 text-right">Stock resultante</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Observación</th>
              </tr>
            </thead>
            <tbody>
              {kardex.map((m) => (
                <tr key={m.id} className="border-b border-borde last:border-0">
                  <td className="px-4 py-3 text-sm text-t2">{formatoFecha(m.fecha)}</td>
                  <td className="px-4 py-3"><span className={`rounded-lg px-2 py-1 text-sm font-medium capitalize ${TIPO[m.tipo]}`}>{m.tipo}</span></td>
                  <td className={`px-4 py-3 text-right font-semibold tabular-nums ${m.conSigno > 0 ? 'text-ok' : 'text-err'}`}>
                    {m.conSigno > 0 ? `+${m.conSigno}` : m.conSigno}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-t2">{m.stockAnterior}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{m.stockResultante}</td>
                  <td className="px-4 py-3">{m.usuario}</td>
                  <td className="px-4 py-3 text-t2">{m.observacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

// Entrada (suma) o ajuste (resta) con cantidad y motivo
const FormularioMovimiento = ({ addMovement, stock }) => {
  const VACIO = { tipo: 'entrada', cantidad: '', observacion: '' }
  const [mov, setMov] = useState(VACIO)
  const [fields, setFields] = useState({})
  const [mensaje, setMensaje] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const handleChange = (e) => setMov({ ...mov, [e.target.name]: e.target.value })
  const resta = mov.tipo === 'ajuste'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)
    const result = await addMovement(mov)
    setGuardando(false)
    setFields(result.fields ?? {})
    if (result.success) {
      setMov(VACIO)
      setMensaje({ type: 'success', message: result.message })
    } else {
      setMensaje({ type: 'error', message: result.error })
    }
  }

  const clase = (campo) => `rounded-xl border bg-card px-4 py-2.5 outline-none focus:ring-2 focus:ring-acc/30 ${fields[campo] ? 'border-err' : 'border-borde focus:border-acc'}`

  return (
    <form onSubmit={handleSubmit} noValidate className="grid content-start gap-3 rounded-2xl border border-borde bg-card p-5">
      <h2 className="font-sub text-lg text-nav">Movimiento de stock</h2>
      {mensaje && <AlertMessage type={mensaje.type} message={mensaje.message} />}

      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de movimiento">
        {[['entrada', 'Entrada (+)'], ['ajuste', 'Ajuste (−)']].map(([valor, texto]) => (
          <label key={valor} className={`cursor-pointer rounded-xl border px-3 py-2 text-center font-medium ${mov.tipo === valor ? 'border-acc bg-acc/10 text-acc' : 'border-borde text-t2'}`}>
            <input type="radio" name="tipo" value={valor} checked={mov.tipo === valor} onChange={handleChange} className="sr-only" />
            {texto}
          </label>
        ))}
      </div>

      <label className="grid gap-1 font-medium">
        Cantidad
        <input type="number" name="cantidad" min={1} inputMode="numeric" value={mov.cantidad} onChange={handleChange} className={clase('cantidad')} />
        {fields.cantidad && <span className="text-sm font-normal text-err">{fields.cantidad}</span>}
      </label>

      <label className="grid gap-1 font-medium">
        Motivo
        <input name="observacion" value={mov.observacion} onChange={handleChange} maxLength={255}
          placeholder={resta ? 'Ej. producto vencido, dañado' : 'Ej. compra al proveedor'} className={clase('observacion')} />
        {fields.observacion && <span className="text-sm font-normal text-err">{fields.observacion}</span>}
      </label>

      <p className="text-sm text-t2">
        Stock actual: <strong>{stock}</strong>
        {Number(mov.cantidad) > 0 && <> → quedará en <strong>{resta ? stock - Number(mov.cantidad) : stock + Number(mov.cantidad)}</strong></>}
      </p>

      <button type="submit" disabled={guardando} className="rounded-xl bg-acc py-2.5 font-sub text-white transition hover:bg-pri disabled:opacity-60">
        {guardando ? 'Guardando…' : resta ? 'Registrar ajuste' : 'Registrar entrada'}
      </button>
    </form>
  )
}

export default ProductDetails
