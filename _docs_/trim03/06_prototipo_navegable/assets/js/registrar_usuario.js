const formRegistrarUsuario = document.getElementById('formRegistrarUsuario');
const registroExito = document.getElementById('registroExito');
const registroDuplicado = document.getElementById('registroDuplicado');

formRegistrarUsuario.addEventListener('submit', function (evento) {
        evento.preventDefault();
        if (formRegistrarUsuario.checkValidity() === false) {
        formRegistrarUsuario.classList.add('was-validated');
                return;
        }

registroExito.classList.remove('d-none');
    formRegistrarUsuario.reset();
        formRegistrarUsuario.classList.remove('was-validated');
        });