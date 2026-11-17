// ==========================================================
// Módulo 4 – Domicilios · Patrón REPOSITORY
//
// Este es el ÚNICO archivo que sabe dónde viven los datos de Domicilios.
// Las pantallas (y el servicio) solo llaman a RepositorioDomicilios.*;
// nunca leen localStorage ni arreglos directamente.
// Los productos NO viven aquí: se piden a RepositorioInventario (inventario_datos.js).
// Los domiciliarios tampoco: son los usuarios con rol domiciliario de RepositorioUsuarios.
// Clientes, barrios y métodos de pago son catálogos compartidos: viven en RepositorioCatalogos.
//
// Hoy los datos se guardan en localStorage del navegador, porque el flujo del
// módulo cruza varias páginas (el admin registra y asigna, el domiciliario
// actualiza el estado) y cada página debe ver lo que hizo la anterior.
// Cuando exista el backend (Django), solo se reescribe este archivo para usar
// fetch('/api/domicilios/...'); las pantallas no cambian.
// ==========================================================

// Falla rápido si el HTML no cargó antes las dependencias (orden de <script>)
if (typeof RepositorioInventario === 'undefined') throw new Error('domicilios_datos.js: falta cargar antes inventario/inventario_datos.js');
if (typeof RepositorioUsuarios === 'undefined') throw new Error('domicilios_datos.js: falta cargar antes usuarios/usuarios_datos.js');
if (typeof RepositorioCatalogos === 'undefined') throw new Error('domicilios_datos.js: falta cargar antes catalogos/catalogos_datos.js');

