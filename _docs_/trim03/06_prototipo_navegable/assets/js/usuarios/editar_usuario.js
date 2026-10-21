// Editar usuario. Solo conecta la pantalla con RepositorioUsuarios y ServicioUsuarios.

const parametros = new URLSearchParams(window.location.search);
const documentoUrl = parametros.get('documento');
const usuario = RepositorioUsuarios.obtenerUsuario(documentoUrl);
const formEditarUsuario = document.getElementById('formEditarUsuario');
const edicionExito = document.getElementById('edicionExito');

// Si llegan con un documento que no existe (o sin parámetro), se avisa en vez de
// romper la página en blanco (mismo criterio que editar_producto.js): todo lo que
// depende de "usuario" queda dentro de este if, en vez de leerlo directamente.
if (!usuario) {
    formEditarUsuario.classList.add('d-none');
    const aviso = document.createElement('div');
    aviso.className = 'alert alert-danger';
    aviso.textContent = 'No se encontró ningún usuario con ese documento.';
    formEditarUsuario.insertAdjacentElement('beforebegin', aviso);
} else {
    // Precarga el formulario con los datos encontrados
    document.getElementById('documento').value = usuario.documento;
    document.getElementById('nombres').value = usuario.nombres;
    document.getElementById('apellidos').value = usuario.apellidos;
    document.getElementById('correo').value = usuario.correo;
    document.getElementById('telefono').value = usuario.telefono;
    document.getElementById('rol').value = usuario.rol;

    // Envío del formulario (igual al patrón de las páginas anteriores)
    formEditarUsuario.addEventListener('submit', function (evento) {
        evento.preventDefault();
        if (formEditarUsuario.checkValidity() === false) {
            formEditarUsuario.classList.add('was-validated');
            return;
        }
        // El documento no se envia: es la llave y no se edita
        ServicioUsuarios.editarUsuario(usuario.documento, {
            nombres: document.getElementById('nombres').value.trim(),
            apellidos: document.getElementById('apellidos').value.trim(),
            correo: document.getElementById('correo').value.trim(),
            telefono: document.getElementById('telefono').value.trim(),
            rol: document.getElementById('rol').value
        });
        edicionExito.classList.remove('d-none');
    });
}