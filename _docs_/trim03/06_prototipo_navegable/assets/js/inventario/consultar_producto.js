// Consultar producto (CS-14). Solo conecta la pantalla con RepositorioInventario y ServicioInventario.

// IIFE: las variables de esta pantalla no quedan globales ni chocan con otros scripts
(function () {
    const cuerpoResultados = document.getElementById('cuerpoResultados');
    const productoNoEncontrado = document.getElementById('productoNoEncontrado');
    const detalleProducto = document.getElementById('detalleProducto');
    const buscarConsulta = document.getElementById('buscarConsulta');
    const botonBuscarConsulta = document.getElementById('botonBuscarConsulta');

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
            // Clase en vez de fila.style.cursor: el aspecto (cursor de mano) se define en
            // dashboard.css (.fila-clickeable); el JS solo marca que la fila es clicable.
            fila.classList.add('fila-clickeable');
            fila.dataset.codigo = producto.codigo;
            fila.innerHTML =
                '<td>' + producto.codigo + '</td>' +
                '<td>' + producto.nombre + '</td>' +
                '<td>' + ServicioInventario.formatearPrecio(producto.precio) + '</td>' +
                '<td class="text-end"><i class="bi bi-chevron-right text-muted"></i></td>';
            cuerpoResultados.appendChild(fila);
        });
    }

    // Llena la tarjeta de detalle con un producto y calcula la etiqueta de stock.
    // El nivel (agotado / bajo / normal) lo decide el Service.
    function mostrarDetalle(producto) {
        document.getElementById('detalleCodigo').textContent = producto.codigo;
        document.getElementById('detalleNombre').textContent = producto.nombre;
        document.getElementById('detalleCategoria').textContent = ServicioInventario.textoCategoria(producto.categoria);
        document.getElementById('detalleDescripcion').textContent = producto.descripcion || '—';
        document.getElementById('detallePrecio').textContent = ServicioInventario.formatearPrecio(producto.precio);
        document.getElementById('detalleStock').textContent = producto.stock;
        document.getElementById('detalleStockMinimo').textContent = producto.stockMinimo;
        document.getElementById('detalleUnidad').textContent = ServicioInventario.textoUnidad(producto.unidadMedida);

        const activo = producto.estado === 'activo';
        document.getElementById('detalleEstado').innerHTML =
            '<span class="badge text-bg-' + (activo ? 'success' : 'secondary') + '">' +
            (activo ? 'Activo' : 'Inactivo') + '</span>';

        const badgeStock = document.getElementById('detalleBadgeStock');
        const nivel = ServicioInventario.nivelStock(producto);
        if (nivel === 'agotado') {
            badgeStock.className = 'badge text-bg-danger';
            badgeStock.textContent = 'AGOTADO';
        } else if (nivel === 'bajo') {
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
        const producto = RepositorioInventario.obtenerProducto(fila.dataset.codigo);
        if (producto) {
            mostrarDetalle(producto);
        }
    });

    function ejecutarBusqueda() {
        renderizarResultados(ServicioInventario.buscar(buscarConsulta.value));
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

    renderizarResultados(RepositorioInventario.obtenerProductos());

    if (codigoUrl) {
        const producto = RepositorioInventario.obtenerProducto(codigoUrl);
        if (producto) {
            mostrarDetalle(producto);
        } else {
            // Antes esto no hacia nada: la pagina se quedaba con la tabla completa sin
            // ninguna pista de que el codigo de la URL no correspondia a ningun producto.
            productoNoEncontrado.classList.remove('d-none');
        }
    }
})();
