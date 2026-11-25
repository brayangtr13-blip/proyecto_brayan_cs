// src/views/reportes/PartesReporte.jsx
// VISTA: piezas comunes de los reportes (reportes_graficos.js del prototipo). Los gráficos son barras
// hechas con CSS: no hace falta una librería y funcionan sin internet. Cada barra lleva su valor exacto.
import { Link } from 'react-router-dom'
import useReports from '../../hooks/useReports'
import { ROUTES } from '../../config/routes'
import AlertMessage from '../common/AlertMessage'
import LoadingSpinner from '../common/LoadingSpinner'

// 10 colores distintos (hay 10 métodos de pago): los 7 de la marca y 3 versiones claras
const COLORES = ['bg-acc', 'bg-ok', 'bg-warn', 'bg-pri', 'bg-err', 'bg-nav', 'bg-t2', 'bg-acc/40', 'bg-ok/40', 'bg-warn/40']

// Carga los datos una vez y entrega el contenido del reporte cuando ya están
export const CargarReporte = ({ children }) => {
  const { data, error, loading } = useReports()
  if (loading) return <LoadingSpinner />
  if (error) return <AlertMessage type="error" message={error} />
  return children(data)
}

// Título, botón para volver y acciones (imprimir / Excel); las acciones no salen al imprimir
export const Encabezado = ({ titulo, descripcion, children }) => (
  <div className="flex flex-wrap items-end justify-between gap-3">
    <div>
      <Link to={ROUTES.REPORTS} className="text-sm text-t2 hover:text-acc print:hidden">← Volver a reportes</Link>
      <h1 className="mt-1 font-titulo text-2xl text-nav">{titulo}</h1>
      {descripcion && <p className="text-t2">{descripcion}</p>}
    </div>
    {children && <div className="flex flex-wrap gap-2 print:hidden">{children}</div>}
  </div>
)

export const Boton = ({ onClick, disabled, children }) => (
  <button type="button" onClick={onClick} disabled={disabled}
    className="rounded-xl border border-borde bg-card px-4 py-2.5 font-medium hover:border-acc hover:text-acc disabled:opacity-50">
    {children}
  </button>
)

// Filtros: una fila de campos que se adapta al ancho; no sale al imprimir
export const Filtros = ({ children }) => (
  <form onSubmit={(e) => e.preventDefault()} className="grid gap-3 rounded-2xl border border-borde bg-card p-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
    {children}
  </form>
)

const claseCampo = 'w-full rounded-xl border border-borde bg-card px-3 py-2 text-base font-normal outline-none focus:border-acc'

// Fecha del filtro (formato AAAA-MM-DD del <input type="date">)
export const Fecha = ({ etiqueta, value, onChange }) => (
  <label className="grid gap-1 text-sm font-medium">{etiqueta}
    <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className={claseCampo} />
  </label>
)

