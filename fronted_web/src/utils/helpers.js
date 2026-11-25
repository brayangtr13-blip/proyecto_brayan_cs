// src/utils/helpers.js
// Formatos de la interfaz: una sola copia para todas las vistas (como utilidades.js del prototipo)

// 2850 → "$ 2.850" (pesos colombianos, sin decimales)
const pesos = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
export const formatoPesos = (valor) => pesos.format(Number(valor) || 0)

// "2026-09-23 10:10:30" → "23 sept 2026, 10:10"
const fecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
export const formatoFecha = (texto) => {
  if (!texto) return ''
  const valor = new Date(String(texto).replace(' ', 'T'))
  return Number.isNaN(valor.getTime()) ? texto : fecha.format(valor)
}
