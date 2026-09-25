// ==========================================================
// Módulo 4 – Domicilios · Patrón SERVICE (Facade)
//
// Aquí viven las REGLAS del negocio de domicilios: calcular totales, validar
// stock, armar y registrar un pedido. Las pantallas no repiten estas reglas:
// solo llaman a ServicioDomicilios.*
//
// Es la pieza pensada para el ChatBot: el panel y el bot (WhatsApp o Telegram)
// son dos "puertas" al mismo sistema, y ambas deben usar las mismas reglas.
// En el backend esta lógica vivirá en el servidor y la llamarán los dos.
//
// Depende de (cargar antes en el HTML): domicilios_datos.js, domicilios_estados.js
// y domicilios_eventos.js.
// ==========================================================

const ServicioDomicilios = (function () {

    // Texto visible de cada valor del ENUM domicilios.estado
    const TEXTO_ESTADO = {
        pendiente: 'Pendiente',
        asignado: 'Asignado',
        en_camino: 'En camino',
        entregado: 'Entregado',
        cancelado: 'Cancelado'
    };

    // Avance de la barra de progreso: 4 pasos = los anchos w-25 / w-50 / w-75 / w-100 de Bootstrap
    const AVANCE_ESTADO = {
        pendiente: 'w-25',
        asignado: 'w-50',
        en_camino: 'w-75',
        entregado: 'w-100',
        cancelado: 'w-100'
    };

    function formatearPrecio(valor) {
        return '$' + valor.toLocaleString('es-CO');
    }

    function formatearFecha(textoFecha) {
        const fecha = new Date(textoFecha);
        return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
            ' ' + fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    // HU06: "se debe mostrar el tiempo transcurrido desde que se recibió el pedido"
    function tiempoTranscurrido(textoFecha) {
        const minutos = Math.floor((Date.now() - new Date(textoFecha).getTime()) / 60000);
        if (minutos < 1) return 'hace un momento';
        if (minutos < 60) return 'hace ' + minutos + ' min';
        const horas = Math.floor(minutos / 60);
        if (horas < 24) return 'hace ' + horas + (horas === 1 ? ' hora' : ' horas');
        const dias = Math.floor(horas / 24);
        return 'hace ' + dias + (dias === 1 ? ' día' : ' días');
    }

    // Quita tildes para comparar ("cafe" encuentra "Café"); mismo criterio que Inventario
    function normalizar(texto) {
        return texto.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
    }

    // Busca un producto por código exacto, por "código · nombre" (lo que devuelve el datalist)
    // o por coincidencia de nombre
    function buscarProducto(texto) {
        const valor = texto.trim();
        if (valor === '') return undefined;
        const codigo = valor.split('·')[0].trim();
        const porCodigo = RepositorioDomicilios.obtenerProductoPorCodigo(codigo);
        if (porCodigo) return porCodigo;
        return RepositorioDomicilios.obtenerProductos().find(function (p) {
            return normalizar(p.nombre).includes(normalizar(valor));
        });
    }

    // HU04: "el sistema debe validar el stock disponible de cada producto agregado".
    // Devuelve null si se puede, o el mensaje de error si no.
    function validarStock(producto, cantidadTotal) {
        if (producto.stock === 0) {
            return producto.nombre + ' está agotado.';
        }
        if (cantidadTotal > producto.stock) {
            return 'Solo hay ' + producto.stock + ' unidades de ' + producto.nombre + '.';
        }
        return null;
    }

    // HU04: subtotal por renglón y total del pedido (detalle_venta.subtotal = cantidad x precio)
    function calcularTotales(items) {
        return items.reduce(function (acumulado, item) {
            acumulado.unidades += item.cantidad;
            acumulado.total += item.cantidad * item.precio;
            return acumulado;
        }, { unidades: 0, total: 0 });
    }

    // Registra el pedido completo. Recibe los datos del formulario (o, en el futuro, del bot)
    // y devuelve { ok, pedido } o { ok: false, error }.
    function registrarPedido(datos) {
        if (datos.items.length === 0) {
            return { ok: false, error: 'Agrega al menos un producto al pedido.' };
        }
        for (const item of datos.items) {
            const error = validarStock(RepositorioDomicilios.obtenerProductoPorCodigo(item.codigo), item.cantidad);
            if (error) return { ok: false, error: error };
        }

        // Cliente existente (buscado por teléfono) o cliente nuevo -> INSERT INTO clientes
        let cliente = RepositorioDomicilios.buscarClientePorTelefono(datos.cliente.telefono);
        if (!cliente) {
            cliente = RepositorioDomicilios.agregarCliente(datos.cliente);
        }

        const pedido = RepositorioDomicilios.agregarPedido({
            idCliente: cliente.id,
            idMetodoPago: datos.idMetodoPago,
            fechaVenta: new Date().toISOString(),
            items: datos.items,
            total: calcularTotales(datos.items).total,
            direccionEntrega: datos.direccionEntrega,
            barrio: datos.barrio,
            telefonoContacto: datos.telefonoContacto,
            // CU041 / wireframe 22.2: todo pedido nuevo arranca en "pendiente" (DEFAULT de la columna)
            estado: 'pendiente',
            idDomiciliario: null,
            fechaAsignacion: null,
            fechaEntrega: null,
            observacion: datos.observacion
        });
        // Primera entrada del histórico: el pedido nace en "pendiente"
        registrarHistorial(pedido, null, 'pendiente', 'Administrador', 'Pedido registrado por teléfono');
        RepositorioDomicilios.actualizarPedido();
        return { ok: true, pedido: pedido };
    }

    // Promedio de minutos entre fecha_asignacion y fecha_entrega de los pedidos entregados.
    // Lo usan el indicador del panel y el mensaje "llegará en unos X minutos" (HU07).
    // Devuelve null si todavía no hay entregas para promediar.
    function tiempoPromedioEntrega() {
        const entregados = RepositorioDomicilios.obtenerPedidos().filter(function (p) {
            return p.fechaAsignacion && p.fechaEntrega;
        });
        if (entregados.length === 0) return null;
        const totalMinutos = entregados.reduce(function (suma, p) {
            return suma + (new Date(p.fechaEntrega) - new Date(p.fechaAsignacion)) / 60000;
        }, 0);
        return Math.round(totalMinutos / entregados.length);
    }

    // ---------------- Asignación (CS-36 – MOD_04_HU05 / CU038) ----------------

    // Un pedido entregado o cancelado ya terminó: no se asigna ni se reasigna (HU05)
    function estaTerminado(pedido) {
        return pedido.estado === 'entregado' || pedido.estado === 'cancelado';
    }

    // HU05: "contador de pedidos activos por cada domiciliario para distribuir la carga"
    function cargaDe(idDomiciliario) {
        return RepositorioDomicilios.obtenerPedidos().filter(function (p) {
            return p.idDomiciliario === idDomiciliario && (p.estado === 'asignado' || p.estado === 'en_camino');
        }).length;
    }

    // HU05: "El domiciliario debe ver en su panel únicamente los pedidos asignados a él"
    function pedidosDe(idDomiciliario) {
        return RepositorioDomicilios.obtenerPedidos().filter(function (p) {
            return p.idDomiciliario === idDomiciliario;
        });
    }

    // Histórico del pedido (HU05 y HU06). En la base de datos esto va a log_auditoria
    // (acción, módulo "domicilios", detalle, usuario y fecha), que ya existe.
    // Devuelve el registro creado: viaja dentro del evento "estadoCambiado" y el notificador
    // lo usa para reconocer cada cambio y no notificarlo dos veces (HU07)
    function registrarHistorial(pedido, estadoAnterior, estadoNuevo, usuario, detalle) {
        const cambio = {
            fecha: new Date().toISOString(),
            estadoAnterior: estadoAnterior,
            estadoNuevo: estadoNuevo,
            usuario: usuario,
            detalle: detalle
        };
        pedido.historial = pedido.historial || [];
        pedido.historial.push(cambio);
        return cambio;
    }

    function asignarDomiciliario(idPedido, idDomiciliario, usuario) {
        const pedido = RepositorioDomicilios.obtenerPedidoPorId(idPedido);
        const domiciliario = RepositorioDomicilios.obtenerDomiciliarioPorId(idDomiciliario);

        if (!pedido || estaTerminado(pedido)) {
            return { ok: false, error: 'Este pedido ya terminó y no se puede reasignar.' };
        }
        // HU05: "No se debe poder asignar un pedido a un domiciliario inactivo"
        if (!domiciliario || !domiciliario.activo) {
            return { ok: false, error: 'Solo se puede asignar a un domiciliario activo.' };
        }

        const estadoAnterior = pedido.estado;
        const anterior = RepositorioDomicilios.obtenerDomiciliarioPorId(pedido.idDomiciliario);
        pedido.idDomiciliario = idDomiciliario;
        // HU05: al asignar, "pendiente" pasa automáticamente a "asignado" y se registra la hora.
        // En una reasignación el estado se conserva (un pedido en camino sigue en camino).
        if (pedido.estado === 'pendiente') {
            pedido.estado = 'asignado';
        }
        pedido.fechaAsignacion = new Date().toISOString();
        const cambio = registrarHistorial(pedido, estadoAnterior, pedido.estado, usuario,
            anterior ? 'Reasignado de ' + anterior.nombre + ' a ' + domiciliario.nombre
                : 'Asignado a ' + domiciliario.nombre);
        RepositorioDomicilios.actualizarPedido();
        EventosDomicilios.publicar('estadoCambiado', {
            pedido: pedido, estadoAnterior: estadoAnterior, estadoNuevo: pedido.estado, usuario: usuario, cambio: cambio
        });

        return { ok: true, pedido: pedido, mensaje: 'Pedido asignado a ' + domiciliario.nombre };
    }

    // ---------------- Actualizar estado (CS-37 – MOD_04_HU06 / CU040) ----------------

    // quien = { rol: 'administrador' | 'domiciliario', idUsuario, nombre }
    function cambiarEstado(idPedido, nuevoEstado, quien, observacion, motivo) {
        const pedido = RepositorioDomicilios.obtenerPedidoPorId(idPedido);
        if (!pedido) {
            return { ok: false, error: 'El pedido no existe.' };
        }
        // Las reglas de transición y de rol son de la máquina de estados (patrón State)
        const error = EstadosPedido.validar(pedido, nuevoEstado, quien.rol, quien.idUsuario);
        if (error) {
            return { ok: false, error: error };
        }
        // HU06: "Para cancelar un pedido se debe exigir un motivo obligatorio"
        if (nuevoEstado === 'cancelado' && !(motivo && motivo.trim())) {
            return { ok: false, error: 'Escribe el motivo de la cancelación.' };
        }

        const estadoAnterior = pedido.estado;
        pedido.estado = nuevoEstado;
        if (nuevoEstado === 'entregado') {
            pedido.fechaEntrega = new Date().toISOString();   // domicilios.fecha_entrega
        }
        // HU06: cada cambio guarda estado anterior, nuevo, usuario, fecha y hora.
        // El motivo de cancelación va en el detalle (log_auditoria.detalle), porque la tabla
        // domicilios no tiene una columna para él.
        const detalle = [motivo ? 'Motivo: ' + motivo.trim() : '', observacion ? observacion.trim() : '']
            .filter(Boolean).join(' · ');
        const cambio = registrarHistorial(pedido, estadoAnterior, nuevoEstado, quien.nombre, detalle);
        RepositorioDomicilios.actualizarPedido();

        // Patrón Observer: los interesados (inventario ahora, notificaciones en CS-38) reaccionan solos
        EventosDomicilios.publicar('estadoCambiado', {
            pedido: pedido, estadoAnterior: estadoAnterior, estadoNuevo: nuevoEstado,
            usuario: quien.nombre, motivo: motivo, cambio: cambio
        });

        return { ok: true, pedido: pedido, mensaje: 'Pedido #' + pedido.id + ': ' + TEXTO_ESTADO[nuevoEstado].toLowerCase() + '.' };
    }

    // ---------------- Oyente de inventario (HU06) ----------------
    // "Al pasar el pedido a Entregado se debe descontar automáticamente el stock" y
    // "al cancelar, si el stock ya fue descontado, este debe devolverse".
    // Como un pedido entregado ya no puede cancelarse (estado final), la devolución no
    // debería ocurrir; se deja programada por si esa regla cambia. En el backend esto
    // irá dentro de una transacción junto con el UPDATE del pedido.
    EventosDomicilios.suscribir('estadoCambiado', function (evento) {
        const pedido = evento.pedido;
        const descontar = evento.estadoNuevo === 'entregado' && !pedido.stockDescontado;
        const devolver = evento.estadoNuevo === 'cancelado' && pedido.stockDescontado;
        if (!descontar && !devolver) {
            return;
        }
        pedido.items.forEach(function (item) {
            const producto = RepositorioDomicilios.obtenerProductoPorCodigo(item.codigo);
            producto.stock += descontar ? -item.cantidad : item.cantidad;
            RepositorioDomicilios.registrarMovimientoInventario({
                codigoProducto: item.codigo,
                tipo: descontar ? 'salida' : 'entrada',
                cantidad: item.cantidad,
                usuario: evento.usuario,
                observacion: (descontar ? 'Entrega' : 'Cancelación') + ' del pedido a domicilio #' + pedido.id,
                fecha: new Date().toISOString()
            });
        });
        pedido.stockDescontado = descontar;
        RepositorioDomicilios.actualizarPedido();
    });

    return {
        tiempoPromedioEntrega: tiempoPromedioEntrega,
        cambiarEstado: cambiarEstado,
        estaTerminado: estaTerminado,
        cargaDe: cargaDe,
        pedidosDe: pedidosDe,
        registrarHistorial: registrarHistorial,
        asignarDomiciliario: asignarDomiciliario,
        TEXTO_ESTADO: TEXTO_ESTADO,
        AVANCE_ESTADO: AVANCE_ESTADO,
        formatearPrecio: formatearPrecio,
        formatearFecha: formatearFecha,
        tiempoTranscurrido: tiempoTranscurrido,
        buscarProducto: buscarProducto,
        validarStock: validarStock,
        calcularTotales: calcularTotales,
        registrarPedido: registrarPedido
    };
})();
