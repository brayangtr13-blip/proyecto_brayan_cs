// Módulo 1 – Usuarios · Patrón SERVICE
// Reglas de negocio del módulo. Las pantallas no las repiten: llaman a ServicioUsuarios.*
// Depende de: usuarios_datos.js

// Falla rápido si el HTML no cargó antes las dependencias (orden de <script>)
if (typeof RepositorioUsuarios === 'undefined') throw new Error('usuarios_servicio.js: falta cargar antes usuarios_datos.js');

const ServicioUsuarios = (function () {

    const ROLES = { vendedor: 'Vendedor', domiciliario: 'Domiciliario' };

    function textoRol(rol) { return ROLES[rol] || rol; }

    function nombreCompleto(usuario) {
        return usuario.nombres + ' ' + usuario.apellidos;
    }

    // No se registra dos veces el mismo documento
    function registrarUsuario(usuario) {
        if (RepositorioUsuarios.obtenerUsuario(usuario.documento)) {
            return { ok: false, error: 'duplicado' };
        }
        return { ok: true, usuario: RepositorioUsuarios.agregarUsuario(usuario) };
    }

    // El documento no se edita, es la llave del usuario
    function editarUsuario(documento, cambios) {
        const usuario = RepositorioUsuarios.actualizarUsuario(documento, cambios);
        return usuario ? { ok: true, usuario: usuario } : { ok: false, error: 'No existe el usuario.' };
    }

    // CS-83: activar/inactivar en vez de borrar
    function alternarEstado(documento) {
        const usuario = RepositorioUsuarios.obtenerUsuario(documento);
        if (!usuario) return { ok: false, error: 'No existe el usuario.' };
        return editarUsuario(documento, { estado: usuario.estado === 'activo' ? 'inactivo' : 'activo' });
    }

    return {
        textoRol: textoRol,
        nombreCompleto: nombreCompleto,
        registrarUsuario: registrarUsuario,
        editarUsuario: editarUsuario,
        alternarEstado: alternarEstado
    };
})();
