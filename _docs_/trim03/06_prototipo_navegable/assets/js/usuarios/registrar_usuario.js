// Registrar usuario. Solo conecta la pantalla con ServicioUsuarios.

const formRegistrarUsuario = document.getElementById('formRegistrarUsuario');
const registroExito = document.getElementById('registroExito');
const registroDuplicado = document.getElementById('registroDuplicado');
const documento = document.getElementById('documento');

formRegistrarUsuario.addEventListener('submit', function (evento) {
    evento.preventDefault();

    // Cada intento de envio empieza limpio: se ocultan los avisos del intento anterior.
    registroExito.classList.add('d-none');
    registroDuplicado.classList.add('d-none');

    if (formRegistrarUsuario.checkValidity() === false) {
        formRegistrarUsuario.classList.add('was-validated');
        return;
    }

    // El Service rechaza un documento ya registrado.
    // La contraseña no se guarda en el prototipo: con Django se guarda cifrada.
    const resultado = ServicioUsuarios.registrarUsuario({
        documento: documento.value.trim(),
        nombres: document.getElementById('nombres').value.trim(),
        apellidos: document.getElementById('apellidos').value.trim(),
        correo: document.getElementById('correo').value.trim(),
        telefono: document.getElementById('telefono').value.trim(),
        rol: document.getElementById('rol').value,
        estado: document.getElementById('estado').value
    });
    if (!resultado.ok) {
        registroDuplicado.classList.remove('d-none');
        return;
    }

    registroExito.classList.remove('d-none');
    formRegistrarUsuario.reset();
    formRegistrarUsuario.classList.remove('was-validated');
});