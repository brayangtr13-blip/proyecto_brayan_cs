// ==========================================================
// Módulo 4 – Domicilios · Patrón OBSERVER (publicar / suscribirse)
//
// Cuando un pedido cambia de estado, varias cosas deben pasar: guardar el
// historial, descontar o devolver stock (HU06) y avisarle al cliente (HU07).
// En vez de que la pantalla llame a todas, el Service PUBLICA un evento
// ("estadoCambiado") y cada interesado se SUSCRIBE por su cuenta.
//
// Así la pantalla que cambia el estado no sabe que existen el inventario ni
// WhatsApp; agregar otro interesado (por ejemplo un correo) no la toca.
// ==========================================================

const EventosDomicilios = (function () {
    const oyentes = {};

    function suscribir(evento, funcion) {
        oyentes[evento] = oyentes[evento] || [];
        oyentes[evento].push(funcion);
    }

    function publicar(evento, datos) {
        (oyentes[evento] || []).forEach(function (funcion) {
            funcion(datos);
        });
    }

    return { suscribir: suscribir, publicar: publicar };
})();
