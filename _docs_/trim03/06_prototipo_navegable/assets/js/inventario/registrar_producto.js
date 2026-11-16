// Referencias a los elementos que este script necesita tocar.
// Se buscan una sola vez al cargar la pagina, no en cada evento.

// IIFE: las variables de esta pantalla no quedan globales ni chocan con otros scripts
(function () {
    const formRegistrarProducto = document.getElementById('formRegistrarProducto');
    const registroExito = document.getElementById('registroExito');
    const registroDuplicado = document.getElementById('registroDuplicado');
    const codigoProducto = document.getElementById('codigoProducto');

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

        // CS-12: el Service rechaza un codigo de barras repetido
        const resultado = ServicioInventario.registrarProducto({
            codigo: codigoProducto.value.trim(),
            nombre: document.getElementById('nombre').value.trim(),
            categoria: document.getElementById('categoria').value,
            unidadMedida: document.getElementById('unidadMedida').value,
            precio: Number(document.getElementById('precioUnitario').value),
            stock: Number(document.getElementById('stockActual').value),
            stockMinimo: Number(document.getElementById('stockMinimo').value),
            descripcion: document.getElementById('descripcion').value.trim(),
            estado: document.getElementById('estado').value
        });
        if (!resultado.ok) {
            registroDuplicado.classList.remove('d-none');
            return;
        }

        // Formulario listo para cargar otro producto
        registroExito.classList.remove('d-none');
        formRegistrarProducto.reset();
        formRegistrarProducto.classList.remove('was-validated');
    });
})();
