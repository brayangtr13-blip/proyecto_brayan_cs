// Elementos del modal de cambiar estado
const modalCambiarEstado = document.getElementById('modalCambiarEstado');
const modalCambiarEstadoTexto = document.getElementById('modalCambiarEstadoTexto');
const confirmarCambiarEstado = document.getElementById('confirmarCambiarEstado');
const estadoExito = document.getElementById('estadoExito');

let documentoSeleccionado = null;

// Antes de que el modal se abra, averigua cuál botón lo activó
modalCambiarEstado.addEventListener('show.bs.modal', function (evento) {
    const boton = evento.relatedTarget;
    documentoSeleccionado = boton.dataset.documento;
    const nombre = boton.dataset.nombre;
    const estadoActual = boton.dataset.estadoActual;
    const accion = estadoActual === 'activo' ? 'inactivar' : 'activar';
    modalCambiarEstadoTexto.textContent = '¿Desea ' + accion + ' a ' + nombre + '?';
});

// Al confirmar con "Sí", cambia visualmente el estado en la tabla
confirmarCambiarEstado.addEventListener('click', function () {
    const badge = document.getElementById('estado-' + documentoSeleccionado);
    const boton = document.querySelector('[data-documento="' + documentoSeleccionado + '"]');

    if (badge.textContent === 'Activo') {
        badge.textContent = 'Inactivo';
        badge.classList.remove('text-bg-success');
        badge.classList.add('text-bg-danger');
        boton.dataset.estadoActual = 'inactivo';
    } else {
        badge.textContent = 'Activo';
        badge.classList.remove('text-bg-danger');
        badge.classList.add('text-bg-success');
        boton.dataset.estadoActual = 'activo';
    }

    bootstrap.Modal.getInstance(modalCambiarEstado).hide();
    estadoExito.classList.remove('d-none');
});

