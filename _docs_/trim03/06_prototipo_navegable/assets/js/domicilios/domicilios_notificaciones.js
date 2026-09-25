// ==========================================================
// Módulo 4 – Domicilios · Notificaciones (CS-38 – MOD_04_HU07 / CU042, y CU039)
//
// Es un OYENTE más del evento "estadoCambiado" (patrón Observer): ninguna pantalla
// llama a este archivo. Cuando el Service publica un cambio de estado, aquí se arma
// el mensaje con la plantilla del estado y se envía por el canal activo (patrón Adapter).
//
// Depende de (cargar antes): domicilios_datos.js, domicilios_estados.js,
// domicilios_eventos.js, domicilios_servicio.js y canales_notificacion.js.
// ==========================================================

const NotificacionesDomicilios = (function () {
    const MAX_INTENTOS = 3;   // HU07: "reintentar hasta 3 veces"

    // Plantillas de mensaje por estado (HU07: claras y con el nombre del cliente y el número de pedido)
    const PLANTILLAS = {
        // HU07: "Al pasar a Asignado: informar que el pedido está siendo preparado"
        asignado: function (d) {
            return 'Hola ' + d.cliente + ', tu pedido #' + d.id + ' está siendo preparado. Te avisaremos cuando salga.';
        },
        // HU07: "Al pasar a En camino: informar que el domiciliario salió, con su nombre y el tiempo estimado"
        en_camino: function (d) {
            return 'Hola ' + d.cliente + ', tu pedido #' + d.id + ' ya salió con ' + d.domiciliario +
                '. Llegará en unos ' + d.minutos + ' minutos.';
        },
        // HU07: "Al pasar a Entregado: agradecer la compra y recordar el total pagado"
        entregado: function (d) {
            return '¡Gracias por tu compra, ' + d.cliente + '! Tu pedido #' + d.id + ' fue entregado. Total pagado: ' + d.total + '.';
        },
        // HU07: "Al pasar a Cancelado: informar la cancelación y el motivo"
        cancelado: function (d) {
            return 'Hola ' + d.cliente + ', tu pedido #' + d.id + ' fue cancelado. Motivo: ' + d.motivo + '.';
        }
    };

    // Tiempo estimado de llegada: el promedio real de entregas; si aún no hay, 30 minutos
    function minutosEstimados() {
        const promedio = ServicioDomicilios.tiempoPromedioEntrega();
        return promedio === null ? 30 : promedio;
    }

    // HU07: si el envío falla, se reintenta hasta 3 veces
    function enviarConReintentos(telefono, mensaje) {
        let intentos = 0;
        let resultado;
        do {
            intentos += 1;
            resultado = CANAL_ACTIVO.enviar(telefono, mensaje);
        } while (!resultado.ok && intentos < MAX_INTENTOS);
        return { ok: resultado.ok, error: resultado.error, intentos: intentos };
    }

    // Identifica un cambio de estado con la fecha exacta de su registro en el historial.
    // Si el evento no trae el registro (por ejemplo, publicado a mano), se busca el último
    // registro con esa misma transición. No se usa la posición en el historial porque los
    // registros de error que se agregan después la cambiarían.
    function claveDelCambio(evento) {
        let cambio = evento.cambio;
        if (!cambio) {
            cambio = (evento.pedido.historial || []).filter(function (h) {
                return h.estadoAnterior === evento.estadoAnterior && h.estadoNuevo === evento.estadoNuevo;
            }).pop();
        }
        return evento.pedido.id + '-' + evento.estadoNuevo + '-' + (cambio ? cambio.fecha : '');
    }

    // ---------- Oyente: cliente ----------
    EventosDomicilios.suscribir('estadoCambiado', function (evento) {
        const pedido = evento.pedido;
        // HU07 notifica cuando el pedido CAMBIA de estado; una reasignación (asignado -> asignado)
        // no es un cambio de estado para el cliente
        if (evento.estadoAnterior === evento.estadoNuevo || !PLANTILLAS[evento.estadoNuevo]) {
            return;
        }
        // HU07: "No se deben enviar notificaciones duplicadas por un mismo cambio de estado":
        // si ya existe una notificación con la clave de este cambio, no se envía otra.
        const clave = claveDelCambio(evento);
        pedido.notificaciones = pedido.notificaciones || [];
        if (pedido.notificaciones.some(function (n) { return n.clave === clave; })) {
            return;
        }

        const cliente = RepositorioDomicilios.obtenerClientePorId(pedido.idCliente);
        const domiciliario = RepositorioDomicilios.obtenerDomiciliarioPorId(pedido.idDomiciliario);
        const mensaje = PLANTILLAS[evento.estadoNuevo]({
            id: pedido.id,
            cliente: cliente.nombre,
            domiciliario: domiciliario ? domiciliario.nombre : 'nuestro domiciliario',
            minutos: minutosEstimados(),
            total: ServicioDomicilios.formatearPrecio(pedido.total),
            motivo: evento.motivo || 'sin especificar'
        });

        const envio = enviarConReintentos(pedido.telefonoContacto, mensaje);
        const notificacion = {
            clave: clave,
            fecha: new Date().toISOString(),
            estado: evento.estadoNuevo,
            telefono: pedido.telefonoContacto,
            mensaje: mensaje,
            canal: CANAL_ACTIVO.nombre,
            intentos: envio.intentos,
            ok: envio.ok,
            error: envio.error || null
        };
        pedido.notificaciones.push(notificacion);

        // HU07: "registrar el error en la bitácora" -> log_auditoria (aquí, el historial del pedido)
        if (!envio.ok) {
            ServicioDomicilios.registrarHistorial(pedido, pedido.estado, pedido.estado, 'Sistema',
                'Error al notificar al cliente después de ' + envio.intentos + ' intentos: ' + envio.error);
        }
        RepositorioDomicilios.actualizarPedido();

        // Otro evento (Observer): las pantallas abiertas muestran el Toast sin conocer este archivo
        EventosDomicilios.publicar('notificacionEnviada', { pedido: pedido, notificacion: notificacion, cliente: cliente.nombre });
    });

    // ---------- Oyente: domiciliario (CU039 "Notificar al domiciliario") ----------
    EventosDomicilios.suscribir('estadoCambiado', function (evento) {
        const pedido = evento.pedido;
        // Al asignar o reasignar, el domiciliario elegido recibe un aviso en la campana de su panel
        const esAsignacion = evento.estadoNuevo === 'asignado' ||
            (evento.estadoAnterior === evento.estadoNuevo && evento.estadoNuevo === 'en_camino');
        if (!esAsignacion || !pedido.idDomiciliario) {
            return;
        }
        RepositorioDomicilios.agregarAvisoDomiciliario({
            idDomiciliario: pedido.idDomiciliario,
            texto: 'Te asignaron el pedido #' + pedido.id + ' · ' + pedido.barrio,
            fecha: new Date().toISOString(),
            leido: false
        });
    });

    // ---------- Respuesta del ChatBot: consulta por número de pedido ----------
    // HU07: "El cliente debe poder consultar el estado de su pedido en cualquier momento
    // escribiendo el número de pedido al chatbot". Solo responde si el pedido es de ese
    // teléfono: nadie puede ver el pedido de otra persona adivinando números.
    function responderConsulta(textoCliente, telefono) {
        const numero = parseInt(textoCliente.replace(/[^0-9]/g, ''), 10);
        if (!numero) {
            return 'Escribe el número de tu pedido (por ejemplo 2) para consultar su estado.';
        }
        const pedido = RepositorioDomicilios.obtenerPedidoPorId(numero);
        if (!pedido || pedido.telefonoContacto !== telefono) {
            return 'No encontré un pedido #' + numero + ' asociado a este número de teléfono.';
        }
        const domiciliario = RepositorioDomicilios.obtenerDomiciliarioPorId(pedido.idDomiciliario);
        return 'Tu pedido #' + pedido.id + ' está: ' + ServicioDomicilios.TEXTO_ESTADO[pedido.estado] + '.' +
            (domiciliario && !EstadosPedido.esFinal(pedido.estado) ? ' Domiciliario: ' + domiciliario.nombre + '.' : '') +
            ' Total: ' + ServicioDomicilios.formatearPrecio(pedido.total) + '.';
    }

    // Todas las notificaciones enviadas a un teléfono, en orden (bandeja del simulador)
    function mensajesDe(telefono) {
        return RepositorioDomicilios.obtenerPedidos()
            .reduce(function (lista, p) { return lista.concat(p.notificaciones || []); }, [])
            .filter(function (n) { return n.telefono === telefono; })
            .sort(function (a, b) { return new Date(a.fecha) - new Date(b.fecha); });
    }

    // Toast de Bootstrap con el resultado del envío, para las pantallas que lo tengan.
    // Docs: https://getbootstrap.com/docs/5.3/components/toasts/#usage
    function mostrarToastEn(elementoToast) {
        EventosDomicilios.suscribir('notificacionEnviada', function (datos) {
            const n = datos.notificacion;
            elementoToast.querySelector('[data-campo="textoToast"]').textContent = n.ok
                ? 'Mensaje enviado a ' + datos.cliente + ' (' + n.canal + '): "' + n.mensaje + '"'
                : 'No se pudo notificar a ' + datos.cliente + ' tras ' + n.intentos + ' intentos. Quedó registrado en el historial.';
            bootstrap.Toast.getOrCreateInstance(elementoToast).show();
        });
    }

    return { responderConsulta: responderConsulta, mensajesDe: mensajesDe, mostrarToastEn: mostrarToastEn };
})();