// Lista desplegable con la opción "Todos" (valor vacío = sin filtrar)
export const Selector = ({ etiqueta, value, onChange, opciones, todos = 'Todos' }) => (
  <label className="grid gap-1 text-sm font-medium">{etiqueta}
    <select value={value} onChange={(e) => onChange(e.target.value)} className={claseCampo}>
      <option value="">{todos}</option>
      {opciones.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </label>
)

// Rango de fechas de la hoja impresa
export const RangoImpreso = ({ desde, hasta }) => (
  <p className="hidden text-sm text-t2 print:block">Periodo: {desde || 'inicio'} a {hasta || 'hoy'} · generado el {new Date().toLocaleString('es-CO')}</p>
)

// Indicador grande (total vendido, número de pedidos...)
export const Indicador = ({ titulo, valor, detalle }) => (
  <div className="rounded-2xl border border-borde bg-card p-4">
    <p className="text-sm text-t2">{titulo}</p>
    <p className="font-sub text-2xl text-nav tabular-nums">{valor}</p>
    {detalle && <p className="text-sm text-t2">{detalle}</p>}
  </div>
)

export const Tarjeta = ({ titulo, children, className = '' }) => (
  <section className={`grid content-start gap-3 rounded-2xl border border-borde bg-card p-5 break-inside-avoid ${className}`}>
    <h2 className="font-sub text-lg text-nav">{titulo}</h2>
    {children}
  </section>
)

export const SinDatos = ({ texto = 'No hay datos en el periodo elegido. Cambia las fechas o los filtros.' }) => (
  <p className="rounded-2xl border border-borde bg-card p-6 text-center text-t2">{texto}</p>
)

// Barras horizontales: una por item { etiqueta, valor }. formato(valor, item) da el texto de la derecha.
export const Barras = ({ items, formato = String, color = 'bg-acc', maximo, destacarPrimero = false }) => {
  if (!items.length) return <p className="text-sm text-t2">Sin datos en el periodo.</p>
  const tope = maximo || Math.max(...items.map((i) => i.valor)) || 1
  return (
    <ul className="grid gap-2">
      {items.map((item, n) => (
        <li key={item.etiqueta + n} className="grid gap-1">
          <div className="flex justify-between gap-2 text-sm">
            <span className="truncate">{destacarPrimero && n === 0 && item.valor > 0 && <span aria-label="Primero">🏆 </span>}{item.etiqueta}</span>
            <span className="whitespace-nowrap font-medium tabular-nums">{formato(item.valor, item)}</span>
          </div>
          <div className="h-2.5 rounded-full bg-fondo" role="img" aria-label={`${item.etiqueta}: ${formato(item.valor, item)}`}>
            <div className={`h-full rounded-full ${item.color ?? color}`} style={{ width: `${(item.valor / tope) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

// Barra apilada (partes de un todo) con su leyenda: métodos de pago, estados, roles...
export const Apilada = ({ items, formato = String, detalle }) => {
  const total = items.reduce((s, i) => s + i.valor, 0)
  if (!total) return <p className="text-sm text-t2">Sin datos en el periodo.</p>
  return (
    <div className="grid gap-3">
      <div className="flex h-5 overflow-hidden rounded-full bg-fondo">
        {items.filter((i) => i.valor > 0).map((i) => (
          <div key={i.etiqueta} className={i.color ?? COLORES[items.indexOf(i) % COLORES.length]} style={{ width: `${(i.valor / total) * 100}%` }}
            title={`${i.etiqueta}: ${formato(i.valor)}`} />
        ))}
      </div>
      <ul className="grid gap-1.5 text-sm">
        {items.map((i, n) => (
          <li key={i.etiqueta} className="flex items-start justify-between gap-2">
            <span className="flex items-center gap-2">
              <span className={`size-3 shrink-0 rounded-sm ${i.color ?? COLORES[n % COLORES.length]}`} />
              <span>{i.etiqueta}{detalle && <span className="block text-t2">{detalle(i)}</span>}</span>
            </span>
            <span className="whitespace-nowrap font-medium tabular-nums">{formato(i.valor)} · {Math.round((i.valor / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Tabla simple con encabezados; "derecha" = índices de columnas numéricas
export const Tabla = ({ encabezados, filas, derecha = [], claseFila }) => (
  <div className="overflow-x-auto rounded-2xl border border-borde bg-card print:overflow-visible">
    <table className="w-full text-sm">
      <thead className="bg-fondo text-left text-t2">
        <tr>{encabezados.map((e, i) => <th key={e} className={`px-3 py-2 font-medium ${derecha.includes(i) ? 'text-right' : ''}`}>{e}</th>)}</tr>
      </thead>
      <tbody>
        {filas.map((fila, n) => (
          <tr key={n} className={`border-t border-borde ${claseFila?.(n) ?? ''}`}>
            {fila.map((celda, i) => <td key={i} className={`px-3 py-2 ${derecha.includes(i) ? 'text-right tabular-nums' : ''}`}>{celda}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)
