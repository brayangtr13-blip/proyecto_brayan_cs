// Editar producto (CS-15). Solo conecta la pantalla con RepositorioInventario y ServicioInventario.

const parametros = new URLSearchParams(window.location.search);
const codigoUrl = parametros.get('codigo');
const producto = RepositorioInventario.obtenerProducto(codigoUrl);
const formEditarProducto = document.getElementById('formEditarProducto');
const edicionExito = document.getElementById('edicionExito');

// Si llegan con un codigo que no existe, se avisa en vez de romper la pagina en blanco
// (antes esto intentaba leer producto.codigo sobre "undefined" y tronaba silenciosamente).
// Todo lo que depende de "producto" queda dentro de este if, en vez de cortar el script
// con un throw: asi la consola del navegador no muestra un error donde no lo hay.
if (!producto) {
    formEditarProducto.classList.add('d-none');
    const aviso = document.createElement('div');
    aviso.className = 'alert alert-danger';
    aviso.textContent = 'No se encontró ningún producto con ese código.';
    formEditarProducto.insertAdjacentElement('beforebegin', aviso);
} else {
    // Precarga el formulario con los datos encontrados (CS-15: "debe abrir con los datos actuales")
    document.getElementById('codigoProducto').value = producto.codigo;
    document.getElementById('nombre').value = producto.nombre;
    document.getElementById('categoria').value = producto.categoria;
    document.getElementById('unidadMedida').value = producto.unidadMedida;
    document.getElementById('precioUnitario').value = producto.precio;
    document.getElementById('stockActual').value = producto.stock;
    document.getElementById('stockMinimo').value = producto.stockMinimo;
    document.getElementById('descripcion').value = producto.descripcion;
    document.getElementById('estado').value = producto.estado;

    // Envio del formulario: mismo patron de validacion que el resto del proyecto
    formEditarProducto.addEventListener('submit', function (evento) {
        evento.preventDefault();

        if (formEditarProducto.checkValidity() === false) {
            formEditarProducto.classList.add('was-validated');
            return;
        }

        // El codigo no se envia: es la llave y no se edita.
        // Pendiente con backend: registro en log_auditoria (CS-15: quien y cuando lo edito)
        ServicioInventario.editarProducto(producto.codigo, {
            nombre: document.getElementById('nombre').value.trim(),
            categoria: document.getElementById('categoria').value,
            unidadMedida: document.getElementById('unidadMedida').value,
            precio: Number(document.getElementById('precioUnitario').value),
            stock: Number(document.getElementById('stockActual').value),
            stockMinimo: Number(document.getElementById('stockMinimo').value),
            descripcion: document.getElementById('descripcion').value.trim(),
            estado: document.getElementById('estado').value
        });
        edicionExito.classList.remove('d-none');
    });
}
