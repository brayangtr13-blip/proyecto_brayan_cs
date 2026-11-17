// Módulo 2 – Inventario · Patrón SERVICE
// Reglas de negocio del módulo. Las pantallas no las repiten: llaman a ServicioInventario.*
// Depende de: inventario_datos.js, auditoria/auditoria_datos.js (RNF04)

// Falla rápido si el HTML no cargó antes las dependencias (orden de <script>)
if (typeof RepositorioInventario === 'undefined') throw new Error('inventario_servicio.js: falta cargar antes inventario_datos.js');
if (typeof RepositorioAuditoria === 'undefined') throw new Error('inventario_servicio.js: falta cargar antes auditoria/auditoria_datos.js');

const ServicioInventario = (function () {

    // Textos de la interfaz para los valores que se guardan en la BD
    const CATEGORIAS = { lacteos: 'Lácteos', abarrotes: 'Abarrotes', bebidas: 'Bebidas', panaderia: 'Panadería', aseo: 'Aseo' };
    const UNIDADES = { unidad: 'Unidad', kilogramo: 'Kilogramo', litro: 'Litro', paquete: 'Paquete' };

    // El formato vive en utilidades.js (una sola copia para todo el sistema)
    const formatearPrecio = Formato.precio;
    const normalizar = Formato.normalizar;

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

    // RNF04: toda acción sobre productos queda en log_auditoria (módulo Inventario)
    function auditar(accion, detalle) {
        RepositorioAuditoria.registrar({ idModulo: RepositorioAuditoria.MODULO.INVENTARIO, accion: accion, detalle: detalle });
    }

    // CS-12: no se registra dos veces el mismo código de barras
    function registrarProducto(producto) {
        if (RepositorioInventario.obtenerProducto(producto.codigo)) {
            return { ok: false, error: 'duplicado' };
        }
        const nuevo = RepositorioInventario.agregarProducto(producto);
        // El stock con el que nace el producto también entra al kárdex (si no, el kárdex no cuadra)
        if (nuevo.stock > 0) {
            RepositorioInventario.registrarMovimientos([{ codigoProducto: nuevo.codigo, idUsuario: RepositorioAuditoria.idUsuarioActual(),
                tipo: 'entrada', cantidad: nuevo.stock, observacion: 'Stock inicial al registrar el producto' }]);
        }
        auditar('registrar', 'Registró el producto ' + nuevo.nombre + ' (' + nuevo.codigo + ')');
        return { ok: true, producto: nuevo };
    }

    // CS-15: el código no se edita, es la llave del producto.
    // Si cambia el stock, el log dice cuánto: es lo que más se audita en una tienda.
    function editarProducto(codigo, cambios) {
        const antes = RepositorioInventario.obtenerProducto(codigo);
        const stockAntes = antes ? antes.stock : null;
        const producto = RepositorioInventario.actualizarProducto(codigo, cambios);
        if (!producto) return { ok: false, error: 'No existe el producto.' };
        const cambioStock = stockAntes !== null && producto.stock !== stockAntes
            ? ' · stock ' + stockAntes + ' → ' + producto.stock : '';
        // Cambiar el stock a mano es un AJUSTE: queda en el kárdex con la diferencia (positiva o negativa)
        if (cambioStock) {
            RepositorioInventario.registrarMovimientos([{ codigoProducto: codigo, idUsuario: RepositorioAuditoria.idUsuarioActual(),
                tipo: 'ajuste', cantidad: producto.stock - stockAntes, observacion: 'Ajuste manual al editar el producto' }]);
        }
        auditar('actualizar', 'Editó el producto ' + producto.nombre + cambioStock);
        return { ok: true, producto: producto };
    }

    // CS-16: borrado LÓGICO; el producto se conserva con estado inactivo
    function cambiarEstado(codigo, estado) {
        const producto = RepositorioInventario.actualizarProducto(codigo, { estado: estado });
        if (!producto) return { ok: false, error: 'No existe el producto.' };
        auditar(estado === 'activo' ? 'activar' : 'eliminar',
            (estado === 'activo' ? 'Reactivó' : 'Eliminó (borrado lógico)') + ' el producto ' + producto.nombre);
        return { ok: true, producto: producto };
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
