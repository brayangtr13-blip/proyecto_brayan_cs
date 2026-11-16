// Botón de cerrar sesión, ahora dentro del menú de perfil (el modal se abre solo, por data-bs-toggle)

// IIFE: las variables de esta pantalla no quedan globales ni chocan con otros scripts
(function () {
    const confirmarCerrarSesion = document.getElementById('confirmarCerrarSesion');

    // El menú de perfil muestra a quien inició sesión (antes el nombre estaba escrito en el HTML)
    document.querySelectorAll('[data-sesion="nombre"]').forEach(function (elemento) {
        elemento.textContent = Sesion.actual().nombre;
    });

    // RF02: antes solo volvía al login y la sesión seguía guardada; ahora se borra primero
    confirmarCerrarSesion.addEventListener('click', function () {
        Sesion.cerrar();
        window.location.href = '../company/login.html';
    });
})();
