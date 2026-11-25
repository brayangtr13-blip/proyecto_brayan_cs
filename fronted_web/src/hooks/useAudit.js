// src/hooks/useAudit.js
// HOOK del log de auditoría: carga una vez eventos, usuarios y módulos.
// Los filtros y la paginación recalculan en la vista sin volver a pedir nada.
import { useEffect, useState } from 'react'
import AuditController from '../controllers/AuditController'

const useAudit = () => {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    AuditController.getLog().then((result) => {
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

export default useAudit
