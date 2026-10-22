// Contador de alertas del dashboard: la misma regla y los mismos datos que alertas_stock.js,
// porque los dos le preguntan a ServicioInventario. Con backend: SELECT COUNT(*) con esa condición.

// IIFE: las variables de esta pantalla no quedan globales ni chocan con otros scripts
(function () {
    document.getElementById('contadorAlertas').textContent = ServicioInventario.obtenerAlertas().length;
})();
