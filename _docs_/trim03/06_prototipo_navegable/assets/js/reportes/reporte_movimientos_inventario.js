// RF29 · Reporte impreso de inventario (CS-31): existencias de hoy + kárdex del periodo.
// RF29.1: Imprimir / PDF (diálogo del navegador) y Excel (CSV).

(function () {
    const el = function (id) { return document.getElementById(id); };
    const precio = ServicioReportes.formatearPrecio;
    const BADGE = { entrada: ['Entrada', 'text-bg-success'], salida: ['Salida', 'text-bg-danger'],
        ajuste: ['Ajuste', 'text-bg-warning'], reverso: ['Reverso', 'text-bg-info'] };
    let renglones = [];

    const productos = RepositorioInventario.obtenerProductos();
    productos.forEach(function (p) { el('filtroProducto').appendChild(new Option(p.nombre, p.codigo)); });
    const categorias = [];
    productos.forEach(function (p) { if (categorias.indexOf(p.categoria) < 0) categorias.push(p.categoria); });
    categorias.forEach(function (c) { el('filtroCategoria').appendChild(new Option(ServicioInventario.textoCategoria(c), c)); });

    const rango = ServicioReportes.rangoInicial(RepositorioInventario.obtenerMovimientos().map(function (m) { return m.fecha; }));
    el('filtroDesde').value = rango.desde;
    el('filtroHasta').value = rango.hasta;

    function celdas(tr, valores, derecha) {
        valores.forEach(function (v, i) {
            const td = tr.insertCell();
            if (v instanceof Node) td.appendChild(v); else td.textContent = v;
            if (derecha.indexOf(i) >= 0) td.className = 'text-end';
        });
    }

    function dibujarExistencias() {
        const categoria = el('filtroCategoria').value;
        const codigo = el('filtroProducto').value;
        const lista = productos.filter(function (p) { return (!categoria || p.categoria === categoria) && (!codigo || p.codigo === codigo); });
        el('cuerpoProductos').replaceChildren();
        lista.forEach(function (p) {
            const tr = el('cuerpoProductos').insertRow();
            const bajo = ServicioInventario.tieneStockBajo(p);
            if (bajo) tr.className = 'table-danger';
            const estado = GraficosReportes.crear('span', 'badge ' + (p.estado === 'activo' ? 'text-bg-success' : 'text-bg-secondary'),
                p.estado === 'activo' ? 'Activo' : 'Inactivo');
            celdas(tr, [p.codigo, p.nombre, ServicioInventario.textoCategoria(p.categoria), precio(p.precio),
                p.stock + (bajo ? ' ⚠' : ''), p.stockMinimo, estado, precio(p.stock * p.precio)], [3, 4, 5, 7]);
        });
        el('bajoMinimo').textContent = lista.filter(ServicioInventario.tieneStockBajo).length;
        el('valorInventario').textContent = precio(lista.reduce(function (s, p) { return s + p.stock * p.precio; }, 0));
    }

    function dibujar() {
        const f = { desde: el('filtroDesde').value, hasta: el('filtroHasta').value, codigo: el('filtroProducto').value,
            categoria: el('filtroCategoria').value, tipo: el('filtroTipo').value };
        GraficosReportes.hoja(f.desde, f.hasta);
        dibujarExistencias();

        renglones = ServicioReportes.kardex(f);
        el('sinDatos').classList.toggle('d-none', renglones.length > 0);
        el('tablaKardex').classList.toggle('d-none', renglones.length === 0);
        el('cuerpoKardex').replaceChildren();
        renglones.forEach(function (r) {
            const tr = el('cuerpoKardex').insertRow();
            const badge = GraficosReportes.crear('span', 'badge ' + BADGE[r.tipo][1], BADGE[r.tipo][0]);
            celdas(tr, [ServicioReportes.formatearFecha(r.fecha), r.codigo, r.producto, badge,
                (r.cantidad > 0 ? '+' : '') + r.cantidad, r.anterior, r.resultante, r.usuario, r.observacion], [4, 5, 6]);
        });
        const resumen = ServicioReportes.resumenKardex(renglones);
        el('unidadesEntrada').textContent = resumen.entradas;
        el('unidadesSalida').textContent = resumen.salidas;
        el('saldoPeriodo').textContent = (resumen.saldo > 0 ? '+' : '') + resumen.saldo;
    }

    el('formFiltros').addEventListener('change', dibujar);
    el('botonImprimir').addEventListener('click', function () { GraficosReportes.imprimir('reporte de inventario'); });
    el('botonExcel').addEventListener('click', function () {
        GraficosReportes.exportar('kárdex de inventario', 'reporte_inventario.csv',
            ['Fecha', 'Código', 'Producto', 'Tipo', 'Cantidad', 'Stock anterior', 'Stock resultante', 'Usuario', 'Observación'],
            renglones.map(function (r) {
                return [ServicioReportes.formatearFecha(r.fecha), r.codigo, r.producto, BADGE[r.tipo][0], r.cantidad,
                    r.anterior, r.resultante, r.usuario, r.observacion];
            }));
    });
    dibujar();
})();
