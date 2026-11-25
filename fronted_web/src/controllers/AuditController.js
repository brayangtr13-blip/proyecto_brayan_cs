// src/controllers/AuditController.js
// CONTROLADOR del log de auditoría (log_auditoria.html · RNF04, solo administrador).
// Filtra, ordena, resume y pagina. Solo lee: nadie puede editar ni borrar un evento.
import AuditModel from '../models/AuditModel'

// Texto de cada acción de log_auditoria.accion (las que no estén aquí se muestran tal cual)
export const TEXTO_ACCION = {
  login: 'Inicio de sesión',
  logout: 'Cierre de sesión',
  login_fallido: 'Acceso fallido',
  registrar: 'Registrar',
  actualizar: 'Actualizar',
  activar: 'Activar',
  inactivar: 'Inactivar',
  anular: 'Anular',
  asignar: 'Asignar',
  cancelar: 'Cancelar',
  cerrar: 'Cierre de caja',
  consultar: 'Consultar'
}

export const POR_PAGINA = 10

const fechaLocal = (texto) => String(texto).slice(0, 10)
const aFecha = (texto) => new Date(String(texto).replace(' ', 'T'))
const hoy = () => new Date().toLocaleString('sv-SE').slice(0, 10)

// En los datos del DML un intento fallido o un bloqueo quedó como accion "login" con el detalle
// "Intento fallido..." o "Cuenta bloqueada...": se clasifica como acceso fallido para no ocultarlo
const clasificar = (e) => (e.accion === 'login' && /fallid|bloquead/i.test(e.detalle) ? { ...e, accion: 'login_fallido' } : e)

class AuditController {
  static async getLog() {
    const result = await AuditModel.getLog()
    if (!result.success) return result
    return { ...result, data: { ...result.data, eventos: result.data.eventos.map(clasificar) } }
  }

  // Rango inicial: del evento más antiguo a hoy, para que se vea todo el log
  static rangoInicial(eventos) {
    return { desde: eventos.length ? eventos.map((e) => fechaLocal(e.fecha)).sort()[0] : hoy(), hasta: hoy() }
  }

  // Más reciente primero; si dos eventos tienen la misma hora, manda el id (el orden en que se guardaron)
  static filtrar(eventos, f) {
    return eventos
      .filter((e) => {
        const dia = fechaLocal(e.fecha)
        return (!f.desde || dia >= f.desde) && (!f.hasta || dia <= f.hasta) &&
          (!f.idUsuario || e.idUsuario === Number(f.idUsuario)) &&
          (!f.idModulo || e.idModulo === Number(f.idModulo)) &&
          (!f.accion || e.accion === f.accion)
      })
      .sort((a, b) => aFecha(b.fecha) - aFecha(a.fecha) || b.id - a.id)
  }

  // Resumen: cuántos eventos, cuántas personas distintas y cuántos accesos fallidos
  static resumen(eventos) {
    return {
      total: eventos.length,
      usuarios: new Set(eventos.filter((e) => e.idUsuario).map((e) => e.idUsuario)).size,
      fallidos: eventos.filter((e) => e.accion === 'login_fallido').length
    }
  }

  // Las acciones del filtro salen de los datos y del catálogo, sin repetir
  static acciones(eventos) {
    return [...new Set([...Object.keys(TEXTO_ACCION), ...eventos.map((e) => e.accion)])]
  }

  static totalPaginas(cantidad) {
    return Math.max(1, Math.ceil(cantidad / POR_PAGINA))
  }

  static pagina(eventos, numero) {
    return eventos.slice((numero - 1) * POR_PAGINA, numero * POR_PAGINA)
  }
}

export default AuditController
