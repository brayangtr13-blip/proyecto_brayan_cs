// src/views/auditoria/AuditLogView.jsx
// VISTA: log de auditoría (seguridad/log_auditoria.html · RNF04, solo administrador).
// Solo lectura: filtros, resumen, tabla paginada de 10 en 10 e imprimir. No hay editar ni borrar.
import { useState } from 'react'
import useAudit from '../../hooks/useAudit'
import AuditController, { TEXTO_ACCION } from '../../controllers/AuditController'
import { formatoFecha } from '../../utils/helpers'
import AlertMessage from '../common/AlertMessage'
import LoadingSpinner from '../common/LoadingSpinner'
import { Boton, Fecha, Filtros, Indicador, RangoImpreso, Selector, SinDatos, Tabla } from '../reportes/PartesReporte'

const COLOR_ACCION = {
  login: 'bg-t2/10 text-t2', logout: 'bg-t2/10 text-t2', login_fallido: 'bg-err/10 text-err',
  registrar: 'bg-ok/10 text-ok', actualizar: 'bg-acc/10 text-acc', activar: 'bg-acc/10 text-acc', inactivar: 'bg-warn/10 text-warn',
  anular: 'bg-err/10 text-err', cancelar: 'bg-err/10 text-err', asignar: 'bg-pri/10 text-pri', cerrar: 'bg-nav/10 text-nav'
}

const EtiquetaAccion = ({ accion }) => (
  <span className={`whitespace-nowrap rounded-lg px-2 py-0.5 text-xs font-medium ${COLOR_ACCION[accion] ?? 'bg-t2/10 text-t2'}`}>
    {TEXTO_ACCION[accion] ?? accion}
  </span>
)

const mayuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1)

const Contenido = ({ data }) => {
  const [f, setF] = useState(() => ({ ...AuditController.rangoInicial(data.eventos), idUsuario: '', idModulo: '', accion: '' }))
  const [pagina, setPagina] = useState(1)
  // Cambiar un filtro vuelve a la página 1
  const cambiar = (campo) => (valor) => {
    setF({ ...f, [campo]: valor })
    setPagina(1)
  }

  const eventos = AuditController.filtrar(data.eventos, f)
  const resumen = AuditController.resumen(eventos)
  const paginas = AuditController.totalPaginas(eventos.length)
  const actual = Math.min(pagina, paginas)

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-titulo text-2xl text-nav">Log de auditoría</h1>
          <p className="text-t2">Quién hizo qué y cuándo. Los eventos no se pueden editar ni borrar.</p>
        </div>
        <div className="print:hidden"><Boton onClick={() => window.print()}>Imprimir</Boton></div>
      </div>

      <Filtros>
        <Fecha etiqueta="Desde" value={f.desde} onChange={cambiar('desde')} />
        <Fecha etiqueta="Hasta" value={f.hasta} onChange={cambiar('hasta')} />
        <Selector etiqueta="Usuario" value={f.idUsuario} onChange={cambiar('idUsuario')} opciones={data.usuarios.map((u) => ({ value: u.id, label: u.nombre }))} />
        <Selector etiqueta="Módulo" value={f.idModulo} onChange={cambiar('idModulo')} opciones={data.modulos.map((m) => ({ value: m.id, label: m.nombre }))} />
        <Selector etiqueta="Acción" value={f.accion} onChange={cambiar('accion')} todos="Todas"
          opciones={AuditController.acciones(data.eventos).map((a) => ({ value: a, label: TEXTO_ACCION[a] ?? a }))} />
      </Filtros>
      <RangoImpreso desde={f.desde} hasta={f.hasta} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Indicador titulo="Eventos" valor={resumen.total} />
        <Indicador titulo="Usuarios distintos" valor={resumen.usuarios} />
        <Indicador titulo="Accesos fallidos" valor={resumen.fallidos} />
      </div>

      {eventos.length === 0 ? <SinDatos texto="No hay eventos con estos filtros." /> : (
        <>
          <Tabla encabezados={['#', 'Fecha', 'Usuario', 'Acción', 'Módulo', 'Detalle', 'IP']}
            filas={AuditController.pagina(eventos, actual).map((e) => [
              e.id, <span key="f" className="whitespace-nowrap">{formatoFecha(e.fecha)}</span>,
              <span key="u">{e.usuario}<span className="block text-xs text-t2">{mayuscula(e.rol)}</span></span>,
              <EtiquetaAccion key="a" accion={e.accion} />, e.modulo, e.detalle, e.ip
            ])} />
          {/* Paginación de 10 en 10 */}
          <nav className="flex flex-wrap items-center justify-between gap-2 print:hidden" aria-label="Páginas del log">
            <p className="text-sm text-t2">
              Mostrando {(actual - 1) * 10 + 1}–{Math.min(actual * 10, eventos.length)} de {eventos.length} eventos
            </p>
            <div className="flex gap-1">
              <button type="button" onClick={() => setPagina(actual - 1)} disabled={actual === 1} className="rounded-lg border border-borde px-3 py-1.5 disabled:opacity-40">Anterior</button>
              {Array.from({ length: paginas }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" onClick={() => setPagina(n)} aria-current={n === actual ? 'page' : undefined}
                  className={`rounded-lg border px-3 py-1.5 ${n === actual ? 'border-acc bg-acc text-white' : 'border-borde'}`}>{n}</button>
              ))}
              <button type="button" onClick={() => setPagina(actual + 1)} disabled={actual === paginas} className="rounded-lg border border-borde px-3 py-1.5 disabled:opacity-40">Siguiente</button>
            </div>
          </nav>
        </>
      )}
    </section>
  )
}

const AuditLogView = () => {
  const { data, error, loading } = useAudit()
  if (loading) return <LoadingSpinner />
  if (error) return <AlertMessage type="error" message={error} />
  return <Contenido data={data} />
}

export default AuditLogView
