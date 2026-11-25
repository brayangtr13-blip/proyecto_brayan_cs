// src/views/reportes/UsersPrintReport.jsx
// VISTA: reporte impreso de usuarios (reporte_impreso_usuarios.html): listado con rol, estado y lo que
// vendió cada uno en el periodo; totales por rol. Imprimir y exportar.
import { useState } from 'react'
import ReportController from '../../controllers/ReportController'
import { formatoPesos } from '../../utils/helpers'
import { exportarCSV } from '../../utils/exportar'
import { Boton, CargarReporte, Encabezado, Fecha, Filtros, RangoImpreso, Selector, SinDatos, Tabla, Tarjeta } from './PartesReporte'

const mayuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1)

const Contenido = ({ data }) => {
  const [f, setF] = useState(() => ({ ...ReportController.rangoInicial(data.ventas.map((v) => v.fecha)), rol: '', estado: '' }))
  const cambiar = (campo) => (valor) => setF({ ...f, [campo]: valor })

  const ventas = ReportController.ventasPorVendedor(data.ventas, data.usuarios, f)
  const filas = data.usuarios
    .filter((u) => (!f.rol || u.rol === f.rol) && (!f.estado || u.activo === (f.estado === 'activo')))
    .map((u) => ({ u, venta: ventas.find((v) => v.id === u.id) ?? null }))
  const roles = data.roles.map((r) => ({ nombre: mayuscula(r.nombre), cantidad: filas.filter((x) => x.u.rol === r.nombre).length })).filter((r) => r.cantidad > 0)

  const exportar = () => exportarCSV('reporte_usuarios.csv', ['Documento', 'Nombre', 'Apellido', 'Correo', 'Teléfono', 'Rol', 'Estado', 'Total vendido', 'N.º ventas'],
    filas.map(({ u, venta }) => [u.documento, u.nombre, u.apellido, u.email, u.telefono ?? '', mayuscula(u.rol), u.activo ? 'Activo' : 'Inactivo', venta?.valor ?? '', venta?.cantidad ?? '']))

  return (
    <section className="grid gap-4">
      <Encabezado titulo="Reporte de usuarios" descripcion="Lo vendido se calcula en el periodo elegido y solo aplica a administradores y cajeros.">
        <Boton onClick={() => window.print()} disabled={!filas.length}>Imprimir</Boton>
        <Boton onClick={exportar} disabled={!filas.length}>Exportar a Excel</Boton>
      </Encabezado>
      <Filtros>
        <Fecha etiqueta="Ventas desde" value={f.desde} onChange={cambiar('desde')} />
        <Fecha etiqueta="Ventas hasta" value={f.hasta} onChange={cambiar('hasta')} />
        <Selector etiqueta="Rol" value={f.rol} onChange={cambiar('rol')} opciones={data.roles.map((r) => ({ value: r.nombre, label: mayuscula(r.nombre) }))} />
        <Selector etiqueta="Estado" value={f.estado} onChange={cambiar('estado')} opciones={[{ value: 'activo', label: 'Activo' }, { value: 'inactivo', label: 'Inactivo' }]} />
      </Filtros>
      <RangoImpreso desde={f.desde} hasta={f.hasta} />

      {filas.length === 0 ? <SinDatos texto="No hay usuarios con estos filtros." /> : (
        <>
          <Tabla encabezados={['Documento', 'Nombre', 'Correo', 'Teléfono', 'Rol', 'Estado', 'Total vendido', 'N.º ventas']} derecha={[6, 7]}
            filas={filas.map(({ u, venta }) => [u.documento, u.nombreCompleto, u.email, u.telefono ?? '—', mayuscula(u.rol), u.activo ? 'Activo' : 'Inactivo',
              venta ? formatoPesos(venta.valor) : '—', venta ? venta.cantidad : '—'])} />
          <Tarjeta titulo="Totales por rol" className="max-w-sm">
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
              {roles.map((r) => <div key={r.nombre} className="contents"><dt>{r.nombre}</dt><dd className="text-right tabular-nums">{r.cantidad}</dd></div>)}
              <dt className="border-t border-borde pt-1 font-semibold">Total de usuarios</dt>
              <dd className="border-t border-borde pt-1 text-right font-semibold tabular-nums">{filas.length}</dd>
            </dl>
          </Tarjeta>
        </>
      )}
    </section>
  )
}

const UsersPrintReport = () => <CargarReporte>{(data) => <Contenido data={data} />}</CargarReporte>

export default UsersPrintReport
