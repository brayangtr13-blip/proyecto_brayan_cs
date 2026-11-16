// formulario Recuperar Contraseña

// IIFE: las variables de esta pantalla no quedan globales ni chocan con otros scripts
(function () {
    const formRecuperar = document.getElementById('formRecuperar');
    const recuperarAlerta = document.getElementById('recuperarAlerta');

    formRecuperar.addEventListener('submit', function (evento)  {
        evento.preventDefault();

        if (formRecuperar.checkValidity() === false) {
            formRecuperar.classList.add('was-validated');
            return;
    }

      // El correo es válido: mostramos el mensaje (genérico, exista o no el correo)
        recuperarAlerta.classList.remove('d-none');
    });
})();
