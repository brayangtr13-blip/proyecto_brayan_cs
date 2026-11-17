// RF26 · Reporte gráfico de ventas (CS-23). Solo filtra y dibuja: los cálculos son de ServicioReportes.

(function () {
    const el = function (id) { return document.getElementById(id); };
    const precio = ServicioReportes.formatearPrecio;
    const TITULOS = { dia: 'Total de ventas por día', semana: 'Total de ventas por semana', mes: 'Total de ventas por mes' };

    // Rango inicial: de la venta más antigua a hoy
    const rango = ServicioReportes.rangoInicial(RepositorioVentas.obtenerVentas().map(function (v) { return v.fecha; }));
    el('filtroDesde').value = rango.desde;
    el('filtroHasta').value = rango.hasta;

    function dibujar() {
        const agrupacion = document.querySelector('input[name="agrupacion"]:checked').value;
        const periodo = ServicioReportes.ventasDelPeriodo({ desde: el('filtroDesde').value, hasta: el('filtroHasta').value });
        const pagadas = periodo.pagadas;

        // HU01: sin ventas en el rango no se dibuja el gráfico, se avisa
        el('sinDatos').classList.toggle('d-none', pagadas.length > 0);
        el('contenido').classList.toggle('d-none', pagadas.length === 0);
        if (!pagadas.length) return;

        const resumen = ServicioReportes.resumenVentas(pagadas);
        el('totalVendido').textContent = precio(resumen.total);
        el('numeroVentas').textContent = resumen.cantidad;
        el('ticketPromedio').textContent = precio(resumen.ticket);

        el('tituloPeriodo').textContent = TITULOS[agrupacion];
        GraficosReportes.barras(el('graficoPeriodo'), ServicioReportes.ventasPorPeriodo(pagadas, agrupacion), { formato: precio });

        GraficosReportes.apilada(el('graficoMetodos'), ServicioReportes.ventasPorMetodo(pagadas), {
            formato: precio,
            detalle: function (m) { return m.cantidad + (m.cantidad === 1 ? ' venta' : ' ventas') + ' · ' + precio(m.valor); }
        });

        const top = ServicioReportes.productosVendidos(pagadas).slice(0, 10).map(function (p) {
            return { etiqueta: p.etiqueta, valor: p.unidades, total: p.valor };
        });
        GraficosReportes.barras(el('graficoProductos'), top, {
            formato: function (v, p) { return v + ' und. · ' + precio(p.total); }
        });
    }

    el('formFiltros').addEventListener('submit', function (e) { e.preventDefault(); dibujar(); });
    document.querySelectorAll('#formFiltros input').forEach(function (i) { i.addEventListener('change', dibujar); });
    dibujar();
})();
