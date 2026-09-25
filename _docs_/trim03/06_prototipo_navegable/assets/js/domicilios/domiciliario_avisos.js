// Campana de avisos del panel del domiciliario (CS-38 – CU039 "Notificar al domiciliario").
// Lee los avisos que el notificador guarda en el Repository cuando se le asigna un pedido.

// Mismo domiciliario que mis_pedidos.js (Luis Pérez, usuarios.id_usuario = 3 en la base de datos)
const ID_DOMICILIARIO_AVISOS = 3;

const listaAvisos = document.getElementById('listaAvisos');
const puntoAvisos = document.getElementById('puntoAvisos');

function dibujarAvisos() {
    const avisos = RepositorioDomicilios.obtenerAvisos(ID_DOMICILIARIO_AVISOS).slice().reverse();
    listaAvisos.replaceChildren();

    if (avisos.length === 0) {
        const vacio = document.createElement('div');
        vacio.className = 'dropdown-item-text small text-body-secondary';
        vacio.textContent = 'No tienes avisos.';
        listaAvisos.appendChild(vacio);
    }
    avisos.slice(0, 5).forEach(function (aviso) {
        const item = document.createElement('div');
        // fw-semibold marca los que todavía no se han leído
        item.className = 'dropdown-item-text small' + (aviso.leido ? '' : ' fw-semibold');
        item.textContent = aviso.texto;
        listaAvisos.appendChild(item);
    });

    // El punto azul solo aparece si hay avisos sin leer
    puntoAvisos.classList.toggle('d-none', !avisos.some(function (a) { return !a.leido; }));
}

// Al abrir el dropdown se dan por leídos (el punto desaparece, el texto queda visible)
// Docs: https://getbootstrap.com/docs/5.3/components/dropdowns/#events
document.getElementById('botonAvisos').addEventListener('shown.bs.dropdown', function () {
    RepositorioDomicilios.marcarAvisosLeidos(ID_DOMICILIARIO_AVISOS);
    puntoAvisos.classList.add('d-none');
});

// "storage" se dispara cuando otra página del mismo sitio cambia el localStorage (otra pestaña,
// o el iframe de "Mis pedidos"). Se vuelven a leer los datos y solo se redibuja la campana,
// sin recargar el panel: si el administrador asigna un pedido en otra pestaña, el aviso aparece solo.
window.addEventListener('storage', function () {
    RepositorioDomicilios.recargar();
    dibujarAvisos();
});

dibujarAvisos();
