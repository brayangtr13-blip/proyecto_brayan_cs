// Sesión simulada: quién entró y con qué rol. La guarda login.js y la leen las pantallas.
// sessionStorage (no localStorage): se borra al cerrar la pestaña, como una sesión real.
// Los usuarios NO viven aquí: se buscan en RepositorioUsuarios (una sola fuente).
// Con el backend, esto lo reemplaza el token JWT que devuelve el login (CS-253).

// Falla rápido si el HTML no cargó antes las dependencias (orden de <script>)
if (typeof RepositorioUsuarios === 'undefined') throw new Error('sesion.js: falta cargar antes usuarios/usuarios_datos.js');
if (typeof RepositorioAuditoria === 'undefined') throw new Error('sesion.js: falta cargar antes auditoria/auditoria_datos.js');

const Sesion = (function () {
    const CLAVE = 'controlstore_sesion';
    const ID_ADMINISTRADOR = 1;

    // Alias cortos para la demo; los tres apuntan a usuarios reales de la BD (id_usuario)
    const ALIAS = { admin: 1, juan: 2, luis: 3 };

    // Lo que se guarda en la sesión: solo lo que las pantallas necesitan, nunca la contraseña.
    // rol va como texto ('cajero') porque así lo comparan Ventas y Domicilios.
    function datosDeSesion(usuario) {
        return {
            idUsuario: usuario.idUsuario,
            nombre: usuario.nombres + ' ' + usuario.apellidos,
            rol: RepositorioUsuarios.obtenerRol(usuario.idRol).nombre
        };
    }

    // RF01: busca por alias o por correo.
    // RF01.2: si no existe → error. RF01.3: si está inactivo → no entra.
    // La contraseña no se valida: el prototipo no la guarda (la validará el backend).
    function iniciar(usuarioEscrito) {
        const texto = usuarioEscrito.trim().toLowerCase();
        const usuario = ALIAS[texto]
            ? RepositorioUsuarios.obtenerUsuario(ALIAS[texto])
            : RepositorioUsuarios.obtenerPorCorreo(texto);

        // RNF04: los intentos fallidos también quedan en el log (así se detecta quien prueba cuentas)
        if (!usuario) {
            // No se guarda lo que se escribió: podría ser una contraseña tecleada en el campo equivocado
            RepositorioAuditoria.registrar({ idUsuario: null, idModulo: RepositorioAuditoria.MODULO.USUARIOS,
                accion: 'login_fallido', detalle: 'Intento de acceso con un usuario o correo que no existe' });
            return { ok: false, error: 'Usuario o contraseña incorrectos' };
        }
        if (usuario.estado !== 'activo') {
            RepositorioAuditoria.registrar({ idUsuario: usuario.idUsuario, idModulo: RepositorioAuditoria.MODULO.USUARIOS,
                accion: 'login_fallido', detalle: 'Intento de acceso con una cuenta inactiva' });
            return { ok: false, error: 'Usuario inactivo. Comunícate con el administrador.' };
        }
        const sesion = datosDeSesion(usuario);
        try { sessionStorage.setItem(CLAVE, JSON.stringify(sesion)); } catch (e) { /* sin almacenamiento */ }
        RepositorioAuditoria.registrar({ idUsuario: usuario.idUsuario, idModulo: RepositorioAuditoria.MODULO.USUARIOS,
            accion: 'login', detalle: 'Inicio de sesión exitoso' });
        return { ok: true, usuario: sesion };
    }

    // Si se abre una página sin pasar por el login, se asume el administrador (prototipo).
    // Los guards por rol (CS-254) cambiarán esto por "volver al login".
    function actual() {
        try {
            const guardada = sessionStorage.getItem(CLAVE);
            if (guardada) return JSON.parse(guardada);
        } catch (e) { /* sin almacenamiento */ }
        return datosDeSesion(RepositorioUsuarios.obtenerUsuario(ID_ADMINISTRADOR));
    }

    // RF02: cerrar sesión = olvidar quién entró
    function cerrar() {
        // Solo se registra si de verdad había una sesión (actual() inventaría al administrador)
        let guardada = null;
        try { guardada = JSON.parse(sessionStorage.getItem(CLAVE)); } catch (e) { /* sin almacenamiento */ }
        if (guardada) {
            RepositorioAuditoria.registrar({ idUsuario: guardada.idUsuario, idModulo: RepositorioAuditoria.MODULO.USUARIOS,
                accion: 'logout', detalle: 'Cerró sesión' });
        }
        try { sessionStorage.removeItem(CLAVE); } catch (e) { /* sin almacenamiento */ }
    }

    return { iniciar: iniciar, actual: actual, cerrar: cerrar };
})();

// Lo que en el HTML lleva data-solo-rol="administrador" (u otro rol) solo lo ve ese rol.
// sesion.js se carga al final del <body>, así que estos elementos ya existen cuando corre.
// Ojo: solo esconde; la regla de verdad la valida el Service (y con la API, el servidor).
document.querySelectorAll('[data-solo-rol]').forEach(function (elemento) {
    if (elemento.dataset.soloRol !== Sesion.actual().rol) elemento.classList.add('d-none');
});
