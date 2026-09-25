// Simulador del ChatBot (CS-38 – MOD_04_HU07 / CU042).
// Muestra lo que recibe un cliente en su chat y responde cuando escribe un número de pedido.
// La respuesta sale de NotificacionesDomicilios.responderConsulta: la MISMA función que
// usará el ChatBot real en el servidor; aquí solo cambia dónde se muestra.

const selectTelefono = document.getElementById('telefonoCliente');
const conversacion = document.getElementById('conversacion');
const formMensaje = document.getElementById('formMensaje');
const campoMensaje = document.getElementById('mensaje');

// Lo que el cliente escribe en esta sesión (no se guarda: es solo la charla del simulador)
let charla = [];

RepositorioDomicilios.obtenerClientes().forEach(function (cliente) {
    selectTelefono.appendChild(new Option(cliente.nombre + ' · ' + cliente.telefono, cliente.telefono));
});

function agregarBurbuja(quien, texto, meta, conError) {
    const burbuja = document.getElementById('plantillaBurbuja').content.cloneNode(true).querySelector('div');
    burbuja.classList.add(quien === 'bot' ? 'burbuja-bot' : 'burbuja-cliente');
    burbuja.classList.toggle('burbuja-error', Boolean(conError));
    burbuja.querySelector('[data-campo="texto"]').textContent = texto;
    burbuja.querySelector('[data-campo="meta"]').textContent = meta || '';
    conversacion.appendChild(burbuja);
}

function dibujarConversacion() {
    conversacion.replaceChildren();
    const telefono = selectTelefono.value;
    const recibidos = NotificacionesDomicilios.mensajesDe(telefono);

    if (recibidos.length === 0 && charla.length === 0) {
        agregarBurbuja('bot', 'Bienvenido a Control Store. Escribe el número de tu pedido para consultar su estado.');
    }
    // Notificaciones automáticas que el sistema le envió a este teléfono (HU07)
    recibidos.forEach(function (n) {
        agregarBurbuja('bot', n.ok ? n.mensaje : '(Mensaje no entregado) ' + n.mensaje,
            ServicioDomicilios.formatearFecha(n.fecha), !n.ok);
    });
    // Preguntas del cliente y respuestas del bot en esta sesión
    charla.forEach(function (linea) {
        agregarBurbuja(linea.quien, linea.texto);
    });
    // Como en un chat real: siempre se ve el último mensaje
    conversacion.scrollTop = conversacion.scrollHeight;
}

selectTelefono.addEventListener('change', function () {
    charla = [];
    dibujarConversacion();
});

formMensaje.addEventListener('submit', function (evento) {
    evento.preventDefault();
    const texto = campoMensaje.value.trim();
    if (!texto) return;
    charla.push({ quien: 'cliente', texto: texto });
    charla.push({ quien: 'bot', texto: NotificacionesDomicilios.responderConsulta(texto, selectTelefono.value) });
    campoMensaje.value = '';
    dibujarConversacion();
});

dibujarConversacion();
