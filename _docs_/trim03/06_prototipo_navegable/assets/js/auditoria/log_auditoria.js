// Log de auditoría (RNF04 · solo administrador).
// Esta pantalla solo LEE: no hay botones para editar ni borrar eventos.
// Los eventos vienen de RepositorioAuditoria; los nombres y roles, de RepositorioUsuarios.
// Depende de: usuarios/usuarios_datos.js, auditoria/auditoria_datos.js

if (typeof RepositorioUsuarios === 'undefined') throw new Error('log_auditoria.js: falta cargar antes usuarios/usuarios_datos.js');
if (typeof RepositorioAuditoria === 'undefined') throw new Error('log_auditoria.js: falta cargar antes auditoria/auditoria_datos.js');

// IIFE: las variables de esta pantalla no quedan globales
(function () {
    const POR_PAGINA = 10;

    // Texto y color del badge de cada acción (log_auditoria.accion)
    const ACCIONES = {
        login: ['Inicio de sesión', 'text-bg-secondary'],
        logout: ['Cierre de sesión', 'text-bg-light border'],
        login_fallido: ['Acceso fallido', 'text-bg-danger'],
        registrar: ['Registrar', 'text-bg-success'],
        actualizar: ['Actualizar', 'text-bg-primary'],
        activar: ['Activar', 'text-bg-info'],
        inactivar: ['Inactivar', 'text-bg-warning'],
        eliminar: ['Eliminar', 'text-bg-warning'],
        anular: ['Anular', 'text-bg-danger'],
        asignar: ['Asignar', 'text-bg-primary'],
        cancelar: ['Cancelar', 'text-bg-danger'],
        cerrar_caja: ['Cierre de caja', 'text-bg-dark'],
        imprimir: ['Imprimir', 'text-bg-light border'],
        exportar: ['Exportar', 'text-bg-light border']
    };

    const filtros = {
        desde: document.getElementById('filtroDesde'),
        hasta: document.getElementById('filtroHasta'),
        usuario: document.getElementById('filtroUsuario'),
        modulo: document.getElementById('filtroModulo'),
        accion: document.getElementById('filtroAccion')
    };
    const cuerpo = document.getElementById('cuerpoLog');
    const sinEventos = document.getElementById('sinEventos');
    const resumenPaginas = document.getElementById('resumenPaginas');
    const paginacion = document.getElementById('paginacion');
    let pagina = 1;

    // El formato y la paginación vienen de utilidades.js
    const fechaLocal = Formato.fechaLocal;
    const formatearFecha = Formato.fecha;

    function datosUsuario(idUsuario) {
        const u = idUsuario ? RepositorioUsuarios.obtenerUsuario(idUsuario) : null;
        if (!u) return { nombre: 'Desconocido', rol: 'Sin sesión' };
        const rol = RepositorioUsuarios.obtenerRol(u.idRol);
        return { nombre: u.nombres + ' ' + u.apellidos, rol: rol ? rol.nombre.charAt(0).toUpperCase() + rol.nombre.slice(1) : '' };
    }

    // ---------- Opciones de los filtros (salen de los datos, no escritas a mano) ----------
    RepositorioUsuarios.obtenerUsuarios().forEach(function (u) {
        filtros.usuario.appendChild(new Option(u.nombres + ' ' + u.apellidos, u.idUsuario));
    });
    RepositorioAuditoria.obtenerModulos().forEach(function (m) {
        filtros.modulo.appendChild(new Option(m.nombre, m.id));
    });
    Object.keys(ACCIONES).forEach(function (clave) {
        filtros.accion.appendChild(new Option(ACCIONES[clave][0], clave));
    });

    // Rango inicial: desde el evento más antiguo hasta hoy, para que se vea todo el log
    function rangoInicial() {
        const eventos = RepositorioAuditoria.obtenerEventos();
        const primero = eventos.reduce(function (min, e) { return e.fecha < min ? e.fecha : min; },
            new Date().toISOString());
        filtros.desde.value = fechaLocal(primero);
        filtros.hasta.value = fechaLocal(new Date().toISOString());
    }

    // ---------- Filtrar (del más reciente al más antiguo) ----------
    function filtrar() {
        const idUsuario = Number(filtros.usuario.value) || null;
        const idModulo = Number(filtros.modulo.value) || null;
        const accion = filtros.accion.value;
        return RepositorioAuditoria.obtenerEventos().filter(function (e) {
            const dia = fechaLocal(e.fecha);
            return (!filtros.desde.value || dia >= filtros.desde.value) &&
                (!filtros.hasta.value || dia <= filtros.hasta.value) &&
                (!idUsuario || e.idUsuario === idUsuario) &&
                (!idModulo || e.idModulo === idModulo) &&
                (!accion || e.accion === accion);
        // Más reciente primero; si dos eventos tienen la misma hora, manda el id (el orden en que se guardaron)
        }).sort(function (a, b) { return (new Date(b.fecha) - new Date(a.fecha)) || (b.id - a.id); });
    }

    function celda(fila, texto, clase) {
        const td = fila.insertCell();
        td.textContent = texto;
        if (clase) td.className = clase;
        return td;
    }

    function dibujarResumen(eventos) {
        document.getElementById('totalEventos').textContent = eventos.length;
        const usuarios = new Set(eventos.filter(function (e) { return e.idUsuario; }).map(function (e) { return e.idUsuario; }));
        document.getElementById('totalUsuarios').textContent = usuarios.size;
        const fallidos = eventos.filter(function (e) { return e.accion === 'login_fallido'; }).length;
        const caja = document.getElementById('totalFallidos');
        caja.textContent = fallidos;
        caja.classList.toggle('text-success', fallidos === 0);
        caja.classList.toggle('text-danger', fallidos > 0);
    }

    function dibujar() {
        const eventos = filtrar();
        dibujarResumen(eventos);
        pagina = Paginacion.dibujar(paginacion, resumenPaginas, eventos.length, pagina, POR_PAGINA, 'eventos',
            function (n) { pagina = n; dibujar(); });
        sinEventos.classList.toggle('d-none', eventos.length > 0);

        cuerpo.replaceChildren();
        eventos.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA).forEach(function (e) {
            const fila = cuerpo.insertRow();
            const usuario = datosUsuario(e.idUsuario);
            const modulo = RepositorioAuditoria.obtenerModulo(e.idModulo);
            const accion = ACCIONES[e.accion] || [e.accion, 'text-bg-secondary'];

            celda(fila, e.id);
            celda(fila, formatearFecha(e.fecha), 'text-nowrap');
            const tdUsuario = celda(fila, usuario.nombre);
            tdUsuario.appendChild(document.createElement('br'));
            tdUsuario.appendChild(Object.assign(document.createElement('span'), { className: 'text-muted', textContent: usuario.rol }));
            const tdAccion = fila.insertCell();
            tdAccion.appendChild(Object.assign(document.createElement('span'), { className: 'badge ' + accion[1], textContent: accion[0] }));
            celda(fila, modulo ? modulo.nombre : '—');
            celda(fila, e.detalle || '');
            celda(fila, e.ip, 'text-nowrap');
        });
    }

    // ---------- Eventos de la pantalla ----------
    document.getElementById('formFiltros').addEventListener('submit', function (evento) {
        evento.preventDefault();
        pagina = 1;
        dibujar();
    });
    // Los select y las fechas filtran apenas cambian; el botón Filtrar queda para quien lo busque
    Object.keys(filtros).forEach(function (k) {
        filtros[k].addEventListener('change', function () { pagina = 1; dibujar(); });
    });
    document.getElementById('formFiltros').addEventListener('reset', function () {
        // reset() se aplica después de este evento: se espera un instante y se vuelve al rango inicial
        setTimeout(function () { rangoInicial(); pagina = 1; dibujar(); }, 0);
    });
    document.getElementById('botonImprimir').addEventListener('click', function () { window.print(); });

    rangoInicial();
    dibujar();
})();
