// Botón de cerrar sesión en el encabezado 

const botonCerrarSesion = document.getElementById('botonCerrarSesion');
const modalCerrarSesion = new bootstrap.Modal(document.getElementById('modalCerrarSesion'));
const confirmarCerrarSesion = document.getElementById('confirmarCerrarSesion');
botonCerrarSesion.addEventListener('click', function () {
    modalCerrarSesion.show();
});
confirmarCerrarSesion.addEventListener('click', function () {
    window.location.href = '../company/login.html';
});