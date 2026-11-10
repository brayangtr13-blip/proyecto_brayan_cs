// Sesión simulada: quién entró y con qué rol. La guarda login.js y la leen las pantallas.
// sessionStorage (no localStorage): se borra al cerrar la pestaña, como una sesión real.
// Los usuarios NO viven aquí: se buscan en RepositorioUsuarios (una sola fuente).
// Con el backend, esto lo reemplaza el token JWT que devuelve el login (CS-253).

// Falla rápido si el HTML no cargó antes las dependencias (orden de <script>)
if (typeof RepositorioUsuarios === 'undefined') throw new Error('sesion.js: falta cargar antes usuarios/usuarios_datos.js');

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

        if (!usuario) return { ok: false, error: 'Usuario o contraseña incorrectos' };
        if (usuario.estado !== 'activo') return { ok: false, error: 'Usuario inactivo. Comunícate con el administrador.' };

        const sesion = datosDeSesion(usuario);
        try { sessionStorage.setItem(CLAVE, JSON.stringify(sesion)); } catch (e) { /* sin almacenamiento */ }
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
        try { sessionStorage.removeItem(CLAVE); } catch (e) { /* sin almacenamiento */ }
    }

    return { iniciar: iniciar, actual: actual, cerrar: cerrar };
})();
