// Contraseña actual simulada (el backend la reemplaza por la validación real contra el hash)
const contrasenaActualSimulada = "Vendedor2024";

const formCambiarContrasena = document.getElementById('formCambiarContrasena');
const campoContrasenaActual = document.getElementById('contrasenaActual');
const campoNuevaContrasena = document.getElementById('nuevaContrasena');
const campoConfirmarNuevaContrasena = document.getElementById('confirmarNuevaContrasena');
const cambioExito = document.getElementById('cambioExito');
const cambioError = document.getElementById('cambioError');

// La nueva contraseña no puede ser igual a la actual
function validarNuevaDistinta() {
    if (campoNuevaContrasena.value !== '' && campoNuevaContrasena.value === campoContrasenaActual.value) {
        campoNuevaContrasena.setCustomValidity('La nueva contraseña no puede ser igual a la actual');
    } else {
        campoNuevaContrasena.setCustomValidity('');
    }
}

// Confirmar debe coincidir con la nueva (mismo patrón que ya usamos en CS-74)
function validarCoincidencia() {
    if (campoConfirmarNuevaContrasena.value !== campoNuevaContrasena.value) {
        campoConfirmarNuevaContrasena.setCustomValidity('Las contraseñas no coinciden');
    } else {
        campoConfirmarNuevaContrasena.setCustomValidity('');
    }
}

campoContrasenaActual.addEventListener('input', validarNuevaDistinta);
campoNuevaContrasena.addEventListener('input', function () {
    validarNuevaDistinta();
    validarCoincidencia();
});
campoConfirmarNuevaContrasena.addEventListener('input', validarCoincidencia);

formCambiarContrasena.addEventListener('submit', function (evento) {
    evento.preventDefault();
    cambioError.classList.add('d-none');

    if (formCambiarContrasena.checkValidity() === false) {
        formCambiarContrasena.classList.add('was-validated');
        return;
    }

    // Aparte de la validación de campos: revisa la "contraseña actual" simulada
    if (campoContrasenaActual.value !== contrasenaActualSimulada) {
        cambioError.classList.remove('d-none');
        return;
    }

    cambioExito.classList.remove('d-none');
    setTimeout(function () {
        // window.top: la ventana de más afuera — así se sale del iframe por completo
        window.top.location.href = '../../company/login.html';
    }, 2000);
});
