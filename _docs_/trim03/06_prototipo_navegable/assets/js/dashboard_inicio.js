// Contador de alertas del dashboard: la misma regla y los mismos datos que alertas_stock.js,
// porque los dos le preguntan a ServicioInventario. Con backend: SELECT COUNT(*) con esa condición.
document.getElementById('contadorAlertas').textContent = ServicioInventario.obtenerAlertas().length;
