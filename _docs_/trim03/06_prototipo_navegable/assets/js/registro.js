// Registro desde el login (CS-77). Sin backend: valida y muestra el resultado.

const formRegistro = document.getElementById('formRegistro');
const registroExito = document.getElementById('registroExito');
const registroError = document.getElementById('registroError');
const campoContrasena = document.getElementById('contrasena');
const campoConfirmar = document.getElementById('confirmarContrasena');
const iconoOjo = document.getElementById('iconoOjo');

// Documentos y correos que ya existen en la tabla usuarios (UNIQUE en la BD)
const DOCUMENTOS_REGISTRADOS = ['1000000001', '1000000002', '1000000003'];
const CORREOS_REGISTRADOS = ['admin@controlstore.com', 'juan.perez@controlstore.com', 'luis.p@controlstore.com'];

// Mostrar u ocultar las dos contraseñas a la vez
document.getElementById('botonMostrarContrasena').addEventListener('click', function () {
    const ocultas = campoContrasena.type === 'password';
    campoContrasena.type = ocultas ? 'text' : 'password';
    campoConfirmar.type = ocultas ? 'text' : 'password';
    iconoOjo.classList.toggle('bi-eye', !ocultas);
    iconoOjo.classList.toggle('bi-eye-slash', ocultas);
});

// setCustomValidity: así Bootstrap marca en rojo la confirmación que no coincide
function revisarConfirmacion() {
    campoConfirmar.setCustomValidity(campoConfirmar.value === campoContrasena.value ? '' : 'No coincide');
}
campoContrasena.addEventListener('input', revisarConfirmacion);
campoConfirmar.addEventListener('input', revisarConfirmacion);

formRegistro.addEventListener('submit', function (evento) {
    evento.preventDefault();
    registroExito.classList.add('d-none');
    registroError.classList.add('d-none');
    revisarConfirmacion();

    if (formRegistro.checkValidity() === false) {
        formRegistro.classList.add('was-validated');
        return;
    }

    const documento = document.getElementById('documento').value.trim();
    const correo = document.getElementById('correo').value.trim().toLowerCase();
    if (DOCUMENTOS_REGISTRADOS.includes(documento) || CORREOS_REGISTRADOS.includes(correo)) {
        registroError.textContent = 'Ya existe una cuenta con ese documento o correo. Si olvidaste la contraseña, recupérala desde el inicio de sesión.';
        registroError.classList.remove('d-none');
        return;
    }

    // La cuenta nace inactiva y sin rol: la activa el administrador
    registroExito.classList.remove('d-none');
    formRegistro.reset();
    formRegistro.classList.remove('was-validated');
});
