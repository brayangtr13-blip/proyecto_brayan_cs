// Módulo 1 – Usuarios · Patrón SERVICE
// Reglas de negocio del módulo. Las pantallas no las repiten: llaman a ServicioUsuarios.*
// Depende de: usuarios_datos.js

// Falla rápido si el HTML no cargó antes las dependencias (orden de <script>)
if (typeof RepositorioUsuarios === 'undefined') throw new Error('usuarios_servicio.js: falta cargar antes usuarios_datos.js');

const ServicioUsuarios = (function () {

    // 'cajero' (como está en la tabla roles) → 'Cajero' para mostrar en pantalla
    function textoRol(idRol) {
        const rol = RepositorioUsuarios.obtenerRol(idRol);
        if (!rol) return 'Sin rol';
        return rol.nombre.charAt(0).toUpperCase() + rol.nombre.slice(1);
    }

    function nombreCompleto(usuario) {
        return usuario.nombres + ' ' + usuario.apellidos;
    }

    // CS-75 / RF04.2: no se registra dos veces el mismo documento ni el mismo correo
    // (en la BD los dos son UNIQUE)
    function registrarUsuario(usuario) {
        if (RepositorioUsuarios.obtenerPorDocumento(usuario.documento) ||
            RepositorioUsuarios.obtenerPorCorreo(usuario.correo)) {
            return { ok: false, error: 'duplicado' };
        }
        return { ok: true, usuario: RepositorioUsuarios.agregarUsuario(usuario) };
    }

    // El id y el documento no se editan: son la llave y la identidad del usuario.
    // Si cambia el correo, tampoco puede quedar repetido con el de otro usuario.
    function editarUsuario(idUsuario, cambios) {
        if (cambios.correo) {
            const dueno = RepositorioUsuarios.obtenerPorCorreo(cambios.correo);
            if (dueno && dueno.idUsuario !== idUsuario) return { ok: false, error: 'duplicado' };
        }
        const usuario = RepositorioUsuarios.actualizarUsuario(idUsuario, cambios);
        return usuario ? { ok: true, usuario: usuario } : { ok: false, error: 'No existe el usuario.' };
    }

    // CS-83: activar/inactivar en vez de borrar
    function alternarEstado(idUsuario) {
        const usuario = RepositorioUsuarios.obtenerUsuario(idUsuario);
        if (!usuario) return { ok: false, error: 'No existe el usuario.' };
        return editarUsuario(idUsuario, { estado: usuario.estado === 'activo' ? 'inactivo' : 'activo' });
    }

    return {
        textoRol: textoRol,
        nombreCompleto: nombreCompleto,
        registrarUsuario: registrarUsuario,
        editarUsuario: editarUsuario,
        alternarEstado: alternarEstado
    };
})();
