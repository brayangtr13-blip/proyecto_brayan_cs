// Módulo 3 – Ventas y Caja · Patrón REPOSITORY
// Único acceso a los datos del módulo. Hoy: localStorage. Con Django: fetch a la API.

const RepositorioVentas = (function () {
    const CLAVE = 'controlstore_ventas_v1';

    // Datos del volcado de controlstore_sena: productos, métodos de pago, usuarios,
    // el turno #2 (arqueo_caja) y las ventas #2, #3 y #4 con su detalle_venta.
    function datosDeEjemplo() {
        return {
            productos: [
                { codigo: '7702001001', nombre: 'Leche Entera 1L', precio: 2850, stock: 15, activo: true },
                { codigo: '7702001002', nombre: 'Arroz Blanco 5kg', precio: 12500, stock: 15, activo: true },
                { codigo: '7702001003', nombre: 'Café Molido 250g', precio: 9900, stock: 5, activo: true },
                { codigo: '7702001004', nombre: 'Azúcar Blanca 2kg', precio: 5800, stock: 0, activo: true },
                { codigo: '7702001005', nombre: 'Pan Tajado', precio: 3000, stock: 34, activo: true }
            ],
            metodosPago: [
                { id: 1, nombre: 'Efectivo' },
                { id: 2, nombre: 'Nequi' },
                { id: 3, nombre: 'Transferencia' },
                { id: 4, nombre: 'Tarjeta' }
            ],
            usuarios: [
                { idUsuario: 1, nombre: 'Andrés Gómez' },
                { idUsuario: 2, nombre: 'Juan Carlos Pérez' }
            ],
            arqueos: [
                {
                    id: 2, idUsuario: 2, fechaApertura: '2026-09-23T08:40:30', fechaCierre: '2026-09-23T11:40:30',
                    montoInicial: 20000, montoFinal: 49750, totalVentas: 62050, totalEfectivo: 29750,
                    observacion: 'Turno de la tarde, sin novedades'
                }
            ],
            ventas: [
                { id: 2, idUsuario: 2, idArqueo: 2, idCliente: null, idMetodoPago: 1, fecha: '2026-09-23T09:40:30', total: 8700, estado: 'pagada',
                  detalle: [{ codigo: '7702001001', cantidad: 2, precio: 2850 }, { codigo: '7702001005', cantidad: 1, precio: 3000 }] },
                { id: 3, idUsuario: 2, idArqueo: 2, idCliente: 1, idMetodoPago: 2, fecha: '2026-09-23T10:10:30', total: 32300, estado: 'pagada',
                  detalle: [{ codigo: '7702001002', cantidad: 1, precio: 12500 }, { codigo: '7702001003', cantidad: 2, precio: 9900 }] },
                { id: 4, idUsuario: 2, idArqueo: 2, idCliente: 2, idMetodoPago: 1, fecha: '2026-09-23T11:10:30', total: 21050, estado: 'pagada',
                  detalle: [{ codigo: '7702001001', cantidad: 3, precio: 2850 }, { codigo: '7702001002', cantidad: 1, precio: 12500 }] }
            ],
            movimientos: [],   // movimientos_inventario
            auditoria: []      // log_auditoria
        };
    }

    let enMemoria = null;

    function leer() {
        if (enMemoria) return enMemoria;
        try {
            const guardado = localStorage.getItem(CLAVE);
            enMemoria = guardado ? JSON.parse(guardado) : datosDeEjemplo();
        } catch (e) {
            enMemoria = datosDeEjemplo();
        }
        return enMemoria;
    }

    function guardar() {
        try { localStorage.setItem(CLAVE, JSON.stringify(enMemoria)); } catch (e) { /* solo en memoria */ }
    }

    function siguienteId(lista) {
        return lista.reduce(function (max, x) { return Math.max(max, x.id); }, 0) + 1;
    }

    return {
        obtenerProductos: function () { return leer().productos; },
        obtenerProducto: function (codigo) { return leer().productos.find(function (p) { return p.codigo === codigo; }); },
        obtenerMetodosPago: function () { return leer().metodosPago; },
        obtenerMetodoPago: function (id) { return leer().metodosPago.find(function (m) { return m.id === id; }); },
        obtenerUsuarios: function () { return leer().usuarios; },
        obtenerUsuario: function (id) { return leer().usuarios.find(function (u) { return u.idUsuario === id; }); },
        obtenerVentas: function () { return leer().ventas; },
        obtenerVenta: function (id) { return leer().ventas.find(function (v) { return v.id === id; }); },
        obtenerArqueos: function () { return leer().arqueos; },

        // Turno abierto = arqueo sin fecha_cierre
        obtenerTurnoAbierto: function (idUsuario) {
            return leer().arqueos.find(function (a) { return a.idUsuario === idUsuario && !a.fechaCierre; });
        },
        // INSERT INTO arqueo_caja
        agregarArqueo: function (arqueo) {
            const datos = leer();
            arqueo.id = siguienteId(datos.arqueos);
            datos.arqueos.push(arqueo);
            guardar();
            return arqueo;
        },
        // INSERT INTO ventas + detalle_venta, UPDATE de stock y movimientos, en un solo guardado:
        // o se guarda todo o nada (el Service valida antes de llamar)
        guardarVenta: function (venta, movimientos) {
            const datos = leer();
            venta.id = siguienteId(datos.ventas);
            datos.ventas.push(venta);
            movimientos.forEach(function (m) { datos.movimientos.push(m); });
            guardar();
            return venta;
        },
        registrarAuditoria: function (evento) {
            leer().auditoria.push(evento);
            guardar();
        },
        obtenerAuditoria: function () { return leer().auditoria; },
        guardarCambios: function () { guardar(); },
        restablecer: function () { enMemoria = datosDeEjemplo(); guardar(); }
    };
})();
