// Datos de ejemplo (Repository): esto se reemplaza por una consulta SELECT cuando exista backend.
// Dos productos con stock bajo el minimo a proposito, para poder ver el resaltado en rojo.
const productos = [
    { codigo: "7702001001", nombre: "Leche Entera 1L", categoria: "lacteos", categoriaTexto: "Lácteos", precio: 2850, stock: 15, stockMinimo: 20, estado: "activo" },
    { codigo: "7702001002", nombre: "Arroz Blanco 5kg", categoria: "abarrotes", categoriaTexto: "Abarrotes", precio: 12500, stock: 15, stockMinimo: 10, estado: "activo" },
    { codigo: "7702001003", nombre: "Café Molido 250g", categoria: "abarrotes", categoriaTexto: "Abarrotes", precio: 9900, stock: 5, stockMinimo: 20, estado: "activo" },
    { codigo: "7702001004", nombre: "Azúcar Blanca 2kg", categoria: "abarrotes", categoriaTexto: "Abarrotes", precio: 5800, stock: 0, stockMinimo: 15, estado: "activo" },
    { codigo: "7702001005", nombre: "Pan Tajado", categoria: "panaderia", categoriaTexto: "Panadería", precio: 3000, stock: 34, stockMinimo: 10, estado: "activo" }
];

const cuerpoProductos = document.getElementById('cuerpoProductos');
const sinProductos = document.getElementById('sinProductos');
const accionExito = document.getElementById('accionExito');
const buscarProducto = document.getElementById('buscarProducto');
const filtroCategoria = document.getElementById('filtroCategoria');

// Recuerda por cual columna se esta ordenando y en que direccion (1 = asc, -1 = desc)
const ordenActual = { clave: null, direccion: 1 };

function formatearPrecio(valor) {
    return '$' + valor.toLocaleString('es-CO');
}

