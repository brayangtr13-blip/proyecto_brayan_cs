// Módulo 2 – Inventario · Patrón REPOSITORY
// ÚNICO dueño de las tablas productos y movimientos_inventario (el kárdex) en todo el prototipo:
// Ventas y Domicilios las leen y las modifican a través de este Repository.
// Hoy: localStorage. Con Django: fetch a la API.

const RepositorioInventario = (function () {
    // v2: el stock pasa a ser el de controlstore_sena y se agrega el kárdex (movimientos_inventario),
    //     para que stock y movimientos cuadren. Cambiar la versión hace arrancar con los datos de ejemplo.
    const CLAVE = 'controlstore_inventario_v2';

    // Tablas productos y movimientos_inventario de controlstore_sena, con los mismos valores.
    // El stock cuadra con el kárdex: stock actual = stock inicial + entradas - salidas.
    // El Café (5 de 20) queda bajo el mínimo y sirve para ver las alertas.
    function datosDeEjemplo() {
        return {
            productos: [
                { codigo: '7702001001', nombre: 'Leche Entera 1L', categoria: 'lacteos', descripcion: 'Leche entera pasteurizada, bolsa de 1 litro.', precio: 2850, stock: 57, stockMinimo: 20, unidadMedida: 'litro', estado: 'activo' },
                { codigo: '7702001002', nombre: 'Arroz Blanco 5kg', categoria: 'abarrotes', descripcion: 'Arroz blanco de grano largo, bolsa de 5 kilogramos.', precio: 12500, stock: 13, stockMinimo: 10, unidadMedida: 'paquete', estado: 'activo' },
                { codigo: '7702001003', nombre: 'Café Molido 250g', categoria: 'abarrotes', descripcion: 'Café molido tostado, bolsa de 250 gramos.', precio: 9900, stock: 5, stockMinimo: 20, unidadMedida: 'paquete', estado: 'activo' },
                { codigo: '7702001004', nombre: 'Azúcar Blanca 2kg', categoria: 'abarrotes', descripcion: 'Azúcar blanca refinada, bolsa de 2 kilogramos.', precio: 5800, stock: 30, stockMinimo: 15, unidadMedida: 'paquete', estado: 'activo' },
                { codigo: '7702001005', nombre: 'Pan Tajado', categoria: 'panaderia', descripcion: 'Pan de molde tajado.', precio: 3000, stock: 33, stockMinimo: 10, unidadMedida: 'unidad', estado: 'activo' }
            ],
            // tipo: entrada (suma), salida (resta) o ajuste (cantidad con signo)
            movimientos: [
                { id: 1, codigoProducto: '7702001004', idUsuario: 1, tipo: 'entrada', cantidad: 30, observacion: 'Reposición de stock, proveedor Alquería', fecha: '2026-09-22T11:40:30' },
                { id: 2, codigoProducto: '7702001005', idUsuario: 2, tipo: 'salida', cantidad: 1, observacion: 'Venta #2', fecha: '2026-09-23T09:40:30' },
                { id: 3, codigoProducto: '7702001003', idUsuario: 2, tipo: 'salida', cantidad: 2, observacion: 'Venta #3', fecha: '2026-09-23T10:10:30' },
                { id: 4, codigoProducto: '7702001001', idUsuario: 2, tipo: 'salida', cantidad: 5, observacion: 'Ventas #2 y #4 (mostrador, turno tarde)', fecha: '2026-09-23T11:10:30' },
                { id: 5, codigoProducto: '7702001002', idUsuario: 2, tipo: 'salida', cantidad: 2, observacion: 'Ventas #3 y #4 (mostrador, turno tarde)', fecha: '2026-09-23T11:10:30' }
            ]
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
        // Después de recargar() la memoria queda en null: guardar ahí escribiría "null" y borraría
        // el inventario (pasaba al abrir la campana del domiciliario tras un evento "storage")
        if (!enMemoria) return;
        try { localStorage.setItem(CLAVE, JSON.stringify(enMemoria)); } catch (e) { /* solo en memoria */ }
    }

    return {
        // SELECT * FROM productos
        obtenerProductos: function () { return leer().productos; },
        // SELECT ... WHERE codigo = ?
        obtenerProducto: function (codigo) {
            return leer().productos.find(function (p) { return p.codigo === codigo; });
        },
        // INSERT INTO productos
        agregarProducto: function (producto) {
            leer().productos.push(producto);
            guardar();
            return producto;
        },
        // UPDATE productos SET ... WHERE codigo = ?
        actualizarProducto: function (codigo, cambios) {
            const producto = this.obtenerProducto(codigo);
            if (!producto) return undefined;
            Object.assign(producto, cambios);
            guardar();
            return producto;
        },
        // Ventas y Domicilios cambian el stock del objeto y luego piden guardarlo
        guardarCambios: function () { guardar(); },

        // ---------- movimientos_inventario (kárdex) ----------
        // INSERT INTO movimientos_inventario: cada venta, anulación, entrega o ingreso de stock deja
        // un renglón. Los recibe ya armados { codigoProducto, idUsuario, tipo, cantidad, observacion, fecha }.
        registrarMovimientos: function (lista) {
            const datos = leer();
            datos.movimientos = datos.movimientos || [];
            lista.forEach(function (m) {
                m.id = datos.movimientos.reduce(function (max, x) { return Math.max(max, x.id || 0); }, 0) + 1;
                if (!m.fecha) m.fecha = new Date().toISOString();
                datos.movimientos.push(m);
            });
            guardar();
        },
        // Sin código: todo el kárdex. Con código: solo los movimientos de ese producto
        obtenerMovimientos: function (codigo) {
            return (leer().movimientos || []).filter(function (m) { return !codigo || m.codigoProducto === codigo; });
        },
        // Olvida la copia en memoria para leer de nuevo lo guardado (otra página pudo cambiarlo)
        recargar: function () { enMemoria = null; },
        restablecer: function () { enMemoria = datosDeEjemplo(); guardar(); }
    };
})();
