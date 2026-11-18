// src/views/dashboard/DashboardView.jsx
import useAuth from '../../hooks/useAuth'

const DashboardView = () => {
  const { currentUser } = useAuth()

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="rounded-2xl bg-gradient-to-br from-nav to-pri p-8 text-white">
        <h1 className="font-titulo text-3xl">Hola, {currentUser?.nombre}</h1>
        <p className="mt-2 text-white/75">
          Entraste como <span className="font-semibold capitalize">{currentUser?.role}</span> · {currentUser?.email}
        </p>
      </div>
      <p className="mt-6 text-t2">Los indicadores y el CRUD de usuarios llegan en el paso III.9.</p>
    </div>
  )
}

export default DashboardView
