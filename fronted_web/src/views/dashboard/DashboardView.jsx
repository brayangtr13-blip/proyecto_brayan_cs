// src/views/dashboard/DashboardView.jsx
// VISTA: contenedor del dashboard con sus rutas hijas (/dashboard, /dashboard/usuarios/...)
import { Navigate, Route, Routes } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import useDashboard from '../../hooks/useDashboard'
import { ROUTES } from '../../config/routes'
import { USER_ROLES } from '../../config/constants'
import AlertMessage from '../common/AlertMessage'
import LoadingSpinner from '../common/LoadingSpinner'
import DashboardHeader from './DashboardHeader'
import DashboardStats from './DashboardStats'
import UsersView from './UsersView'
import UserForm from './UserForm'
import UserDetails from './UserDetails'

// Inicio: saludo + indicadores (los indicadores solo los ve el administrador)
const Inicio = () => {
  const { currentUser } = useAuth()
  const { stats, loading, error } = useDashboard()
  return (
    <div className="grid gap-6">
      <DashboardHeader user={currentUser} />
      <AlertMessage type="error" message={error} />
      {loading ? <LoadingSpinner /> : <DashboardStats stats={stats} />}
    </div>
  )
}

// Solo el administrador entra a usuarios; los demás vuelven al inicio
const SoloAdmin = ({ children }) => {
  const { currentUser } = useAuth()
  if (currentUser?.role !== USER_ROLES.ADMIN) return <Navigate to={ROUTES.DASHBOARD} replace />
  return children
}

const DashboardView = () => {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <Routes>
        <Route index element={<Inicio />} />
        <Route path="usuarios" element={<SoloAdmin><UsersView /></SoloAdmin>} />
        <Route path="usuarios/nuevo" element={<SoloAdmin><UserForm /></SoloAdmin>} />
        <Route path="usuarios/:id" element={<SoloAdmin><UserDetails /></SoloAdmin>} />
        <Route path="usuarios/:id/editar" element={<SoloAdmin><UserForm /></SoloAdmin>} />
        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </div>
  )
}

export default DashboardView
