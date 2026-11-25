// src/views/reportes/ReportsView.jsx
// VISTA: portada del módulo de reportes. Cada tarjeta solo aparece si el rol tiene el permiso en rol_permiso.
import { Link } from 'react-router-dom'
import ReportController from '../../controllers/ReportController'
import { ROUTES } from '../../config/routes'

const GRUPOS = [
  { permiso: 'ventas', titulo: 'Ventas', reportes: [
    { ruta: ROUTES.REPORT_SALES, nombre: 'Gráfico de ventas', texto: 'Total por día, semana o mes, métodos de pago y productos más vendidos (RF26).' },
    { ruta: ROUTES.REPORT_SALES_PRINT, nombre: 'Reporte impreso de ventas', texto: 'Ventas pagadas y anuladas con su motivo; imprimir o exportar a Excel (RF27).' }
  ] },
  { permiso: 'inventario', titulo: 'Inventario', reportes: [
    { ruta: ROUTES.REPORT_INVENTORY, nombre: 'Movimientos de inventario', texto: 'Existencias y kárdex con stock anterior y resultante (RF28).' },
    { ruta: ROUTES.REPORT_ROTATION, nombre: 'Rotación de inventario', texto: 'Productos de mayor y menor salida y evolución del stock (RF29).' }
  ] },
  { permiso: 'domicilios', titulo: 'Domicilios', reportes: [
    { ruta: ROUTES.REPORT_DELIVERIES, nombre: 'Reporte de domicilios', texto: 'Pedidos por estado, domiciliario y barrio; tiempo promedio de entrega (RF30).' }
  ] },
  { permiso: 'usuarios', titulo: 'Usuarios', reportes: [
    { ruta: ROUTES.REPORT_USERS, nombre: 'Gráfico de usuarios', texto: 'Ventas por vendedor, usuarios por rol y por estado.' },
    { ruta: ROUTES.REPORT_USERS_PRINT, nombre: 'Reporte impreso de usuarios', texto: 'Listado de usuarios con lo que vendió cada uno; imprimir o exportar.' }
  ] }
]

const ReportsView = () => (
  <section className="grid gap-6">
    <div>
      <h1 className="font-titulo text-2xl text-nav">Reportes</h1>
      <p className="text-t2">Elige un reporte. Todos se filtran por fechas y no modifican ningún dato.</p>
    </div>
    {GRUPOS.filter((g) => ReportController.puedeVer(g.permiso)).map((g) => (
      <div key={g.permiso} className="grid gap-3">
        <h2 className="font-sub text-lg text-nav">{g.titulo}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {g.reportes.map((r) => (
            <Link key={r.ruta} to={r.ruta} className="rounded-2xl border border-borde bg-card p-5 transition hover:border-acc">
              <p className="font-sub text-nav">{r.nombre}</p>
              <p className="text-sm text-t2">{r.texto}</p>
            </Link>
          ))}
        </div>
      </div>
    ))}
  </section>
)

export default ReportsView
