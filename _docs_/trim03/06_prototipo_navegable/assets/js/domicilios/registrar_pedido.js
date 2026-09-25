// Registrar pedido (CU037 / CS-35 – MOD_04_HU04).
// Esta pantalla solo maneja el formulario: las reglas (stock, totales, cómo se guarda)
// están en ServicioDomicilios, y los datos en RepositorioDomicilios.

const form = document.getElementById('formRegistrarPedido');
const registroExito = document.getElementById('registroExito');
const registroError = document.getElementById('registroError');

const campos = {
    buscarTelefono: document.getElementById('buscarTelefono'),
    ayudaBuscar: document.getElementById('ayudaBuscarTelefono'),
    nombre: document.getElementById('clienteNombre'),
    telefono: document.getElementById('clienteTelefono'),
    direccion: document.getElementById('clienteDireccion'),
    barrio: document.getElementById('clienteBarrio'),
    usarDireccion: document.getElementById('usarDireccionCliente'),
    direccionEntrega: document.getElementById('direccionEntrega'),
    barrioEntrega: document.getElementById('barrioEntrega'),
    telefonoContacto: document.getElementById('telefonoContacto'),
    observacion: document.getElementById('observacion'),
    contadorObservacion: document.getElementById('contadorObservacion'),
    metodoPago: document.getElementById('metodoPago'),
    buscarProducto: document.getElementById('buscarProducto'),
    cantidadProducto: document.getElementById('cantidadProducto'),
    errorProducto: document.getElementById('errorProducto')
};

const cuerpoProductos = document.getElementById('cuerpoProductosPedido');
const filaSinProductos = document.getElementById('filaSinProductos');
const plantillaRenglon = document.getElementById('plantillaRenglon');

// Carrito del pedido: [{ codigo, cantidad, precio }] -> serán los renglones de detalle_venta
let carrito = [];

// ---------- Catálogo del datalist (una sola fuente: el Repository) ----------
RepositorioDomicilios.obtenerProductos().forEach(function (producto) {
    const opcion = document.createElement('option');
    opcion.value = producto.codigo + ' · ' + producto.nombre;
    document.getElementById('catalogoProductos').appendChild(opcion);
});

// ---------- Cliente ----------
function buscarCliente() {
    const telefono = campos.buscarTelefono.value.trim();
    const cliente = RepositorioDomicilios.buscarClientePorTelefono(telefono);
    if (cliente) {
        campos.nombre.value = cliente.nombre;
        campos.telefono.value = cliente.telefono;
        campos.direccion.value = cliente.direccion;
        campos.barrio.value = cliente.barrio;
        campos.ayudaBuscar.textContent = 'Cliente encontrado: se cargaron sus datos. Puedes corregirlos si cambiaron.';
    } else {
        // Cliente nuevo: se deja el teléfono escrito para no pedirlo dos veces
        campos.nombre.value = '';
        campos.telefono.value = telefono;
        campos.direccion.value = '';
        campos.barrio.value = '';
        campos.ayudaBuscar.textContent = 'No hay un cliente con ese teléfono: llena sus datos y se registrará con el pedido.';
    }
    copiarDireccionSiCorresponde();
}

document.getElementById('botonBuscarCliente').addEventListener('click', buscarCliente);
campos.buscarTelefono.addEventListener('keydown', function (evento) {
    if (evento.key === 'Enter') {
        evento.preventDefault(); // Enter dentro de un form lo enviaría
        buscarCliente();
    }
});

// ---------- Entrega: switch "Entregar en la dirección del cliente" ----------
function copiarDireccionSiCorresponde() {
    const copiar = campos.usarDireccion.checked;
    // readonly: el usuario ve el valor copiado pero no lo edita. Ojo: un campo readonly
    // no entra en la validación HTML; aquí no importa porque copia campos del cliente
    // que sí son required. Al apagar el switch vuelven a ser editables y se validan.
    [campos.direccionEntrega, campos.barrioEntrega, campos.telefonoContacto].forEach(function (c) {
        c.readOnly = copiar;
    });
    if (copiar) {
        campos.direccionEntrega.value = campos.direccion.value;
        campos.barrioEntrega.value = campos.barrio.value;
        campos.telefonoContacto.value = campos.telefono.value;
    }
}

campos.usarDireccion.addEventListener('change', copiarDireccionSiCorresponde);
[campos.telefono, campos.direccion, campos.barrio].forEach(function (c) {
    c.addEventListener('input', copiarDireccionSiCorresponde);
});

// ---------- Observación: contador de caracteres (máximo 255, como la columna) ----------
campos.observacion.addEventListener('input', function () {
    campos.contadorObservacion.textContent = campos.observacion.value.length + ' / 255';
});

// ---------- Productos ----------
function mostrarErrorProducto(mensaje) {
    campos.errorProducto.textContent = mensaje;
    campos.errorProducto.classList.toggle('d-none', !mensaje);
}

function cantidadEnCarrito(codigo) {
    const renglon = carrito.find(function (r) { return r.codigo === codigo; });
    return renglon ? renglon.cantidad : 0;
}

