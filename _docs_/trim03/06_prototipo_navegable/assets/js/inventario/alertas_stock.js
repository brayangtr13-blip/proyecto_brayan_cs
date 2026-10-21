// Alertas de stock (CS-17). Solo conecta la pantalla con ServicioInventario.

const cuerpoAlertas = document.getElementById('cuerpoAlertas');
const sinAlertas = document.getElementById('sinAlertas');

// El Service filtra (stock <= minimo) y ordena: los mas graves primero
const productosEnAlerta = ServicioInventario.obtenerAlertas();

if (productosEnAlerta.length === 0) {
    sinAlertas.classList.remove('d-none');
} else {
    productosEnAlerta.forEach(function (producto) {
        const agotado = producto.stock === 0;
        const fila = document.createElement('tr');
        // Colores que pide CS-17: naranja para stock bajo, rojo para agotado
        fila.classList.add(agotado ? 'table-danger' : 'table-warning');

        fila.innerHTML =
            '<td>' + producto.codigo + '</td>' +
            '<td>' + producto.nombre + '</td>' +
            '<td>' + ServicioInventario.textoCategoria(producto.categoria) + '</td>' +
            '<td>' + producto.stock + '</td>' +
            '<td>' + producto.stockMinimo + '</td>' +
            '<td><span class="badge text-bg-' + (agotado ? 'danger' : 'warning') + '">' +
                (agotado ? 'AGOTADO' : 'STOCK BAJO') + '</span></td>';

        cuerpoAlertas.appendChild(fila);
    });
}

document.getElementById('botonImprimir').addEventListener('click', function () {
    window.print();
});
