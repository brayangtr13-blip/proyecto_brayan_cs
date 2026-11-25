// src/hooks/useAuth.js
// HOOK: puente entre el Controlador y las Vistas. Lee la sesión que comparte AuthProvider.
import { useContext } from 'react'
import { AuthContext } from './authContext'

const useAuth = () => {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth debe usarse dentro de <AuthProvider> (ver main.jsx)')
  return contexto // { currentUser, isAuthenticated, checking, loading, login, register, logout }
}

export default useAuth
