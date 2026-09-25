// Detalle del pedido y cambio de estado por el administrador (CS-37 – MOD_04_HU06 / CU040).
// Las reglas (qué estado sigue, quién puede, motivo obligatorio, stock) NO están aquí:
// están en EstadosPedido (State) y ServicioDomicilios (Service).

// Sin backend no hay sesión: esta pantalla solo la usa el administrador
const USUARIO_ACTUAL = { rol: 'administrador', idUsuario: 1, nombre: 'Administrador' };

const idPedido = Number(new URLSearchParams(window.location.search).get('id'));
const form = document.getElementById('formCambiarEstado');
const selectEstado = document.getElementById('nuevoEstado');
const grupoMotivo = document.getElementById('grupoMotivo');
const campoMotivo = document.getElementById('motivoCancelacion');
const campoObservacion = document.getElementById('observacionCambio');
const cambioExito = document.getElementById('cambioExito');
const campo = function (nombre) { return document.querySelector('[data-campo="' + nombre + '"]'); };

function llenarFila(plantilla, valores) {
    const fila = document.getElementById(plantilla).content.cloneNode(true);
    Object.keys(valores).forEach(function (clave) {
        fila.querySelector('[data-campo="' + clave + '"]').textContent = valores[clave];
    });
    return fila;
}

function mostrarPedido(pedido) {
    const cliente = RepositorioDomicilios.obtenerClientePorId(pedido.idCliente);
    const metodo = RepositorioDomicilios.obtenerMetodoPago(pedido.idMetodoPago);
    const domiciliario = RepositorioDomicilios.obtenerDomiciliarioPorId(pedido.idDomiciliario);
    const texto = ServicioDomicilios.TEXTO_ESTADO;

    campo('migaPedido').textContent = 'Pedido #' + pedido.id;
    campo('titulo').textContent = 'Pedido #' + pedido.id;
    const estado = campo('estado');
    estado.textContent = texto[pedido.estado];
    estado.className = 'badge rounded-pill fs-6 align-middle estado-' + pedido.estado;
    // HU06: "Se debe mostrar el tiempo transcurrido desde que se recibió el pedido"
    campo('recibido').textContent = 'Recibido el ' + ServicioDomicilios.formatearFecha(pedido.fechaVenta) +
        ' · ' + ServicioDomicilios.tiempoTranscurrido(pedido.fechaVenta);

    // Barra de avance: mismo criterio que las tarjetas del panel
    const avance = campo('avance');
    avance.className = 'progress-bar ' + ServicioDomicilios.AVANCE_ESTADO[pedido.estado] +
        (pedido.estado === 'cancelado' ? ' bg-danger' : '');
    campo('pasos').querySelectorAll('[data-paso]').forEach(function (paso) {
        paso.classList.toggle('fw-semibold', paso.dataset.paso === pedido.estado);
        paso.classList.toggle('text-body', paso.dataset.paso === pedido.estado);
    });

    campo('cliente').textContent = cliente.nombre + ' · ' + pedido.telefonoContacto;
    campo('direccion').textContent = pedido.direccionEntrega + ' · ' + pedido.barrio;
    campo('pago').textContent = metodo.nombre + ' · ' + ServicioDomicilios.formatearPrecio(pedido.total);
    campo('domiciliario').textContent = domiciliario ? domiciliario.nombre : 'Sin asignar';
    campo('fechaAsignacion').textContent = pedido.fechaAsignacion ? ServicioDomicilios.formatearFecha(pedido.fechaAsignacion) : '—';
    campo('fechaEntrega').textContent = pedido.fechaEntrega ? ServicioDomicilios.formatearFecha(pedido.fechaEntrega) : '—';
    campo('observacion').textContent = pedido.observacion || 'Sin observaciones';
    campo('total').textContent = ServicioDomicilios.formatearPrecio(pedido.total);

    const cuerpoProductos = document.getElementById('cuerpoProductos');
    cuerpoProductos.replaceChildren();
    pedido.items.forEach(function (item) {
        cuerpoProductos.appendChild(llenarFila('plantillaProducto', {
            nombre: RepositorioDomicilios.obtenerProductoPorCodigo(item.codigo).nombre,
            precio: ServicioDomicilios.formatearPrecio(item.precio),
            cantidad: item.cantidad,
            subtotal: ServicioDomicilios.formatearPrecio(item.precio * item.cantidad)
        }));
    });

    // Historial (wireframe 24.5): del más antiguo al más reciente, como una línea de tiempo
    const cuerpoHistorial = document.getElementById('cuerpoHistorial');
    cuerpoHistorial.replaceChildren();
    (pedido.historial || []).forEach(function (cambio) {
        cuerpoHistorial.appendChild(llenarFila('plantillaHistorial', {
            fecha: ServicioDomicilios.formatearFecha(cambio.fecha),
            anterior: cambio.estadoAnterior ? texto[cambio.estadoAnterior] : '—',
            nuevo: texto[cambio.estadoNuevo],
            usuario: cambio.usuario,
            detalle: cambio.detalle || '—'
        }));
    });

    // Opciones del select: SOLO lo que permite la máquina de estados para el administrador.
    // "Asignado" no se ofrece aquí porque requiere elegir domiciliario (botón Asignar del panel).
    selectEstado.querySelectorAll('option[value]:not([value=""])').forEach(function (o) { o.remove(); });
    EstadosPedido.siguientes(pedido.estado, USUARIO_ACTUAL.rol)
        .filter(function (estado) { return estado !== 'asignado'; })
        .forEach(function (estado) {
            selectEstado.appendChild(new Option(texto[estado], estado));
        });
    selectEstado.value = '';

    // HU06: entregado o cancelado ya no se modifica: se oculta el formulario
    const terminado = EstadosPedido.esFinal(pedido.estado);
    form.classList.toggle('d-none', terminado);
    document.getElementById('pedidoTerminado').classList.toggle('d-none', !terminado);
}

// El motivo aparece (y se vuelve obligatorio) solo al elegir "Cancelado"
selectEstado.addEventListener('change', function () {
    const cancelar = selectEstado.value === 'cancelado';
    grupoMotivo.classList.toggle('d-none', !cancelar);
    campoMotivo.required = cancelar;
});

form.addEventListener('submit', function (evento) {
    evento.preventDefault();
    cambioExito.classList.add('d-none');
    const valido = form.checkValidity();
    form.classList.add('was-validated');
    if (!valido) return;

    const resultado = ServicioDomicilios.cambiarEstado(idPedido, selectEstado.value, USUARIO_ACTUAL,
        campoObservacion.value, campoMotivo.value);

    cambioExito.classList.toggle('alert-success', resultado.ok);
    cambioExito.classList.toggle('alert-danger', !resultado.ok);
    cambioExito.textContent = resultado.ok ? resultado.mensaje : resultado.error;
    cambioExito.classList.remove('d-none');
    if (!resultado.ok) return;

    form.reset();
    form.classList.remove('was-validated');
    grupoMotivo.classList.add('d-none');
    campoMotivo.required = false;
    mostrarPedido(resultado.pedido);
});

const pedido = RepositorioDomicilios.obtenerPedidoPorId(idPedido);
if (!pedido) {
    document.getElementById('contenidoPedido').classList.add('d-none');
    document.getElementById('pedidoNoEncontrado').classList.remove('d-none');
} else {
    mostrarPedido(pedido);
}
