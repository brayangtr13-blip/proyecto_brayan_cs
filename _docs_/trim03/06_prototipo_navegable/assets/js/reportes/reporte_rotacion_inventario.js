// RF28 · Reporte gráfico de inventario (CS-30). Los cálculos salen del kárdex vía ServicioReportes.

(function () {
    const el = function (id) { return document.getElementById(id); };
    const unidades = function (v) { return v + (v === 1 ? ' und.' : ' und.'); };

    // Categorías que de verdad tienen productos (texto bonito desde ServicioInventario)
    const categorias = [];
    RepositorioInventario.obtenerProductos().forEach(function (p) {
        if (categorias.indexOf(p.categoria) < 0) categorias.push(p.categoria);
    });
    categorias.forEach(function (c) { el('filtroCategoria').appendChild(new Option(ServicioInventario.textoCategoria(c), c)); });

    const rango = ServicioReportes.rangoInicial(RepositorioInventario.obtenerMovimientos().map(function (m) { return m.fecha; }));
    el('filtroDesde').value = rango.desde;
    el('filtroHasta').value = rango.hasta;

    function dibujar() {
        const f = { desde: el('filtroDesde').value, hasta: el('filtroHasta').value, categoria: el('filtroCategoria').value };
        const base = ServicioReportes.kardexCompleto();   // una sola vez para los cuatro gráficos
        const hay = ServicioReportes.kardex(f, base).length > 0;
        el('sinDatos').classList.toggle('d-none', hay);
        el('contenido').classList.toggle('d-none', !hay);
        if (!hay) return;

        const rotacion = ServicioReportes.rotacion(f, base);
        const maximo = Math.max.apply(null, rotacion.map(function (r) { return r.valor; })) || 1;
        GraficosReportes.barras(el('graficoMayor'), rotacion.slice().sort(function (a, b) { return b.valor - a.valor; }).slice(0, 5),
            { formato: unidades, color: 'bg-success', maximo: maximo });
        GraficosReportes.barras(el('graficoMenor'), rotacion.slice().sort(function (a, b) { return a.valor - b.valor; }).slice(0, 5),
            { formato: unidades, color: 'bg-danger', maximo: maximo });

        GraficosReportes.barras(el('graficoEvolucion'), ServicioReportes.evolucionStock(f, base), { formato: unidades });

        // Dos barras por día (entradas en verde, salidas en rojo) con la misma escala
        const dias = ServicioReportes.entradasYSalidasPorDia(f, base);
        const tope = Math.max.apply(null, dias.map(function (d) { return Math.max(d.entradas, d.salidas); })) || 1;
        el('graficoEntradasSalidas').replaceChildren();
        dias.forEach(function (d) {
            const bloque = document.createElement('div');
            bloque.className = 'mb-2';
            bloque.appendChild(GraficosReportes.crear('p', 'small fw-semibold mb-1', d.etiqueta));
            el('graficoEntradasSalidas').appendChild(bloque);
            GraficosReportes.barras(bloque.appendChild(document.createElement('div')), [
                { etiqueta: 'Entradas', valor: d.entradas, color: 'bg-success' },
                { etiqueta: 'Salidas', valor: d.salidas, color: 'bg-danger' }
            ], { formato: unidades, maximo: tope });
        });
    }

    el('formFiltros').addEventListener('change', dibujar);
    el('formFiltros').addEventListener('submit', function (e) { e.preventDefault(); dibujar(); });
    dibujar();
})();
