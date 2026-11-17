// Listar productos (CS-13, CS-16). Solo conecta la pantalla con RepositorioInventario y ServicioInventario.

// IIFE: las variables de esta pantalla no quedan globales ni chocan con otros scripts
(function () {
    const cuerpoProductos = document.getElementById('cuerpoProductos');
    const sinProductos = document.getElementById('sinProductos');
    const accionExito = document.getElementById('accionExito');
    const buscarProducto = document.getElementById('buscarProducto');
    const filtroCategoria = document.getElementById('filtroCategoria');

    // Recuerda por cual columna se esta ordenando y en que direccion (1 = asc, -1 = desc)
    const ordenActual = { clave: null, direccion: 1 };

    // Paginación: 10 productos por página. Al buscar, filtrar u ordenar se vuelve a la página 1
    const POR_PAGINA = 10;
    let paginaActual = 1;
    let ultimaLista = [];

    function dibujarPaginacion(total) {
        const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
        paginaActual = Math.min(paginaActual, paginas);
        const desde = total === 0 ? 0 : (paginaActual - 1) * POR_PAGINA + 1;
        document.getElementById('resumenPaginas').textContent =
            'Mostrando ' + desde + '–' + Math.min(paginaActual * POR_PAGINA, total) + ' de ' + total + ' productos';
        const ul = document.getElementById('paginacionProductos');
        ul.replaceChildren();
        function boton(texto, destino, activo, deshabilitado) {
            const li = document.createElement('li');
            li.className = 'page-item' + (activo ? ' active' : '') + (deshabilitado ? ' disabled' : '');
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'page-link';
            b.textContent = texto;
            if (activo) b.setAttribute('aria-current', 'page');
            b.addEventListener('click', function () { paginaActual = destino; mostrarPagina(); });
            li.appendChild(b);
            ul.appendChild(li);
        }
        boton('Anterior', paginaActual - 1, false, paginaActual === 1);
        for (let n = 1; n <= paginas; n++) boton(String(n), n, n === paginaActual, false);
        boton('Siguiente', paginaActual + 1, false, paginaActual === paginas);
    }

    // Dibuja solo los productos de la página actual
    function mostrarPagina() {
        dibujarPaginacion(ultimaLista.length);
        renderizarProductos(ultimaLista.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA), ultimaLista.length);
    }

    // Dibuja el <tbody> completo a partir de la lista recibida.
    // No se llama sola: aplicarFiltros() es quien decide que lista mostrar.
    function renderizarProductos(lista, total) {
        cuerpoProductos.innerHTML = '';

        if (total === 0) {
            sinProductos.classList.remove('d-none');
            return;
        }
        sinProductos.classList.add('d-none');

        lista.forEach(function (producto) {
            // La regla de alerta vive en el Service (la misma para alertas_stock.js y consultar_producto.js)
            const stockBajo = ServicioInventario.tieneStockBajo(producto);
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
                '<td>' + ServicioInventario.textoCategoria(producto.categoria) + '</td>' +
                '<td>' + ServicioInventario.formatearPrecio(producto.precio) + '</td>' +
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
        const texto = ServicioInventario.normalizar(buscarProducto.value.trim());
        const categoria = filtroCategoria.value;

        let resultado = RepositorioInventario.obtenerProductos().filter(function (producto) {
            const coincideTexto = ServicioInventario.normalizar(producto.nombre).includes(texto) || producto.codigo.includes(texto);
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

        ultimaLista = resultado;
        mostrarPagina();
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
    buscarProducto.addEventListener('input', function () { paginaActual = 1; aplicarFiltros(); });
    filtroCategoria.addEventListener('change', function () { paginaActual = 1; aplicarFiltros(); });

    // Clic en un encabezado ordenable: si ya se estaba ordenando por esa columna, invierte la direccion.
    // El cursor de mano no se pone aqui: lo da la clase .sortable en dashboard.css (el JS no escribe estilos).
    document.querySelectorAll('th.sortable').forEach(function (encabezado) {
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
        // Borrado LOGICO (CS-16): el Service cambia el estado, el producto no se borra
        ServicioInventario.cambiarEstado(codigoAEliminar, 'inactivo');
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
        ServicioInventario.cambiarEstado(boton.dataset.codigo, 'activo');
        aplicarFiltros();
        mostrarExito('Producto reactivado correctamente');
    });

    // Primer dibujo de la tabla al cargar la pagina
    aplicarFiltros();
})();
