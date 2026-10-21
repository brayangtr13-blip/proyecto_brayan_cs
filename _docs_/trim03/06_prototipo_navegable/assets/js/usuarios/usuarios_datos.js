// Módulo 1 – Usuarios · Patrón REPOSITORY
// Único acceso a los usuarios del módulo. Hoy: localStorage. Con Django: fetch a la API.

const RepositorioUsuarios = (function () {
    const CLAVE = 'controlstore_usuarios_v1';

    function datosDeEjemplo() {
        return {
            usuarios: [
                { documento: '1020304050', nombres: 'Laura', apellidos: 'Gomez', correo: 'laura@controlstore.com', telefono: '3001234567', rol: 'vendedor', estado: 'activo' },
                { documento: '1122334455', nombres: 'Carlos', apellidos: 'Ruiz', correo: 'carlos@controlstore.com', telefono: '3009876543', rol: 'domiciliario', estado: 'activo' }
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
        // SELECT * FROM usuarios
        obtenerUsuarios: function () { return leer().usuarios; },
        // SELECT ... WHERE documento = ?
        obtenerUsuario: function (documento) {
            return leer().usuarios.find(function (u) { return u.documento === documento; });
        },
        // INSERT INTO usuarios
        agregarUsuario: function (usuario) {
            leer().usuarios.push(usuario);
            guardar();
            return usuario;
        },
        // UPDATE usuarios SET ... WHERE documento = ?
        actualizarUsuario: function (documento, cambios) {
            const usuario = this.obtenerUsuario(documento);
            if (!usuario) return undefined;
            Object.assign(usuario, cambios);
            guardar();
            return usuario;
        },
        restablecer: function () { enMemoria = datosDeEjemplo(); guardar(); }
    };
})();
