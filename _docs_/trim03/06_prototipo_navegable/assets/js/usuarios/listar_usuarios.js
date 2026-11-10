// Listar usuarios (CS-83). Solo conecta la pantalla con RepositorioUsuarios y ServicioUsuarios.

// IIFE: las variables de esta pantalla no quedan globales ni chocan con otros scripts
(function () {
    const cuerpoUsuarios = document.getElementById('cuerpoUsuarios');
    const modalCambiarEstado = document.getElementById('modalCambiarEstado');
    const modalCambiarEstadoTexto = document.getElementById('modalCambiarEstadoTexto');
    const confirmarCambiarEstado = document.getElementById('confirmarCambiarEstado');
    const estadoExito = document.getElementById('estadoExito');
    const estadoError = document.getElementById('estadoError');

    let idSeleccionado = null;

    // Dibuja el <tbody> desde el Repository (antes las filas estaban escritas a mano en el HTML)
    function renderizarUsuarios() {
        cuerpoUsuarios.innerHTML = '';
        RepositorioUsuarios.obtenerUsuarios().forEach(function (usuario) {
            const activo = usuario.estado === 'activo';
            // El administrador no se inactiva (regla de ServicioUsuarios): su botón se ve, pero deshabilitado
            const esAdministrador = usuario.idRol === 1;
            const fila = document.createElement('tr');
            fila.innerHTML =
                '<td>' + usuario.documento + '</td>' +
                '<td>' + usuario.nombres + '</td>' +
                '<td>' + usuario.apellidos + '</td>' +
                '<td>' + usuario.correo + '</td>' +
                // En la BD el teléfono es opcional (NULL): se muestra una raya en vez de "null"
                '<td>' + (usuario.telefono || '—') + '</td>' +
                '<td>' + ServicioUsuarios.textoRol(usuario.idRol) + '</td>' +
                '<td><span class="badge text-bg-' + (activo ? 'success' : 'danger') + '">' +
                    (activo ? 'Activo' : 'Inactivo') + '</span></td>' +
                '<td>' +
                    '<a href="editar_usuario.html?id=' + usuario.idUsuario + '" class="btn btn-sm btn-outline-primary" title="Editar"><i class="bi bi-pencil"></i></a> ' +
                    '<button type="button" class="btn btn-sm btn-outline-danger" ' +
                        (esAdministrador
                            ? 'title="El administrador no se puede inactivar" disabled>'
                            : 'title="Cambiar estado" data-bs-toggle="modal" data-bs-target="#modalCambiarEstado" ' +
                              'data-id="' + usuario.idUsuario + '">') +
                        '<i class="bi bi-toggle-' + (activo ? 'on' : 'off') + '"></i></button>' +
                '</td>';
            cuerpoUsuarios.appendChild(fila);
        });
    }

    // Antes de que el modal se abra, averigua cuál botón lo activó.
    // data-id llega como texto ("6"): Number() lo vuelve número para compararlo con idUsuario.
    modalCambiarEstado.addEventListener('show.bs.modal', function (evento) {
        idSeleccionado = Number(evento.relatedTarget.dataset.id);
        const usuario = RepositorioUsuarios.obtenerUsuario(idSeleccionado);
        const accion = usuario.estado === 'activo' ? 'inactivar' : 'activar';
        modalCambiarEstadoTexto.textContent = '¿Desea ' + accion + ' a ' + ServicioUsuarios.nombreCompleto(usuario) + '?';
    });

    // Al confirmar con "Sí", el Service cambia el estado y la tabla se vuelve a dibujar
    // Si el Service rechaza el cambio, se muestra su motivo en vez del mensaje de éxito
    confirmarCambiarEstado.addEventListener('click', function () {
        const resultado = ServicioUsuarios.alternarEstado(idSeleccionado);
        bootstrap.Modal.getInstance(modalCambiarEstado).hide();
        renderizarUsuarios();
        estadoExito.classList.toggle('d-none', !resultado.ok);
        estadoError.classList.toggle('d-none', resultado.ok);
        if (!resultado.ok) estadoError.textContent = resultado.error;
    });

    renderizarUsuarios();
})();
