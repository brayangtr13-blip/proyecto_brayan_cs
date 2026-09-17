// Formulario mostrar/ocultar contraseña

const botonMostrarContrasena =
document.getElementById('botonMostrarContrasena');
const campoContrasena = document.getElementById('contrasena');
const iconoOjo = document.getElementById('iconoOjo');

botonMostrarContrasena.addEventListener('click', function () {
   if (campoContrasena.type === 'password') {
    campoContrasena.type = 'text';
    iconoOjo.classList.remove('bi-eye');
    iconoOjo.classList.add('bi-eye-slash');
} else {
    campoContrasena.type = 'password';
    iconoOjo.classList.remove('bi-eye-slash');
    iconoOjo.classList.add('bi-eye');
}
});

// Formulario de login: no enviar si hay campos vacíos
const formLogin = document.getElementById('formLogin');

formLogin.addEventListener('submit', function (evento) {
    evento.preventDefault();
    
   if (formLogin.checkValidity() === false) {
    formLogin.classList.add('was-validated');
    return;
  }

    // Sin backend todavía: simula el login exitoso y entra al panel
    window.location.href = '../roles/admin.html';
});