// src/views/dashboard/DashboardStats.jsx
// VISTA: tarjetas de indicadores y barras de cuentas por rol (solo dibuja lo que recibe)
const Tarjeta = ({ valor, texto, color }) => (
  <div className="rounded-2xl border border-borde bg-card p-5">
    <p className={`font-sub text-3xl ${color}`}>{valor}</p>
    <p className="mt-1 text-t2">{texto}</p>
  </div>
)

const DashboardStats = ({ stats }) => {
  if (!stats) return null
  const mayor = Math.max(...stats.porRol.map((r) => r.cantidad), 1)

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tarjeta valor={stats.total} texto="cuentas registradas" color="text-nav" />
        <Tarjeta valor={stats.activos} texto="cuentas activas" color="text-ok" />
        <Tarjeta valor={stats.inactivos} texto="cuentas inactivas" color="text-err" />
        <Tarjeta valor={stats.roles} texto="roles en uso" color="text-acc" />
      </div>

      <div className="rounded-2xl border border-borde bg-card p-5">
        <h2 className="font-sub text-lg text-nav">Cuentas por rol</h2>
        <ul className="mt-4 grid gap-3">
          {stats.porRol.map((r) => (
            <li key={r.rol} className="grid grid-cols-[110px_1fr_32px] items-center gap-3">
              <span className="capitalize">{r.rol}</span>
              {/* El ancho de la barra es proporcional al rol con más cuentas */}
              <span className="h-3 rounded-full bg-fondo">
                <span className="block h-full rounded-full bg-acc" style={{ width: `${(r.cantidad / mayor) * 100}%` }} />
              </span>
              <span className="text-right font-semibold tabular-nums">{r.cantidad}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default DashboardStats
