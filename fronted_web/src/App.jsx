// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from './config/routes'
import LoginView from './views/auth/LoginView'
import RegisterView from './views/auth/RegisterView'
import DashboardView from './views/dashboard/DashboardView'

function App() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.LOGIN} replace />} />
      <Route path={ROUTES.LOGIN} element={<LoginView />} />
      <Route path={ROUTES.REGISTER} element={<RegisterView />} />
      <Route path={`${ROUTES.DASHBOARD}/*`} element={<DashboardView />} />
    </Routes>
  )
}

export default App
