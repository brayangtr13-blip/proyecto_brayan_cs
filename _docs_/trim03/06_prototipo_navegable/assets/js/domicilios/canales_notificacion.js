// ==========================================================
// Módulo 4 – Domicilios · Patrón ADAPTER (canales de notificación)
//
// El notificador no sabe si el mensaje sale por WhatsApp, por Telegram o por
// el simulador: solo llama a canal.enviar(telefono, mensaje). Cada canal
// "adapta" esa misma llamada a su proveedor. Pasar de WhatsApp a Telegram es
// cambiar UNA línea (CANAL_ACTIVO), sin tocar el notificador ni las pantallas.
//
// Todos los canales cumplen la misma interfaz:
//   nombre            -> texto que se muestra en pantalla
//   enviar(tel, msg)  -> { ok: true } o { ok: false, error: '...' }
// ==========================================================

// Canal del prototipo: "envía" el mensaje sin salir del navegador (el mensaje queda
// guardado en el pedido y se ve en el detalle y en el Simulador del ChatBot).
const CanalSimulado = {
    nombre: 'Simulado',
    // Para demostrar los reintentos de HU07: cuántos envíos seguidos deben fallar.
    // Normalmente es 0; en la sustentación se puede subir desde la consola del navegador.
    fallosPendientes: 0,
    enviar: function (telefono, mensaje) {
        if (this.fallosPendientes > 0) {
            this.fallosPendientes -= 1;
            return { ok: false, error: 'Sin conexión con el proveedor de mensajería (simulado)' };
        }
        return { ok: true };
    }
};

// Canales reales: su envío vive en el servidor (Django), porque necesitan credenciales
// (token de Twilio o del bot de Telegram) que NUNCA deben ir en código del navegador.
// Aquí quedan con la misma interfaz, para que el cambio de canal sea de una línea.
const CanalWhatsApp = {
    nombre: 'WhatsApp (Twilio)',
    enviar: function () {
        return { ok: false, error: 'El envío por WhatsApp se hace desde el servidor con Twilio.' };
    }
};

const CanalTelegram = {
    nombre: 'Telegram (Bot API)',
    enviar: function () {
        return { ok: false, error: 'El envío por Telegram se hace desde el servidor con la Bot API.' };
    }
};

// La única línea que cambia al conectar el ChatBot real
const CANAL_ACTIVO = CanalSimulado;
