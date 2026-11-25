// src/hooks/useDashboard.js
// HOOK: pide los indicadores al montar el dashboard (según el usuario conectado)
import { useEffect, useState } from 'react'
import DashboardController from '../controllers/DashboardController'
import useAuth from './useAuth'

const useDashboard = () => {
  const { currentUser } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true // evita actualizar si la vista ya se cerró
    DashboardController.getStats(currentUser).then((result) => {
      if (!activo) return
      if (result.success) setStats(result.data)
      else setError(result.error)
      setLoading(false)
    })
    return () => {
      activo = false
    }
  }, [currentUser])

  return { stats, loading, error }
}

export default useDashboard
