// src/hooks/useReports.js
// HOOK de reportes: carga una sola vez los datos y se los entrega a la vista.
// Los filtros no vuelven a pedir nada: cada reporte recalcula sobre estos datos (como el prototipo).
import { useEffect, useState } from 'react'
import ReportController from '../controllers/ReportController'

const useReports = () => {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    ReportController.getData().then((result) => {
      if (!activo) return
      setData(result.success ? result.data : null)
      setError(result.success ? '' : result.error)
    })
    return () => {
      activo = false
    }
  }, [])

  return { data, error, loading: !data && !error }
}

export default useReports
