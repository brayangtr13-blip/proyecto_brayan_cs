// Botón de cerrar sesión, ahora dentro del menú de perfil (el modal se abre solo, por data-bs-toggle)
const confirmarCerrarSesion = document.getElementById('confirmarCerrarSesion');

confirmarCerrarSesion.addEventListener('click', function () {
    window.location.href = '../company/login.html';
});
