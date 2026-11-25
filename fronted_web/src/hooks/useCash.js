// src/hooks/useCash.js
// HOOKS de caja: turnos abiertos e histórico de cierres, y el resumen de un turno
import { useCallback, useEffect, useState } from 'react'
import CashController from '../controllers/CashController'

const useCash = () => {
  const [abiertos, setAbiertos] = useState([])
  const [cerrados, setCerrados] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let activo = true
    CashController.getShifts().then((result) => {
      if (!activo) return
      setAbiertos(result.success ? result.data.abiertos : [])
      setCerrados(result.success ? result.data.cerrados : [])
      setError(result.success ? '' : result.error)
      setLoading(false)
    })
    return () => {
      activo = false
    }
  }, [version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  const cerrar = async (turno, contado, observacion) => {
    const result = await CashController.closeShift(turno, contado, observacion)
    if (result.success) reload()
    return result
  }

  return { abiertos, cerrados, loading, error, cerrar }
}

// Resumen del turno elegido: ventas por método, total en efectivo y efectivo esperado
export const useShiftSummary = (turno) => {
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    if (!turno) return undefined
    let activo = true
    CashController.getSummary(turno).then((result) => {
      if (activo) setSummary(result.success ? result.data : null)
    })
    return () => {
      activo = false
    }
  }, [turno])

  return turno ? summary : null
}

export default useCash
