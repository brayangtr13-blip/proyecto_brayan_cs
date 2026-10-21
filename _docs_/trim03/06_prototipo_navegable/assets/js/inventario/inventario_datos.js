// Módulo 2 – Inventario · Patrón REPOSITORY
// Único acceso a los productos del módulo. Hoy: localStorage. Con Django: fetch a la API.

const RepositorioInventario = (function () {
    const CLAVE = 'controlstore_inventario_v1';

    // Tabla productos de controlstore_sena. Dos productos bajo el mínimo y uno agotado
    // a propósito, para poder ver las alertas y el resaltado en rojo.
    function datosDeEjemplo() {
        return {
            productos: [
                { codigo: '7702001001', nombre: 'Leche Entera 1L', categoria: 'lacteos', descripcion: 'Leche entera pasteurizada, bolsa de 1 litro.', precio: 2850, stock: 15, stockMinimo: 20, unidadMedida: 'litro', estado: 'activo' },
                { codigo: '7702001002', nombre: 'Arroz Blanco 5kg', categoria: 'abarrotes', descripcion: 'Arroz blanco de grano largo, bolsa de 5 kilogramos.', precio: 12500, stock: 15, stockMinimo: 10, unidadMedida: 'paquete', estado: 'activo' },
                { codigo: '7702001003', nombre: 'Café Molido 250g', categoria: 'abarrotes', descripcion: 'Café molido tostado, bolsa de 250 gramos.', precio: 9900, stock: 5, stockMinimo: 20, unidadMedida: 'paquete', estado: 'activo' },
                { codigo: '7702001004', nombre: 'Azúcar Blanca 2kg', categoria: 'abarrotes', descripcion: 'Azúcar blanca refinada, bolsa de 2 kilogramos.', precio: 5800, stock: 0, stockMinimo: 15, unidadMedida: 'paquete', estado: 'activo' },
                { codigo: '7702001005', nombre: 'Pan Tajado', categoria: 'panaderia', descripcion: 'Pan de molde tajado.', precio: 3000, stock: 34, stockMinimo: 10, unidadMedida: 'unidad', estado: 'activo' }
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
        restablecer: function () { enMemoria = datosDeEjemplo(); guardar(); }
    };
})();
