// Módulo 5 – Reportes · Patrón SERVICE
// Todos los cálculos de los reportes (RF26 a RF30) en un solo lugar. Las pantallas solo filtran y dibujan.
// No guarda nada: LEE de los Repository de cada módulo, como un SELECT con GROUP BY en la BD.
// Cada función revisa que esté cargado el Repository que necesita, así una página carga solo lo que usa.

const ServicioReportes = (function () {

    // Los Repository son const globales y no quedan en window: por eso se pregunta por cada uno con typeof
    const REPOSITORIOS = {
        RepositorioVentas: function () { return typeof RepositorioVentas !== 'undefined' ? RepositorioVentas : null; },
        RepositorioInventario: function () { return typeof RepositorioInventario !== 'undefined' ? RepositorioInventario : null; },
        RepositorioUsuarios: function () { return typeof RepositorioUsuarios !== 'undefined' ? RepositorioUsuarios : null; },
        RepositorioDomicilios: function () { return typeof RepositorioDomicilios !== 'undefined' ? RepositorioDomicilios : null; }
    };

    function requiere(nombre) {
        const repositorio = REPOSITORIOS[nombre]();
        if (!repositorio) throw new Error('reportes_servicio.js: esta página no cargó ' + nombre);
        return repositorio;
    }

    // ---------------- Utilidades de formato y fechas ----------------

    function formatearPrecio(valor) {
        return (valor < 0 ? '-' : '') + '$' + Math.abs(Math.round(valor)).toLocaleString('es-CO');
    }

    function formatearFecha(texto) {
        const f = new Date(texto);
        return f.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
            f.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    function formatearDia(aaaammdd) {
        const p = aaaammdd.split('-');
        return p[2] + '/' + p[1] + '/' + p[0];
    }

    // Fecha local AAAA-MM-DD (la de los <input type="date">)
    function fechaLocal(texto) {
        const f = new Date(texto);
        return f.getFullYear() + '-' + String(f.getMonth() + 1).padStart(2, '0') + '-' + String(f.getDate()).padStart(2, '0');
    }

    // Rango vacío = sin límite por ese lado
    function enRango(texto, desde, hasta) {
        const dia = fechaLocal(texto);
        return (!desde || dia >= desde) && (!hasta || dia <= hasta);
    }

    // Rango inicial de un reporte: desde el registro más antiguo hasta hoy (para que no salga vacío)
    function rangoInicial(fechas) {
        const hoy = fechaLocal(new Date().toISOString());
        const desde = fechas.length ? fechas.map(fechaLocal).sort()[0] : hoy;
        return { desde: desde, hasta: hoy };
    }

    // Llave del grupo para el gráfico: día, semana (lunes de esa semana) o mes
    function llaveGrupo(texto, agrupacion) {
        const f = new Date(texto);
        if (agrupacion === 'mes') {
            return { llave: f.getFullYear() + '-' + String(f.getMonth() + 1).padStart(2, '0'),
                etiqueta: f.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }) };
        }
        if (agrupacion === 'semana') {
            const lunes = new Date(f.getFullYear(), f.getMonth(), f.getDate() - ((f.getDay() + 6) % 7));
            const dia = fechaLocal(lunes.toISOString());
            return { llave: dia, etiqueta: 'Semana del ' + formatearDia(dia) };
        }
        const dia = fechaLocal(texto);
        return { llave: dia, etiqueta: formatearDia(dia) };
    }

    function sumar(lista, campo) {
        return lista.reduce(function (s, x) { return s + (typeof campo === 'function' ? campo(x) : x[campo]); }, 0);
    }

    // Agrupa una lista: [{ llave, etiqueta, items }] en orden de llave
    function agrupar(lista, fnLlave) {
        const mapa = {};
        lista.forEach(function (x) {
            const g = fnLlave(x);
            if (!mapa[g.llave]) mapa[g.llave] = { llave: g.llave, etiqueta: g.etiqueta, items: [] };
            mapa[g.llave].items.push(x);
        });
        return Object.keys(mapa).sort().map(function (k) { return mapa[k]; });
    }

    function nombreUsuario(idUsuario) {
        const u = idUsuario ? requiere('RepositorioUsuarios').obtenerUsuario(idUsuario) : null;
        return u ? u.nombres + ' ' + u.apellidos : '—';
    }

    // ---------------- RF26 / RF27 · Ventas ----------------

    // SELECT ... FROM ventas WHERE fecha BETWEEN ... (separa pagadas y anuladas)
    function ventasDelPeriodo(f) {
        const ventas = requiere('RepositorioVentas').obtenerVentas().filter(function (v) {
            return enRango(v.fecha, f.desde, f.hasta) &&
                (!f.idUsuario || v.idUsuario === f.idUsuario) &&
                (!f.idMetodoPago || v.idMetodoPago === f.idMetodoPago);
        }).sort(function (a, b) { return new Date(a.fecha) - new Date(b.fecha); });
        return {
            pagadas: ventas.filter(function (v) { return v.estado !== 'anulada'; }),
            anuladas: ventas.filter(function (v) { return v.estado === 'anulada'; })
        };
    }

    // Resumen sin anuladas: total, número de ventas y ticket promedio
    function resumenVentas(pagadas) {
        const total = sumar(pagadas, 'total');
        return { total: total, cantidad: pagadas.length, ticket: pagadas.length ? total / pagadas.length : 0 };
    }

    function ventasPorPeriodo(pagadas, agrupacion) {
        return agrupar(pagadas, function (v) { return llaveGrupo(v.fecha, agrupacion); }).map(function (g) {
            return { etiqueta: g.etiqueta, valor: sumar(g.items, 'total'), cantidad: g.items.length };
        });
    }

    // Todos los métodos de pago salen, aunque tengan $0 (así se ve cuáles no se usaron)
    function ventasPorMetodo(pagadas) {
        return requiere('RepositorioVentas').obtenerMetodosPago().map(function (m) {
            const delMetodo = pagadas.filter(function (v) { return v.idMetodoPago === m.id; });
            return { id: m.id, etiqueta: m.nombre, valor: sumar(delMetodo, 'total'), cantidad: delMetodo.length };
        });
    }

    // SUM(detalle_venta.cantidad) GROUP BY producto, del más vendido al menos vendido
    function productosVendidos(pagadas) {
        const mapa = {};
        pagadas.forEach(function (v) {
            v.detalle.forEach(function (d) {
                mapa[d.codigo] = mapa[d.codigo] || { codigo: d.codigo, unidades: 0, valor: 0 };
                mapa[d.codigo].unidades += d.cantidad;
                mapa[d.codigo].valor += d.cantidad * d.precio;
            });
        });
        return Object.keys(mapa).map(function (k) {
            const p = requiere('RepositorioInventario').obtenerProducto(k);
            return Object.assign(mapa[k], { etiqueta: p ? p.nombre : k });
        }).sort(function (a, b) { return b.unidades - a.unidades || b.valor - a.valor; });
    }

    // ---------------- RF28 / RF29 · Inventario ----------------

    function signo(m) {
        if (m.tipo === 'salida') return -Math.abs(m.cantidad);
        if (m.tipo === 'entrada') return Math.abs(m.cantidad);
        return m.cantidad;   // ajuste: la cantidad ya trae su signo
    }

    // Una entrada que devuelve stock de una venta anulada o un pedido cancelado es un "reverso"
    function esReverso(m) {
        return m.tipo === 'entrada' && /^(Anulaci|Devoluci|Cancelaci)/.test(m.observacion || '');
    }

    // Kárdex con stock anterior y resultante. Se calcula hacia atrás desde el stock actual:
    // stock antes del primer movimiento = stock actual - suma de todos los movimientos.
    function kardex(f) {
        const inv = requiere('RepositorioInventario');
        const todos = inv.obtenerMovimientos().slice().sort(function (a, b) {
            return (new Date(a.fecha) - new Date(b.fecha)) || (a.id - b.id);
        });
        const saldo = {};
        inv.obtenerProductos().forEach(function (p) {
            const suyos = todos.filter(function (m) { return m.codigoProducto === p.codigo; });
            saldo[p.codigo] = p.stock - sumar(suyos, signo);
        });
        const renglones = todos.map(function (m) {
            const producto = inv.obtenerProducto(m.codigoProducto) || { nombre: m.codigoProducto, categoria: '' };
            const anterior = saldo[m.codigoProducto] || 0;
            saldo[m.codigoProducto] = anterior + signo(m);
            return {
                id: m.id, fecha: m.fecha, codigo: m.codigoProducto, producto: producto.nombre, categoria: producto.categoria,
                tipo: esReverso(m) ? 'reverso' : m.tipo, cantidad: signo(m), anterior: anterior,
                resultante: saldo[m.codigoProducto], usuario: nombreUsuario(m.idUsuario), observacion: m.observacion || ''
            };
        });
        return renglones.filter(function (r) {
            return enRango(r.fecha, f.desde, f.hasta) && (!f.codigo || r.codigo === f.codigo) &&
                (!f.categoria || r.categoria === f.categoria) &&
                (!f.tipo || r.tipo === f.tipo || (f.tipo === 'entrada' && r.tipo === 'reverso'));
        });
    }

    function resumenKardex(renglones) {
        const entradas = sumar(renglones.filter(function (r) { return r.cantidad > 0; }), 'cantidad');
        const salidas = -sumar(renglones.filter(function (r) { return r.cantidad < 0; }), 'cantidad');
        return { entradas: entradas, salidas: salidas, saldo: entradas - salidas };
    }

    // Rotación = unidades que salieron por ventas o entregas, menos las que volvieron (reversos)
    function rotacion(f) {
        const inv = requiere('RepositorioInventario');
        const renglones = kardex({ desde: f.desde, hasta: f.hasta });
        return inv.obtenerProductos().filter(function (p) {
            return p.estado === 'activo' && (!f.categoria || p.categoria === f.categoria);
        }).map(function (p) {
            const suyos = renglones.filter(function (r) { return r.codigo === p.codigo; });
            const vendidas = -sumar(suyos.filter(function (r) { return r.tipo === 'salida'; }), 'cantidad') -
                sumar(suyos.filter(function (r) { return r.tipo === 'reverso'; }), 'cantidad');
            return { codigo: p.codigo, etiqueta: p.nombre, valor: Math.max(0, vendidas) };
        });
    }

    // Unidades totales en inventario: al inicio del periodo y al final de cada día con movimientos
    function evolucionStock(f) {
        const todos = kardex({ categoria: f.categoria });   // todo el kárdex, sin cortar por fechas
        const saldo = {};
        requiere('RepositorioInventario').obtenerProductos().forEach(function (p) {
            if (f.categoria && p.categoria !== f.categoria) return;
            const primero = todos.find(function (r) { return r.codigo === p.codigo; });
            saldo[p.codigo] = primero ? primero.anterior : p.stock;   // sin movimientos, el stock no cambió
        });
        const total = function () { return sumar(Object.keys(saldo), function (k) { return saldo[k]; }); };
        // Lo que pasó antes del periodo ya está aplicado al empezar
        todos.forEach(function (r) { if (f.desde && fechaLocal(r.fecha) < f.desde) saldo[r.codigo] = r.resultante; });
        const enPeriodo = todos.filter(function (r) { return enRango(r.fecha, f.desde, f.hasta); });
        if (!enPeriodo.length) return [];
        const puntos = [{ etiqueta: 'Inicio del periodo', valor: total() }];
        agrupar(enPeriodo, function (r) { return llaveGrupo(r.fecha, 'dia'); }).forEach(function (g) {
            g.items.forEach(function (r) { saldo[r.codigo] = r.resultante; });
            puntos.push({ etiqueta: g.etiqueta, valor: total() });
        });
        return puntos;
    }

    function entradasYSalidasPorDia(f) {
        return agrupar(kardex(f), function (r) { return llaveGrupo(r.fecha, 'dia'); }).map(function (g) {
            return { etiqueta: g.etiqueta, entradas: sumar(g.items.filter(function (r) { return r.tipo === 'entrada'; }), 'cantidad'),
                salidas: -sumar(g.items.filter(function (r) { return r.tipo === 'salida'; }), 'cantidad') };
        });
    }

    // ---------------- Reportes de usuarios ----------------

    // Total vendido y número de ventas por vendedor (los que pueden vender: admin y cajeros)
    function ventasPorVendedor(f) {
        const pagadas = ventasDelPeriodo(f).pagadas;
        return requiere('RepositorioUsuarios').obtenerUsuarios().filter(function (u) {
            return u.idRol === 1 || u.idRol === 2;
        }).map(function (u) {
            const suyas = pagadas.filter(function (v) { return v.idUsuario === u.idUsuario; });
            return { idUsuario: u.idUsuario, etiqueta: u.nombres + ' ' + u.apellidos, valor: sumar(suyas, 'total'), cantidad: suyas.length };
        }).sort(function (a, b) { return b.valor - a.valor; });
    }

    function usuariosPorRol() {
        const repo = requiere('RepositorioUsuarios');
        return repo.obtenerRoles().map(function (r) {
            const delRol = repo.obtenerUsuarios().filter(function (u) { return u.idRol === r.idRol; });
            return { id: r.idRol, etiqueta: r.nombre.charAt(0).toUpperCase() + r.nombre.slice(1), valor: delRol.length, usuarios: delRol };
        });
    }

    // ---------------- RF30 · Domicilios ----------------

    const TEXTO_ESTADO = { pendiente: 'Pendiente', asignado: 'Asignado', en_camino: 'En camino', entregado: 'Entregado', cancelado: 'Cancelado' };

    function pedidosDelPeriodo(f) {
        return requiere('RepositorioDomicilios').obtenerPedidos().filter(function (p) {
            return enRango(p.fechaVenta, f.desde, f.hasta) && (!f.estado || p.estado === f.estado) &&
                (!f.idDomiciliario || p.idDomiciliario === f.idDomiciliario) && (!f.idBarrio || p.idBarrio === f.idBarrio);
        }).sort(function (a, b) { return new Date(a.fechaVenta) - new Date(b.fechaVenta); });
    }

    function resumenDomicilios(pedidos) {
        const entregados = pedidos.filter(function (p) { return p.estado === 'entregado'; });
        const conTiempo = entregados.filter(function (p) { return p.fechaAsignacion && p.fechaEntrega; });
        const minutos = conTiempo.length
            ? sumar(conTiempo, function (p) { return (new Date(p.fechaEntrega) - new Date(p.fechaAsignacion)) / 60000; }) / conTiempo.length
            : null;
        return {
            total: pedidos.length, entregados: entregados.length,
            cancelados: pedidos.filter(function (p) { return p.estado === 'cancelado'; }).length,
            enCurso: pedidos.filter(function (p) { return ['pendiente', 'asignado', 'en_camino'].indexOf(p.estado) >= 0; }).length,
            valorProductos: sumar(entregados, 'total'),
            valorEnvios: sumar(entregados, function (p) { return p.costoEnvio || 0; }),
            minutosPromedio: minutos
        };
    }

    function pedidosPorEstado(pedidos) {
        return Object.keys(TEXTO_ESTADO).map(function (e) {
            return { id: e, etiqueta: TEXTO_ESTADO[e], valor: pedidos.filter(function (p) { return p.estado === e; }).length };
        });
    }

    function pedidosPorDomiciliario(pedidos) {
        return requiere('RepositorioDomicilios').obtenerDomiciliarios().map(function (d) {
            const suyos = pedidos.filter(function (p) { return p.idDomiciliario === d.id; });
            return { id: d.id, etiqueta: d.nombre, valor: suyos.filter(function (p) { return p.estado === 'entregado'; }).length,
                asignados: suyos.length };
        }).sort(function (a, b) { return b.valor - a.valor || b.asignados - a.asignados; });
    }

    function pedidosPorBarrio(pedidos) {
        const repo = requiere('RepositorioDomicilios');
        return repo.obtenerBarrios().map(function (b) {
            return { id: b.id, etiqueta: b.nombre, valor: pedidos.filter(function (p) { return p.idBarrio === b.id; }).length };
        });
    }

    // ---------------- Exportar (RF27.1 / RF29.1) ----------------

    // Excel abre un CSV directamente. Se usa ";" (separador de Excel en español) y BOM para las tildes.
    function exportarCSV(nombreArchivo, encabezados, filas) {
        const limpiar = function (v) {
            const t = String(v === null || v === undefined ? '' : v);
            return /[";\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
        };
        const texto = [encabezados].concat(filas).map(function (f) { return f.map(limpiar).join(';'); }).join('\r\n');
        const enlace = document.createElement('a');
        enlace.href = URL.createObjectURL(new Blob(['﻿' + texto], { type: 'text/csv;charset=utf-8' }));
        enlace.download = nombreArchivo;
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        setTimeout(function () { URL.revokeObjectURL(enlace.href); }, 1000);
    }

    return {
        formatearPrecio: formatearPrecio, formatearFecha: formatearFecha, formatearDia: formatearDia,
        fechaLocal: fechaLocal, rangoInicial: rangoInicial, nombreUsuario: nombreUsuario,
        ventasDelPeriodo: ventasDelPeriodo, resumenVentas: resumenVentas, ventasPorPeriodo: ventasPorPeriodo,
        ventasPorMetodo: ventasPorMetodo, productosVendidos: productosVendidos,
        kardex: kardex, resumenKardex: resumenKardex, rotacion: rotacion, evolucionStock: evolucionStock,
        entradasYSalidasPorDia: entradasYSalidasPorDia,
        ventasPorVendedor: ventasPorVendedor, usuariosPorRol: usuariosPorRol,
        TEXTO_ESTADO: TEXTO_ESTADO, pedidosDelPeriodo: pedidosDelPeriodo, resumenDomicilios: resumenDomicilios,
        pedidosPorEstado: pedidosPorEstado, pedidosPorDomiciliario: pedidosPorDomiciliario, pedidosPorBarrio: pedidosPorBarrio,
        exportarCSV: exportarCSV
    };
})();
