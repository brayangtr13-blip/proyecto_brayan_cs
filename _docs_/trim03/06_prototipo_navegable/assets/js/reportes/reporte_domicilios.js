// RF30 · Reporte de domicilios. RF30.1 consulta los pedidos; RF30.2 (enviar estado) se hace desde el
// detalle de cada pedido, al que lleva el botón de cada fila.

(function () {
    const el = function (id) { return document.getElementById(id); };
    const precio = ServicioReportes.formatearPrecio;
    const BADGE = { pendiente: 'text-bg-secondary', asignado: 'text-bg-info', en_camino: 'text-bg-primary',
        entregado: 'text-bg-success', cancelado: 'text-bg-danger' };
    let pedidos = [];

    Object.keys(ServicioReportes.TEXTO_ESTADO).forEach(function (e) {
        el('filtroEstado').appendChild(new Option(ServicioReportes.TEXTO_ESTADO[e], e));
    });
    RepositorioDomicilios.obtenerDomiciliarios().forEach(function (d) { el('filtroDomiciliario').appendChild(new Option(d.nombre, d.id)); });
    RepositorioDomicilios.obtenerBarrios().forEach(function (b) { el('filtroBarrio').appendChild(new Option(b.nombre, b.id)); });

    const rango = ServicioReportes.rangoInicial(RepositorioDomicilios.obtenerPedidos().map(function (p) { return p.fechaVenta; }));
    el('filtroDesde').value = rango.desde;
    el('filtroHasta').value = rango.hasta;

    function nombreDomiciliario(id) {
        const d = id ? RepositorioDomicilios.obtenerDomiciliarioPorId(id) : null;
        return d ? d.nombre : 'Sin asignar';
    }

    function nombreCliente(id) {
        const c = RepositorioDomicilios.obtenerClientePorId(id);
        return c ? c.nombre : '—';
    }

    function dibujar() {
        const f = { desde: el('filtroDesde').value, hasta: el('filtroHasta').value, estado: el('filtroEstado').value,
            idDomiciliario: Number(el('filtroDomiciliario').value) || null, idBarrio: Number(el('filtroBarrio').value) || null };
        pedidos = ServicioReportes.pedidosDelPeriodo(f);
        el('sinDatos').classList.toggle('d-none', pedidos.length > 0);
        el('contenido').classList.toggle('d-none', pedidos.length === 0);
        el('botonExcel').disabled = el('botonImprimir').disabled = pedidos.length === 0;
        if (!pedidos.length) return;
        GraficosReportes.hoja(f.desde, f.hasta);

        const r = ServicioReportes.resumenDomicilios(pedidos);
        el('totalPedidos').textContent = r.total;
        el('totalEntregados').textContent = r.entregados;
        el('tiempoPromedio').textContent = r.minutosPromedio === null ? '—' : Math.round(r.minutosPromedio) + ' min';
        el('totalEnvios').textContent = precio(r.valorEnvios);
        el('totalEnCurso').textContent = r.enCurso;
        el('totalCancelados').textContent = r.cancelados;
        el('valorProductos').textContent = precio(r.valorProductos);
        el('valorTotal').textContent = precio(r.valorProductos + r.valorEnvios);

        const COLORES = { pendiente: 'bg-secondary', asignado: 'bg-info', en_camino: 'bg-primary', entregado: 'bg-success', cancelado: 'bg-danger' };
        GraficosReportes.apilada(el('graficoEstados'), ServicioReportes.pedidosPorEstado(pedidos).map(function (e) {
            return Object.assign(e, { color: COLORES[e.id] });
        }), { formato: function (n) { return n + (n === 1 ? ' pedido' : ' pedidos'); } });
        GraficosReportes.barras(el('graficoDomiciliarios'), ServicioReportes.pedidosPorDomiciliario(pedidos), {
            formato: function (n, d) { return n + ' entregados de ' + d.asignados; }, color: 'bg-success', destacarPrimero: true
        });
        GraficosReportes.barras(el('graficoBarrios'), ServicioReportes.pedidosPorBarrio(pedidos), {
            formato: function (n) { return n + (n === 1 ? ' pedido' : ' pedidos'); }, color: 'bg-info'
        });

        el('cuerpoPedidos').replaceChildren();
        pedidos.slice().reverse().forEach(function (p) {
            const tr = el('cuerpoPedidos').insertRow();
            const badge = GraficosReportes.crear('span', 'badge ' + BADGE[p.estado], ServicioReportes.TEXTO_ESTADO[p.estado]);
            // RF30.2: desde el detalle se ve el histórico y se notifica el estado al cliente
            const ver = GraficosReportes.crear('a', 'btn btn-sm btn-outline-primary');
            ver.href = '../domicilios/consultar_pedido.html?id=' + p.id;
            ver.title = 'Ver el pedido y notificar su estado al cliente';
            ver.appendChild(GraficosReportes.crear('i', 'bi bi-whatsapp'));
            ver.append(' Ver / notificar');
            [ '#' + p.id, ServicioReportes.formatearFecha(p.fechaVenta), nombreCliente(p.idCliente),
                RepositorioDomicilios.nombreBarrio(p.idBarrio), nombreDomiciliario(p.idDomiciliario), badge,
                precio(p.total), precio(p.costoEnvio || 0), ver ].forEach(function (v, i) {
                const td = tr.insertCell();
                if (v instanceof Node) td.appendChild(v); else td.textContent = v;
                if (i === 6 || i === 7) td.className = 'text-end';
                if (i === 8) td.className = 'd-print-none text-nowrap';
            });
        });
    }

    el('formFiltros').addEventListener('change', dibujar);
    el('botonImprimir').addEventListener('click', function () { GraficosReportes.imprimir('reporte de domicilios'); });
    el('botonExcel').addEventListener('click', function () {
        GraficosReportes.exportar('reporte de domicilios', 'reporte_domicilios.csv',
            ['Pedido', 'Fecha', 'Cliente', 'Barrio', 'Domiciliario', 'Estado', 'Productos', 'Envío'],
            pedidos.map(function (p) {
                return [p.id, ServicioReportes.formatearFecha(p.fechaVenta), nombreCliente(p.idCliente),
                    RepositorioDomicilios.nombreBarrio(p.idBarrio), nombreDomiciliario(p.idDomiciliario),
                    ServicioReportes.TEXTO_ESTADO[p.estado], p.total, p.costoEnvio || 0];
            }));
    });
    dibujar();
})();
