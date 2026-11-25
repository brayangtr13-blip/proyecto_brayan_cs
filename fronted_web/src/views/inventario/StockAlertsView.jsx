// src/views/inventario/StockAlertsView.jsx
// VISTA: alertas de stock (alertas_stock.html). Los datos salen de la vista SQL vw_inventario_stock_bajo.
import { Link } from 'react-router-dom'
import { useStockAlerts } from '../../hooks/useProducts'
import { ROUTES } from '../../config/routes'
import AlertMessage from '../common/AlertMessage'
import LoadingSpinner from '../common/LoadingSpinner'
import StockBadge from './StockBadge'

const StockAlertsView = () => {
  const { alerts, loading, error } = useStockAlerts()
  const agotados = alerts.filter((p) => p.stockActual === 0).length

  return (
    <section className="grid gap-4">
      <div>
        <Link to={ROUTES.PRODUCTS} className="text-sm text-t2 hover:text-acc">← Volver al inventario</Link>
        <h1 className="mt-1 font-titulo text-2xl text-nav">Alertas de stock</h1>
        <p className="text-t2">Productos en o por debajo de su stock mínimo. Primero los agotados y los que más unidades necesitan.</p>
      </div>

      <AlertMessage type="error" message={error} />

      {loading ? (
        <LoadingSpinner />
      ) : alerts.length === 0 ? (
        <p className="rounded-2xl border border-ok/30 bg-ok/10 p-6 text-center font-medium text-ok">Todo en orden: ningún producto está bajo su mínimo.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-borde bg-card p-5">
              <p className="font-sub text-3xl text-warn">{alerts.length}</p>
              <p className="text-t2">productos para pedir</p>
            </div>
            <div className="rounded-2xl border border-borde bg-card p-5">
              <p className="font-sub text-3xl text-err">{agotados}</p>
              <p className="text-t2">agotados</p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-borde bg-card">
            <table className="w-full min-w-[680px] text-left">
              <thead className="border-b border-borde font-sub text-xs uppercase tracking-wider text-t2">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3 text-right">Stock actual</th>
                  <th className="px-4 py-3 text-right">Stock mínimo</th>
                  <th className="px-4 py-3 text-right">Faltan</th>
                  <th className="px-4 py-3">Alerta</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((p) => (
                  <tr key={p.codigo} className="border-b border-borde last:border-0">
                    <td className="px-4 py-3 tabular-nums text-t2">{p.codigo}</td>
                    <td className="px-4 py-3 font-semibold">
                      <Link to={ROUTES.PRODUCT_DETAIL(p.codigo)} className="hover:text-acc hover:underline">{p.nombre}</Link>
                    </td>
                    <td className="px-4 py-3">{p.categoria}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{p.stockActual}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-t2">{p.stockMinimo}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{p.faltan}</td>
                    <td className="px-4 py-3"><StockBadge producto={p} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

export default StockAlertsView
