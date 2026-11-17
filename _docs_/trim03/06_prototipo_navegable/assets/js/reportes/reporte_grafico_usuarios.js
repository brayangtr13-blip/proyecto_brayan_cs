// CS-27 · Reporte gráfico de usuarios: ventas por vendedor, usuarios por rol y por estado.

(function () {
    const el = function (id) { return document.getElementById(id); };
    const precio = ServicioReportes.formatearPrecio;
    const COLOR_ROL = { 1: 'bg-dark', 2: 'bg-primary', 3: 'bg-warning' };

    const rango = ServicioReportes.rangoInicial(RepositorioVentas.obtenerVentas().map(function (v) { return v.fecha; }));
    el('filtroDesde').value = rango.desde;
    el('filtroHasta').value = rango.hasta;

    function dibujar() {
        const vendedores = ServicioReportes.ventasPorVendedor({ desde: el('filtroDesde').value, hasta: el('filtroHasta').value });
        const mejor = vendedores[0];
        el('destacado').classList.toggle('d-none', !mejor || !mejor.valor);
        if (mejor && mejor.valor) {
            el('textoDestacado').replaceChildren(GraficosReportes.crear('strong', '', 'Vendedor destacado: '),
                mejor.etiqueta + ' · ' + mejor.cantidad + (mejor.cantidad === 1 ? ' venta' : ' ventas') + ' · ' + precio(mejor.valor));
        }
        GraficosReportes.barras(el('graficoTotal'), vendedores, { formato: precio, destacarPrimero: true });
        GraficosReportes.barras(el('graficoNumero'),
            vendedores.map(function (v) { return { etiqueta: v.etiqueta, valor: v.cantidad }; })
                .sort(function (a, b) { return b.valor - a.valor; }),
            { formato: function (n) { return n + (n === 1 ? ' venta' : ' ventas'); }, destacarPrimero: true });

        // Composición de las cuentas: no depende de las fechas
        GraficosReportes.apilada(el('graficoRoles'), ServicioReportes.usuariosPorRol().map(function (r) {
            return Object.assign(r, { color: COLOR_ROL[r.id] });
        }), {
            detalle: function (r) {
                return r.valor + (r.valor === 1 ? ' usuario: ' : ' usuarios: ') +
                    r.usuarios.map(function (u) { return u.nombres + ' ' + u.apellidos; }).join(', ');
            }
        });
        const usuarios = RepositorioUsuarios.obtenerUsuarios();
        const activos = usuarios.filter(function (u) { return u.estado === 'activo'; }).length;
        GraficosReportes.barras(el('graficoEstado'), [
            { etiqueta: 'Activos', valor: activos, color: 'bg-success' },
            { etiqueta: 'Inactivos', valor: usuarios.length - activos, color: 'bg-secondary' }
        ], { formato: String, maximo: usuarios.length });
    }

    el('formFiltros').addEventListener('change', dibujar);
    dibujar();
})();
