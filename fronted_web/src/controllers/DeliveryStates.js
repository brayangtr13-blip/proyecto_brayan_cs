// src/controllers/DeliveryStates.js
// Patrón STATE (de domicilios_estados.js del prototipo): un solo lugar define qué cambios de estado
// son válidos y quién puede hacerlos. Pantallas, controlador y chatbot le preguntan aquí.
// Estados = ENUM de la columna domicilios.estado.
import { USER_ROLES } from '../config/constants'

// HU06: flujo secuencial sin saltos; desde cualquier estado no final se puede cancelar
const TRANSICIONES = {
  pendiente: ['asignado', 'cancelado'],
  asignado: ['en_camino', 'cancelado'],
  en_camino: ['entregado', 'cancelado'],
  entregado: [], // un pedido entregado no se puede modificar
  cancelado: [] // un pedido cancelado tampoco
}

// HU06: el domiciliario solo pone "en camino" y "entregado"; el administrador, cualquiera
const PERMITIDOS_POR_ROL = {
  [USER_ROLES.ADMIN]: ['asignado', 'en_camino', 'entregado', 'cancelado'],
  [USER_ROLES.DOMICILIARIO]: ['en_camino', 'entregado']
}

export const TEXTO_ESTADO = {
  pendiente: 'Pendiente',
  asignado: 'Asignado',
  en_camino: 'En camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado'
}

export const ORDEN_ESTADOS = ['pendiente', 'asignado', 'en_camino', 'entregado']

const DeliveryStates = {
  esFinal(estado) {
    return TRANSICIONES[estado].length === 0
  },

  // Estados a los que ESTE rol puede mover el pedido desde su estado actual.
  // "asignado" no se elige aquí: se pone al asignar un domiciliario.
  siguientes(estadoActual, rol) {
    return TRANSICIONES[estadoActual].filter((e) => e !== 'asignado' && (PERMITIDOS_POR_ROL[rol] ?? []).includes(e))
  },

  // null si el cambio es válido, o el mensaje que explica por qué no
  validar(pedido, nuevoEstado, rol, idUsuario) {
    if (this.esFinal(pedido.estado)) return `El pedido ya está ${TEXTO_ESTADO[pedido.estado].toLowerCase()} y no se puede modificar.`
    if (!TRANSICIONES[pedido.estado].includes(nuevoEstado)) {
      const permitidos = TRANSICIONES[pedido.estado].map((e) => TEXTO_ESTADO[e].toLowerCase()).join(' o ')
      return `No se permiten saltos de estado: desde "${TEXTO_ESTADO[pedido.estado].toLowerCase()}" solo se puede pasar a ${permitidos}.`
    }
    if (!(PERMITIDOS_POR_ROL[rol] ?? []).includes(nuevoEstado)) return `Tu rol no puede poner un pedido en "${TEXTO_ESTADO[nuevoEstado].toLowerCase()}".`
    if (rol === USER_ROLES.DOMICILIARIO && pedido.idDomiciliario !== idUsuario) return 'Solo puedes cambiar el estado de tus propios pedidos.'
    if (nuevoEstado === 'asignado' && !pedido.idDomiciliario) return 'Para pasar a "asignado" primero hay que elegir un domiciliario.'
    return null
  }
}

export default DeliveryStates
