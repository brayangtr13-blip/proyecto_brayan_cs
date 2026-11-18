// src/views/common/AlertMessage.jsx
// Colores por tipo de alerta (clases de Tailwind con los tokens de index.css)
const ESTILOS = {
  info: 'bg-acc/10 text-acc border-acc/30',
  success: 'bg-ok/10 text-ok border-ok/30',
  warning: 'bg-warn/10 text-warn border-warn/30',
  error: 'bg-err/10 text-err border-err/30'
}

const AlertMessage = ({ type = 'info', message }) => {
  if (!message) return null
  return (
    <div role="alert" className={`rounded-xl border px-4 py-3 font-medium ${ESTILOS[type] ?? ESTILOS.info}`}>
      {message}
    </div>
  )
}

export default AlertMessage