const RepositorioDomicilios = (function () {
    // v2: los pedidos ahora traen historial y stockDescontado (CS-37).
    // v3: el pedido #3 pasa de Diana Morales (no existe en la BD) a Kevin Mora (usuario 6).
    // v4: clientes y métodos de pago salen a RepositorioCatalogos; el barrio deja de ser texto
    //     y pasa a idBarrio + costoEnvio, como domicilios.id_barrio y domicilios.costo_envio.
    // Cambiar la versión hace que los navegadores con datos viejos arranquen con los de ejemplo.
    const CLAVE = 'controlstore_domicilios_v4';

    // id del rol domiciliario en la tabla roles
    const ROL_DOMICILIARIO = 3;

    // Datos de ejemplo basados en controlstore_sena (MySQL 8.4):
    //  - venta #3 y domicilio #1: registros reales del volcado SQL (clientes en RepositorioCatalogos)
    //  - costoEnvio: la tarifa del barrio el día del pedido (si la tarifa cambia, el pedido viejo no)
    //  - domiciliarios: Luis Perez (usuario 3), Kevin Mora (6) y Yeison Castro (7) de RepositorioUsuarios.
    //    El caso "inactivo" (HU05) se prueba inactivando a uno desde la pantalla de Usuarios.
    function datosDeEjemplo() {
        return {
            // Un pedido = una venta (ventas + detalle_venta) + su domicilio (domicilios).
            // historial = los registros de log_auditoria del módulo domicilios para ese pedido.
            pedidos: [
                {
                    id: 1, idVenta: 3, idCliente: 1, idMetodoPago: 2, fechaVenta: '2026-09-23T10:10:30',
                    items: [{ codigo: '7702001002', cantidad: 1, precio: 12500 }, { codigo: '7702001003', cantidad: 2, precio: 9900 }],
                    total: 32300, direccionEntrega: 'Calle 12 # 4-30', idBarrio: 1, costoEnvio: 2000, telefonoContacto: '3011234567',
                    estado: 'entregado', idDomiciliario: 3,
                    fechaAsignacion: '2026-09-23T10:20:30', fechaEntrega: '2026-09-23T11:00:30',
                    observacion: 'Entregado en porteria',
                    // La venta #3 ya se entregó: su stock ya salió del inventario
                    stockDescontado: true,
                    historial: [
                        { fecha: '2026-09-23T10:10:30', estadoAnterior: null, estadoNuevo: 'pendiente', usuario: 'Administrador', detalle: 'Pedido registrado por teléfono' },
                        { fecha: '2026-09-23T10:20:30', estadoAnterior: 'pendiente', estadoNuevo: 'asignado', usuario: 'Administrador', detalle: 'Asignado a Luis Pérez' },
                        { fecha: '2026-09-23T10:32:00', estadoAnterior: 'asignado', estadoNuevo: 'en_camino', usuario: 'Luis Pérez', detalle: '' },
                        { fecha: '2026-09-23T11:00:30', estadoAnterior: 'en_camino', estadoNuevo: 'entregado', usuario: 'Luis Pérez', detalle: 'Entregado en porteria' }
                    ]
                },
                {
                    id: 2, idVenta: 4, idCliente: 2, idMetodoPago: 1, fechaVenta: '2026-09-23T11:10:30',
                    items: [{ codigo: '7702001001', cantidad: 3, precio: 2850 }, { codigo: '7702001002', cantidad: 1, precio: 12500 }],
                    total: 21050, direccionEntrega: 'Carrera 7 # 15-02', idBarrio: 2, costoEnvio: 3000, telefonoContacto: '3109876543',
                    estado: 'en_camino', idDomiciliario: 3,
                    fechaAsignacion: '2026-09-23T11:20:00', fechaEntrega: null, observacion: '',
                    historial: [
                        { fecha: '2026-09-23T11:10:30', estadoAnterior: null, estadoNuevo: 'pendiente', usuario: 'Administrador', detalle: 'Pedido registrado por teléfono' },
                        { fecha: '2026-09-23T11:20:00', estadoAnterior: 'pendiente', estadoNuevo: 'asignado', usuario: 'Administrador', detalle: 'Asignado a Luis Pérez' },
                        { fecha: '2026-09-23T11:35:00', estadoAnterior: 'asignado', estadoNuevo: 'en_camino', usuario: 'Luis Pérez', detalle: '' }
                    ]
                },
                {
                    id: 3, idVenta: 5, idCliente: 1, idMetodoPago: 2, fechaVenta: '2026-09-24T16:50:00',
                    items: [{ codigo: '7702001003', cantidad: 1, precio: 9900 }, { codigo: '7702001005', cantidad: 1, precio: 3000 }],
                    total: 12900, direccionEntrega: 'Calle 12 # 4-30', idBarrio: 1, costoEnvio: 2000, telefonoContacto: '3011234567',
                    estado: 'asignado', idDomiciliario: 6,
                    fechaAsignacion: '2026-09-24T17:05:00', fechaEntrega: null, observacion: '',
                    historial: [
                        { fecha: '2026-09-24T16:50:00', estadoAnterior: null, estadoNuevo: 'pendiente', usuario: 'Administrador', detalle: 'Pedido registrado por teléfono' },
                        { fecha: '2026-09-24T17:05:00', estadoAnterior: 'pendiente', estadoNuevo: 'asignado', usuario: 'Administrador', detalle: 'Asignado a Kevin Stiven Mora' }
                    ]
                },
                {
                    id: 4, idVenta: 6, idCliente: 3, idMetodoPago: 3, fechaVenta: '2026-09-24T17:15:00',
                    items: [{ codigo: '7702001005', cantidad: 2, precio: 3000 }, { codigo: '7702001001', cantidad: 1, precio: 2850 }],
                    total: 8850, direccionEntrega: 'Calle 45 # 12-30', idBarrio: 3, costoEnvio: 3500, telefonoContacto: '3124567890',
                    estado: 'pendiente', idDomiciliario: null,
                    fechaAsignacion: null, fechaEntrega: null, observacion: 'Llamar antes de llegar',
                    historial: [
                        { fecha: '2026-09-24T17:15:00', estadoAnterior: null, estadoNuevo: 'pendiente', usuario: 'Administrador', detalle: 'Pedido registrado por teléfono' }
                    ]
                }
            ]
        };
    }

    // localStorage puede fallar (modo privado, almacenamiento bloqueado): por eso cada
    // lectura/escritura va en try/catch y, si falla, se trabaja en memoria.
    let enMemoria = null;

    function leer() {
        if (enMemoria) {
            return enMemoria;
        }
        try {
            const guardado = localStorage.getItem(CLAVE);
            enMemoria = guardado ? JSON.parse(guardado) : datosDeEjemplo();
        } catch (error) {
            enMemoria = datosDeEjemplo();
        }
        return enMemoria;
    }

    function guardar() {
        try {
            localStorage.setItem(CLAVE, JSON.stringify(enMemoria));
            // Entregar o devolver un pedido cambia stock: se guarda junto con el pedido
            RepositorioInventario.guardarCambios();
        } catch (error) {
            // Sin almacenamiento disponible: los cambios quedan solo en esta página
        }
    }

    // Un usuario de RepositorioUsuarios con la forma que ya usan las pantallas de Domicilios:
    // { id, nombre, activo }. Así ninguna pantalla tuvo que cambiar.
    function comoDomiciliario(usuario) {
        return {
            id: usuario.idUsuario,
            nombre: usuario.nombres + ' ' + usuario.apellidos,
            activo: usuario.estado === 'activo'
        };
    }

    // Un cliente de RepositorioCatalogos con lo que usan las pantallas de Domicilios:
    // nombre = nombre completo (para mostrar); nombres y apellido por separado (para el formulario).
    // Es una copia: las pantallas no modifican el catálogo por accidente.
    function comoCliente(c) {
        if (!c) return undefined;
        return {
            id: c.id, nombre: RepositorioCatalogos.nombreCompleto(c), nombres: c.nombre, apellido: c.apellido,
            telefono: c.telefono, direccion: c.direccion, idBarrio: c.idBarrio
        };
    }

    // Lo que se devuelve es la "interfaz" del repositorio: lo único visible desde afuera
    return {
        obtenerPedidos: function () {
            return leer().pedidos;
        },
        obtenerPedidoPorId: function (id) {
            return leer().pedidos.find(function (p) { return p.id === id; });
        },
        obtenerProductos: function () {
            return RepositorioInventario.obtenerProductos();
        },
        obtenerProductoPorCodigo: function (codigo) {
            return RepositorioInventario.obtenerProducto(codigo);
        },
        obtenerClientePorId: function (id) {
            return comoCliente(RepositorioCatalogos.obtenerCliente(id));
        },
        buscarClientePorTelefono: function (telefono) {
            return comoCliente(RepositorioCatalogos.buscarClientePorTelefono(telefono));
        },
        obtenerMetodosPago: function () {
            return RepositorioCatalogos.obtenerMetodosPago();
        },
        obtenerMetodoPago: function (id) {
            return RepositorioCatalogos.obtenerMetodoPago(id);
        },
        // Barrios con cobertura (tabla barrios): el formulario los ofrece en una lista
        obtenerBarrios: function () {
            return RepositorioCatalogos.obtenerBarrios();
        },
        obtenerBarrio: function (id) {
            return RepositorioCatalogos.obtenerBarrio(id);
        },
        // Lo que se muestra en pantalla: "Centro" (el pedido guarda solo el id, como la FK)
        nombreBarrio: function (id) {
            const barrio = RepositorioCatalogos.obtenerBarrio(id);
            return barrio ? barrio.nombre : 'Sin barrio';
        },
        // SELECT ... FROM usuarios WHERE id_rol = 3 (se piden a Usuarios: una sola fuente)
        obtenerDomiciliarios: function () {
            return RepositorioUsuarios.obtenerUsuarios()
                .filter(function (u) { return u.idRol === ROL_DOMICILIARIO; })
                .map(comoDomiciliario);
        },
        // Solo si ese usuario es domiciliario: un id de cajero no debe aparecer como domiciliario
        obtenerDomiciliarioPorId: function (id) {
            const usuario = RepositorioUsuarios.obtenerUsuario(id);
            return usuario && usuario.idRol === ROL_DOMICILIARIO ? comoDomiciliario(usuario) : undefined;
        },
        // INSERT INTO clientes: el id sigue la secuencia, como un AUTO_INCREMENT
        agregarCliente: function (cliente) {
            return comoCliente(RepositorioCatalogos.agregarCliente(cliente));
        },
        // INSERT INTO ventas + detalle_venta + domicilios (en el backend irá en una transacción)
        agregarPedido: function (pedido) {
            const datos = leer();
            pedido.id = Math.max.apply(null, datos.pedidos.map(function (p) { return p.id; })) + 1;
            pedido.idVenta = Math.max.apply(null, datos.pedidos.map(function (p) { return p.idVenta; })) + 1;
            datos.pedidos.push(pedido);
            guardar();
            return pedido;
        },
        // UPDATE domicilios: las pantallas modifican el pedido y luego piden guardarlo
        actualizarPedido: function () {
            guardar();
        },
        // INSERT INTO movimientos_inventario (tipo "salida" al entregar, "entrada" si se devuelve).
        // El stock del producto ya viene modificado por el Service; aquí se deja constancia y se guarda.
        registrarMovimientoInventario: function (movimiento) {
            const datos = leer();
            datos.movimientos = datos.movimientos || [];
            datos.movimientos.push(movimiento);
            guardar();
        },
        obtenerMovimientosInventario: function () {
            return leer().movimientos || [];
        },
        obtenerClientes: function () {
            return RepositorioCatalogos.obtenerClientes().map(comoCliente);
        },
        // Avisos para el domiciliario (CU039 "Notificar al domiciliario"): los muestra la campana de su panel
        agregarAvisoDomiciliario: function (aviso) {
            const datos = leer();
            datos.avisos = datos.avisos || [];
            datos.avisos.push(aviso);
            guardar();
        },
        obtenerAvisos: function (idDomiciliario) {
            return (leer().avisos || []).filter(function (a) { return a.idDomiciliario === idDomiciliario; });
        },
        marcarAvisosLeidos: function (idDomiciliario) {
            (leer().avisos || []).forEach(function (a) {
                if (a.idDomiciliario === idDomiciliario) a.leido = true;
            });
            guardar();
        },
        // Olvida la copia en memoria para leer de nuevo lo guardado (otra página pudo cambiarlo)
        recargar: function () {
            enMemoria = null;
            RepositorioInventario.recargar();
            RepositorioUsuarios.recargar();
            RepositorioCatalogos.recargar();
        },
        // Vuelve a los datos de ejemplo (útil para repetir la demostración ante el instructor)
        restablecer: function () {
            enMemoria = datosDeEjemplo();
            guardar();
        }
    };
})();
