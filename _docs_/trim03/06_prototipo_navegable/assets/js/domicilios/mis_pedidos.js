// Mis pedidos – panel del domiciliario (CS-36 – HU05 / CU038 y CS-37 – HU06 / CU040).
// HU05: "El domiciliario debe ver en su panel únicamente los pedidos asignados a él".
// HU06: "El domiciliario solo debe poder cambiar los estados de sus pedidos a En camino y Entregado".

// Sin backend no hay sesión real: el panel es el de Luis Pérez, el domiciliario que existe
// en la base de datos (usuarios.id_usuario = 3). Con Django, este id vendrá del usuario logueado.
const ID_DOMICILIARIO_ACTUAL = 3;
const USUARIO_ACTUAL = { rol: 'domiciliario', idUsuario: ID_DOMICILIARIO_ACTUAL, nombre: 'Luis Pérez' };

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

    // Solo queda el botón del SIGUIENTE paso que la máquina de estados permite a este rol:
    // asignado -> "Salir a entregar" (en_camino); en_camino -> "Marcar entregado" (entregado)
    const permitidos = EstadosPedido.siguientes(pedido.estado, USUARIO_ACTUAL.rol);
    tarjeta.querySelectorAll('[data-accion]').forEach(function (boton) {
        boton.dataset.id = pedido.id;
        if (!permitidos.includes(boton.dataset.accion)) {
            boton.remove();
        }
    });
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

// ---------------- Cambiar estado (CS-37) ----------------
const accionExito = document.getElementById('accionExito');
const modalEntregar = document.getElementById('modalEntregar');
let pedidoAEntregar = null;
let temporizadorAviso = null;

function avisar(resultado) {
    clearTimeout(temporizadorAviso);
    accionExito.classList.toggle('alert-success', resultado.ok);
    accionExito.classList.toggle('alert-danger', !resultado.ok);
    accionExito.textContent = resultado.ok ? resultado.mensaje : resultado.error;
    accionExito.classList.remove('d-none');
    temporizadorAviso = setTimeout(function () { accionExito.classList.add('d-none'); }, 4000);
}

// "Salir a entregar": cambio directo (no es un estado final, no necesita confirmación)
pedidosActivos.addEventListener('click', function (evento) {
    const boton = evento.target.closest('[data-accion="en_camino"]');
    if (!boton) return;
    avisar(ServicioDomicilios.cambiarEstado(Number(boton.dataset.id), 'en_camino', USUARIO_ACTUAL));
    mostrarMisPedidos();
});

// "Marcar entregado": el modal recuerda cuánto cobrar antes de confirmar
// Docs: https://getbootstrap.com/docs/5.3/components/modal/#events
modalEntregar.addEventListener('show.bs.modal', function (evento) {
    pedidoAEntregar = RepositorioDomicilios.obtenerPedidoPorId(Number(evento.relatedTarget.dataset.id));
    const metodo = RepositorioDomicilios.obtenerMetodoPago(pedidoAEntregar.idMetodoPago);
    const texto = document.getElementById('textoModalEntregar');
    texto.replaceChildren(
        '¿Entregaste el pedido #' + pedidoAEntregar.id + ' y cobraste ',
        Object.assign(document.createElement('strong'), { textContent: ServicioDomicilios.formatearPrecio(pedidoAEntregar.total) }),
        ' en ' + metodo.nombre + '?'
    );
});

document.getElementById('confirmarEntrega').addEventListener('click', function () {
    avisar(ServicioDomicilios.cambiarEstado(pedidoAEntregar.id, 'entregado', USUARIO_ACTUAL));
    bootstrap.Modal.getInstance(modalEntregar).hide();
    mostrarMisPedidos();
});

mostrarMisPedidos();
