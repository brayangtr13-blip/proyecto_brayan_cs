// Sesión simulada: quién entró y con qué rol. La guarda login.js y la leen las pantallas.
// sessionStorage (no localStorage): se borra al cerrar la pestaña, como una sesión real.
// Con Django, esto lo reemplaza la sesión del servidor (request.user).

const Sesion = (function () {
    const CLAVE = 'controlstore_sesion';

    // Usuarios reales de la tabla usuarios (id_usuario, rol)
    const USUARIOS = {
        admin: { idUsuario: 1, nombre: 'Andrés Gómez', rol: 'administrador' },
        juan: { idUsuario: 2, nombre: 'Juan Carlos Pérez', rol: 'cajero' },
        luis: { idUsuario: 3, nombre: 'Luis Pérez', rol: 'domiciliario' }
    };

    // Acepta el alias o el correo de la BD; cualquier otro entra como administrador (prototipo)
    function iniciar(usuarioEscrito) {
        const texto = usuarioEscrito.trim().toLowerCase();
        let usuario = USUARIOS.admin;
        if (texto === 'juan' || texto === 'juan.perez@controlstore.com') usuario = USUARIOS.juan;
        if (texto === 'luis' || texto === 'luis.p@controlstore.com') usuario = USUARIOS.luis;
        try { sessionStorage.setItem(CLAVE, JSON.stringify(usuario)); } catch (e) { /* sin almacenamiento */ }
        return usuario;
    }

    // Si se abre una página sin pasar por el login, se asume el administrador
    function actual() {
        try {
            const guardada = sessionStorage.getItem(CLAVE);
            if (guardada) return JSON.parse(guardada);
        } catch (e) { /* sin almacenamiento */ }
        return USUARIOS.admin;
    }

    return { iniciar: iniciar, actual: actual };
})();
