// Panel de pedidos (CU037 / CS-35). Solo conecta el HTML con el Repository y el Service:
// no guarda datos propios ni repite reglas de negocio.

const listaPedidos = document.getElementById('listaPedidos');
const sinPedidos = document.getElementById('sinPedidos');
const plantillaPedido = document.getElementById('plantillaPedido');
const filtrosEstado = document.getElementById('filtrosEstado');

let estadoFiltro = '';

// Llena una copia de la <template> con los datos de un pedido.
// textContent (y no innerHTML): lo que escribió el usuario se muestra como texto, nunca como HTML.
function crearTarjeta(pedido) {
    const tarjeta = plantillaPedido.content.cloneNode(true);
    const cliente = RepositorioDomicilios.obtenerClientePorId(pedido.idCliente);
    const metodo = RepositorioDomicilios.obtenerMetodoPago(pedido.idMetodoPago);
    const domiciliario = RepositorioDomicilios.obtenerDomiciliarioPorId(pedido.idDomiciliario);
    const campo = function (nombre) { return tarjeta.querySelector('[data-campo="' + nombre + '"]'); };

    campo('titulo').textContent = 'Pedido #' + pedido.id;
    campo('subtitulo').textContent = 'Venta #' + pedido.idVenta + ' · ' +
        ServicioDomicilios.formatearFecha(pedido.fechaVenta) + ' · ' +
        ServicioDomicilios.tiempoTranscurrido(pedido.fechaVenta);

    const estado = campo('estado');
    estado.textContent = ServicioDomicilios.TEXTO_ESTADO[pedido.estado];
    // La clase estado-* (domicilios.css) le da el color distintivo que pide HU06
    estado.classList.add('estado-' + pedido.estado);

    campo('cliente').textContent = cliente.nombre + ' · ' + pedido.telefonoContacto;
    campo('direccion').textContent = pedido.direccionEntrega + ' · ' + pedido.barrio;
    campo('metodo').textContent = metodo.nombre;
    campo('total').textContent = ServicioDomicilios.formatearPrecio(pedido.total);

    const celdaDomiciliario = campo('domiciliario');
    if (domiciliario) {
        celdaDomiciliario.textContent = domiciliario.nombre;
    } else {
        celdaDomiciliario.textContent = 'Sin asignar';
        celdaDomiciliario.classList.add('text-body-secondary');
    }

    // Barra de avance: la clase de ancho (w-25...w-100) la decide el Service según el estado
    const avance = campo('avance');
    avance.classList.add(ServicioDomicilios.AVANCE_ESTADO[pedido.estado]);
    if (pedido.estado === 'cancelado') {
        avance.classList.add('bg-danger');
    }
    const paso = campo('pasos').querySelector('[data-paso="' + pedido.estado + '"]');
    if (paso) {
        paso.classList.add('fw-semibold', 'text-body');
    }

    // CS-36: "Asignar" si todavía no tiene domiciliario, "Reasignar" mientras no haya terminado
    // (HU05: se puede reasignar mientras no esté Entregado). Un pedido terminado no muestra el botón.
    const botonAsignar = tarjeta.querySelector('[data-accion="asignar"]');
    botonAsignar.dataset.id = pedido.id;
    if (ServicioDomicilios.estaTerminado(pedido)) {
        botonAsignar.remove();
    } else if (pedido.idDomiciliario) {
        campo('textoAsignar').textContent = 'Reasignar';
        botonAsignar.classList.replace('btn-primary', 'btn-outline-primary');
    }

    return tarjeta;
}

// Indicadores de arriba, calculados siempre sobre todos los pedidos (no sobre el filtro)
function actualizarIndicadores(pedidos) {
    const contar = function (estado) {
        return pedidos.filter(function (p) { return p.estado === estado; }).length;
    };
    document.getElementById('kpiPendientes').textContent = contar('pendiente');
    document.getElementById('kpiEnCamino').textContent = contar('en_camino');
    document.getElementById('kpiEntregados').textContent = contar('entregado');

    // Promedio entre fecha_asignacion y fecha_entrega de los pedidos ya entregados
    const entregados = pedidos.filter(function (p) { return p.fechaAsignacion && p.fechaEntrega; });
    const kpiTiempo = document.getElementById('kpiTiempo');
    if (entregados.length === 0) {
        kpiTiempo.textContent = '—';
    } else {
        const totalMinutos = entregados.reduce(function (suma, p) {
            return suma + (new Date(p.fechaEntrega) - new Date(p.fechaAsignacion)) / 60000;
        }, 0);
        kpiTiempo.textContent = Math.round(totalMinutos / entregados.length) + ' min';
    }

    // Cantidad en cada píldora de filtro
    filtrosEstado.querySelectorAll('[data-estado]').forEach(function (boton) {
        const estado = boton.dataset.estado;
        boton.querySelector('.badge').textContent = estado === '' ? pedidos.length : contar(estado);
    });
}

function mostrarPedidos() {
    const pedidos = RepositorioDomicilios.obtenerPedidos();
    actualizarIndicadores(pedidos);

    // Los más recientes primero: el último pedido registrado es el que más urge atender
    const visibles = pedidos
        .filter(function (p) { return estadoFiltro === '' || p.estado === estadoFiltro; })
        .slice()
        .sort(function (a, b) { return new Date(b.fechaVenta) - new Date(a.fechaVenta); });

    listaPedidos.replaceChildren();
    visibles.forEach(function (pedido) {
        listaPedidos.appendChild(crearTarjeta(pedido));
    });
    sinPedidos.classList.toggle('d-none', visibles.length > 0);
}

