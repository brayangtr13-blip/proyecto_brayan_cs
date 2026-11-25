// src/hooks/AuthProvider.jsx
// Patrón Provider: pregunta UNA vez al servidor quién está conectado y comparte la sesión con toda la app
// (sin Context, cada componente que usa useAuth repetiría la petición a /auth/me)
import { useCallback, useEffect, useMemo, useState } from 'react'
import AuthController from '../controllers/AuthController'
import httpService from '../services/httpService'
import { AuthContext } from './authContext'

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [checking, setChecking] = useState(true) // true mientras /auth/me responde
  const [loading, setLoading] = useState(false) // true mientras se envía un formulario

  // Al abrir la app: si la cookie sigue válida, el servidor responde quién es
  useEffect(() => {
    let activo = true
    AuthController.checkSession().then((result) => {
      if (!activo) return
      setCurrentUser(result.success ? result.user : null)
      setChecking(false)
    })
    return () => {
      activo = false
    }
  }, [])

  // Si cualquier petición recibe 401 (sesión vencida), se cierra la sesión en pantalla
  useEffect(() => {
    httpService.onUnauthorized = () => setCurrentUser(null)
    return () => {
      httpService.onUnauthorized = null
    }
  }, [])

  const login = useCallback(async (credentials) => {
    setLoading(true)
    const result = await AuthController.handleLogin(credentials)
    if (result.success) setCurrentUser(result.user)
    setLoading(false)
    return result
  }, [])

  const register = useCallback(async (userData) => {
    setLoading(true)
    const result = await AuthController.handleRegister(userData)
    setLoading(false)
    return result
  }, [])

  const logout = useCallback(async () => {
    await AuthController.handleLogout()
    setCurrentUser(null)
  }, [])

  // useMemo: el valor solo cambia cuando cambia la sesión (evita renders de más en toda la app)
  const value = useMemo(
    () => ({ currentUser, isAuthenticated: Boolean(currentUser), checking, loading, login, register, logout }),
    [currentUser, checking, loading, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
