// Datos de ejemplo (esto se reemplaza por el backend más adelante)

const usuariosEjemplo = [
    { documento: "1020304050", nombres: "Laura", apellidos: "Gomez", correo: "laura@controlstore.com", telefono: "3001234567", rol: "vendedor" },
    { documento: "1122334455", nombres: "Carlos", apellidos: "Ruiz", correo: "carlos@controlstore.com", telefono: "3009876543", rol: "domiciliario" }
];
// Busca un usuario dentro de la lista de ejemplo, por su documento
function obtenerUsuarioPorDocumento(documento) {
    return usuariosEjemplo.find(function (usuario) {
        return usuario.documento === documento;
    });
}
const parametros = new URLSearchParams(window.location.search);
const documentoUrl = parametros.get('documento');
const usuario = obtenerUsuarioPorDocumento(documentoUrl);
// Precarga el formulario con los datos encontrados
document.getElementById('documento').value = usuario.documento;
document.getElementById('nombres').value = usuario.nombres;
document.getElementById('apellidos').value = usuario.apellidos;
document.getElementById('correo').value = usuario.correo;
document.getElementById('telefono').value = usuario.telefono;
document.getElementById('rol').value = usuario.rol;
// Envío del formulario (igual al patrón de las páginas anteriores)
const formEditarUsuario = document.getElementById('formEditarUsuario');
const edicionExito = document.getElementById('edicionExito');

formEditarUsuario.addEventListener('submit', function (evento) {
    evento.preventDefault();
    if (formEditarUsuario.checkValidity() === false) {
        formEditarUsuario.classList.add('was-validated');
        return;
    }
    edicionExito.classList.remove('d-none');
});