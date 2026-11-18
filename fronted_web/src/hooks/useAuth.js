// src/hooks/useAuth.js
import { useState } from 'react'
import AuthController from '../controllers/AuthController'

const useAuth = () => {
  // El estado inicial se pide al Controller una sola vez (sin setState dentro de un useEffect)
  const [authState] = useState(() => AuthController.getAuthState())
  const [loading] = useState(false)

  return {
    isAuthenticated: authState.isAuthenticated,
    currentUser: authState.currentUser,
    loading
  }
}

export default useAuth
