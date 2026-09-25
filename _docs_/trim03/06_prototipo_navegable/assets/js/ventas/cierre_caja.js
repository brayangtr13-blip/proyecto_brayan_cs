// Cierre de caja (CS-22 · HU05). Reglas en ServicioVentas; aquí solo la pantalla.

const usuario = Sesion.actual();
const el = function (id) { return document.getElementById(id); };
const precio = ServicioVentas.formatearPrecio;
let turno = null;

// ---------- Recaudo y cuadre del turno abierto ----------
function mostrarTurno() {
    turno = RepositorioVentas.obtenerTurnoAbierto(usuario.idUsuario);
    el('sinTurno').classList.toggle('d-none', Boolean(turno));
    el('seccionCierre').classList.toggle('d-none', !turno);
    if (!turno) return;

    const resumen = ServicioVentas.resumenTurno(turno);
    el('seccionCierre').querySelector('[data-campo="turno"]').textContent = '· Turno #' + turno.id;
    el('listaMetodos').replaceChildren();
    resumen.porMetodo.forEach(function (m) {
        const fila = el('plantillaMetodo').content.cloneNode(true);
        fila.querySelector('[data-campo="nombre"]').textContent = m.nombre;
        fila.querySelector('[data-campo="cantidad"]').textContent = m.cantidad + (m.cantidad === 1 ? ' venta' : ' ventas');
        fila.querySelector('[data-campo="total"]').textContent = precio(m.total);
        el('listaMetodos').appendChild(fila);
    });
    el('totalTurno').textContent = precio(resumen.totalVentas);

    const campo = function (n) { return el('formCierre').querySelector('[data-campo="' + n + '"]'); };
    campo('base').textContent = precio(turno.montoInicial);
    campo('efectivo').textContent = precio(resumen.totalEfectivo);
    campo('esperado').textContent = precio(turno.montoInicial + resumen.totalEfectivo);
    actualizarDiferencia();
}

// HU05: verde "Caja cuadrada" si es 0; rojo con faltante/sobrante y observación obligatoria si no
function actualizarDiferencia() {
    const escrito = el('efectivoContado').value !== '';
    const diferencia = escrito ? ServicioVentas.calcularDiferencia(turno, Number(el('efectivoContado').value)) : 0;
    const cuadra = diferencia === 0;
    el('cajaDiferencia').classList.toggle('diferencia-cuadrada', cuadra);
    el('cajaDiferencia').classList.toggle('diferencia-descuadre', !cuadra);
    el('textoDiferencia').textContent = !escrito ? 'Escribe el efectivo contado'
        : cuadra ? 'Caja cuadrada' : diferencia < 0 ? 'Faltante' : 'Sobrante';
    el('valorDiferencia').textContent = precio(diferencia);
    el('grupoObservacion').classList.toggle('d-none', cuadra);
    el('observacionCierre').required = !cuadra;
}

el('efectivoContado').addEventListener('input', actualizarDiferencia);

el('formCierre').addEventListener('submit', function (evento) {
    evento.preventDefault();
    el('formCierre').classList.add('was-validated');
    if (!el('formCierre').checkValidity()) return;
    const resultado = ServicioVentas.cerrarCaja(usuario, Number(el('efectivoContado').value), el('observacionCierre').value);
    if (!resultado.ok) return;

    llenarComprobante(resultado.turno);
    const imprimir = Object.assign(document.createElement('button'), {
        type: 'button', className: 'btn btn-sm btn-success ms-2', textContent: 'Imprimir comprobante'
    });
    imprimir.addEventListener('click', function () { window.print(); });
    el('cierreExito').replaceChildren('Caja cerrada. Turno #' + resultado.turno.id + ' con diferencia de ' +
        precio(resultado.diferencia) + '.', imprimir);
    el('cierreExito').classList.remove('d-none');
    el('formCierre').reset();
    el('formCierre').classList.remove('was-validated');
    mostrarTurno();      // sin turno abierto: ya no se puede vender en este turno
    mostrarHistorico();
});

// ---------- Comprobante de cierre (CU028) ----------
function llenarComprobante(cierre) {
    const c = el('comprobante');
    const campo = function (n) { return c.querySelector('[data-campo="' + n + '"]'); };
    const diferencia = cierre.montoFinal - cierre.montoInicial - cierre.totalEfectivo;
    campo('encabezado').textContent = 'Turno #' + cierre.id + ' · ' + RepositorioVentas.obtenerUsuario(cierre.idUsuario).nombre +
        ' · ' + ServicioVentas.formatearFecha(cierre.fechaApertura) + ' a ' + ServicioVentas.formatearFecha(cierre.fechaCierre);
    const cuerpo = campo('renglones');
    cuerpo.replaceChildren();
    ServicioVentas.resumenTurno(cierre).porMetodo.forEach(function (m) {
        const fila = cuerpo.insertRow();
        fila.insertCell().textContent = m.nombre + ' (' + m.cantidad + ')';
        const t = fila.insertCell();
        t.textContent = precio(m.total);
        t.className = 'text-end';
    });
    campo('cuadre').textContent = 'Total ' + precio(cierre.totalVentas) + ' · Base ' + precio(cierre.montoInicial) +
        ' · Contado ' + precio(cierre.montoFinal) + ' · Diferencia ' + precio(diferencia);
    campo('observacion').textContent = cierre.observacion ? 'Observación: ' + cierre.observacion : '';
}

// ---------- Histórico de cierres ----------
function mostrarHistorico() {
    el('cuerpoCierres').replaceChildren();
    ServicioVentas.listarCierres(usuario).forEach(function (a) {
        const fila = el('plantillaCierre').content.cloneNode(true).querySelector('tr');
        const campo = function (n) { return fila.querySelector('[data-campo="' + n + '"]'); };
        const diferencia = a.montoFinal - a.montoInicial - a.totalEfectivo;
        campo('turno').textContent = '#' + a.id;
        campo('cajero').textContent = RepositorioVentas.obtenerUsuario(a.idUsuario).nombre;
        campo('apertura').textContent = ServicioVentas.formatearFecha(a.fechaApertura);
        campo('cierre').textContent = ServicioVentas.formatearFecha(a.fechaCierre);
        campo('ventas').textContent = precio(a.totalVentas);
        campo('contado').textContent = precio(a.montoFinal);
        campo('diferencia').textContent = precio(diferencia);
        campo('diferencia').classList.add(diferencia === 0 ? 'text-success' : 'text-danger');
        campo('observacion').textContent = a.observacion || '—';
        fila.querySelector('[data-accion="imprimir"]').dataset.id = a.id;
        el('cuerpoCierres').appendChild(fila);
    });
}

el('cuerpoCierres').addEventListener('click', function (evento) {
    const boton = evento.target.closest('[data-accion="imprimir"]');
    if (!boton) return;
    llenarComprobante(RepositorioVentas.obtenerArqueos().find(function (a) { return a.id === Number(boton.dataset.id); }));
    window.print();
});

mostrarTurno();
mostrarHistorico();
