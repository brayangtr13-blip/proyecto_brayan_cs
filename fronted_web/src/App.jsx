// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from './config/routes'
import useAuth from './hooks/useAuth'
import LoginView from './views/auth/LoginView'
import RegisterView from './views/auth/RegisterView'
import RecoverPasswordView from './views/auth/RecoverPasswordView'
import DashboardView from './views/dashboard/DashboardView'
import MainLayout from './views/layouts/MainLayout'

// Ruta protegida: sin sesión válida manda al login (patrón Guard)
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />
  return children
}

// Ruta pública: si ya hay sesión, no tiene sentido ver el login otra vez
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to={ROUTES.DASHBOARD} replace />
  return children
}

function App() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.LOGIN} replace />} />
      <Route path={ROUTES.LOGIN} element={<PublicRoute><LoginView /></PublicRoute>} />
      <Route path={ROUTES.REGISTER} element={<PublicRoute><RegisterView /></PublicRoute>} />
      <Route path={ROUTES.RECOVER_PASSWORD} element={<PublicRoute><RecoverPasswordView /></PublicRoute>} />
      <Route
        path={`${ROUTES.DASHBOARD}/*`}
        element={
          <ProtectedRoute>
            <MainLayout>
              <DashboardView />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
    </Routes>
  )
}

export default App
