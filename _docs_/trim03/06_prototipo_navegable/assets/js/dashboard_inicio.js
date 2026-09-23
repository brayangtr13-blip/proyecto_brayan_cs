// Mismos datos de ejemplo que alertas_stock.js, solo para calcular el contador.
// Cuando exista backend, este numero vendria de un SELECT COUNT(*) con la misma condicion.
const productosEjemplo = [
    { stock: 15, stockMinimo: 20 },
    { stock: 15, stockMinimo: 10 },
    { stock: 5, stockMinimo: 20 },
    { stock: 0, stockMinimo: 15 },
    { stock: 34, stockMinimo: 10 }
];

const totalEnAlerta = productosEjemplo.filter(function (producto) {
    return producto.stock <= producto.stockMinimo;
}).length;

document.getElementById('contadorAlertas').textContent = totalEnAlerta;
