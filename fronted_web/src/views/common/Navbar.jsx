// src/views/common/Navbar.jsx
import { NavLink, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { ROUTES } from '../../config/routes'
import { USER_ROLES } from '../../config/constants'

// Enlace del menú: NavLink marca el activo (la ruta "end" evita que Inicio quede activo en /usuarios)
const enlace = ({ isActive }) =>
  `rounded-lg px-3 py-2 font-medium transition ${isActive ? 'bg-acc text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'}`

const Navbar = () => {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const esAdmin = currentUser?.role === USER_ROLES.ADMIN
  const vende = [USER_ROLES.ADMIN, USER_ROLES.CAJERO].includes(currentUser?.role) // ventas e inventario
  const reparte = currentUser?.role === USER_ROLES.DOMICILIARIO

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  return (
    <nav className="bg-nav text-white print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-6">
          <h2 className="font-titulo text-lg">Control Store</h2>
          <div className="flex flex-wrap gap-1">
            <NavLink to={ROUTES.DASHBOARD} end className={enlace}>Inicio</NavLink>
            {/* Cada enlace solo aparece para los roles que tienen el permiso en rol_permiso */}
            {vende && <NavLink to={ROUTES.POS} className={enlace}>Vender</NavLink>}
            {vende && <NavLink to={ROUTES.SALES} className={enlace}>Ventas</NavLink>}
            {esAdmin && <NavLink to={ROUTES.CASH_CLOSE} className={enlace}>Caja</NavLink>}
            {vende && <NavLink to={ROUTES.PRODUCTS} className={enlace}>Inventario</NavLink>}
            {esAdmin && <NavLink to={ROUTES.DELIVERIES} className={enlace}>Domicilios</NavLink>}
            {reparte && <NavLink to={ROUTES.MY_DELIVERIES} className={enlace}>Mis pedidos</NavLink>}
            {vende && <NavLink to={ROUTES.REPORTS} className={enlace}>Reportes</NavLink>}
            {esAdmin && <NavLink to={ROUTES.USERS} className={enlace}>Usuarios</NavLink>}
          </div>
        </div>
        {currentUser && (
          <div className="flex items-center gap-4">
            <span className="hidden text-right leading-tight sm:block">
              <span className="block font-semibold">{currentUser.nombre} {currentUser.apellido}</span>
              <span className="text-sm capitalize text-white/70">{currentUser.role}</span>
            </span>
            <button
              type="button" onClick={handleLogout}
              className="rounded-xl border border-white/30 px-4 py-2 font-medium transition hover:bg-white/10"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
