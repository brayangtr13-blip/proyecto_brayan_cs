// Punto de venta (CS-18 · HU01). Solo conecta la pantalla con RepositorioVentas y ServicioVentas.

const usuario = Sesion.actual();
const el = function (id) { return document.getElementById(id); };
let carrito = [];   // renglones de la venta: { codigo, cantidad, precio }
// Al borrar la fila del campo con el cursor, el navegador dispara su "change" en medio del redibujo;
// esta bandera evita que ese evento redibuje otra vez (error de nodo y filas repetidas).
let redibujando = false;

// ---------- Turno: sin caja abierta no se vende ----------
function mostrarTurno() {
    const turno = RepositorioVentas.obtenerTurnoAbierto(usuario.idUsuario);
    el('seccionApertura').classList.toggle('d-none', Boolean(turno));
    el('seccionVenta').classList.toggle('d-none', !turno);
    el('infoTurno').textContent = turno
        ? 'Turno #' + turno.id + ' abierto · Base ' + ServicioVentas.formatearPrecio(turno.montoInicial) + ' · ' + usuario.nombre
        : 'Caja cerrada';
}

el('formApertura').addEventListener('submit', function (evento) {
    evento.preventDefault();
    if (!el('formApertura').checkValidity()) {
        el('formApertura').classList.add('was-validated');
        return;
    }
    ServicioVentas.abrirCaja(usuario, Number(el('montoInicial').value));
    mostrarTurno();
});

// ---------- Catálogo: datalist y accesos rápidos desde el Repository ----------
RepositorioVentas.obtenerProductos().forEach(function (p) {
    el('catalogoVenta').appendChild(new Option(p.codigo + ' · ' + p.nombre));
});

function dibujarAccesos() {
    el('accesosRapidos').replaceChildren();
    RepositorioVentas.obtenerProductos().forEach(function (p) {
        const acceso = el('plantillaRapido').content.cloneNode(true);
        const boton = acceso.querySelector('button');
        const sinStock = !p.activo || p.stock === 0;
        acceso.querySelector('[data-campo="nombre"]').textContent = p.nombre;
        const detalle = acceso.querySelector('[data-campo="detalle"]');
        detalle.textContent = sinStock ? 'Agotado' : ServicioVentas.formatearPrecio(p.precio) + ' · ' + p.stock + ' und.';
        detalle.classList.add(sinStock ? 'text-danger' : 'text-body-secondary');
        boton.disabled = sinStock;   // HU01: no se agregan productos sin stock o inactivos
        boton.dataset.codigo = p.codigo;
        el('accesosRapidos').appendChild(acceso);
    });
}

el('accesosRapidos').addEventListener('click', function (evento) {
    const boton = evento.target.closest('button[data-codigo]');
    if (boton) agregar(RepositorioVentas.obtenerProducto(boton.dataset.codigo), 1);
});

// ---------- Carrito ----------
function mostrarError(mensaje) {
    el('errorProducto').textContent = mensaje || '';
    el('errorProducto').classList.toggle('d-none', !mensaje);
}

function agregar(producto, cantidad) {
    if (!producto) return mostrarError('No se encontró ese producto.');
    const renglon = carrito.find(function (r) { return r.codigo === producto.codigo; });
    const error = ServicioVentas.validarCantidad(producto, (renglon ? renglon.cantidad : 0) + cantidad);
    if (error) return mostrarError(error);
    if (renglon) renglon.cantidad += cantidad;
    else carrito.push({ codigo: producto.codigo, cantidad: cantidad, precio: producto.precio });
    mostrarError('');
    dibujarCarrito();
}

function agregarDesdeBuscador() {
    agregar(ServicioVentas.buscarProducto(el('buscarProductoVenta').value), 1);
    el('buscarProductoVenta').value = '';
    el('buscarProductoVenta').focus();   // listo para el siguiente escaneo
}

el('botonAgregar').addEventListener('click', agregarDesdeBuscador);
// El lector de código de barras escribe el código y envía Enter
el('buscarProductoVenta').addEventListener('keydown', function (evento) {
    if (evento.key === 'Enter') agregarDesdeBuscador();
});

