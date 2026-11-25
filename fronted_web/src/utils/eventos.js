// src/utils/eventos.js
// Patrón OBSERVER (de domicilios_eventos.js del prototipo): quien publica un evento no sabe
// quién lo escucha. El controlador de domicilios publica "estadoCambiado" y las notificaciones
// reaccionan solas; mañana se puede sumar otro oyente sin tocar el controlador.
const oyentes = {}

const Eventos = {
  suscribir(nombre, funcion) {
    oyentes[nombre] = [...(oyentes[nombre] ?? []), funcion]
  },

  publicar(nombre, datos) {
    for (const funcion of oyentes[nombre] ?? []) {
      try {
        funcion(datos)
      } catch (error) {
        console.error(`Un oyente de "${nombre}" falló:`, error) // un oyente con error no detiene a los demás
      }
    }
  }
}

export default Eventos
