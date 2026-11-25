// src/views/ventas/SaleDetails.jsx
// VISTA: una factura (consultar_venta.html) con su detalle, el comprobante y, si fue anulada, quién y por qué.
import { Link, useParams } from 'react-router-dom'
import { useSale } from '../../hooks/useSales'
import { ROUTES } from '../../config/routes'
import { formatoFecha, formatoPesos } from '../../utils/helpers'
import AlertMessage from '../common/AlertMessage'
import LoadingSpinner from '../common/LoadingSpinner'
import Comprobante from './Comprobante'

const ESTADO = { pagada: 'bg-ok/10 text-ok', pendiente: 'bg-warn/10 text-warn', anulada: 'bg-err/10 text-err' }

const SaleDetails = () => {
  const { id } = useParams()
  const { sale, loading, error } = useSale(id)

  if (loading) return <LoadingSpinner />
  if (!sale) return <AlertMessage type="error" message={error || 'Venta no encontrada.'} />

  const datos = [
    ['Fecha', formatoFecha(sale.fecha)],
    ['Cajero', sale.cajero],
    ['Método de pago', sale.metodo],
    ['Turno de caja', sale.idArqueo ? `#${sale.idArqueo}` : '—'],
    ['Cliente', sale.cliente ?? 'Consumidor final'],
    ['Canal', sale.esDomicilio ? 'Domicilio' : 'Mostrador']
  ]

  return (
    <section className="grid gap-4">
      <Link to={ROUTES.SALES} className="text-sm text-t2 hover:text-acc">← Volver a ventas</Link>
      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="grid content-start gap-4">
          <div className="rounded-2xl border border-borde bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="font-titulo text-2xl text-nav">Factura #{sale.id}</h1>
              <span className={`rounded-lg px-3 py-1 font-medium capitalize ${ESTADO[sale.estado]}`}>{sale.estado}</span>
            </div>
            <dl className="mt-5 grid gap-3 sm:grid-cols-3">
              {datos.map(([etiqueta, valor]) => (
                <div key={etiqueta} className="rounded-xl bg-fondo px-4 py-3">
                  <dt className="font-sub text-xs uppercase tracking-wider text-t2">{etiqueta}</dt>
                  <dd className="mt-1 font-semibold">{valor}</dd>
                </div>
              ))}
            </dl>
          </div>

          {sale.anulacion && (
            <div className="rounded-2xl border border-err/30 bg-err/5 p-5">
              <h2 className="font-sub text-err">Venta anulada</h2>
              <p className="mt-1 text-t2">{formatoFecha(sale.anulacion.fecha)} · {sale.anulacion.usuario}</p>
              <p className="mt-1">{sale.anulacion.detalle}</p>
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl border border-borde bg-card">
            <table className="w-full min-w-[520px] text-left">
              <thead className="border-b border-borde font-sub text-xs uppercase tracking-wider text-t2">
                <tr><th className="px-4 py-3">Código</th><th className="px-4 py-3">Nombre</th><th className="px-4 py-3 text-right">Cantidad</th><th className="px-4 py-3 text-right">Precio unit.</th><th className="px-4 py-3 text-right">Subtotal</th></tr>
              </thead>
              <tbody>
                {sale.detalle.map((d) => (
                  <tr key={d.codigo} className="border-b border-borde last:border-0">
                    <td className="px-4 py-3 tabular-nums text-t2">{d.codigo}</td>
                    <td className="px-4 py-3 font-semibold">{d.producto}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{d.cantidad}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatoPesos(d.precio)}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatoPesos(d.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-borde"><td colSpan={4} className="px-4 py-3 text-right font-sub">Total</td><td className="px-4 py-3 text-right font-sub text-lg tabular-nums">{formatoPesos(sale.total)}</td></tr>
              </tfoot>
            </table>
          </div>
        </div>
        <Comprobante venta={sale} renglones={sale.detalle} />
      </div>
    </section>
  )
}

export default SaleDetails