function dibujarCarrito() {
    redibujando = true;
    el('cuerpoVenta').querySelectorAll('tr[data-codigo]').forEach(function (f) { f.remove(); });
    el('filaVacia').classList.toggle('d-none', carrito.length > 0);
    carrito.forEach(function (r) {
        const p = RepositorioVentas.obtenerProducto(r.codigo);
        const fila = el('plantillaRenglon').content.cloneNode(true).querySelector('tr');
        fila.dataset.codigo = r.codigo;
        fila.querySelector('[data-campo="codigo"]').textContent = r.codigo;
        fila.querySelector('[data-campo="nombre"]').textContent = p.nombre;
        fila.querySelector('[data-campo="precio"]').textContent = ServicioVentas.formatearPrecio(r.precio);
        fila.querySelector('[data-campo="subtotal"]').textContent = ServicioVentas.formatearPrecio(r.cantidad * r.precio);
        const campoCantidad = fila.querySelector('input');
        campoCantidad.value = r.cantidad;
        campoCantidad.max = p.stock;
        el('cuerpoVenta').appendChild(fila);
    });
    redibujando = false;
    actualizarResumen();
}

// HU01: cantidad editable, validada contra el stock
el('cuerpoVenta').addEventListener('change', function (evento) {
    if (redibujando || !evento.target.matches('input')) return;
    const renglon = carrito.find(function (r) { return r.codigo === evento.target.closest('tr').dataset.codigo; });
    if (!renglon) return;
    const cantidad = parseInt(evento.target.value, 10);
    const error = cantidad >= 1 ? ServicioVentas.validarCantidad(RepositorioVentas.obtenerProducto(renglon.codigo), cantidad)
        : 'La cantidad debe ser 1 o más.';
    if (error) mostrarError(error);
    else { renglon.cantidad = cantidad; mostrarError(''); }
    dibujarCarrito();   // si hubo error, vuelve a la cantidad válida anterior
});

// HU01: quitar un producto antes de confirmar
el('cuerpoVenta').addEventListener('click', function (evento) {
    const boton = evento.target.closest('[data-accion="quitar"]');
    if (!boton) return;
    carrito = carrito.filter(function (r) { return r.codigo !== boton.closest('tr').dataset.codigo; });
    dibujarCarrito();
});

// ---------- Pago ----------
RepositorioVentas.obtenerMetodosPago().forEach(function (m, indice) {
    const opcion = el('plantillaMetodo').content.cloneNode(true);
    const radio = opcion.querySelector('input');
    radio.id = 'pago' + m.id;
    radio.value = m.id;
    radio.checked = indice === 0;
    opcion.querySelector('label').htmlFor = radio.id;
    opcion.querySelector('label').textContent = m.nombre;
    el('metodosPago').appendChild(opcion);
});

function metodoElegido() {
    return Number(document.querySelector('input[name="metodoPago"]:checked').value);
}

function actualizarResumen() {
    const total = ServicioVentas.calcularTotal(carrito);
    el('totalVenta').textContent = ServicioVentas.formatearPrecio(total);
    const esEfectivo = metodoElegido() === 1;
    el('grupoEfectivo').classList.toggle('d-none', !esEfectivo);
    const recibido = Number(el('valorRecibido').value);
    const cambio = ServicioVentas.calcularCambio(total, recibido);
    el('valorCambio').textContent = ServicioVentas.formatearPrecio(cambio === null ? 0 : cambio);
    el('errorRecibido').classList.toggle('d-none', !esEfectivo || !el('valorRecibido').value || cambio !== null);
    el('botonRegistrar').disabled = carrito.length === 0;
}

el('metodosPago').addEventListener('change', actualizarResumen);
el('valorRecibido').addEventListener('input', actualizarResumen);

// ---------- Registrar ----------
el('botonRegistrar').addEventListener('click', function () {
    const recibido = Number(el('valorRecibido').value);
    const resultado = ServicioVentas.registrarVenta(usuario, carrito, metodoElegido(), recibido);
    if (!resultado.ok) return mostrarError(resultado.error);

    ComprobanteVenta.llenar(el('comprobante'), resultado.venta, recibido, resultado.cambio);
    // HU01: mensaje + opción de imprimir el comprobante (CU019)
    const imprimir = Object.assign(document.createElement('button'), {
        type: 'button', className: 'btn btn-sm btn-success ms-2', textContent: 'Imprimir comprobante'
    });
    imprimir.addEventListener('click', function () { window.print(); });
    el('ventaExito').replaceChildren('Venta registrada exitosamente. Factura #' + resultado.venta.id + '.', imprimir);
    el('ventaExito').classList.remove('d-none');
    limpiar();
    dibujarAccesos();   // el stock mostrado ya bajó
});

function limpiar() {
    carrito = [];
    el('valorRecibido').value = '';
    mostrarError('');
    dibujarCarrito();
}

el('botonLimpiar').addEventListener('click', function () {
    limpiar();
    el('ventaExito').classList.add('d-none');
});

mostrarTurno();
dibujarAccesos();
dibujarCarrito();
