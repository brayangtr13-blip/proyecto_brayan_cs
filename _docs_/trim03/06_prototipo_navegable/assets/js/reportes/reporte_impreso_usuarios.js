// CS-28 · Reporte impreso de usuarios. Nunca muestra ni exporta la contraseña.

(function () {
    const el = function (id) { return document.getElementById(id); };
    const precio = ServicioReportes.formatearPrecio;
    let filas = [];
    const PLURAL = { administrador: 'Administradores', cajero: 'Cajeros', domiciliario: 'Domiciliarios' };

    RepositorioUsuarios.obtenerRoles().forEach(function (r) {
        el('filtroRol').appendChild(new Option(r.nombre.charAt(0).toUpperCase() + r.nombre.slice(1), r.idRol));
    });
    const rango = ServicioReportes.rangoInicial(RepositorioVentas.obtenerVentas().map(function (v) { return v.fecha; }));
    el('filtroDesde').value = rango.desde;
    el('filtroHasta').value = rango.hasta;

    function textoRol(idRol) {
        const r = RepositorioUsuarios.obtenerRol(idRol);
        return r ? r.nombre.charAt(0).toUpperCase() + r.nombre.slice(1) : '';
    }

    function dibujar() {
        const idRol = Number(el('filtroRol').value) || null;
        const estado = el('filtroEstado').value;
        const desde = el('filtroDesde').value, hasta = el('filtroHasta').value;
        const ventas = ServicioReportes.ventasPorVendedor({ desde: desde, hasta: hasta });
        GraficosReportes.hoja(desde, hasta);

        filas = RepositorioUsuarios.obtenerUsuarios().filter(function (u) {
            return (!idRol || u.idRol === idRol) && (!estado || u.estado === estado);
        }).map(function (u) {
            const v = ventas.find(function (x) { return x.idUsuario === u.idUsuario; });
            return { u: u, total: v ? v.valor : null, cantidad: v ? v.cantidad : null };
        });
        el('sinDatos').classList.toggle('d-none', filas.length > 0);
        el('hoja').classList.toggle('d-none', filas.length === 0);

        el('cuerpoUsuarios').replaceChildren();
        filas.forEach(function (f) {
            const tr = el('cuerpoUsuarios').insertRow();
            const badge = GraficosReportes.crear('span', 'badge ' + (f.u.estado === 'activo' ? 'text-bg-success' : 'text-bg-secondary'),
                f.u.estado === 'activo' ? 'Activo' : 'Inactivo');
            [f.u.documento, f.u.nombres, f.u.apellidos, f.u.correo, f.u.telefono || '—', textoRol(f.u.idRol), badge,
                f.total === null ? '—' : precio(f.total), f.cantidad === null ? '—' : f.cantidad].forEach(function (v, i) {
                const td = tr.insertCell();
                if (v instanceof Node) td.appendChild(v); else td.textContent = v;
                if (i >= 7) td.className = 'text-end';
            });
        });

        // Total de usuarios por rol (de los que pasaron el filtro)
        const totales = el('totalesPorRol');
        totales.replaceChildren();
        RepositorioUsuarios.obtenerRoles().forEach(function (r) {
            const n = filas.filter(function (f) { return f.u.idRol === r.idRol; }).length;
            totales.append(GraficosReportes.crear('dt', 'col-8', PLURAL[r.nombre] || textoRol(r.idRol)),
                GraficosReportes.crear('dd', 'col-4 text-end mb-1', String(n)));
        });
        totales.append(GraficosReportes.crear('dt', 'col-8 fs-6', 'Total de usuarios'),
            GraficosReportes.crear('dd', 'col-4 text-end fs-6 fw-bold mb-0', String(filas.length)));
    }

    el('formFiltros').addEventListener('change', dibujar);
    el('botonImprimir').addEventListener('click', function () { GraficosReportes.imprimir('reporte de usuarios'); });
    el('botonExcel').addEventListener('click', function () {
        GraficosReportes.exportar('reporte de usuarios', 'reporte_usuarios.csv',
            ['Documento', 'Nombres', 'Apellidos', 'Correo', 'Teléfono', 'Rol', 'Estado', 'Total vendido', 'N.º ventas'],
            filas.map(function (f) {
                return [f.u.documento, f.u.nombres, f.u.apellidos, f.u.correo, f.u.telefono || '', textoRol(f.u.idRol),
                    f.u.estado, f.total === null ? '' : f.total, f.cantidad === null ? '' : f.cantidad];
            }));
    });
    dibujar();
})();
