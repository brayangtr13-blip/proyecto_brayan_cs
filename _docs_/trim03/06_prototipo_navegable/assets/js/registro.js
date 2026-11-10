// Registro desde el login (CS-77). La cuenta se guarda con ServicioUsuarios (las mismas reglas que
// la pantalla del administrador) y aparece en Usuarios como inactiva, con el rol que eligió la persona.

// IIFE: las variables de esta pantalla no quedan globales ni chocan con otros scripts
(function () {
    const formRegistro = document.getElementById('formRegistro');
    const registroExito = document.getElementById('registroExito');
    const registroError = document.getElementById('registroError');
    const campoContrasena = document.getElementById('contrasena');
    const campoConfirmar = document.getElementById('confirmarContrasena');
    const iconoOjo = document.getElementById('iconoOjo');
    const campoRol = document.getElementById('rol');

    // Solo en un sistema recién instalado (sin administrador) se ofrece ese rol: el primero que
    // se registre lo toma y, desde ahí, la opción desaparece. Con los datos de la BD nunca se ve.
    if (!ServicioUsuarios.hayAdministrador()) {
        campoRol.add(new Option('Administrador', '1'));
    }

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

        // La cuenta nace inactiva con el rol elegido (en la BD id_rol es NOT NULL): el administrador la activa.
        // La contraseña no se guarda en el prototipo: con el backend se guarda cifrada (RF04.1).
        const resultado = ServicioUsuarios.registrarUsuario({
            documento: document.getElementById('documento').value.trim(),
            nombres: document.getElementById('nombres').value.trim(),
            apellidos: document.getElementById('apellidos').value.trim(),
            correo: document.getElementById('correo').value.trim().toLowerCase(),
            telefono: document.getElementById('telefono').value.trim() || null,
            idRol: Number(campoRol.value),
            estado: 'inactivo'
        });
        if (!resultado.ok) {
            // Mensaje según el motivo que devuelve el Service
            registroError.textContent = resultado.error === 'administrador'
                ? 'El sistema ya tiene un administrador. Elige otro rol.'
                : 'Ya existe una cuenta con ese documento o correo. Si olvidaste la contraseña, recupérala desde el inicio de sesión.';
            registroError.classList.remove('d-none');
            return;
        }

        // Si esta cuenta tomó el rol de administrador, la opción ya no se ofrece a nadie más
        const opcionAdministrador = campoRol.querySelector('option[value="1"]');
        if (opcionAdministrador && ServicioUsuarios.hayAdministrador()) opcionAdministrador.remove();

        registroExito.classList.remove('d-none');
        formRegistro.reset();
        formRegistro.classList.remove('was-validated');
    });
})();