function agregarProducto() {
    const producto = ServicioDomicilios.buscarProducto(campos.buscarProducto.value);
    const cantidad = parseInt(campos.cantidadProducto.value, 10);

    if (!producto) {
        mostrarErrorProducto('No se encontró ese producto. Búscalo por código o nombre.');
        return;
    }
    if (!(cantidad >= 1)) {
        mostrarErrorProducto('La cantidad debe ser 1 o más.');
        return;
    }
    // La validación de stock es del Service: la misma regla servirá para el ChatBot
    const error = ServicioDomicilios.validarStock(producto, cantidadEnCarrito(producto.codigo) + cantidad);
    if (error) {
        mostrarErrorProducto(error);
        return;
    }

    const renglon = carrito.find(function (r) { return r.codigo === producto.codigo; });
    if (renglon) {
        renglon.cantidad += cantidad;
    } else {
        carrito.push({ codigo: producto.codigo, cantidad: cantidad, precio: producto.precio });
    }
    mostrarErrorProducto('');
    campos.buscarProducto.value = '';
    campos.cantidadProducto.value = 1;
    dibujarCarrito();
}

document.getElementById('botonAgregarProducto').addEventListener('click', agregarProducto);
campos.buscarProducto.addEventListener('keydown', function (evento) {
    if (evento.key === 'Enter') {
        evento.preventDefault();
        agregarProducto();
    }
});

function dibujarCarrito() {
    cuerpoProductos.querySelectorAll('tr[data-codigo]').forEach(function (fila) { fila.remove(); });
    filaSinProductos.classList.toggle('d-none', carrito.length > 0);

    carrito.forEach(function (renglon) {
        const producto = RepositorioDomicilios.obtenerProductoPorCodigo(renglon.codigo);
        const fila = plantillaRenglon.content.cloneNode(true).querySelector('tr');
        fila.dataset.codigo = renglon.codigo;
        fila.querySelector('[data-campo="nombre"]').textContent = producto.nombre;
        fila.querySelector('[data-campo="codigo"]').textContent = producto.codigo;
        fila.querySelector('[data-campo="precio"]').textContent = ServicioDomicilios.formatearPrecio(renglon.precio);
        fila.querySelector('[data-campo="cantidad"]').value = renglon.cantidad;
        fila.querySelector('[data-campo="subtotal"]').textContent =
            ServicioDomicilios.formatearPrecio(renglon.cantidad * renglon.precio);
        // No se puede sumar por encima del stock disponible
        fila.querySelector('[data-accion="sumar"]').disabled = renglon.cantidad >= producto.stock;
        cuerpoProductos.appendChild(fila);
    });

    const totales = ServicioDomicilios.calcularTotales(carrito);
    document.getElementById('resumenCantidad').textContent =
        totales.unidades + (totales.unidades === 1 ? ' unidad' : ' unidades');
    document.getElementById('resumenTotal').textContent = ServicioDomicilios.formatearPrecio(totales.total);
}

// Delegación de eventos: las filas se crean y destruyen, el <tbody> siempre existe
cuerpoProductos.addEventListener('click', function (evento) {
    const boton = evento.target.closest('[data-accion]');
    if (!boton) return;
    const codigo = boton.closest('tr').dataset.codigo;
    const renglon = carrito.find(function (r) { return r.codigo === codigo; });

    if (boton.dataset.accion === 'sumar') {
        renglon.cantidad += 1;
    } else if (boton.dataset.accion === 'restar') {
        renglon.cantidad -= 1;
    }
    if (boton.dataset.accion === 'quitar' || renglon.cantidad === 0) {
        carrito = carrito.filter(function (r) { return r.codigo !== codigo; });
    }
    dibujarCarrito();
});

// ---------- Registrar ----------
form.addEventListener('submit', function (evento) {
    evento.preventDefault();
    registroExito.classList.add('d-none');
    registroError.classList.add('d-none');

    const formularioValido = form.checkValidity();
    form.classList.add('was-validated');
    if (!formularioValido) {
        return;
    }

    const resultado = ServicioDomicilios.registrarPedido({
        cliente: {
            nombre: campos.nombre.value.trim(),
            telefono: campos.telefono.value.trim(),
            direccion: campos.direccion.value.trim(),
            barrio: campos.barrio.value.trim()
        },
        items: carrito,
        idMetodoPago: parseInt(campos.metodoPago.value, 10),
        direccionEntrega: campos.direccionEntrega.value.trim(),
        barrio: campos.barrioEntrega.value.trim(),
        telefonoContacto: campos.telefonoContacto.value.trim(),
        observacion: campos.observacion.value.trim()
    });

    if (!resultado.ok) {
        registroError.textContent = resultado.error;
        registroError.classList.remove('d-none');
        return;
    }

    // HU04: "Pedido registrado exitosamente" con el número de pedido
    registroExito.replaceChildren(
        'Pedido registrado exitosamente. Número de pedido: ',
        Object.assign(document.createElement('strong'), { textContent: '#' + resultado.pedido.id }),
        '. ',
        Object.assign(document.createElement('a'), { href: 'listar_domicilios.html', className: 'alert-link', textContent: 'Ver en el panel de pedidos' })
    );
    registroExito.classList.remove('d-none');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Formulario listo para el siguiente pedido telefónico
    form.reset();
    form.classList.remove('was-validated');
    carrito = [];
    dibujarCarrito();
    campos.contadorObservacion.textContent = '0 / 255';
    campos.ayudaBuscar.textContent = 'Si el cliente ya compró antes, se cargan sus datos; si no, llénalos para registrarlo.';
    copiarDireccionSiCorresponde();
});

copiarDireccionSiCorresponde();
