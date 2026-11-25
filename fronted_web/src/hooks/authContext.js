// src/hooks/authContext.js
// Contexto de la sesión: AuthProvider lo llena y useAuth lo lee (va aparte para que
// AuthProvider.jsx solo exporte el componente, como pide react-refresh)
import { createContext } from 'react'

export const AuthContext = createContext(null)