// Delegación de eventos: un solo listener en la lista de filtros en vez de uno por botón
filtrosEstado.addEventListener('click', function (evento) {
    const boton = evento.target.closest('[data-estado]');
    if (!boton) return;
    filtrosEstado.querySelectorAll('.nav-link').forEach(function (b) { b.classList.remove('active'); });
    boton.classList.add('active');
    estadoFiltro = boton.dataset.estado;
    mostrarPedidos();
});

// ---------------- Asignar domiciliario (CS-36 – HU05 / CU038) ----------------
const modalAsignar = document.getElementById('modalAsignar');
const listaDomiciliarios = document.getElementById('listaDomiciliarios');
const plantillaDomiciliario = document.getElementById('plantillaDomiciliario');
const sinDomiciliarios = document.getElementById('sinDomiciliarios');
const errorAsignar = document.getElementById('errorAsignar');
const confirmarAsignar = document.getElementById('confirmarAsignar');
const accionExito = document.getElementById('accionExito');
let pedidoAAsignar = null;
let temporizadorAviso = null;

// "show.bs.modal" lo dispara Bootstrap justo antes de abrir el modal; relatedTarget es el
// botón que lo abrió, así sabemos de qué pedido se trata sin variables globales extra.
// Docs: https://getbootstrap.com/docs/5.3/components/modal/#events
modalAsignar.addEventListener('show.bs.modal', function (evento) {
    pedidoAAsignar = RepositorioDomicilios.obtenerPedidoPorId(Number(evento.relatedTarget.dataset.id));
    const cliente = RepositorioDomicilios.obtenerClientePorId(pedidoAAsignar.idCliente);
    document.getElementById('resumenPedidoAsignar').textContent =
        'Pedido #' + pedidoAAsignar.id + ' · ' + cliente.nombre + ' · ' + pedidoAAsignar.barrio;
    errorAsignar.classList.add('d-none');

    listaDomiciliarios.replaceChildren();
    const domiciliarios = RepositorioDomicilios.obtenerDomiciliarios();
    domiciliarios.forEach(function (domiciliario) {
        const fila = plantillaDomiciliario.content.cloneNode(true).querySelector('label');
        const radio = fila.querySelector('input');
        const carga = fila.querySelector('[data-campo="carga"]');
        radio.value = domiciliario.id;
        radio.id = 'domiciliario' + domiciliario.id;
        fila.htmlFor = radio.id;
        fila.querySelector('[data-campo="nombre"]').textContent = domiciliario.nombre +
            (domiciliario.id === pedidoAAsignar.idDomiciliario ? ' (actual)' : '');

        if (domiciliario.activo) {
            const activos = ServicioDomicilios.cargaDe(domiciliario.id);
            carga.textContent = activos + (activos === 1 ? ' activo' : ' activos');
            carga.classList.add('text-bg-light', 'border');
            radio.checked = domiciliario.id === pedidoAAsignar.idDomiciliario;
        } else {
            // HU05: un domiciliario inactivo se ve, pero no se puede elegir
            carga.textContent = 'Inactivo';
            carga.classList.add('text-bg-secondary');
            radio.disabled = true;
            fila.classList.add('disabled');
            fila.setAttribute('aria-disabled', 'true');
        }
        listaDomiciliarios.appendChild(fila);
    });

    // Extensión "Sin domiciliarios disponibles": se avisa y no se deja confirmar
    const hayActivos = domiciliarios.some(function (d) { return d.activo; });
    sinDomiciliarios.classList.toggle('d-none', hayActivos);
    confirmarAsignar.disabled = !hayActivos;
});

confirmarAsignar.addEventListener('click', function () {
    const elegido = listaDomiciliarios.querySelector('input:checked');
    if (!elegido) {
        errorAsignar.textContent = 'Selecciona un domiciliario.';
        errorAsignar.classList.remove('d-none');
        return;
    }
    // La regla (activo, no terminado, cambio de estado, histórico) es del Service
    const resultado = ServicioDomicilios.asignarDomiciliario(pedidoAAsignar.id, Number(elegido.value), 'Administrador');
    if (!resultado.ok) {
        errorAsignar.textContent = resultado.error;
        errorAsignar.classList.remove('d-none');
        return;
    }
    // Facade de Bootstrap: cerrar el modal sin manipular sus clases a mano
    bootstrap.Modal.getInstance(modalAsignar).hide();
    mostrarPedidos();

    // HU05: "Al asignar se debe mostrar 'Pedido asignado a [nombre del domiciliario]'"
    clearTimeout(temporizadorAviso);
    accionExito.textContent = resultado.mensaje + ' (pedido #' + resultado.pedido.id + ').';
    accionExito.classList.remove('d-none');
    temporizadorAviso = setTimeout(function () { accionExito.classList.add('d-none'); }, 4000);
});

document.getElementById('botonRestablecer').addEventListener('click', function () {
    RepositorioDomicilios.restablecer();
    mostrarPedidos();
});

mostrarPedidos();
