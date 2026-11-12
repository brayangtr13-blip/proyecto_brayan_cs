// Formulario mostrar/ocultar contraseña

// IIFE: las variables de esta pantalla no quedan globales ni chocan con otros scripts
(function () {
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
    const loginAlerta = document.getElementById('loginAlerta');
    const PANEL_POR_ROL = { administrador: 'admin.html', cajero: 'cajero.html', domiciliario: 'domiciliario.html' };

    formLogin.addEventListener('submit', function (evento) {
        evento.preventDefault();
        loginAlerta.classList.add('d-none');

       if (formLogin.checkValidity() === false) {
        formLogin.classList.add('was-validated');
        return;
      }

        // Sesion busca al usuario en RepositorioUsuarios y decide si puede entrar.
        // Si no puede (no existe o está inactivo), se muestra el motivo y no se navega.
        const resultado = Sesion.iniciar(document.getElementById('usuario').value);
        if (!resultado.ok) {
            loginAlerta.textContent = resultado.error;
            loginAlerta.classList.remove('d-none');
            return;
        }
        window.location.href = '../roles/' + PANEL_POR_ROL[resultado.usuario.rol];
    });
})();
