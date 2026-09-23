// Datos de ejemplo (Repository): mismos valores que listar_productos.js.
// Cada pantalla tiene su propia copia porque no hay backend que las comparta todavia
// (mismo criterio que ya se uso entre listar_usuarios.js y editar_usuario.js).
const productosEjemplo = [
    { codigo: "7702001001", nombre: "Leche Entera 1L", categoria: "lacteos", descripcion: "Leche entera pasteurizada, bolsa de 1 litro.", precio: 2850, stock: 15, stockMinimo: 20, unidadMedida: "litro", estado: "activo" },
    { codigo: "7702001002", nombre: "Arroz Blanco 5kg", categoria: "abarrotes", descripcion: "", precio: 12500, stock: 15, stockMinimo: 10, unidadMedida: "paquete", estado: "activo" },
    { codigo: "7702001003", nombre: "Café Molido 250g", categoria: "abarrotes", descripcion: "", precio: 9900, stock: 5, stockMinimo: 20, unidadMedida: "paquete", estado: "activo" },
    { codigo: "7702001004", nombre: "Azúcar Blanca 2kg", categoria: "abarrotes", descripcion: "", precio: 5800, stock: 0, stockMinimo: 15, unidadMedida: "paquete", estado: "activo" },
    { codigo: "7702001005", nombre: "Pan Tajado", categoria: "panaderia", descripcion: "", precio: 3000, stock: 34, stockMinimo: 10, unidadMedida: "unidad", estado: "activo" }
];

// Repository: busca un producto de ejemplo por su codigo de barras
function obtenerProductoPorCodigo(codigo) {
    return productosEjemplo.find(function (producto) {
        return producto.codigo === codigo;
    });
}

const parametros = new URLSearchParams(window.location.search);
const codigoUrl = parametros.get('codigo');
const producto = obtenerProductoPorCodigo(codigoUrl);
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

        // Sin backend todavia: aqui iria el UPDATE a la tabla productos y el registro
        // en log_auditoria (CS-15 pide dejar constancia de quien y cuando lo edito)
        edicionExito.classList.remove('d-none');
    });
}
