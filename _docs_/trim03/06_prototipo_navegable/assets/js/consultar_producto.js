// Datos de ejemplo (Repository), mismos valores que las demas pantallas de Inventario.
// Incluye un producto agotado (stock 0) para poder mostrar la etiqueta "AGOTADO".
const productosEjemplo = [
    { codigo: "7702001001", nombre: "Leche Entera 1L", categoria: "lacteos", categoriaTexto: "Lácteos", descripcion: "Leche entera pasteurizada, bolsa de 1 litro.", precio: 2850, stock: 15, stockMinimo: 20, unidadTexto: "Litro", estado: "activo" },
    { codigo: "7702001002", nombre: "Arroz Blanco 5kg", categoria: "abarrotes", categoriaTexto: "Abarrotes", descripcion: "Arroz blanco de grano largo, bolsa de 5 kilogramos.", precio: 12500, stock: 15, stockMinimo: 10, unidadTexto: "Paquete", estado: "activo" },
    { codigo: "7702001003", nombre: "Café Molido 250g", categoria: "abarrotes", categoriaTexto: "Abarrotes", descripcion: "Café molido tostado, bolsa de 250 gramos.", precio: 9900, stock: 5, stockMinimo: 20, unidadTexto: "Paquete", estado: "activo" },
    { codigo: "7702001004", nombre: "Azúcar Blanca 2kg", categoria: "abarrotes", categoriaTexto: "Abarrotes", descripcion: "Azúcar blanca refinada, bolsa de 2 kilogramos.", precio: 5800, stock: 0, stockMinimo: 15, unidadTexto: "Paquete", estado: "activo" },
    { codigo: "7702001005", nombre: "Pan Tajado", categoria: "panaderia", categoriaTexto: "Panadería", descripcion: "Pan de molde tajado.", precio: 3000, stock: 34, stockMinimo: 10, unidadTexto: "Unidad", estado: "activo" }
];

const cuerpoResultados = document.getElementById('cuerpoResultados');
const productoNoEncontrado = document.getElementById('productoNoEncontrado');
const detalleProducto = document.getElementById('detalleProducto');
const buscarConsulta = document.getElementById('buscarConsulta');
const botonBuscarConsulta = document.getElementById('botonBuscarConsulta');

function formatearPrecio(valor) {
    return '$' + valor.toLocaleString('es-CO');
}

// Quita tildes antes de comparar: en español es muy comun buscar "cafe" o "azucar"
// sin el acento, y el usuario espera que igual encuentre "Café" o "Azúcar".
// \p{M} (con la bandera "u") es la categoria Unicode "marca": cubre cualquier tilde
// que NFD haya separado de su letra, sin depender de escribir un rango de codigos a mano.
function normalizar(texto) {
    return texto.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

// Repository: filtra por codigo, nombre O categoria (CS-14 pide que el buscador cubra los tres)
function buscarProductos(texto) {
    const valor = normalizar(texto.trim());
    if (valor === '') {
        return productosEjemplo;
    }
    return productosEjemplo.filter(function (producto) {
        return producto.codigo.includes(valor) ||
            normalizar(producto.nombre).includes(valor) ||
            normalizar(producto.categoriaTexto).includes(valor);
    });
}

// Dibuja la tabla de resultados. Cada fila es clickeable: al elegirla se abre el detalle.
function renderizarResultados(lista) {
    cuerpoResultados.innerHTML = '';

    // Cada busqueda nueva oculta el detalle anterior: si no se hace esto, el detalle de
    // un producto que ya no aparece en los resultados se queda pegado en pantalla.
    detalleProducto.classList.add('d-none');

    if (lista.length === 0) {
        productoNoEncontrado.classList.remove('d-none');
        return;
    }
    productoNoEncontrado.classList.add('d-none');

    lista.forEach(function (producto) {
        const fila = document.createElement('tr');
        fila.style.cursor = 'pointer';
        fila.dataset.codigo = producto.codigo;
        fila.innerHTML =
            '<td>' + producto.codigo + '</td>' +
            '<td>' + producto.nombre + '</td>' +
            '<td>' + formatearPrecio(producto.precio) + '</td>' +
            '<td class="text-end"><i class="bi bi-chevron-right text-muted"></i></td>';
        cuerpoResultados.appendChild(fila);
    });
}

// Llena la tarjeta de detalle con un producto y calcula la etiqueta de stock.
// AGOTADO manda sobre STOCK BAJO: un producto en 0 nunca muestra las dos etiquetas.
function mostrarDetalle(producto) {
    document.getElementById('detalleCodigo').textContent = producto.codigo;
    document.getElementById('detalleNombre').textContent = producto.nombre;
    document.getElementById('detalleCategoria').textContent = producto.categoriaTexto;
    document.getElementById('detalleDescripcion').textContent = producto.descripcion || '—';
    document.getElementById('detallePrecio').textContent = formatearPrecio(producto.precio);
    document.getElementById('detalleStock').textContent = producto.stock;
    document.getElementById('detalleStockMinimo').textContent = producto.stockMinimo;
    document.getElementById('detalleUnidad').textContent = producto.unidadTexto;

    const activo = producto.estado === 'activo';
    document.getElementById('detalleEstado').innerHTML =
        '<span class="badge text-bg-' + (activo ? 'success' : 'secondary') + '">' +
        (activo ? 'Activo' : 'Inactivo') + '</span>';

    const badgeStock = document.getElementById('detalleBadgeStock');
    if (producto.stock === 0) {
        badgeStock.className = 'badge text-bg-danger';
        badgeStock.textContent = 'AGOTADO';
    } else if (producto.stock <= producto.stockMinimo) {
        badgeStock.className = 'badge text-bg-warning';
        badgeStock.textContent = 'STOCK BAJO';
    } else {
        badgeStock.className = 'badge d-none';
        badgeStock.textContent = '';
    }

    detalleProducto.classList.remove('d-none');
}

// Delegacion de eventos: las filas se crean y se destruyen con cada busqueda,
// por eso el listener va en el <tbody> (que si existe siempre) y no en cada <tr>.
cuerpoResultados.addEventListener('click', function (evento) {
    const fila = evento.target.closest('tr');
    if (!fila) {
        return;
    }
    const producto = productosEjemplo.find(function (p) {
        return p.codigo === fila.dataset.codigo;
    });
    if (producto) {
        mostrarDetalle(producto);
    }
});

function ejecutarBusqueda() {
    renderizarResultados(buscarProductos(buscarConsulta.value));
}

botonBuscarConsulta.addEventListener('click', ejecutarBusqueda);
buscarConsulta.addEventListener('keydown', function (evento) {
    if (evento.key === 'Enter') {
        ejecutarBusqueda();
    }
});

// Si se llega aqui desde el boton "Ver" de Listar Productos (?codigo=...), abre ese
// producto directamente. Si no, deja la tabla completa sin nada seleccionado.
const parametros = new URLSearchParams(window.location.search);
const codigoUrl = parametros.get('codigo');

renderizarResultados(productosEjemplo);

if (codigoUrl) {
    const producto = productosEjemplo.find(function (p) {
        return p.codigo === codigoUrl;
    });
    if (producto) {
        mostrarDetalle(producto);
    } else {
        // Antes esto no hacia nada: la pagina se quedaba con la tabla completa sin
        // ninguna pista de que el codigo de la URL no correspondia a ningun producto.
        productoNoEncontrado.classList.remove('d-none');
    }
}
