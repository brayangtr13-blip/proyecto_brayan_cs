const formRegistrarUsuario = document.getElementById('formRegistrarUsuario');
const registroExito = document.getElementById('registroExito');
const registroDuplicado = document.getElementById('registroDuplicado');
const documento = document.getElementById('documento');

// Mismos documentos que ya existen en listar_usuarios.js: sin backend, esta es la
// unica forma de detectar un documento repetido antes de "guardar".
const documentosExistentes = ["1020304050", "1122334455"];

formRegistrarUsuario.addEventListener('submit', function (evento) {
    evento.preventDefault();

    // Cada intento de envio empieza limpio: se ocultan los avisos del intento anterior.
    registroExito.classList.add('d-none');
    registroDuplicado.classList.add('d-none');

    if (formRegistrarUsuario.checkValidity() === false) {
        formRegistrarUsuario.classList.add('was-validated');
        return;
    }

    // El usuario ya se encuentra registrado (mismo documento)
    if (documentosExistentes.includes(documento.value.trim())) {
        registroDuplicado.classList.remove('d-none');
        return;
    }

    registroExito.classList.remove('d-none');
    formRegistrarUsuario.reset();
    formRegistrarUsuario.classList.remove('was-validated');
});