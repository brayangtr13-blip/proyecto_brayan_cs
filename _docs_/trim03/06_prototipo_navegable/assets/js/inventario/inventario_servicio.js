// Módulo 2 – Inventario · Patrón SERVICE
// Reglas de negocio del módulo. Las pantallas no las repiten: llaman a ServicioInventario.*
// Depende de: inventario_datos.js

const ServicioInventario = (function () {

    // Textos de la interfaz para los valores que se guardan en la BD
    const CATEGORIAS = { lacteos: 'Lácteos', abarrotes: 'Abarrotes', bebidas: 'Bebidas', panaderia: 'Panadería', aseo: 'Aseo' };
    const UNIDADES = { unidad: 'Unidad', kilogramo: 'Kilogramo', litro: 'Litro', paquete: 'Paquete' };

    function formatearPrecio(valor) {
        return '$' + valor.toLocaleString('es-CO');
    }

    // Sin tildes y en minúscula: "cafe" encuentra "Café"
    function normalizar(texto) {
        return texto.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
    }

    function textoCategoria(categoria) { return CATEGORIAS[categoria] || categoria; }
    function textoUnidad(unidad) { return UNIDADES[unidad] || unidad; }

    // CS-17: "<=", un producto justo en su mínimo también es alerta
    function tieneStockBajo(producto) {
        return producto.stock <= producto.stockMinimo;
    }

    // AGOTADO manda sobre STOCK BAJO: un producto en 0 nunca muestra las dos etiquetas
    function nivelStock(producto) {
        if (producto.stock === 0) return 'agotado';
        if (tieneStockBajo(producto)) return 'bajo';
        return 'normal';
    }

    // CS-14: el buscador cubre código, nombre y categoría
    function buscar(texto) {
        const valor = normalizar(texto.trim());
        const productos = RepositorioInventario.obtenerProductos();
        if (valor === '') return productos;
        return productos.filter(function (p) {
            return p.codigo.includes(valor) ||
                normalizar(p.nombre).includes(valor) ||
                normalizar(textoCategoria(p.categoria)).includes(valor);
        });
    }

    // CS-17: los más graves primero: agotados y, entre ellos, los más lejos de su mínimo
    function obtenerAlertas() {
        return RepositorioInventario.obtenerProductos()
            .filter(tieneStockBajo)
            .sort(function (a, b) {
                if (a.stock === 0 && b.stock !== 0) return -1;
                if (b.stock === 0 && a.stock !== 0) return 1;
                return (b.stockMinimo - b.stock) - (a.stockMinimo - a.stock);
            });
    }

    // CS-12: no se registra dos veces el mismo código de barras
    function registrarProducto(producto) {
        if (RepositorioInventario.obtenerProducto(producto.codigo)) {
            return { ok: false, error: 'duplicado' };
        }
        return { ok: true, producto: RepositorioInventario.agregarProducto(producto) };
    }

    // CS-15: el código no se edita, es la llave del producto
    function editarProducto(codigo, cambios) {
        const producto = RepositorioInventario.actualizarProducto(codigo, cambios);
        return producto ? { ok: true, producto: producto } : { ok: false, error: 'No existe el producto.' };
    }

    // CS-16: borrado LÓGICO; el producto se conserva con estado inactivo
    function cambiarEstado(codigo, estado) {
        return editarProducto(codigo, { estado: estado });
    }

    return {
        formatearPrecio: formatearPrecio,
        normalizar: normalizar,
        textoCategoria: textoCategoria,
        textoUnidad: textoUnidad,
        tieneStockBajo: tieneStockBajo,
        nivelStock: nivelStock,
        buscar: buscar,
        obtenerAlertas: obtenerAlertas,
        registrarProducto: registrarProducto,
        editarProducto: editarProducto,
        cambiarEstado: cambiarEstado
    };
})();
