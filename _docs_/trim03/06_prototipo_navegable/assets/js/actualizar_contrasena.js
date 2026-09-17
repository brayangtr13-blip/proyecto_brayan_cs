const formActualizar = document.getElementById('formActualizar');
const actualizarAlerta = document.getElementById('actualizarAlerta');
const campoNuevaContrasena = document.getElementById('nuevaContrasena');
const campoConfirmarContrasena = document.getElementById('confirmarContrasena');

function validarCoincidencia() {
    if (campoNuevaContrasena.value !== campoConfirmarContrasena.value) {
        campoConfirmarContrasena.setCustomValidity("Las contraseñas no coinciden");
    } else {
        campoConfirmarContrasena.setCustomValidity("");
       }
}

campoNuevaContrasena.addEventListener('input', validarCoincidencia);
campoConfirmarContrasena.addEventListener('input', validarCoincidencia);

formActualizar.addEventListener('submit', function (evento) {
    evento.preventDefault();

    if (formActualizar.checkValidity() === false) {
        formActualizar.classList.add('was-validated');
        return;
    }

    actualizarAlerta.classList.remove('d-none');
    setTimeout(function () {
        window.location.href = 'login.html';
    }, 2000);
});