// Quita tildes antes de comparar: "cafe" sin acento tambien debe encontrar "Café".
// \p{M} (con la bandera "u") es la categoria Unicode "marca": cubre cualquier tilde
// que NFD haya separado de su letra, sin depender de escribir un rango de codigos a mano.
function normalizar(texto) {
    return texto.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

// Dibuja el <tbody> completo a partir de la lista recibida.
// No se llama sola: aplicarFiltros() es quien decide que lista mostrar.
function renderizarProductos(lista) {
    cuerpoProductos.innerHTML = '';

    if (lista.length === 0) {
        sinProductos.classList.remove('d-none');
        return;
    }
    sinProductos.classList.add('d-none');

    lista.forEach(function (producto) {
        // "<=": misma regla de alerta que alertas_stock.js, consultar_producto.js y
        // dashboard_inicio.js (un producto justo en su stock mínimo también es alerta).
        const stockBajo = producto.stock <= producto.stockMinimo;
        const activo = producto.estado === 'activo';
        const fila = document.createElement('tr');
        if (stockBajo) {
            fila.classList.add('table-danger');
        }

        // CS-16: el borrado es logico (estado -> inactivo), por eso un producto inactivo
        // no desaparece de la tabla: se queda visible, con boton "Reactivar" en vez de "Eliminar"
        const botonBaja = activo
            ? '<button type="button" class="btn btn-sm btn-outline-danger" title="Eliminar" ' +
                'data-bs-toggle="modal" data-bs-target="#modalEliminarProducto" ' +
                'data-codigo="' + producto.codigo + '" data-nombre="' + producto.nombre + '" ' +
                'data-stock="' + producto.stock + '">' +
                '<i class="bi bi-trash"></i></button>'
            : '<button type="button" class="btn btn-sm btn-outline-success btn-reactivar" title="Reactivar" ' +
                'data-codigo="' + producto.codigo + '">' +
                '<i class="bi bi-arrow-counterclockwise"></i></button>';

        fila.innerHTML =
            '<td>' + producto.codigo + '</td>' +
            '<td>' + producto.nombre + '</td>' +
            '<td>' + producto.categoriaTexto + '</td>' +
            '<td>' + formatearPrecio(producto.precio) + '</td>' +
            '<td>' + producto.stock + (stockBajo ? ' <i class="bi bi-exclamation-triangle-fill text-danger" title="Stock bajo el mínimo"></i>' : '') + '</td>' +
            '<td><span class="badge text-bg-' + (activo ? 'success' : 'secondary') + '">' +
                (activo ? 'Activo' : 'Inactivo') + '</span></td>' +
            '<td>' +
                '<a href="consultar_producto.html?codigo=' + producto.codigo + '" class="btn btn-sm btn-outline-secondary" title="Ver"><i class="bi bi-eye"></i></a> ' +
                '<a href="editar_producto.html?codigo=' + producto.codigo + '" class="btn btn-sm btn-outline-primary" title="Editar"><i class="bi bi-pencil"></i></a> ' +
                botonBaja +
            '</td>';

        cuerpoProductos.appendChild(fila);
    });
}

// Une busqueda + filtro de categoria + orden, y vuelve a dibujar la tabla.
// Se llama cada vez que cambia cualquiera de los tres, o cuando se elimina/reactiva un producto.
function aplicarFiltros() {
    const texto = normalizar(buscarProducto.value.trim());
    const categoria = filtroCategoria.value;

    let resultado = productos.filter(function (producto) {
        const coincideTexto = normalizar(producto.nombre).includes(texto) || producto.codigo.includes(texto);
        const coincideCategoria = categoria === '' || producto.categoria === categoria;
        return coincideTexto && coincideCategoria;
    });

    if (ordenActual.clave) {
        resultado = resultado.slice().sort(function (a, b) {
            if (a[ordenActual.clave] < b[ordenActual.clave]) return -1 * ordenActual.direccion;
            if (a[ordenActual.clave] > b[ordenActual.clave]) return 1 * ordenActual.direccion;
            return 0;
        });
    }

    renderizarProductos(resultado);
}

// Guarda el temporizador activo para poder cancelarlo si llega un segundo aviso
// antes de que termine el primero (si no, el aviso nuevo podia ocultarse antes de tiempo).
let temporizadorAviso = null;

function mostrarExito(mensaje) {
    if (temporizadorAviso) {
        clearTimeout(temporizadorAviso);
    }
    accionExito.textContent = mensaje;
    accionExito.classList.remove('d-none');
    // Se oculta sola: es un aviso de una sola accion, no debe quedar pegado en pantalla
    temporizadorAviso = setTimeout(function () {
        accionExito.classList.add('d-none');
    }, 3000);
}

// "input" (no "change"): dispara con cada tecla, que es lo que pide CS-13 ("mientras se escribe")
buscarProducto.addEventListener('input', aplicarFiltros);
filtroCategoria.addEventListener('change', aplicarFiltros);

// Clic en un encabezado ordenable: si ya se estaba ordenando por esa columna, invierte la direccion
document.querySelectorAll('th.sortable').forEach(function (encabezado) {
    encabezado.style.cursor = 'pointer';
    encabezado.addEventListener('click', function () {
        const clave = encabezado.dataset.sort;
        if (ordenActual.clave === clave) {
            ordenActual.direccion *= -1;
        } else {
            ordenActual.clave = clave;
            ordenActual.direccion = 1;
        }
        aplicarFiltros();
    });
});

// Modal de eliminar (Facade sobre bootstrap.Modal, igual que "Cambiar estado" en Usuarios):
// show.bs.modal se dispara automaticamente cuando el boton con data-bs-target abre el modal
const modalEliminarProducto = document.getElementById('modalEliminarProducto');
const modalEliminarProductoTexto = document.getElementById('modalEliminarProductoTexto');
const confirmarEliminarProducto = document.getElementById('confirmarEliminarProducto');
let codigoAEliminar = null;

modalEliminarProducto.addEventListener('show.bs.modal', function (evento) {
    const boton = evento.relatedTarget;
    codigoAEliminar = boton.dataset.codigo;
    const stock = Number(boton.dataset.stock);

    // Texto exacto que pide CS-16, mas la advertencia extra si todavia hay stock
    let texto = '¿Desea eliminar el producto "' + boton.dataset.nombre + '"?';
    if (stock > 0) {
        texto += '<br><span class="text-warning"><i class="bi bi-exclamation-triangle-fill"></i> ' +
            'Este producto aún tiene ' + stock + ' unidades en stock, ¿desea continuar?</span>';
    }
    modalEliminarProductoTexto.innerHTML = texto;
});

confirmarEliminarProducto.addEventListener('click', function () {
    // Borrado LOGICO: el producto no se quita del arreglo, solo cambia su estado.
    // Asi se conserva el historico, tal como pide CS-16 (no eliminar fisicamente).
    const producto = productos.find(function (p) {
        return p.codigo === codigoAEliminar;
    });
    if (producto) {
        producto.estado = 'inactivo';
    }
    bootstrap.Modal.getInstance(modalEliminarProducto).hide();
    aplicarFiltros();
    mostrarExito('Producto eliminado correctamente');
});

// Reactivar: no pide modal de confirmacion en los criterios, solo "que exista la opcion"
cuerpoProductos.addEventListener('click', function (evento) {
    const boton = evento.target.closest('.btn-reactivar');
    if (!boton) {
        return;
    }
    const producto = productos.find(function (p) {
        return p.codigo === boton.dataset.codigo;
    });
    if (producto) {
        producto.estado = 'activo';
    }
    aplicarFiltros();
    mostrarExito('Producto reactivado correctamente');
});

// Primer dibujo de la tabla al cargar la pagina
renderizarProductos(productos);
