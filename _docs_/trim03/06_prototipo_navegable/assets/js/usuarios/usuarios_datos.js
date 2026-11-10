// Módulo 1 – Usuarios · Patrón REPOSITORY
// Único dueño de las tablas usuarios y roles: Ventas, Domicilios y la sesión le piden los usuarios a él.
// Hoy: localStorage. Con el backend: fetch a la API (solo cambia este archivo).

const RepositorioUsuarios = (function () {
    // v2: los usuarios ahora son los de controlstore_sena (antes Laura y Carlos, que no existían en la BD)
    const CLAVE = 'controlstore_usuarios_v2';

    // Tabla roles de controlstore_sena (id_rol, nombre). El prototipo usa solo estos tres.
    const ROLES = [
        { idRol: 1, nombre: 'administrador' },
        { idRol: 2, nombre: 'cajero' },
        { idRol: 3, nombre: 'domiciliario' }
    ];

    // Usuarios 1 a 7 de controlstore_sena (volcado + 03_datos_diez_por_tabla.sql), mismos id y datos.
    // Los usuarios 8 a 10 tienen roles que el prototipo no maneja (supervisor, bodeguero, contador).
    // La contraseña no se guarda aquí: en la BD va cifrada (contrasena_hash) y la valida el backend.
    function datosDeEjemplo() {
        return {
            usuarios: [
                { idUsuario: 1, documento: '1000000001', nombres: 'Andres', apellidos: 'Gomez', correo: 'admin@controlstore.com', telefono: null, idRol: 1, estado: 'activo' },
                { idUsuario: 2, documento: '1000000002', nombres: 'Juan Carlos', apellidos: 'Perez', correo: 'juan.perez@controlstore.com', telefono: null, idRol: 2, estado: 'activo' },
                { idUsuario: 3, documento: '1000000003', nombres: 'Luis', apellidos: 'Perez', correo: 'luis.p@controlstore.com', telefono: null, idRol: 3, estado: 'activo' },
                { idUsuario: 4, documento: '1000000004', nombres: 'Sandra Milena', apellidos: 'Ortiz', correo: 'sandra.ortiz@controlstore.com', telefono: '3001230004', idRol: 2, estado: 'activo' },
                { idUsuario: 5, documento: '1000000005', nombres: 'Diego Alejandro', apellidos: 'Rojas', correo: 'diego.rojas@controlstore.com', telefono: '3001230005', idRol: 2, estado: 'inactivo' },
                { idUsuario: 6, documento: '1000000006', nombres: 'Kevin Stiven', apellidos: 'Mora', correo: 'kevin.mora@controlstore.com', telefono: '3001230006', idRol: 3, estado: 'activo' },
                { idUsuario: 7, documento: '1000000007', nombres: 'Yeison Andres', apellidos: 'Castro', correo: 'yeison.castro@controlstore.com', telefono: '3001230007', idRol: 3, estado: 'activo' }
            ]
        };
    }

    let enMemoria = null;

    function leer() {
        if (enMemoria) return enMemoria;
        try {
            const guardado = localStorage.getItem(CLAVE);
            enMemoria = guardado ? JSON.parse(guardado) : datosDeEjemplo();
        } catch (e) {
            enMemoria = datosDeEjemplo();
        }
        return enMemoria;
    }

    function guardar() {
        try { localStorage.setItem(CLAVE, JSON.stringify(enMemoria)); } catch (e) { /* solo en memoria */ }
    }

    return {
        // SELECT * FROM roles
        obtenerRoles: function () { return ROLES; },
        // SELECT * FROM roles WHERE id_rol = ?
        obtenerRol: function (idRol) {
            return ROLES.find(function (r) { return r.idRol === idRol; });
        },
        // SELECT * FROM usuarios
        obtenerUsuarios: function () { return leer().usuarios; },
        // SELECT ... WHERE id_usuario = ?   (la llave primaria, la que usan ventas y domicilios)
        obtenerUsuario: function (idUsuario) {
            return leer().usuarios.find(function (u) { return u.idUsuario === idUsuario; });
        },
        // SELECT ... WHERE documento = ?
        obtenerPorDocumento: function (documento) {
            return leer().usuarios.find(function (u) { return u.documento === documento; });
        },
        // SELECT ... WHERE email = ?   (sin importar mayúsculas: así se escribe en el login)
        obtenerPorCorreo: function (correo) {
            const buscado = correo.trim().toLowerCase();
            return leer().usuarios.find(function (u) { return u.correo.toLowerCase() === buscado; });
        },
        // INSERT INTO usuarios: el id lo pone el Repository, como el AUTO_INCREMENT de MySQL
        agregarUsuario: function (usuario) {
            const usuarios = leer().usuarios;
            const mayorId = usuarios.reduce(function (mayor, u) { return Math.max(mayor, u.idUsuario); }, 0);
            usuario.idUsuario = mayorId + 1;
            usuarios.push(usuario);
            guardar();
            return usuario;
        },
        // UPDATE usuarios SET ... WHERE id_usuario = ?
        actualizarUsuario: function (idUsuario, cambios) {
            const usuario = this.obtenerUsuario(idUsuario);
            if (!usuario) return undefined;
            Object.assign(usuario, cambios);
            guardar();
            return usuario;
        },
        restablecer: function () { enMemoria = datosDeEjemplo(); guardar(); }
    };
})();
