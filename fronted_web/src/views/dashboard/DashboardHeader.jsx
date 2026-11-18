// src/views/dashboard/DashboardHeader.jsx
// Saludo según la hora y fecha de hoy
const saludo = () => {
  const hora = new Date().getHours()
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

const DashboardHeader = ({ user }) => {
  const hoy = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

  return (
    <header className="rounded-2xl bg-gradient-to-br from-nav to-pri p-8 text-white">
      <h1 className="font-titulo text-3xl">{saludo()}, {user?.nombre}</h1>
      <p className="mt-2 text-white/75 first-letter:uppercase">{hoy}</p>
      <p className="mt-1 text-white/75">
        Entraste como <span className="font-semibold capitalize">{user?.role}</span> · {user?.email}
      </p>
    </header>
  )
}

export default DashboardHeader
