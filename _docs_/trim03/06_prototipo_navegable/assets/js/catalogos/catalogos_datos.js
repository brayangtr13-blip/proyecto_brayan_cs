// Catálogos compartidos · Patrón REPOSITORY
// Única fuente de las tablas que usan varios módulos: clientes, barrios y metodos_pago.
// Antes Ventas y Domicilios tenían cada uno su copia de los métodos de pago, y Domicilios
// guardaba el barrio como texto. Ahora los dos módulos le piden los datos a este archivo,
// igual que en la BD hay una sola tabla para cada cosa (3FN).
// Hoy: localStorage. Con el backend: fetch a la API; las pantallas no cambian.
// No depende de otros archivos: se carga antes de ventas_datos.js y domicilios_datos.js.

const RepositorioCatalogos = (function () {
    const CLAVE = 'controlstore_catalogos_v1';

    // Datos reales de controlstore_sena (MySQL 8.4), con los mismos id.
    // El cliente 3 no está en la BD: se deja para tener un pedido de un barrio distinto.
    function datosDeEjemplo() {
        return {
            barrios: [
                { id: 1, nombre: 'Centro', costoDomicilio: 2000, activo: true },
                { id: 2, nombre: 'La Playa', costoDomicilio: 3000, activo: true },
                { id: 3, nombre: 'Los Alamos', costoDomicilio: 3500, activo: true }
            ],
            // clientes: nombre y apellido separados (migración 05, 1FN); id_barrio es FK opcional
            clientes: [
                { id: 1, nombre: 'Maria', apellido: 'Restrepo', telefono: '3011234567', direccion: 'Calle 12 # 4-30', idBarrio: 1 },
                { id: 2, nombre: 'Carlos', apellido: 'Ruiz', telefono: '3109876543', direccion: 'Carrera 7 # 15-02', idBarrio: 2 },
                { id: 3, nombre: 'Paola', apellido: 'Díaz', telefono: '3124567890', direccion: 'Calle 45 # 12-30', idBarrio: 3 }
            ],
            metodosPago: [
                { id: 1, nombre: 'Efectivo', activo: true },
                { id: 2, nombre: 'Nequi', activo: true },
                { id: 3, nombre: 'Transferencia', activo: true },
                { id: 4, nombre: 'Tarjeta', activo: true }
            ]
        };
    }

    // localStorage puede fallar (modo privado): si falla, se trabaja en memoria
    let enMemoria = null;

    function leer() {
        if (enMemoria) return enMemoria;
        try {
            const guardado = localStorage.getItem(CLAVE);
            enMemoria = guardado ? JSON.parse(guardado) : datosDeEjemplo();
        } catch (error) {
            enMemoria = datosDeEjemplo();
        }
        return enMemoria;
    }

    function guardar() {
        try { localStorage.setItem(CLAVE, JSON.stringify(enMemoria)); } catch (error) { /* solo en memoria */ }
    }

    function porId(lista, id) {
        return lista.find(function (x) { return x.id === id; });
    }

    return {
        // ---------- metodos_pago ----------
        // Solo los activos se ofrecen para cobrar; los inactivos siguen sirviendo para mostrar ventas viejas
        obtenerMetodosPago: function () {
            return leer().metodosPago.filter(function (m) { return m.activo; });
        },
        obtenerMetodoPago: function (id) { return porId(leer().metodosPago, id); },

        // ---------- barrios ----------
        // SELECT ... FROM barrios WHERE activo = 1 (dentro de la cobertura de domicilios)
        obtenerBarrios: function () {
            return leer().barrios.filter(function (b) { return b.activo; });
        },
        obtenerBarrio: function (id) { return porId(leer().barrios, id); },

        // ---------- clientes ----------
        obtenerClientes: function () { return leer().clientes; },
        obtenerCliente: function (id) { return porId(leer().clientes, id); },
        buscarClientePorTelefono: function (telefono) {
            return leer().clientes.find(function (c) { return c.telefono === telefono; });
        },
        // INSERT INTO clientes: el id sigue la secuencia, como un AUTO_INCREMENT
        agregarCliente: function (cliente) {
            const datos = leer();
            cliente.id = datos.clientes.reduce(function (max, c) { return Math.max(max, c.id); }, 0) + 1;
            datos.clientes.push(cliente);
            guardar();
            return cliente;
        },
        // UPDATE clientes: si el cliente cambió de dirección o de barrio, se corrige su registro
        actualizarCliente: function (id, cambios) {
            const cliente = porId(leer().clientes, id);
            if (cliente) { Object.assign(cliente, cambios); guardar(); }
            return cliente;
        },
        nombreCompleto: function (cliente) {
            return cliente ? cliente.nombre + ' ' + cliente.apellido : '';
        },

        // Olvida la copia en memoria para leer lo que otra página pudo guardar
        recargar: function () { enMemoria = null; },
        restablecer: function () { enMemoria = datosDeEjemplo(); guardar(); }
    };
})();
