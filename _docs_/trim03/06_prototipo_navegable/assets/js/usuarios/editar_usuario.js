// Editar usuario. Solo conecta la pantalla con RepositorioUsuarios y ServicioUsuarios.

// IIFE: las variables de esta pantalla no quedan globales ni chocan con otros scripts
(function () {
    const parametros = new URLSearchParams(window.location.search);
    // ?id=6 llega como texto: Number() lo vuelve número para buscarlo por idUsuario
    const idUrl = Number(parametros.get('id'));
    const usuario = RepositorioUsuarios.obtenerUsuario(idUrl);
    const formEditarUsuario = document.getElementById('formEditarUsuario');
    const edicionExito = document.getElementById('edicionExito');
    const edicionDuplicado = document.getElementById('edicionDuplicado');
    const campoRol = document.getElementById('rol');

    // Si llegan con un id que no existe (o sin parámetro), se avisa en vez de
    // romper la página en blanco (mismo criterio que editar_producto.js): todo lo que
    // depende de "usuario" queda dentro de este if, en vez de leerlo directamente.
    if (!usuario) {
        formEditarUsuario.classList.add('d-none');
        const aviso = document.createElement('div');
        aviso.className = 'alert alert-danger';
        aviso.textContent = 'No se encontró el usuario solicitado.';
        formEditarUsuario.insertAdjacentElement('beforebegin', aviso);
    } else {
        // El select no ofrece "Administrador". Si se edita al administrador, se agrega esa
        // opción solo para mostrarla y se bloquea el campo: su rol no se cambia desde aquí.
        if (usuario.idRol === 1) {
            campoRol.add(new Option('Administrador', '1'));
            campoRol.disabled = true;
        }

        // Precarga el formulario con los datos encontrados
        document.getElementById('documento').value = usuario.documento;
        document.getElementById('nombres').value = usuario.nombres;
        document.getElementById('apellidos').value = usuario.apellidos;
        document.getElementById('correo').value = usuario.correo;
        document.getElementById('telefono').value = usuario.telefono || '';
        campoRol.value = String(usuario.idRol);

        // Envío del formulario (igual al patrón de las páginas anteriores)
        formEditarUsuario.addEventListener('submit', function (evento) {
            evento.preventDefault();
            edicionExito.classList.add('d-none');
            edicionDuplicado.classList.add('d-none');

            if (formEditarUsuario.checkValidity() === false) {
                formEditarUsuario.classList.add('was-validated');
                return;
            }
            // El documento no se envía: no se edita. Teléfono vacío = NULL, como en la BD.
            const resultado = ServicioUsuarios.editarUsuario(usuario.idUsuario, {
                nombres: document.getElementById('nombres').value.trim(),
                apellidos: document.getElementById('apellidos').value.trim(),
                correo: document.getElementById('correo').value.trim(),
                telefono: document.getElementById('telefono').value.trim() || null,
                idRol: Number(campoRol.value)
            });
            if (!resultado.ok) {
                edicionDuplicado.classList.remove('d-none');
                return;
            }
            edicionExito.classList.remove('d-none');
        });
    }
})();
