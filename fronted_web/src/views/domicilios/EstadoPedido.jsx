// src/views/domicilios/EstadoPedido.jsx
// VISTA: etiqueta del estado y barra de recorrido de 4 pasos (como AVANCE_ESTADO del prototipo)
import { ORDEN_ESTADOS, TEXTO_ESTADO } from '../../controllers/DeliveryStates'

const COLOR_ESTADO = {
  pendiente: 'bg-warn/10 text-warn',
  asignado: 'bg-acc/10 text-acc',
  en_camino: 'bg-pri/10 text-pri',
  entregado: 'bg-ok/10 text-ok',
  cancelado: 'bg-err/10 text-err'
}

export const EtiquetaEstado = ({ estado }) => (
  <span className={`whitespace-nowrap rounded-lg px-2 py-1 text-sm font-medium ${COLOR_ESTADO[estado]}`}>{TEXTO_ESTADO[estado]}</span>
)

// Pasos hechos en verde, el actual en azul; un pedido cancelado muestra una sola barra roja
const Recorrido = ({ estado }) => {
  if (estado === 'cancelado') {
    return <div className="border-t-4 border-err pt-1 text-xs font-semibold text-err">Cancelado</div>
  }
  const actual = ORDEN_ESTADOS.indexOf(estado)
  return (
    <ol className="grid grid-cols-4 gap-1 text-[11px] font-semibold" aria-label={`Estado: ${TEXTO_ESTADO[estado]}`}>
      {ORDEN_ESTADOS.map((paso, i) => (
        <li key={paso} className={`truncate border-t-4 pt-1 ${i < actual ? 'border-ok text-ok' : i === actual ? 'border-acc text-acc' : 'border-borde text-t2'}`}>
          {TEXTO_ESTADO[paso]}
        </li>
      ))}
    </ol>
  )
}

export default Recorrido
