// ==========================================================
// Módulo 4 – Domicilios · Patrón STATE (máquina de estados)
//
// Un solo lugar define qué cambios de estado son válidos y quién puede hacerlos.
// Sin esto, cada pantalla tendría sus propios "if" y tarde o temprano dejarían de
// coincidir (el panel del admin permitiría algo que el del domiciliario no, o el
// ChatBot otra cosa). Pantallas, Service y bot preguntan todos aquí.
//
// Estados = ENUM de la columna domicilios.estado.
// ==========================================================

const EstadosPedido = (function () {

    // HU06: "El flujo debe ser secuencial: Recibido -> Asignado -> En camino -> Entregado.
    // No se deben permitir saltos de estado." Desde cualquier estado no final se puede cancelar.
    const TRANSICIONES = {
        pendiente: ['asignado', 'cancelado'],
        asignado: ['en_camino', 'cancelado'],
        en_camino: ['entregado', 'cancelado'],
        entregado: [],   // HU06: un pedido entregado no se puede modificar
        cancelado: []    // HU06: un pedido cancelado tampoco
    };

    // HU06: "El domiciliario solo debe poder cambiar ... a En camino y Entregado";
    // "El administrador puede cambiar cualquier pedido ... incluido Cancelado".
    const PERMITIDOS_POR_ROL = {
        administrador: ['asignado', 'en_camino', 'entregado', 'cancelado'],
        domiciliario: ['en_camino', 'entregado']
    };

    // "en_camino" -> "en camino": los mensajes se leen como texto normal
    function nombre(estado) {
        return estado.replace('_', ' ');
    }

    function esFinal(estado) {
        return TRANSICIONES[estado].length === 0;
    }

    // Estados a los que ESTE rol puede mover el pedido desde su estado actual
    function siguientes(estadoActual, rol) {
        return TRANSICIONES[estadoActual].filter(function (estado) {
            return PERMITIDOS_POR_ROL[rol].includes(estado);
        });
    }

    // Devuelve null si el cambio es válido, o el mensaje que explica por qué no
    function validar(pedido, nuevoEstado, rol, idUsuario) {
        if (esFinal(pedido.estado)) {
            return 'El pedido ya está ' + nombre(pedido.estado) + ' y no se puede modificar.';
        }
        if (!TRANSICIONES[pedido.estado].includes(nuevoEstado)) {
            return 'No se permiten saltos de estado: desde "' + nombre(pedido.estado) + '" solo se puede pasar a ' +
                TRANSICIONES[pedido.estado].map(nombre).join(' o ') + '.';
        }
        if (!PERMITIDOS_POR_ROL[rol].includes(nuevoEstado)) {
            return 'Tu rol no puede poner un pedido en "' + nombre(nuevoEstado) + '".';
        }
        // HU06: el domiciliario solo cambia los pedidos asignados a él
        if (rol === 'domiciliario' && pedido.idDomiciliario !== idUsuario) {
            return 'Solo puedes cambiar el estado de tus propios pedidos.';
        }
        // "asignado" necesita un domiciliario: ese paso se hace con "Asignar domiciliario" (CS-36)
        if (nuevoEstado === 'asignado' && !pedido.idDomiciliario) {
            return 'Para pasar a "asignado" primero hay que elegir un domiciliario.';
        }
        return null;
    }

    return { esFinal: esFinal, siguientes: siguientes, validar: validar };
})();
