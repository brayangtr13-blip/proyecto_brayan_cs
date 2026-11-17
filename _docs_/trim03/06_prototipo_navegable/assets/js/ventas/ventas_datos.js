// Módulo 3 – Ventas y Caja · Patrón REPOSITORY
// Único acceso a los datos del módulo. Hoy: localStorage. Con Django: fetch a la API.
// Depende de: inventario/inventario_datos.js (los productos son de Inventario)
//             usuarios/usuarios_datos.js (los cajeros son de Usuarios)
//             catalogos/catalogos_datos.js (métodos de pago y clientes)
//             auditoria/auditoria_datos.js (log_auditoria, compartido por todos los módulos)

// Falla rápido si el HTML no cargó antes las dependencias (orden de <script>)
if (typeof RepositorioInventario === 'undefined') throw new Error('ventas_datos.js: falta cargar antes inventario/inventario_datos.js');
if (typeof RepositorioUsuarios === 'undefined') throw new Error('ventas_datos.js: falta cargar antes usuarios/usuarios_datos.js');
if (typeof RepositorioCatalogos === 'undefined') throw new Error('ventas_datos.js: falta cargar antes catalogos/catalogos_datos.js');
if (typeof RepositorioAuditoria === 'undefined') throw new Error('ventas_datos.js: falta cargar antes auditoria/auditoria_datos.js');

const RepositorioVentas = (function () {
    const CLAVE = 'controlstore_ventas_v1';

    // Datos del volcado de controlstore_sena: el turno #2 (arqueo_caja)
    // y las ventas #2, #3 y #4 con su detalle_venta.
    // Los usuarios, los métodos de pago y los clientes no se copian aquí:
    // se piden a RepositorioUsuarios y a RepositorioCatalogos (una sola fuente).
    function datosDeEjemplo() {
        return {
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
            movimientos: []    // movimientos_inventario (log_auditoria vive en RepositorioAuditoria)
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
        // Una venta o una anulación cambia stock: se guarda junto con la venta
        RepositorioInventario.guardarCambios();
    }

    function siguienteId(lista) {
        return lista.reduce(function (max, x) { return Math.max(max, x.id); }, 0) + 1;
    }

    // Ventas solo necesita id y nombre del cajero: { idUsuario, nombre } (la forma que ya usan las pantallas)
    function comoCajero(usuario) {
        return { idUsuario: usuario.idUsuario, nombre: usuario.nombres + ' ' + usuario.apellidos };
    }

    // RF14: venden el administrador (rol 1) y los cajeros (rol 2)
    function puedeVender(usuario) {
        return usuario.idRol === 1 || usuario.idRol === 2;
    }

    return {
        // Los productos no se copian aquí: se piden al Repository de Inventario
        obtenerProductos: function () { return RepositorioInventario.obtenerProductos(); },
        obtenerProducto: function (codigo) { return RepositorioInventario.obtenerProducto(codigo); },
        // Los métodos de pago y los clientes son catálogos compartidos con Domicilios
        obtenerMetodosPago: function () { return RepositorioCatalogos.obtenerMetodosPago(); },
        obtenerMetodoPago: function (id) { return RepositorioCatalogos.obtenerMetodoPago(id); },
        obtenerCliente: function (id) { return RepositorioCatalogos.obtenerCliente(id); },
        // Los usuarios tampoco se copian: se piden al Repository de Usuarios (una sola fuente)
        obtenerUsuarios: function () {
            return RepositorioUsuarios.obtenerUsuarios().filter(puedeVender).map(comoCajero);
        },
        obtenerUsuario: function (id) {
            const usuario = RepositorioUsuarios.obtenerUsuario(id);
            return usuario ? comoCajero(usuario) : undefined;
        },
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
        // INSERT INTO movimientos_inventario (entradas al anular)
        agregarMovimientos: function (lista) {
            lista.forEach(function (m) { leer().movimientos.push(m); });
        },
        // El log es uno solo para todo el sistema: Ventas escribe y lee sus eventos (módulo 3).
        // Anular y cerrar caja cambian la venta o el turno justo antes de auditar: por eso aquí
        // también se guardan los datos de Ventas (el cambio y su registro quedan juntos).
        registrarAuditoria: function (evento) {
            const registro = Object.assign({ idModulo: RepositorioAuditoria.MODULO.VENTAS }, evento);
            delete registro.modulo;
            guardar();
            return RepositorioAuditoria.registrar(registro);
        },
        obtenerAuditoria: function () {
            return RepositorioAuditoria.obtenerEventos().filter(function (e) {
                return e.idModulo === RepositorioAuditoria.MODULO.VENTAS;
            });
        },
        guardarCambios: function () { guardar(); },
        restablecer: function () { enMemoria = datosDeEjemplo(); guardar(); }
    };
})();
