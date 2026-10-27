// Listar usuarios (CS-83). Solo conecta la pantalla con RepositorioUsuarios y ServicioUsuarios.

// IIFE: las variables de esta pantalla no quedan globales ni chocan con otros scripts
(function () {
    const cuerpoUsuarios = document.getElementById('cuerpoUsuarios');
    const modalCambiarEstado = document.getElementById('modalCambiarEstado');
    const modalCambiarEstadoTexto = document.getElementById('modalCambiarEstadoTexto');
    const confirmarCambiarEstado = document.getElementById('confirmarCambiarEstado');
    const estadoExito = document.getElementById('estadoExito');

    let documentoSeleccionado = null;

    // Dibuja el <tbody> desde el Repository (antes las filas estaban escritas a mano en el HTML)
    function renderizarUsuarios() {
        cuerpoUsuarios.innerHTML = '';
        RepositorioUsuarios.obtenerUsuarios().forEach(function (usuario) {
            const activo = usuario.estado === 'activo';
            const fila = document.createElement('tr');
            fila.innerHTML =
                '<td>' + usuario.documento + '</td>' +
                '<td>' + usuario.nombres + '</td>' +
                '<td>' + usuario.apellidos + '</td>' +
                '<td>' + usuario.correo + '</td>' +
                '<td>' + usuario.telefono + '</td>' +
                '<td>' + ServicioUsuarios.textoRol(usuario.rol) + '</td>' +
                '<td><span class="badge text-bg-' + (activo ? 'success' : 'danger') + '">' +
                    (activo ? 'Activo' : 'Inactivo') + '</span></td>' +
                '<td>' +
                    '<a href="editar_usuario.html?documento=' + usuario.documento + '" class="btn btn-sm btn-outline-primary" title="Editar"><i class="bi bi-pencil"></i></a> ' +
                    '<button type="button" class="btn btn-sm btn-outline-danger" title="Cambiar estado" ' +
                        'data-bs-toggle="modal" data-bs-target="#modalCambiarEstado" ' +
                        'data-documento="' + usuario.documento + '">' +
                        '<i class="bi bi-toggle-' + (activo ? 'on' : 'off') + '"></i></button>' +
                '</td>';
            cuerpoUsuarios.appendChild(fila);
        });
    }

    // Antes de que el modal se abra, averigua cuál botón lo activó
    modalCambiarEstado.addEventListener('show.bs.modal', function (evento) {
        documentoSeleccionado = evento.relatedTarget.dataset.documento;
        const usuario = RepositorioUsuarios.obtenerUsuario(documentoSeleccionado);
        const accion = usuario.estado === 'activo' ? 'inactivar' : 'activar';
        modalCambiarEstadoTexto.textContent = '¿Desea ' + accion + ' a ' + ServicioUsuarios.nombreCompleto(usuario) + '?';
    });

    // Al confirmar con "Sí", el Service cambia el estado y la tabla se vuelve a dibujar
    confirmarCambiarEstado.addEventListener('click', function () {
        ServicioUsuarios.alternarEstado(documentoSeleccionado);
        bootstrap.Modal.getInstance(modalCambiarEstado).hide();
        renderizarUsuarios();
        estadoExito.classList.remove('d-none');
    });

    renderizarUsuarios();
})();
