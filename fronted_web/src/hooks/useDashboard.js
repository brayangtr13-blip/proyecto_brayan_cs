// src/hooks/useDashboard.js
// HOOK: pide los indicadores al montar el dashboard
import { useEffect, useState } from 'react'
import DashboardController from '../controllers/DashboardController'

const useDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true // evita actualizar si la vista ya se cerró
    DashboardController.getStats().then((result) => {
      if (!activo) return
      if (result.success) setStats(result.data)
      else setError(result.error)
      setLoading(false)
    })
    return () => {
      activo = false
    }
  }, [])

  return { stats, loading, error }
}

export default useDashboard
