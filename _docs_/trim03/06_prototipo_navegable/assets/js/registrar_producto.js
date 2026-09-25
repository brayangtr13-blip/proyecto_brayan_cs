// Referencias a los elementos que este script necesita tocar.
// Se buscan una sola vez al cargar la pagina, no en cada evento.
const formRegistrarProducto = document.getElementById('formRegistrarProducto');
const registroExito = document.getElementById('registroExito');
const registroDuplicado = document.getElementById('registroDuplicado');
const codigoProducto = document.getElementById('codigoProducto');

// Mismos codigos que ya existen en listar_productos.js: sin backend, esta es la
// unica forma de detectar un codigo de barras repetido antes de "guardar".
const codigosExistentes = ["7702001001", "7702001002", "7702001003", "7702001004", "7702001005"];

// Patron Observer: el formulario "avisa" cuando alguien intenta enviarlo,
// y esta funcion reacciona a ese aviso.
formRegistrarProducto.addEventListener('submit', function (evento) {
    // Sin esto, el navegador recargaria la pagina al enviar el formulario
    // (comportamiento por defecto de un <form>), perdiendo el mensaje de exito.
    evento.preventDefault();

    // Cada intento de envio empieza limpio: se ocultan los avisos del intento anterior.
    registroExito.classList.add('d-none');
    registroDuplicado.classList.add('d-none');

    // checkValidity() revisa TODOS los required/pattern/min del formulario de una vez.
    // Si algo falla, was-validated hace que Bootstrap pinte los campos en rojo
    // y muestre los .invalid-feedback correspondientes.
    if (formRegistrarProducto.checkValidity() === false) {
        formRegistrarProducto.classList.add('was-validated');
        return;
    }

    // CS-12: no se puede registrar dos veces el mismo codigo de barras.
    if (codigosExistentes.includes(codigoProducto.value.trim())) {
        registroDuplicado.classList.remove('d-none');
        return;
    }

    // Sin backend todavia: se simula el registro exitoso mostrando la alerta
    // y dejando el formulario listo para cargar otro producto.
    registroExito.classList.remove('d-none');
    formRegistrarProducto.reset();
    formRegistrarProducto.classList.remove('was-validated');
});
