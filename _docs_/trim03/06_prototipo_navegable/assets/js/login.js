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

    // Sin backend todavía: simula el login exitoso y envía a cada rol a SU panel.
    // Luis Pérez es el domiciliario de la base de datos (luis.p@controlstore.com);
    // cualquier otro usuario entra al panel del administrador.
    // Con Django, el rol vendrá de usuarios.id_rol y no de lo que se escriba aquí.
    const usuario = document.getElementById('usuario').value.trim().toLowerCase();
    if (usuario === 'luis' || usuario === 'luis.p@controlstore.com') {
        window.location.href = '../roles/domiciliario.html';
    } else {
        window.location.href = '../roles/admin.html';
    }
});