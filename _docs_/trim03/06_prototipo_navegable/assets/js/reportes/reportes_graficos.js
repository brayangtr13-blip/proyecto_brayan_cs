// Módulo 5 – Reportes · dibujo de gráficos y partes comunes de las pantallas.
// Los gráficos son barras de Bootstrap (progress y progress-stacked): no hace falta una librería
// de gráficos y funcionan sin internet. Cada barra lleva title y aria-label con el valor exacto.
// Docs: https://getbootstrap.com/docs/5.3/components/progress/

const GraficosReportes = (function () {
    const COLORES = ['bg-primary', 'bg-success', 'bg-warning', 'bg-info', 'bg-danger', 'bg-secondary', 'bg-dark'];

    function crear(etiqueta, clase, texto) {
        const el = document.createElement(etiqueta);
        if (clase) el.className = clase;
        if (texto !== undefined) el.textContent = texto;
        return el;
    }

    // Barras horizontales: una por item { etiqueta, valor }. formato(valor) da el texto a la derecha.
    function barras(contenedor, items, opciones) {
        const o = Object.assign({ formato: String, color: 'bg-primary', maximo: null, vacio: 'Sin datos en el periodo' }, opciones);
        contenedor.replaceChildren();
        if (!items.length) {
            contenedor.appendChild(crear('p', 'small text-body-secondary mb-0', o.vacio));
            return;
        }
        const maximo = o.maximo || Math.max.apply(null, items.map(function (i) { return i.valor; })) || 1;
        items.forEach(function (item, n) {
            const fila = crear('div', 'd-flex justify-content-between small gap-2');
            const nombre = crear('span', 'text-truncate', item.etiqueta);
            if (o.destacarPrimero && n === 0 && item.valor > 0) {
                nombre.prepend(crear('i', 'bi bi-trophy-fill text-warning me-1'));
            }
            fila.append(nombre, crear('span', 'text-nowrap', o.formato(item.valor, item)));
            const porcentaje = Math.round(item.valor / maximo * 100);
            const barra = crear('div', 'progress mb-2');
            barra.setAttribute('role', 'progressbar');
            barra.setAttribute('aria-label', item.etiqueta);
            barra.setAttribute('aria-valuenow', item.valor);
            barra.setAttribute('aria-valuemin', 0);
            barra.setAttribute('aria-valuemax', maximo);
            barra.title = item.etiqueta + ': ' + o.formato(item.valor, item);
            const relleno = crear('div', 'progress-bar ' + (item.color || o.color));
            relleno.style.width = Math.max(0, porcentaje) + '%';
            barra.appendChild(relleno);
            contenedor.append(fila, barra);
        });
    }

    // Barra apilada (en lugar de torta) + leyenda con el detalle de cada parte
    function apilada(contenedor, items, opciones) {
        const o = Object.assign({ formato: String, detalle: null }, opciones);
        contenedor.replaceChildren();
        const total = items.reduce(function (s, i) { return s + i.valor; }, 0);
        if (!total) {
            contenedor.appendChild(crear('p', 'small text-body-secondary mb-0', 'Sin datos en el periodo'));
            return;
        }
        const pila = crear('div', 'progress-stacked mb-3');
        pila.style.height = '24px';
        const leyenda = crear('ul', 'list-unstyled small mb-0');
        items.forEach(function (item, n) {
            const color = item.color || COLORES[n % COLORES.length];
            const porcentaje = Math.round(item.valor / total * 100);
            if (item.valor > 0) {
                const parte = crear('div', 'progress');
                parte.setAttribute('role', 'progressbar');
                parte.setAttribute('aria-label', item.etiqueta);
                parte.setAttribute('aria-valuenow', porcentaje);
                parte.setAttribute('aria-valuemin', 0);
                parte.setAttribute('aria-valuemax', 100);
                parte.style.width = (item.valor / total * 100) + '%';
                parte.title = item.etiqueta + ': ' + o.formato(item.valor, item) + ' (' + porcentaje + ' %)';
                parte.appendChild(crear('div', 'progress-bar ' + color, porcentaje >= 8 ? porcentaje + ' %' : ''));
                pila.appendChild(parte);
            }
            const li = crear('li', item.valor ? '' : 'text-body-secondary');
            li.appendChild(crear('i', 'bi ' + (item.valor ? 'bi-square-fill ' + color.replace('bg-', 'text-') : 'bi-square') + ' me-1'));
            li.append(item.etiqueta + ' · ' + (o.detalle ? o.detalle(item) : o.formato(item.valor, item)));
            leyenda.appendChild(li);
        });
        contenedor.append(pila, leyenda);
    }

    // Quién está generando el reporte (para el pie de la hoja impresa). Lee la misma sesión que sesion.js
    function usuarioActual() {
        try {
            const s = JSON.parse(sessionStorage.getItem('controlstore_sesion'));
            if (s) return s.nombre + ' (' + s.rol.charAt(0).toUpperCase() + s.rol.slice(1) + ')';
        } catch (e) { /* sin sesión */ }
        return 'Andres Gomez (Administrador)';
    }

    // Llena el encabezado y el pie de la hoja impresa: periodo, fecha de generación y usuario
    function hoja(desde, hasta) {
        const ahora = ServicioReportes.formatearFecha(new Date().toISOString());
        document.querySelectorAll('[data-reporte="periodo"]').forEach(function (el) {
            el.textContent = (desde ? ServicioReportes.formatearDia(desde) : 'el inicio') + ' a ' +
                (hasta ? ServicioReportes.formatearDia(hasta) : 'hoy');
        });
        document.querySelectorAll('[data-reporte="generado"]').forEach(function (el) { el.textContent = ahora; });
        document.querySelectorAll('[data-reporte="usuario"]').forEach(function (el) { el.textContent = usuarioActual(); });
    }

    // RNF04: imprimir o exportar un reporte también queda en el log (módulo Reportes), si el log está cargado
    function auditar(accion, detalle) {
        if (typeof RepositorioAuditoria === 'undefined') return;
        RepositorioAuditoria.registrar({ idModulo: RepositorioAuditoria.MODULO.REPORTES, accion: accion, detalle: detalle });
    }

    // Imprimir = el diálogo del navegador; ahí mismo se elige "Guardar como PDF" (RF27.1 / RF29.1)
    function imprimir(nombreReporte) {
        auditar('imprimir', 'Imprimió o guardó en PDF el ' + nombreReporte);
        window.print();
    }

    function exportar(nombreReporte, archivo, encabezados, filas) {
        auditar('exportar', 'Exportó a Excel el ' + nombreReporte + ' (' + filas.length + ' filas)');
        ServicioReportes.exportarCSV(archivo, encabezados, filas);
    }

    return { barras: barras, apilada: apilada, hoja: hoja, imprimir: imprimir, exportar: exportar, crear: crear };
})();
