// Módulo 1 – Usuarios · Patrón SERVICE
// Reglas de negocio del módulo. Las pantallas no las repiten: llaman a ServicioUsuarios.*
// Depende de: usuarios_datos.js, auditoria/auditoria_datos.js (RNF04)

// Falla rápido si el HTML no cargó antes las dependencias (orden de <script>)
if (typeof RepositorioUsuarios === 'undefined') throw new Error('usuarios_servicio.js: falta cargar antes usuarios_datos.js');
if (typeof RepositorioAuditoria === 'undefined') throw new Error('usuarios_servicio.js: falta cargar antes auditoria/auditoria_datos.js');

const ServicioUsuarios = (function () {

    // id_rol del administrador en la tabla roles
    const ROL_ADMINISTRADOR = 1;

    // Regla del negocio: el sistema tiene UN solo administrador.
    // El primero lo crean los datos iniciales de la BD (usuario 1); nadie más puede tomar ese rol.
    function hayAdministrador() {
        return RepositorioUsuarios.obtenerUsuarios().some(function (u) { return u.idRol === ROL_ADMINISTRADOR; });
    }

    // 'cajero' (como está en la tabla roles) → 'Cajero' para mostrar en pantalla
    function textoRol(idRol) {
        const rol = RepositorioUsuarios.obtenerRol(idRol);
        if (!rol) return 'Sin rol';
        return rol.nombre.charAt(0).toUpperCase() + rol.nombre.slice(1);
    }

    function nombreCompleto(usuario) {
        return usuario.nombres + ' ' + usuario.apellidos;
    }

    // RNF04: toda acción sobre usuarios queda en log_auditoria (módulo Usuarios)
    function auditar(accion, detalle, idUsuario) {
        const evento = { idModulo: RepositorioAuditoria.MODULO.USUARIOS, accion: accion, detalle: detalle };
        if (idUsuario !== undefined) evento.idUsuario = idUsuario;
        RepositorioAuditoria.registrar(evento);
    }

    // CS-75 / RF04.2: no se registra dos veces el mismo documento ni el mismo correo
    // (en la BD los dos son UNIQUE)
    // autoregistro = true cuando la cuenta la crea la misma persona desde «Regístrate» (no hay sesión)
    function registrarUsuario(usuario, autoregistro) {
        if (RepositorioUsuarios.obtenerPorDocumento(usuario.documento) ||
            RepositorioUsuarios.obtenerPorCorreo(usuario.correo)) {
            return { ok: false, error: 'duplicado' };
        }
        // La pantalla ya no ofrece la opción, pero la regla vive aquí: así se cumple venga de donde venga
        if (usuario.idRol === ROL_ADMINISTRADOR && hayAdministrador()) {
            return { ok: false, error: 'administrador' };
        }
        const nuevo = RepositorioUsuarios.agregarUsuario(usuario);
        if (autoregistro) {
            auditar('registrar', 'Solicitó una cuenta de ' + textoRol(nuevo.idRol).toLowerCase() + ' (queda inactiva)', nuevo.idUsuario);
        } else {
            auditar('registrar', 'Registró al usuario ' + nombreCompleto(nuevo) + ' (' + textoRol(nuevo.idRol) + ')');
        }
        return { ok: true, usuario: nuevo };
    }

    // El id y el documento no se editan: son la llave y la identidad del usuario.
    // Si cambia el correo, tampoco puede quedar repetido con el de otro usuario.
    // detalleAuditoria: lo que se escribe en el log (si no llega, "Actualizó los datos de ...")
    function editarUsuario(idUsuario, cambios, accion, detalleAuditoria) {
        if (cambios.correo) {
            const dueno = RepositorioUsuarios.obtenerPorCorreo(cambios.correo);
            if (dueno && dueno.idUsuario !== idUsuario) return { ok: false, error: 'duplicado' };
        }
        // Nadie más puede pasar a ser administrador (CS-77)
        const actual = RepositorioUsuarios.obtenerUsuario(idUsuario);
        if (actual && cambios.idRol === ROL_ADMINISTRADOR && actual.idRol !== ROL_ADMINISTRADOR) {
            return { ok: false, error: 'administrador' };
        }
        const usuario = RepositorioUsuarios.actualizarUsuario(idUsuario, cambios);
        if (!usuario) return { ok: false, error: 'No existe el usuario.' };
        auditar(accion || 'actualizar', detalleAuditoria || 'Actualizó los datos de ' + nombreCompleto(usuario));
        return { ok: true, usuario: usuario };
    }

    // CS-83: activar/inactivar en vez de borrar
    function alternarEstado(idUsuario) {
        const usuario = RepositorioUsuarios.obtenerUsuario(idUsuario);
        if (!usuario) return { ok: false, error: 'No existe el usuario.' };
        // Si el único administrador se inactiva, nadie podría volver a activar cuentas
        if (usuario.idRol === ROL_ADMINISTRADOR && usuario.estado === 'activo') {
            return { ok: false, error: 'No se puede inactivar al administrador: el sistema se quedaría sin quien active cuentas.' };
        }
        const nuevoEstado = usuario.estado === 'activo' ? 'inactivo' : 'activo';
        const accion = nuevoEstado === 'activo' ? 'activar' : 'inactivar';
        return editarUsuario(idUsuario, { estado: nuevoEstado }, accion,
            (accion === 'activar' ? 'Activó' : 'Inactivó') + ' la cuenta de ' + nombreCompleto(usuario));
    }

    return {
        hayAdministrador: hayAdministrador,
        textoRol: textoRol,
        nombreCompleto: nombreCompleto,
        registrarUsuario: registrarUsuario,
        editarUsuario: editarUsuario,
        alternarEstado: alternarEstado
    };
})();
