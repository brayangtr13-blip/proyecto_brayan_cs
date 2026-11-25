// src/views/inventario/ProductsView.jsx
// VISTA: lista de productos (listar_productos.html del prototipo) con búsqueda y filtros
import { useState } from 'react'
import { Link } from 'react-router-dom'
import useProducts from '../../hooks/useProducts'
import ProductController from '../../controllers/ProductController'
import { ROUTES } from '../../config/routes'
import { formatoPesos } from '../../utils/helpers'
import AlertMessage from '../common/AlertMessage'
import LoadingSpinner from '../common/LoadingSpinner'
import StockBadge from './StockBadge'

const boton = 'rounded-lg border border-borde px-3 py-1.5 text-sm font-medium transition hover:border-acc hover:text-acc'
const campo = 'rounded-xl border border-borde bg-card px-4 py-2.5 outline-none focus:border-acc focus:ring-2 focus:ring-acc/30'

const ProductsView = () => {
  const esAdmin = ProductController.puedeAdministrar()
  const [filtros, setFiltros] = useState({ q: '', categoria: '', estado: 'activos' })
  const { products, categories, loading, error, toggleActive } = useProducts(filtros)
  const [mensaje, setMensaje] = useState(null)

  const cambiarFiltro = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value })
  const bajos = products.filter((p) => p.activo && ProductController.nivelStock(p) !== 'normal').length

  const cambiarEstado = async (p) => {
    const result = await toggleActive(p)
    setMensaje(result.success ? { type: 'success', message: `${p.nombre}: ${result.message}` } : { type: 'error', message: result.error })
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-titulo text-2xl text-nav">Inventario</h1>
          <p className="text-t2">{products.length} productos · {bajos} con stock bajo o agotado</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={ROUTES.PRODUCT_ALERTS} className="rounded-xl border border-warn/40 bg-warn/10 px-4 py-2.5 font-medium text-warn transition hover:bg-warn/20">
            Alertas de stock
          </Link>
          <Link to={ROUTES.PRODUCT_NEW} className="rounded-xl bg-acc px-4 py-2.5 font-sub text-white transition hover:bg-pri">
            Registrar producto
          </Link>
        </div>
      </div>

      {/* Filtros: cada cambio vuelve a pedir la lista al servidor */}
      <div className="grid gap-3 rounded-2xl border border-borde bg-card p-4 sm:grid-cols-[2fr_1fr_1fr]">
        <label className="grid gap-1 font-medium">
          Buscar
          <input type="search" name="q" value={filtros.q} onChange={cambiarFiltro} placeholder="Nombre, código o categoría" className={campo} />
        </label>
        <label className="grid gap-1 font-medium">
          Categoría
          <select name="categoria" value={filtros.categoria} onChange={cambiarFiltro} className={campo}>
            <option value="">Todas</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </label>
        <label className="grid gap-1 font-medium">
          Estado
          <select name="estado" value={filtros.estado} onChange={cambiarFiltro} className={campo}>
            <option value="activos">Activos</option>
            <option value="inactivos">Dados de baja</option>
            <option value="todos">Todos</option>
          </select>
        </label>
      </div>

      <AlertMessage type="error" message={error} />
      {mensaje && <AlertMessage type={mensaje.type} message={mensaje.message} />}

      {loading ? (
        <LoadingSpinner />
      ) : products.length === 0 ? (
        <p className="rounded-2xl border border-borde bg-card p-6 text-center text-t2">No hay productos con esos filtros.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-borde bg-card">
          <table className="w-full min-w-[820px] text-left">
            <thead className="border-b border-borde font-sub text-xs uppercase tracking-wider text-t2">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3 text-right">Precio</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.codigo} className={`border-b border-borde last:border-0 ${p.activo ? '' : 'opacity-60'}`}>
                  <td className="px-4 py-3 tabular-nums text-t2">{p.codigo}</td>
                  <td className="px-4 py-3 font-semibold">{p.nombre}</td>
                  <td className="px-4 py-3">{p.categoria}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatoPesos(p.precioUnitario)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <strong>{p.stockActual}</strong> <span className="text-sm text-t2">/ mín. {p.stockMinimo}</span>
                  </td>
                  <td className="px-4 py-3">{p.activo ? <StockBadge producto={p} /> : <span className="text-sm text-t2">Dado de baja</span>}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link to={ROUTES.PRODUCT_DETAIL(p.codigo)} className={boton}>Ver</Link>
                      {esAdmin && <Link to={ROUTES.PRODUCT_EDIT(p.codigo)} className={boton}>Editar</Link>}
                      {esAdmin && (
                        <button type="button" className={boton} onClick={() => cambiarEstado(p)}>
                          {p.activo ? 'Dar de baja' : 'Reactivar'}
                        </button>
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

export default ProductsView
