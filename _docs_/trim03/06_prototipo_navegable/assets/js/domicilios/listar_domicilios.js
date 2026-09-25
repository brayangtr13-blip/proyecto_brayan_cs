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

document.getElementById('botonRestablecer').addEventListener('click', function () {
    RepositorioDomicilios.restablecer();
    mostrarPedidos();
});

mostrarPedidos();
