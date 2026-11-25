// src/hooks/useAuth.js
// HOOK: puente entre el Controlador y las Vistas. Guarda la sesión en estado de React.
import { useState } from 'react'
import AuthController from '../controllers/AuthController'

const useAuth = () => {
  // Estado inicial leído una vez del Controller (token guardado en localStorage)
  const [authState, setAuthState] = useState(() => AuthController.getAuthState())
  const [loading, setLoading] = useState(false)

  // Cada acción marca "cargando" mientras espera la respuesta (para deshabilitar el botón)
  const login = async (credentials) => {
    setLoading(true)
    const result = await AuthController.handleLogin(credentials)
    if (result.success) setAuthState(AuthController.getAuthState())
    setLoading(false)
    return result
  }

  const register = async (userData) => {
    setLoading(true)
    const result = await AuthController.handleRegister(userData)
    setLoading(false)
    return result
  }

  const logout = async () => {
    await AuthController.handleLogout()
    setAuthState(AuthController.getAuthState())
  }

  return {
    isAuthenticated: authState.isAuthenticated,
    currentUser: authState.currentUser,
    loading,
    login,
    register,
    logout
  }
}

export default useAuth
