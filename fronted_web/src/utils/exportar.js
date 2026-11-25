// src/utils/exportar.js
// Exportar un reporte a Excel (RF27.1 / RF29.1). Excel abre un CSV directamente: se usa ";"
// (separador de Excel en español) y un BOM al inicio para que las tildes salgan bien.
const limpiar = (valor) => {
  const texto = String(valor ?? '')
  return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

export const exportarCSV = (nombreArchivo, encabezados, filas) => {
  const texto = [encabezados, ...filas].map((fila) => fila.map(limpiar).join(';')).join('\r\n')
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(new Blob(['﻿' + texto], { type: 'text/csv;charset=utf-8' }))
  enlace.download = nombreArchivo
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1000)
}
