// Historial de ventas (CS-19 · HU02). Filtra con ServicioVentas.filtrarVentas y pagina de a 20.

const usuario = Sesion.actual();
const el = function (id) { return document.getElementById(id); };
const POR_PAGINA = 20;   // HU02: máximo 20 registros por página
let pagina = 1;

// ---------- Opciones de los filtros desde el Repository ----------
RepositorioVentas.obtenerUsuarios().forEach(function (u) {
    el('filtroCajero').appendChild(new Option(u.nombre, u.idUsuario));
});
RepositorioVentas.obtenerMetodosPago().forEach(function (m) {
    el('filtroMetodo').appendChild(new Option(m.nombre, m.id));
});
// HU02: el cajero no filtra por cajero (solo ve lo suyo)
el('grupoFiltroCajero').classList.toggle('d-none', usuario.rol !== 'administrador');

// HU02: por defecto, las ventas del día actual
function ponerHoy() {
    const hoy = ServicioVentas.fechaLocal(new Date().toISOString());
    el('filtroDesde').value = hoy;
    el('filtroHasta').value = hoy;
    el('filtroCajero').value = '';
    el('filtroMetodo').value = '';
    el('filtroFactura').value = '';
}

function leerFiltros() {
    return {
        desde: el('filtroDesde').value,
        hasta: el('filtroHasta').value,
        idCajero: Number(el('filtroCajero').value) || null,
        idMetodo: Number(el('filtroMetodo').value) || null,
        factura: Number(el('filtroFactura').value) || null
    };
}

function crearFila(venta) {
    const fila = el('plantillaVenta').content.cloneNode(true).querySelector('tr');
    const campo = function (n) { return fila.querySelector('[data-campo="' + n + '"]'); };
    const fecha = ServicioVentas.formatearFecha(venta.fecha).split(' ');
    const anulada = venta.estado === 'anulada';
    campo('factura').textContent = '#' + venta.id;
    campo('fecha').textContent = fecha[0];
    campo('hora').textContent = fecha[1];
    campo('cajero').textContent = RepositorioVentas.obtenerUsuario(venta.idUsuario).nombre;
    campo('metodo').textContent = RepositorioVentas.obtenerMetodoPago(venta.idMetodoPago).nombre;
    campo('total').textContent = ServicioVentas.formatearPrecio(venta.total);
    // HU02: anuladas en otro color y con la etiqueta ANULADA
    campo('estado').textContent = anulada ? 'ANULADA' : venta.estado === 'pagada' ? 'Pagada' : 'Pendiente';
    campo('estado').classList.add(anulada ? 'text-bg-danger' : venta.estado === 'pagada' ? 'text-bg-success' : 'text-bg-warning');
    if (anulada) {
        fila.classList.add('table-danger');
        campo('total').classList.add('text-decoration-line-through');
    }
    return fila;
}

function dibujarPaginacion(totalPaginas) {
    el('paginacion').replaceChildren();
    for (let n = 1; n <= totalPaginas; n++) {
        const item = document.createElement('li');
        item.className = 'page-item' + (n === pagina ? ' active' : '');
        const boton = Object.assign(document.createElement('button'), { type: 'button', className: 'page-link', textContent: n });
        boton.dataset.pagina = n;
        if (n === pagina) item.setAttribute('aria-current', 'page');
        item.appendChild(boton);
        el('paginacion').appendChild(item);
    }
}

function mostrar() {
    const ventas = ServicioVentas.filtrarVentas(usuario, leerFiltros());
    const totalPaginas = Math.max(1, Math.ceil(ventas.length / POR_PAGINA));
    pagina = Math.min(pagina, totalPaginas);
    const inicio = (pagina - 1) * POR_PAGINA;
    const visibles = ventas.slice(inicio, inicio + POR_PAGINA);

    el('cuerpoVentas').replaceChildren();
    visibles.forEach(function (v) { el('cuerpoVentas').appendChild(crearFila(v)); });
    // HU02: total acumulado de TODAS las ventas filtradas (no solo de la página), sin anuladas
    el('totalAcumulado').textContent = ServicioVentas.formatearPrecio(ServicioVentas.totalSinAnuladas(ventas));
    el('sinVentas').classList.toggle('d-none', ventas.length > 0);
    el('resumenPaginas').textContent = ventas.length
        ? 'Mostrando ' + (inicio + 1) + '–' + (inicio + visibles.length) + ' de ' + ventas.length : '';
    dibujarPaginacion(totalPaginas);
}

// Cualquier cambio en los filtros vuelve a la página 1
el('formFiltros').addEventListener('input', function () { pagina = 1; mostrar(); });
el('formFiltros').addEventListener('submit', function (e) { e.preventDefault(); });
el('botonLimpiarFiltros').addEventListener('click', function () { ponerHoy(); pagina = 1; mostrar(); });
el('paginacion').addEventListener('click', function (e) {
    const boton = e.target.closest('[data-pagina]');
    if (boton) { pagina = Number(boton.dataset.pagina); mostrar(); }
});

ponerHoy();
mostrar();
