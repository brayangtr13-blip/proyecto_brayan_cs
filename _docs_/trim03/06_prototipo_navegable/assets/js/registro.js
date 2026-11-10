// Registro desde el login (CS-77). La cuenta se guarda con ServicioUsuarios (la misma regla de
// duplicados que la pantalla del administrador) y aparece en Usuarios como inactiva y sin rol.

// IIFE: las variables de esta pantalla no quedan globales ni chocan con otros scripts
(function () {
    const formRegistro = document.getElementById('formRegistro');
    const registroExito = document.getElementById('registroExito');
    const registroError = document.getElementById('registroError');
    const campoContrasena = document.getElementById('contrasena');
    const campoConfirmar = document.getElementById('confirmarContrasena');
    const iconoOjo = document.getElementById('iconoOjo');

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

        // La cuenta nace inactiva y sin rol (idRol: null): el administrador le pone el rol y la activa.
        // La contraseña no se guarda en el prototipo: con el backend se guarda cifrada (RF04.1).
        const resultado = ServicioUsuarios.registrarUsuario({
            documento: document.getElementById('documento').value.trim(),
            nombres: document.getElementById('nombres').value.trim(),
            apellidos: document.getElementById('apellidos').value.trim(),
            correo: document.getElementById('correo').value.trim().toLowerCase(),
            telefono: document.getElementById('telefono').value.trim() || null,
            idRol: null,
            estado: 'inactivo'
        });
        if (!resultado.ok) {
            registroError.textContent = 'Ya existe una cuenta con ese documento o correo. Si olvidaste la contraseña, recupérala desde el inicio de sesión.';
            registroError.classList.remove('d-none');
            return;
        }

        registroExito.classList.remove('d-none');
        formRegistro.reset();
        formRegistro.classList.remove('was-validated');
    });
})();
