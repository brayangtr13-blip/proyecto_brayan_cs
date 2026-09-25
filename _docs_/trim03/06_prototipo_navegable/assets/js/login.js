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

    // Sin backend: guarda la sesión simulada (sesion.js) y abre el panel de su rol.
    // Con Django, el rol vendrá de usuarios.id_rol.
    const usuario = Sesion.iniciar(document.getElementById('usuario').value);
    const PANEL_POR_ROL = { administrador: 'admin.html', cajero: 'cajero.html', domiciliario: 'domiciliario.html' };
    window.location.href = '../roles/' + PANEL_POR_ROL[usuario.rol];
});