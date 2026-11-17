// Utilidades compartidas por todos los módulos (patrón Module con IIFE).
// Antes cada Service tenía su propia copia de formatearPrecio y formatearFecha, y había dos
// paginaciones copiadas; ahora viven aquí una sola vez. No depende de ningún otro archivo:
// se carga antes que los Repository y los Service.

// ---------- Formato de precios, fechas y texto ----------
const Formato = (function () {

    // $2.850 · -$700 (el signo va antes del $, como se escribe un faltante)
    function precio(valor) {
        return (valor < 0 ? '-' : '') + '$' + Math.abs(Math.round(valor)).toLocaleString('es-CO');
    }

    // 23/09/2026 10:10
    function fecha(texto) {
        const f = new Date(texto);
        return f.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
            f.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    // Fecha local AAAA-MM-DD (la que usan los <input type="date">)
    function fechaLocal(texto) {
        const f = new Date(texto);
        return f.getFullYear() + '-' + String(f.getMonth() + 1).padStart(2, '0') + '-' + String(f.getDate()).padStart(2, '0');
    }

    // '2026-09-23' → '23/09/2026'
    function dia(aaaammdd) {
        const p = aaaammdd.split('-');
        return p[2] + '/' + p[1] + '/' + p[0];
    }

    // Sin tildes y en minúscula: "cafe" encuentra "Café"
    function normalizar(texto) {
        return texto.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
    }

    // Para armar HTML con datos escritos por usuarios (nombres de productos, etc.): convierte
    // < > & " ' en texto, así un nombre como "<img onerror=...>" se ve tal cual y no se ejecuta.
    function escaparHtml(texto) {
        return String(texto === null || texto === undefined ? '' : texto)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    return { precio: precio, fecha: fecha, fechaLocal: fechaLocal, dia: dia, normalizar: normalizar, escaparHtml: escaparHtml };
})();

// ---------- Paginación (Bootstrap) ----------
const Paginacion = (function () {

    // Dibuja "Mostrando 1–10 de 12 nombre" y los botones Anterior · 1 · 2 · Siguiente.
    // alCambiar(nuevaPagina) se llama al hacer clic; devuelve la página válida (por si quedó fuera de rango).
    function dibujar(lista, resumen, total, pagina, porPagina, nombre, alCambiar) {
        const paginas = Math.max(1, Math.ceil(total / porPagina));
        pagina = Math.min(Math.max(1, pagina), paginas);
        const desde = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
        resumen.textContent = 'Mostrando ' + desde + '–' + Math.min(pagina * porPagina, total) + ' de ' + total + ' ' + nombre;

        lista.replaceChildren();
        function boton(texto, destino, activo, deshabilitado) {
            const li = document.createElement('li');
            li.className = 'page-item' + (activo ? ' active' : '') + (deshabilitado ? ' disabled' : '');
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'page-link';
            b.textContent = texto;
            if (activo) b.setAttribute('aria-current', 'page');
            b.addEventListener('click', function () { alCambiar(destino); });
            li.appendChild(b);
            lista.appendChild(li);
        }
        boton('Anterior', pagina - 1, false, pagina === 1);
        for (let n = 1; n <= paginas; n++) boton(String(n), n, n === pagina, false);
        boton('Siguiente', pagina + 1, false, pagina === paginas);
        return pagina;
    }

    return { dibujar: dibujar };
})();
