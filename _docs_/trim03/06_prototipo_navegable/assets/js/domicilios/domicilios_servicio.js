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
// Depende de: domicilios_datos.js (debe cargarse antes en el HTML).
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
        return { ok: true, pedido: pedido };
    }

    return {
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
