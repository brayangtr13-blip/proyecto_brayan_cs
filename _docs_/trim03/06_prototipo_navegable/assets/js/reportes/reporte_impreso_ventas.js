// RF27 · Reporte impreso de ventas (CS-24) + RF27.1 exportar a PDF (imprimir) y Excel (CSV).

(function () {
    const el = function (id) { return document.getElementById(id); };
    const precio = ServicioReportes.formatearPrecio;
    let actual = null;   // lo último que se dibujó: es lo mismo que se exporta

    // Opciones de los filtros desde los datos: vendedores (admin y cajeros) y métodos de pago
    RepositorioVentas.obtenerUsuarios().forEach(function (u) { el('filtroVendedor').appendChild(new Option(u.nombre, u.idUsuario)); });
    RepositorioVentas.obtenerMetodosPago().forEach(function (m) { el('filtroMetodo').appendChild(new Option(m.nombre, m.id)); });

    const rango = ServicioReportes.rangoInicial(RepositorioVentas.obtenerVentas().map(function (v) { return v.fecha; }));
    el('filtroDesde').value = rango.desde;
    el('filtroHasta').value = rango.hasta;

    function filtros() {
        return {
            desde: el('filtroDesde').value, hasta: el('filtroHasta').value,
            idUsuario: Number(el('filtroVendedor').value) || null, idMetodoPago: Number(el('filtroMetodo').value) || null
        };
    }

    function fila(cuerpo, valores, ultimaDerecha) {
        const tr = cuerpo.insertRow();
        valores.forEach(function (v, i) {
            const td = tr.insertCell();
            td.textContent = v;
            if (ultimaDerecha && i === valores.length - 1) td.className = 'text-end';
        });
    }

    function dibujar() {
        const f = filtros();
        const periodo = ServicioReportes.ventasDelPeriodo(f);
        actual = periodo;
        const hay = periodo.pagadas.length + periodo.anuladas.length > 0;
        el('sinDatos').classList.toggle('d-none', hay);
        el('hoja').classList.toggle('d-none', !hay);
        el('botonExcel').disabled = !hay;
        el('botonImprimir').disabled = !hay;
        if (!hay) return;

        GraficosReportes.hoja(f.desde, f.hasta);
        el('cuerpoPagadas').replaceChildren();
        periodo.pagadas.forEach(function (v) {
            fila(el('cuerpoPagadas'), ['#' + v.id, ServicioReportes.formatearFecha(v.fecha), ServicioReportes.nombreUsuario(v.idUsuario),
                RepositorioVentas.obtenerMetodoPago(v.idMetodoPago).nombre, precio(v.total)], true);
        });
        const resumen = ServicioReportes.resumenVentas(periodo.pagadas);
        el('numeroVentas').textContent = resumen.cantidad;
        el('ticketPromedio').textContent = precio(resumen.ticket);
        el('totalGeneral').textContent = precio(resumen.total);

        // Las anuladas se muestran aparte con su motivo (sale de log_auditoria) y no suman
        el('cuerpoAnuladas').replaceChildren();
        el('sinAnuladas').classList.toggle('d-none', periodo.anuladas.length > 0);
        el('tablaAnuladas').classList.toggle('d-none', periodo.anuladas.length === 0);
        periodo.anuladas.forEach(function (v) {
            const anulacion = RepositorioVentas.obtenerAuditoria().filter(function (e) {
                return e.accion === 'anular' && e.idVenta === v.id;
            }).pop();
            fila(el('cuerpoAnuladas'), ['#' + v.id, ServicioReportes.formatearFecha(v.fecha), ServicioReportes.nombreUsuario(v.idUsuario),
                anulacion ? anulacion.motivo : 'No registrado', precio(v.total)], true);
        });
    }

    el('formFiltros').addEventListener('change', dibujar);
    el('botonImprimir').addEventListener('click', function () { GraficosReportes.imprimir('reporte de ventas'); });
    el('botonExcel').addEventListener('click', function () {
        const filas = actual.pagadas.map(function (v) {
            return [v.id, ServicioReportes.formatearFecha(v.fecha), ServicioReportes.nombreUsuario(v.idUsuario),
                RepositorioVentas.obtenerMetodoPago(v.idMetodoPago).nombre, 'Pagada', v.total];
        }).concat(actual.anuladas.map(function (v) {
            return [v.id, ServicioReportes.formatearFecha(v.fecha), ServicioReportes.nombreUsuario(v.idUsuario),
                RepositorioVentas.obtenerMetodoPago(v.idMetodoPago).nombre, 'Anulada', v.total];
        }));
        GraficosReportes.exportar('reporte de ventas', 'reporte_ventas.csv',
            ['Factura', 'Fecha', 'Vendedor', 'Método de pago', 'Estado', 'Total'], filas);
    });
    dibujar();
})();
