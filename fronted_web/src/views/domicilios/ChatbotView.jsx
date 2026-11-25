// src/views/domicilios/ChatbotView.jsx
// VISTA: simulador del chatbot (simulador_chatbot.html). Muestra lo que le llega al cliente por el
// canal simulado (las notificaciones automáticas) y le deja preguntar por su pedido escribiendo el número.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useChatbot } from '../../hooks/useDeliveries'
import { ROUTES } from '../../config/routes'

const ChatbotView = () => {
  const { clientes, mensajesDe, responder } = useChatbot()
  const [telefono, setTelefono] = useState('')
  const [texto, setTexto] = useState('')
  const [conversacion, setConversacion] = useState([]) // lo que el cliente pregunta y el bot responde

  const elegir = (e) => {
    setTelefono(e.target.value)
    setConversacion([])
  }

  const enviar = (e) => {
    e.preventDefault()
    if (!texto.trim() || !telefono) return
    setConversacion([...conversacion, { de: 'cliente', mensaje: texto }, { de: 'bot', mensaje: responder(texto, telefono) }])
    setTexto('')
  }

  // Notificaciones automáticas primero (salen del Observer al cambiar el estado), luego la conversación
  const burbujas = telefono
    ? [...mensajesDe(telefono).map((m) => ({ de: 'bot', mensaje: m.mensaje, fecha: m.fecha })), ...conversacion]
    : []

  return (
    <section className="grid gap-4">
      <div>
        <Link to={ROUTES.DELIVERIES} className="text-sm text-t2 hover:text-acc">← Volver a domicilios</Link>
        <h1 className="mt-1 font-titulo text-2xl text-nav">Simulador del chatbot</h1>
        <p className="text-t2">Así le llegan al cliente los avisos de su pedido. El canal real (WhatsApp o Telegram) solo cambiaría el envío.</p>
      </div>

      <label className="grid max-w-md gap-1 font-medium">Ver como el cliente
        <select value={telefono} onChange={elegir} className="rounded-xl border border-borde bg-card px-4 py-2.5">
          <option value="">Elige un cliente</option>
          {clientes.map((c) => <option key={c.id} value={c.telefono}>{c.nombre} · {c.telefono}</option>)}
        </select>
      </label>

      <div className="mx-auto grid w-full max-w-md overflow-hidden rounded-3xl border border-borde bg-card">
        <div className="bg-nav px-4 py-3 font-sub text-white">Control Store · Domicilios</div>
        <div className="grid min-h-72 content-start gap-2 bg-fondo p-4" aria-live="polite">
          {!telefono && <p className="text-center text-t2">Elige un cliente para ver su chat.</p>}
          {telefono && burbujas.length === 0 && <p className="text-center text-t2">Sin mensajes todavía. Escribe el número de un pedido.</p>}
          {burbujas.map((b, i) => (
            <p key={i} className={`max-w-[85%] rounded-2xl px-3 py-2 ${b.de === 'cliente' ? 'justify-self-end bg-acc text-white' : 'justify-self-start bg-card'}`}>
              {b.mensaje}
              {b.fecha && <span className="block text-xs opacity-60">{b.fecha}</span>}
            </p>
          ))}
        </div>
        <form onSubmit={enviar} className="flex gap-2 border-t border-borde p-3">
          <input value={texto} onChange={(e) => setTexto(e.target.value)} disabled={!telefono} placeholder="Ej: ¿cómo va mi pedido 7?" aria-label="Mensaje"
            className="min-w-0 flex-1 rounded-xl border border-borde bg-card px-3 py-2 outline-none focus:border-acc" />
          <button type="submit" disabled={!telefono} className="rounded-xl bg-acc px-4 font-sub text-white hover:bg-pri disabled:opacity-60">Enviar</button>
        </form>
      </div>
    </section>
  )
}

export default ChatbotView
