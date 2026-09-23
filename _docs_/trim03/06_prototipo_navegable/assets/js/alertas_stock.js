// Datos de ejemplo (Repository), mismos valores que las demas pantallas de Inventario.
const productosEjemplo = [
    { codigo: "7702001001", nombre: "Leche Entera 1L", categoriaTexto: "Lácteos", stock: 15, stockMinimo: 20 },
    { codigo: "7702001002", nombre: "Arroz Blanco 5kg", categoriaTexto: "Abarrotes", stock: 15, stockMinimo: 10 },
    { codigo: "7702001003", nombre: "Café Molido 250g", categoriaTexto: "Abarrotes", stock: 5, stockMinimo: 20 },
    { codigo: "7702001004", nombre: "Azúcar Blanca 2kg", categoriaTexto: "Abarrotes", stock: 0, stockMinimo: 15 },
    { codigo: "7702001005", nombre: "Pan Tajado", categoriaTexto: "Panadería", stock: 34, stockMinimo: 10 }
];

const cuerpoAlertas = document.getElementById('cuerpoAlertas');
const sinAlertas = document.getElementById('sinAlertas');

// CS-17: stock <= stock minimo entra en alerta. stock = 0 es el caso mas grave (AGOTADO).
const productosEnAlerta = productosEjemplo.filter(function (producto) {
    return producto.stock <= producto.stockMinimo;
});

// Los mas graves primero: agotados, y entre ellos, los que estan mas lejos de su minimo
productosEnAlerta.sort(function (a, b) {
    if (a.stock === 0 && b.stock !== 0) return -1;
    if (b.stock === 0 && a.stock !== 0) return 1;
    return (b.stockMinimo - b.stock) - (a.stockMinimo - a.stock);
});

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
            '<td>' + producto.categoriaTexto + '</td>' +
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
