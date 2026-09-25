// Comprobante de venta (CU019), compartido por Punto de venta y Detalle de venta.
// Depende de: ventas_datos.js y ventas_servicio.js

const ComprobanteVenta = (function () {

    // recibido y cambio solo existen al momento de cobrar en efectivo (no se guardan en la BD)
    function llenar(seccion, venta, recibido, cambio) {
        const campo = function (n) { return seccion.querySelector('[data-campo="' + n + '"]'); };
        campo('encabezado').textContent = 'Factura #' + venta.id + ' · ' + ServicioVentas.formatearFecha(venta.fecha) +
            ' · Cajero: ' + RepositorioVentas.obtenerUsuario(venta.idUsuario).nombre;

        const cuerpo = campo('renglones');
        cuerpo.replaceChildren();
        venta.detalle.forEach(function (d) {
            const fila = cuerpo.insertRow();
            fila.insertCell().textContent = RepositorioVentas.obtenerProducto(d.codigo).nombre;
            const cant = fila.insertCell();
            cant.textContent = d.cantidad;
            cant.className = 'text-center';
            const sub = fila.insertCell();
            sub.textContent = ServicioVentas.formatearPrecio(d.cantidad * d.precio);
            sub.className = 'text-end';
        });

        campo('total').textContent = ServicioVentas.formatearPrecio(venta.total);
        const metodo = RepositorioVentas.obtenerMetodoPago(venta.idMetodoPago).nombre;
        campo('pago').textContent = 'Pago: ' + metodo + (cambio === null || cambio === undefined ? ''
            : ' · Recibido ' + ServicioVentas.formatearPrecio(recibido) + ' · Cambio ' + ServicioVentas.formatearPrecio(cambio));
    }

    // Llena y abre el diálogo de impresión; ventas.css deja visible solo el comprobante
    function imprimir(seccion, venta, recibido, cambio) {
        llenar(seccion, venta, recibido, cambio);
        window.print();
    }

    return { llenar: llenar, imprimir: imprimir };
})();
