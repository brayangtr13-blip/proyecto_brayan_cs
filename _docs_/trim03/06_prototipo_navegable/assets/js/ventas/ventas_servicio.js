// Módulo 3 – Ventas y Caja · Patrón SERVICE
// Reglas de negocio del módulo. Las pantallas no las repiten: llaman a ServicioVentas.*
// Depende de: ventas_datos.js

const ServicioVentas = (function () {

    function formatearPrecio(valor) {
        return '$' + Math.round(valor).toLocaleString('es-CO');
    }

    function formatearFecha(texto) {
        const f = new Date(texto);
        return f.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
            f.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    // Sin tildes y en minúscula: "cafe" encuentra "Café"
    function normalizar(texto) {
        return texto.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
    }

    // Código exacto (lector de barras), "código · nombre" (datalist) o parte del nombre
    function buscarProducto(texto) {
        const valor = texto.trim();
        if (!valor) return undefined;
        const porCodigo = RepositorioVentas.obtenerProducto(valor.split('·')[0].trim());
        if (porCodigo) return porCodigo;
        return RepositorioVentas.obtenerProductos().find(function (p) {
            return normalizar(p.nombre).includes(normalizar(valor));
        });
    }

    // HU01: sin inactivos, sin stock 0 y sin superar el stock. Devuelve null o el mensaje.
    function validarCantidad(producto, cantidad) {
        if (!producto.activo) return producto.nombre + ' está inactivo.';
        if (producto.stock === 0) return producto.nombre + ' no tiene stock.';
        if (cantidad > producto.stock) return 'Stock insuficiente, solo hay ' + producto.stock + ' unidades';
        return null;
    }

    // Sin columna de IVA en la BD: total = suma de subtotales (precios con IVA incluido)
    function calcularTotal(items) {
        return items.reduce(function (suma, i) { return suma + i.cantidad * i.precio; }, 0);
    }

    // HU01: cambio solo para efectivo; null si lo recibido no alcanza
    function calcularCambio(total, recibido) {
        return recibido >= total ? recibido - total : null;
    }

    // HU05 (primer criterio): abrir turno con su base
    function abrirCaja(usuario, montoInicial) {
        if (RepositorioVentas.obtenerTurnoAbierto(usuario.idUsuario)) {
            return { ok: false, error: 'Ya tienes un turno abierto.' };
        }
        if (!(montoInicial >= 0)) {
            return { ok: false, error: 'Escribe una base válida.' };
        }
        const arqueo = RepositorioVentas.agregarArqueo({
            idUsuario: usuario.idUsuario, fechaApertura: new Date().toISOString(), fechaCierre: null,
            montoInicial: montoInicial, montoFinal: null, totalVentas: null, totalEfectivo: null, observacion: null
        });
        return { ok: true, arqueo: arqueo };
    }

    // HU01: registrar la venta. Primero se valida TODO y solo después se modifica algo:
    // así nunca queda una venta a medias ni stock descontado sin venta (en Django: transacción + rollback).
    function registrarVenta(usuario, items, idMetodoPago, recibido) {
        const turno = RepositorioVentas.obtenerTurnoAbierto(usuario.idUsuario);
        if (!turno) return { ok: false, error: 'Abre la caja antes de vender.' };
        if (items.length === 0) return { ok: false, error: 'Agrega al menos un producto.' };

        for (const item of items) {
            const error = validarCantidad(RepositorioVentas.obtenerProducto(item.codigo), item.cantidad);
            if (error) return { ok: false, error: error };
        }
        const total = calcularTotal(items);
        if (idMetodoPago === 1 && calcularCambio(total, recibido) === null) {
            return { ok: false, error: 'El valor recibido no alcanza para el total.' };
        }

        // Validado: descontar stock y dejar el movimiento de salida de cada producto
        const fecha = new Date().toISOString();
        const movimientos = items.map(function (item) {
            RepositorioVentas.obtenerProducto(item.codigo).stock -= item.cantidad;
            return { codigoProducto: item.codigo, idUsuario: usuario.idUsuario, tipo: 'salida', cantidad: item.cantidad, fecha: fecha };
        });
        const venta = RepositorioVentas.guardarVenta({
            idUsuario: usuario.idUsuario, idArqueo: turno.id, idCliente: null, idMetodoPago: idMetodoPago,
            fecha: fecha, total: total, estado: 'pagada',
            detalle: items.map(function (i) { return { codigo: i.codigo, cantidad: i.cantidad, precio: i.precio }; })
        }, movimientos);
        movimientos.forEach(function (m) { m.observacion = 'Venta #' + venta.id; });
        RepositorioVentas.registrarAuditoria({
            idUsuario: usuario.idUsuario, accion: 'registrar', modulo: 'ventas',
            detalle: 'Registró la venta #' + venta.id + ' por ' + formatearPrecio(total), fecha: fecha
        });

        return {
            ok: true, venta: venta,
            cambio: idMetodoPago === 1 ? calcularCambio(total, recibido) : null
        };
    }

    // Fecha local AAAA-MM-DD (la de los <input type="date">)
    function fechaLocal(texto) {
        const f = new Date(texto);
        return f.getFullYear() + '-' + String(f.getMonth() + 1).padStart(2, '0') + '-' + String(f.getDate()).padStart(2, '0');
    }

    // HU02: filtros + rol. El cajero solo ve sus ventas; el administrador ve todas.
    // Con número de factura se busca en todas las fechas.
    function filtrarVentas(usuario, filtros) {
        return RepositorioVentas.obtenerVentas().filter(function (v) {
            if (usuario.rol !== 'administrador' && v.idUsuario !== usuario.idUsuario) return false;
            if (filtros.factura) return v.id === filtros.factura;
            const dia = fechaLocal(v.fecha);
            if (filtros.desde && dia < filtros.desde) return false;
            if (filtros.hasta && dia > filtros.hasta) return false;
            if (filtros.idCajero && v.idUsuario !== filtros.idCajero) return false;
            if (filtros.idMetodo && v.idMetodoPago !== filtros.idMetodo) return false;
            return true;
        }).sort(function (a, b) { return new Date(b.fecha) - new Date(a.fecha); });
    }

    // HU04: las anuladas no suman en reportes ni en el cierre
    function totalSinAnuladas(ventas) {
        return ventas.reduce(function (suma, v) { return v.estado === 'anulada' ? suma : suma + v.total; }, 0);
    }

    // HU03: una venta por número. El cajero solo consulta las suyas (misma regla que HU02).
    function consultarVenta(usuario, id) {
        const venta = RepositorioVentas.obtenerVenta(id);
        if (!venta || (usuario.rol !== 'administrador' && venta.idUsuario !== usuario.idUsuario)) {
            return { ok: false, error: 'Venta no encontrada' };
        }
        return { ok: true, venta: venta };
    }

    // HU03: fecha, usuario y motivo de la anulación, guardados en log_auditoria (CS-21 los registra)
    function datosAnulacion(idVenta) {
        return RepositorioVentas.obtenerAuditoria().filter(function (e) {
            return e.accion === 'anular' && e.idVenta === idVenta;
        }).pop();
    }

    return {
        consultarVenta: consultarVenta,
        datosAnulacion: datosAnulacion,
        fechaLocal: fechaLocal,
        filtrarVentas: filtrarVentas,
        totalSinAnuladas: totalSinAnuladas,
        formatearPrecio: formatearPrecio,
        formatearFecha: formatearFecha,
        buscarProducto: buscarProducto,
        validarCantidad: validarCantidad,
        calcularTotal: calcularTotal,
        calcularCambio: calcularCambio,
        abrirCaja: abrirCaja,
        registrarVenta: registrarVenta
    };
})();
