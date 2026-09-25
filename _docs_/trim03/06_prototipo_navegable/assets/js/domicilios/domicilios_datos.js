// ==========================================================
// Módulo 4 – Domicilios · Patrón REPOSITORY
//
// Este es el ÚNICO archivo que sabe dónde viven los datos de Domicilios.
// Las pantallas (y el servicio) solo llaman a RepositorioDomicilios.*;
// nunca leen localStorage ni arreglos directamente.
//
// Hoy los datos se guardan en localStorage del navegador, porque el flujo del
// módulo cruza varias páginas (el admin registra y asigna, el domiciliario
// actualiza el estado) y cada página debe ver lo que hizo la anterior.
// Cuando exista el backend (Django), solo se reescribe este archivo para usar
// fetch('/api/domicilios/...'); las pantallas no cambian.
// ==========================================================

const RepositorioDomicilios = (function () {
    const CLAVE = 'controlstore_domicilios_v1';

    // Datos de ejemplo basados en controlstore_sena (MySQL 8.4):
    //  - productos: los mismos 5 de Inventario (tabla productos)
    //  - clientes 1 y 2, venta #3 y domicilio #1: registros reales del volcado SQL
    //  - Luis Perez (usuario 3) es el domiciliario real; Diana Morales y Jorge Rincon
    //    son domiciliarios de ejemplo para poder probar asignar y el caso "inactivo" (HU05)
    function datosDeEjemplo() {
        return {
            productos: [
                { codigo: '7702001001', nombre: 'Leche Entera 1L', precio: 2850, stock: 15 },
                { codigo: '7702001002', nombre: 'Arroz Blanco 5kg', precio: 12500, stock: 15 },
                { codigo: '7702001003', nombre: 'Café Molido 250g', precio: 9900, stock: 5 },
                { codigo: '7702001004', nombre: 'Azúcar Blanca 2kg', precio: 5800, stock: 0 },
                { codigo: '7702001005', nombre: 'Pan Tajado', precio: 3000, stock: 34 }
            ],
            clientes: [
                { id: 1, nombre: 'Maria Restrepo', telefono: '3011234567', direccion: 'Calle 12 # 4-30', barrio: 'Centro' },
                { id: 2, nombre: 'Carlos Ruiz', telefono: '3109876543', direccion: 'Carrera 7 # 15-02', barrio: 'La Playa' },
                { id: 3, nombre: 'Paola Díaz', telefono: '3124567890', direccion: 'Calle 45 # 12-30', barrio: 'El Prado' }
            ],
            metodosPago: [
                { id: 1, nombre: 'Efectivo' },
                { id: 2, nombre: 'Nequi' },
                { id: 3, nombre: 'Transferencia' },
                { id: 4, nombre: 'Tarjeta' }
            ],
            domiciliarios: [
                { id: 3, nombre: 'Luis Pérez', activo: true },
                { id: 4, nombre: 'Diana Morales', activo: true },
                { id: 5, nombre: 'Jorge Rincón', activo: false }
            ],
            // Un pedido = una venta (ventas + detalle_venta) + su domicilio (domicilios)
            pedidos: [
                {
                    id: 1, idVenta: 3, idCliente: 1, idMetodoPago: 2, fechaVenta: '2026-09-23T10:10:30',
                    items: [{ codigo: '7702001002', cantidad: 1, precio: 12500 }, { codigo: '7702001003', cantidad: 2, precio: 9900 }],
                    total: 32300, direccionEntrega: 'Calle 12 # 4-30', barrio: 'Centro', telefonoContacto: '3011234567',
                    estado: 'entregado', idDomiciliario: 3,
                    fechaAsignacion: '2026-09-23T10:20:30', fechaEntrega: '2026-09-23T11:00:30',
                    observacion: 'Entregado en porteria'
                },
                {
                    id: 2, idVenta: 4, idCliente: 2, idMetodoPago: 1, fechaVenta: '2026-09-23T11:10:30',
                    items: [{ codigo: '7702001001', cantidad: 3, precio: 2850 }, { codigo: '7702001002', cantidad: 1, precio: 12500 }],
                    total: 21050, direccionEntrega: 'Carrera 7 # 15-02', barrio: 'La Playa', telefonoContacto: '3109876543',
                    estado: 'en_camino', idDomiciliario: 3,
                    fechaAsignacion: '2026-09-23T11:20:00', fechaEntrega: null, observacion: ''
                },
                {
                    id: 3, idVenta: 5, idCliente: 1, idMetodoPago: 2, fechaVenta: '2026-09-24T16:50:00',
                    items: [{ codigo: '7702001003', cantidad: 1, precio: 9900 }, { codigo: '7702001005', cantidad: 1, precio: 3000 }],
                    total: 12900, direccionEntrega: 'Calle 12 # 4-30', barrio: 'Centro', telefonoContacto: '3011234567',
                    estado: 'asignado', idDomiciliario: 4,
                    fechaAsignacion: '2026-09-24T17:05:00', fechaEntrega: null, observacion: ''
                },
                {
                    id: 4, idVenta: 6, idCliente: 3, idMetodoPago: 3, fechaVenta: '2026-09-24T17:15:00',
                    items: [{ codigo: '7702001005', cantidad: 2, precio: 3000 }, { codigo: '7702001001', cantidad: 1, precio: 2850 }],
                    total: 8850, direccionEntrega: 'Calle 45 # 12-30', barrio: 'El Prado', telefonoContacto: '3124567890',
                    estado: 'pendiente', idDomiciliario: null,
                    fechaAsignacion: null, fechaEntrega: null, observacion: 'Llamar antes de llegar'
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
        } catch (error) {
            // Sin almacenamiento disponible: los cambios quedan solo en esta página
        }
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
            return leer().productos;
        },
        obtenerProductoPorCodigo: function (codigo) {
            return leer().productos.find(function (p) { return p.codigo === codigo; });
        },
        obtenerClientePorId: function (id) {
            return leer().clientes.find(function (c) { return c.id === id; });
        },
        buscarClientePorTelefono: function (telefono) {
            return leer().clientes.find(function (c) { return c.telefono === telefono; });
        },
        obtenerMetodoPago: function (id) {
            return leer().metodosPago.find(function (m) { return m.id === id; });
        },
        obtenerDomiciliarios: function () {
            return leer().domiciliarios;
        },
        obtenerDomiciliarioPorId: function (id) {
            return leer().domiciliarios.find(function (d) { return d.id === id; });
        },
        // INSERT INTO clientes: el id sigue la secuencia, como un AUTO_INCREMENT
        agregarCliente: function (cliente) {
            const datos = leer();
            cliente.id = Math.max.apply(null, datos.clientes.map(function (c) { return c.id; })) + 1;
            datos.clientes.push(cliente);
            guardar();
            return cliente;
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
        // Vuelve a los datos de ejemplo (útil para repetir la demostración ante el instructor)
        restablecer: function () {
            enMemoria = datosDeEjemplo();
            guardar();
        }
    };
})();
