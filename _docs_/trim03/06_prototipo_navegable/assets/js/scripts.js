// Validación del formulario de contacto
const formContacto = document.getElementById('formContacto');
const mensajeEnviado = document.getElementById('mensajeEnviado');

formContacto.addEventListener('submit', function (evento) {
    evento.preventDefault();
    evento.stopPropagation();

    if (formContacto.checkValidity() === false) {
        formContacto.classList.add('was-validated');
        mensajeEnviado.classList.add('d-none');
        return;
    }

    formContacto.classList.add('was-validated');
    mensajeEnviado.classList.remove('d-none');
    formContacto.reset();
    formContacto.classList.remove('was-validated');
});
