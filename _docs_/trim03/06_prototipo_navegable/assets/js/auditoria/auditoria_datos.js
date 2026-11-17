// Log de auditoría (RNF04) · Patrón REPOSITORY
// Única fuente de la tabla log_auditoria. Todos los módulos registran aquí lo que pasa:
// inicios de sesión, usuarios, productos, ventas y domicilios.
// Es de SOLO AGREGAR: no hay funciones para editar ni borrar eventos, igual que en la BD,
// donde la aplicación solo tiene permiso de INSERT y SELECT sobre esta tabla.
// Hoy: localStorage. Con el backend: el servidor escribe el log (y la IP real) en cada petición.
// No depende de otros archivos: se carga antes de sesion.js y de los servicios.

const RepositorioAuditoria = (function () {
    const CLAVE = 'controlstore_auditoria_v1';
    const CLAVE_SESION = 'controlstore_sesion';   // la misma que usa sesion.js
    const ID_ADMINISTRADOR = 1;

    // Tabla modulos de controlstore_sena (log_auditoria.id_modulo es FK a esta tabla)
    const MODULOS = [
        { id: 1, nombre: 'Usuarios' },
        { id: 2, nombre: 'Inventario' },
        { id: 3, nombre: 'Ventas y caja' },
        { id: 4, nombre: 'Domicilios' },
        { id: 5, nombre: 'Reportes' }
    ];

    // Los 5 eventos reales de log_auditoria en controlstore_sena, con los mismos id
    function datosDeEjemplo() {
        return {
            eventos: [
                { id: 1, idUsuario: 2, idModulo: 1, accion: 'login', detalle: 'Inicio de sesión exitoso', ip: '192.168.1.15', fecha: '2026-09-23T08:40:30' },
                { id: 2, idUsuario: 2, idModulo: 3, accion: 'registrar', detalle: 'Registró la venta #2 por $8.700', ip: '192.168.1.15', fecha: '2026-09-23T09:40:30' },
                { id: 3, idUsuario: 2, idModulo: 3, accion: 'registrar', detalle: 'Registró la venta #3 por $32.300', ip: '192.168.1.15', fecha: '2026-09-23T10:10:30' },
                { id: 4, idUsuario: 1, idModulo: 2, accion: 'actualizar', detalle: 'Ingreso de stock: Azúcar Blanca 2kg, +30 unidades', ip: '192.168.1.10', fecha: '2026-09-22T11:40:30' },
                { id: 5, idUsuario: 3, idModulo: 4, accion: 'actualizar', detalle: 'Marcó el domicilio de la venta #3 como entregado', ip: '192.168.1.22', fecha: '2026-09-23T11:00:30' }
            ]
        };
    }

    let enMemoria = null;

    function leer() {
        if (enMemoria) return enMemoria;
        try {
            const guardado = localStorage.getItem(CLAVE);
            enMemoria = guardado ? JSON.parse(guardado) : datosDeEjemplo();
        } catch (error) {
            enMemoria = datosDeEjemplo();
        }
        return enMemoria;
    }

    function guardar() {
        try { localStorage.setItem(CLAVE, JSON.stringify(enMemoria)); } catch (error) { /* solo en memoria */ }
    }

    // Quién hizo la acción: el usuario de la sesión. Se lee la sesión directamente (y no Sesion.actual())
    // para que este archivo no dependa de sesion.js. Sin sesión se asume el administrador,
    // la misma regla del prototipo que usa sesion.js.
    function usuarioDeLaSesion() {
        try {
            const guardada = sessionStorage.getItem(CLAVE_SESION);
            if (guardada) return JSON.parse(guardada).idUsuario;
        } catch (error) { /* sin almacenamiento */ }
        return ID_ADMINISTRADOR;
    }

    return {
        // Constantes para que los servicios no escriban números sueltos: RepositorioAuditoria.MODULO.VENTAS
        MODULO: { USUARIOS: 1, INVENTARIO: 2, VENTAS: 3, DOMICILIOS: 4, REPORTES: 5 },

        // INSERT INTO log_auditoria. Recibe { idModulo, accion, detalle } y, si hace falta, idUsuario.
        // Puede traer datos extra (por ejemplo idVenta y motivo de una anulación).
        registrar: function (evento) {
            const datos = leer();
            const registro = Object.assign({
                idUsuario: usuarioDeLaSesion(),
                // El navegador no conoce su IP: en el prototipo queda la del equipo local
                ip: '127.0.0.1',
                fecha: new Date().toISOString()
            }, evento);
            registro.id = datos.eventos.reduce(function (max, e) { return Math.max(max, e.id); }, 0) + 1;
            datos.eventos.push(registro);
            guardar();
            return registro;
        },

        // SELECT ... FROM log_auditoria (las pantallas reciben copias: el log no se modifica desde afuera)
        obtenerEventos: function () {
            return leer().eventos.map(function (e) { return Object.assign({}, e); });
        },
        obtenerModulos: function () { return MODULOS; },
        obtenerModulo: function (id) {
            return MODULOS.find(function (m) { return m.id === id; });
        },

        // id del usuario en sesión (también lo usa Inventario para firmar los movimientos del kárdex)
        idUsuarioActual: usuarioDeLaSesion,

        recargar: function () { enMemoria = null; },
        restablecer: function () { enMemoria = datosDeEjemplo(); guardar(); }
    };
})();
