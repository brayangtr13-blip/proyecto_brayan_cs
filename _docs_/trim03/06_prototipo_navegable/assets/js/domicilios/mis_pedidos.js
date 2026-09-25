// Mis pedidos – panel del domiciliario (CS-36 – MOD_04_HU05 / CU038).
// HU05: "El domiciliario debe ver en su panel únicamente los pedidos asignados a él".

// Sin backend no hay sesión real: el panel es el de Luis Pérez, el domiciliario que existe
// en la base de datos (usuarios.id_usuario = 3). Con Django, este id vendrá del usuario logueado.
const ID_DOMICILIARIO_ACTUAL = 3;

const pedidosActivos = document.getElementById('pedidosActivos');
const pedidosEntregados = document.getElementById('pedidosEntregados');
const plantillaPedido = document.getElementById('plantillaPedidoDomiciliario');
const plantillaEntregado = document.getElementById('plantillaEntregado');

function crearTarjeta(pedido) {
    const tarjeta = plantillaPedido.content.cloneNode(true);
    const cliente = RepositorioDomicilios.obtenerClientePorId(pedido.idCliente);
    const metodo = RepositorioDomicilios.obtenerMetodoPago(pedido.idMetodoPago);
    const campo = function (nombre) { return tarjeta.querySelector('[data-campo="' + nombre + '"]'); };

    campo('titulo').textContent = 'Pedido #' + pedido.id;
    campo('subtitulo').textContent = 'Asignado ' + ServicioDomicilios.formatearFecha(pedido.fechaAsignacion) +
        ' · ' + ServicioDomicilios.tiempoTranscurrido(pedido.fechaAsignacion);
    campo('estado').textContent = ServicioDomicilios.TEXTO_ESTADO[pedido.estado];
    campo('estado').classList.add('estado-' + pedido.estado);
    campo('cliente').textContent = cliente.nombre;
    campo('telefono').textContent = pedido.telefonoContacto;
    campo('telefono').href = 'tel:' + pedido.telefonoContacto;
    campo('direccion').textContent = pedido.direccionEntrega;
    campo('barrio').textContent = pedido.barrio;
    campo('total').textContent = ServicioDomicilios.formatearPrecio(pedido.total);
    campo('metodo').textContent = metodo.nombre;
    if (pedido.observacion) {
        campo('observacion').textContent = pedido.observacion;
    } else {
        campo('observacion').textContent = 'Sin observaciones';
        campo('observacion').classList.add('text-body-secondary');
    }
    return tarjeta;
}

function mostrarMisPedidos() {
    const mios = ServicioDomicilios.pedidosDe(ID_DOMICILIARIO_ACTUAL);
    const activos = mios.filter(function (p) { return p.estado === 'asignado' || p.estado === 'en_camino'; });
    const entregados = mios.filter(function (p) { return p.estado === 'entregado'; });
    const domiciliario = RepositorioDomicilios.obtenerDomiciliarioPorId(ID_DOMICILIARIO_ACTUAL);

    // Saludo del diseño de referencia con el conteo real
    document.querySelector('[data-campo="nombreDomiciliario"]').textContent = domiciliario.nombre;
    document.querySelector('[data-campo="totalActivos"]').textContent =
        activos.length + (activos.length === 1 ? ' entrega activa' : ' entregas activas');

    pedidosActivos.replaceChildren();
    activos.forEach(function (pedido) { pedidosActivos.appendChild(crearTarjeta(pedido)); });
    document.getElementById('sinPedidos').classList.toggle('d-none', activos.length > 0);

    pedidosEntregados.replaceChildren();
    entregados.forEach(function (pedido) {
        const fila = plantillaEntregado.content.cloneNode(true);
        const cliente = RepositorioDomicilios.obtenerClientePorId(pedido.idCliente);
        fila.querySelector('[data-campo="resumen"]').textContent =
            'Pedido #' + pedido.id + ' · ' + cliente.nombre + ' · ' + pedido.barrio;
        pedidosEntregados.appendChild(fila);
    });
    document.getElementById('sinEntregados').classList.toggle('d-none', entregados.length > 0);
}

mostrarMisPedidos();
