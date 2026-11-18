// src/views/common/Navbar.jsx
import { useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { ROUTES } from '../../config/routes'

const Navbar = () => {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  return (
    <nav className="bg-nav text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <h2 className="font-titulo text-lg">Control Store</h2>
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
