// Detalle de venta (CS-20 · HU03). Solo lectura: muestra la venta, no la modifica.

const usuario = Sesion.actual();
const el = function (id) { return document.getElementById(id); };
const campo = function (n) { return el('detalleVenta').querySelector('[data-campo="' + n + '"]'); };
let ventaActual = null;

function mostrar(id) {
    const resultado = ServicioVentas.consultarVenta(usuario, id);
    el('ventaNoEncontrada').classList.toggle('d-none', resultado.ok);
    el('detalleVenta').classList.toggle('d-none', !resultado.ok);
    if (!resultado.ok) return;   // HU03: "Venta no encontrada"

    const v = resultado.venta;
    ventaActual = v;
    const anulada = v.estado === 'anulada';
    const [fecha, hora] = ServicioVentas.formatearFecha(v.fecha).split(' ');
    campo('titulo').textContent = 'Factura #' + v.id;
    campo('estado').textContent = anulada ? 'ANULADA' : v.estado === 'pagada' ? 'Pagada' : 'Pendiente';
    campo('estado').className = 'badge ' + (anulada ? 'text-bg-danger' : v.estado === 'pagada' ? 'text-bg-success' : 'text-bg-warning');
    campo('fecha').textContent = fecha;
    campo('hora').textContent = hora;
    campo('cajero').textContent = RepositorioVentas.obtenerUsuario(v.idUsuario).nombre;
    campo('metodo').textContent = RepositorioVentas.obtenerMetodoPago(v.idMetodoPago).nombre;

    el('cuerpoDetalle').replaceChildren();
    v.detalle.forEach(function (d) {
        const fila = el('plantillaDetalle').content.cloneNode(true);
        const c = function (n) { return fila.querySelector('[data-campo="' + n + '"]'); };
        c('codigo').textContent = d.codigo;
        c('nombre').textContent = RepositorioVentas.obtenerProducto(d.codigo).nombre;
        c('cantidad').textContent = d.cantidad;
        c('precio').textContent = ServicioVentas.formatearPrecio(d.precio);
        c('subtotal').textContent = ServicioVentas.formatearPrecio(d.cantidad * d.precio);
        el('cuerpoDetalle').appendChild(fila);
    });
    // Sin IVA en la BD: el subtotal es el total
    campo('resumenSubtotal').textContent = ServicioVentas.formatearPrecio(v.total);
    campo('resumenTotal').textContent = ServicioVentas.formatearPrecio(v.total);

    // HU03: marca ANULADA con fecha y motivo
    const anulacion = anulada ? ServicioVentas.datosAnulacion(v.id) : null;
    el('avisoAnulada').classList.toggle('d-none', !anulada);
    if (anulada) {
        campo('fechaAnulacion').textContent = anulacion ? ServicioVentas.formatearFecha(anulacion.fecha) : 'fecha no registrada';
        campo('usuarioAnulacion').textContent = anulacion ? RepositorioVentas.obtenerUsuario(anulacion.idUsuario).nombre : '—';
        campo('motivoAnulacion').textContent = anulacion ? anulacion.motivo : 'no registrado';
    }
    el('buscarFactura').value = v.id;
}

el('formBuscar').addEventListener('submit', function (evento) {
    evento.preventDefault();
    const id = Number(el('buscarFactura').value);
    history.replaceState(null, '', '?id=' + id);   // la URL queda con la factura buscada
    mostrar(id);
});

// HU03: reimprimir; no hay cambio que mostrar (no se guarda en la BD)
el('botonReimprimir').addEventListener('click', function () {
    ComprobanteVenta.imprimir(el('comprobante'), ventaActual, null, null);
});

mostrar(Number(new URLSearchParams(location.search).get('id')));
