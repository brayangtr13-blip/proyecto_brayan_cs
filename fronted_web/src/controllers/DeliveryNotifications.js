// src/controllers/DeliveryNotifications.js
// Notificaciones al cliente (CS-38 · HU07). Es un OYENTE del evento "estadoCambiado" (patrón Observer):
// ninguna pantalla lo llama. Arma el mensaje con la plantilla del estado y lo envía por el canal activo.
// Canal simulado (patrón Adapter): guarda los mensajes en el navegador para que el simulador del chatbot
// los muestre. Un canal real (WhatsApp o Telegram) cambiaría solo "enviar".
import Eventos from '../utils/eventos'
import storageService from '../services/storageService'
import { TEXTO_ESTADO } from './DeliveryStates'
import { formatoPesos } from '../utils/helpers'
import { fechaActual } from '../models/AuditModel'

const CLAVE = 'cs_notificaciones' // mensajes enviados por el canal simulado

// HU07: plantillas claras, con el nombre del cliente y el número de pedido
const PLANTILLAS = {
  asignado: (d) => `Hola ${d.cliente}, tu pedido #${d.id} está siendo preparado. Te avisaremos cuando salga.`,
  en_camino: (d) => `Hola ${d.cliente}, tu pedido #${d.id} ya salió con ${d.domiciliario}. Llegará en unos ${d.minutos} minutos.`,
  entregado: (d) => `¡Gracias por tu compra, ${d.cliente}! Tu pedido #${d.id} fue entregado. Total pagado: ${d.total}.`,
  cancelado: (d) => `Hola ${d.cliente}, tu pedido #${d.id} fue cancelado. Motivo: ${d.motivo}.`
}

const leer = () => {
  try {
    return JSON.parse(storageService.getItem(CLAVE) ?? '[]')
  } catch {
    return []
  }
}

// Adapter del canal: hoy guarda en el navegador; con un canal real aquí se llamaría su API
const CanalSimulado = {
  enviar(telefono, mensaje) {
    storageService.setItem(CLAVE, JSON.stringify([...leer(), { telefono, mensaje, fecha: fechaActual() }]))
    return { ok: true }
  }
}

const datosPlantilla = (pedido, extra = {}) => ({
  id: pedido.id,
  cliente: pedido.cliente.split(' ')[0],
  domiciliario: pedido.domiciliario ?? 'nuestro domiciliario',
  total: formatoPesos(pedido.totalProductos + pedido.costoEnvio),
  minutos: extra.minutos ?? 30,
  motivo: extra.motivo ?? 'sin motivo'
})

// Oyente: cada cambio de estado (no las reasignaciones) avisa al teléfono del cliente
Eventos.suscribir('estadoCambiado', ({ pedido, estadoAnterior, estadoNuevo, motivo, minutos }) => {
  if (estadoAnterior === estadoNuevo || !PLANTILLAS[estadoNuevo]) return
  CanalSimulado.enviar(pedido.telefonoCliente, PLANTILLAS[estadoNuevo](datosPlantilla({ ...pedido, estado: estadoNuevo }, { motivo, minutos })))
})

const DeliveryNotifications = {
  // Mensajes que el sistema le envió a un teléfono
  mensajesDe(telefono) {
    return leer().filter((m) => m.telefono === telefono)
  },

  // El cliente escribe un número de pedido y el bot responde su estado (misma regla para el bot real)
  responderConsulta(texto, telefono, pedidos) {
    const numero = Number(String(texto).match(/\d+/)?.[0])
    if (!numero) return 'Escribe el número de tu pedido (por ejemplo: 7) y te digo cómo va.'
    const pedido = pedidos.find((p) => p.id === numero)
    // Solo se informa al dueño del pedido: el teléfono debe coincidir
    if (!pedido || (pedido.telefonoCliente !== telefono && pedido.telefonoContacto !== telefono)) {
      return `No encontramos el pedido #${numero} asociado a tu número.`
    }
    const plantilla = PLANTILLAS[pedido.estado]
    if (plantilla) return plantilla(datosPlantilla(pedido))
    return `Tu pedido #${pedido.id} está ${TEXTO_ESTADO[pedido.estado].toLowerCase()}: pronto lo asignamos a un domiciliario.`
  }
}

export default DeliveryNotifications
