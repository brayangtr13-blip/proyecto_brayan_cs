// src/views/reportes/SalesPrintReport.jsx
// VISTA: RF27 · reporte impreso de ventas (reporte_impreso_ventas.html): pagadas y anuladas con su
// motivo, filtros por vendedor y método, imprimir y exportar a Excel. Lo que se ve es lo que se exporta.
import { useState } from 'react'
import ReportController from '../../controllers/ReportController'
import AuthController from '../../controllers/AuthController'
import { USER_ROLES } from '../../config/constants'
import { formatoFecha, formatoPesos } from '../../utils/helpers'
import { exportarCSV } from '../../utils/exportar'
import { Boton, CargarReporte, Encabezado, Fecha, Filtros, Indicador, RangoImpreso, Selector, SinDatos, Tabla } from './PartesReporte'

const Contenido = ({ data }) => {
  const [f, setF] = useState(() => ({ ...ReportController.rangoInicial(data.ventas.map((v) => v.fecha)), idUsuario: '', idMetodoPago: '' }))
  const cambiar = (campo) => (valor) => setF({ ...f, [campo]: valor })

  const { pagadas, anuladas } = ReportController.ventasDelPeriodo(data.ventas, { ...f, idUsuario: Number(f.idUsuario) || null, idMetodoPago: Number(f.idMetodoPago) || null })
  const resumen = ReportController.resumenVentas(pagadas)
  const hay = pagadas.length + anuladas.length > 0
  const vendedores = data.usuarios.filter((u) => [USER_ROLES.ADMIN, USER_ROLES.CAJERO].includes(u.rol))

  const exportar = () => exportarCSV('reporte_ventas.csv', ['Factura', 'Fecha', 'Vendedor', 'Método de pago', 'Estado', 'Total', 'Motivo de anulación'],
    [...pagadas, ...anuladas].map((v) => [v.id, formatoFecha(v.fecha), v.vendedor, v.metodo, v.estado === 'pagada' ? 'Pagada' : 'Anulada', v.total, v.motivo]))

  return (
    <section className="grid gap-4">
      <Encabezado titulo="Reporte de ventas" descripcion="Detalle de las ventas del periodo, listo para imprimir o llevar a Excel.">
        <Boton onClick={() => window.print()} disabled={!hay}>Imprimir</Boton>
        <Boton onClick={exportar} disabled={!hay}>Exportar a Excel</Boton>
      </Encabezado>
      <Filtros>
        <Fecha etiqueta="Desde" value={f.desde} onChange={cambiar('desde')} />
        <Fecha etiqueta="Hasta" value={f.hasta} onChange={cambiar('hasta')} />
        {/* El cajero solo ve sus ventas: no necesita elegir vendedor */}
        {AuthController.isAdmin() && (
          <Selector etiqueta="Vendedor" value={f.idUsuario} onChange={cambiar('idUsuario')} opciones={vendedores.map((u) => ({ value: u.id, label: u.nombreCompleto }))} />
        )}
        <Selector etiqueta="Método de pago" value={f.idMetodoPago} onChange={cambiar('idMetodoPago')} opciones={data.metodos.map((m) => ({ value: m.id, label: m.nombre }))} />
      </Filtros>
      <RangoImpreso desde={f.desde} hasta={f.hasta} />

      {!hay ? <SinDatos /> : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Indicador titulo="Ventas pagadas" valor={resumen.cantidad} />
            <Indicador titulo="Ticket promedio" valor={formatoPesos(resumen.ticket)} />
            <Indicador titulo="Total general" valor={formatoPesos(resumen.total)} />
          </div>
          <h2 className="font-sub text-lg text-nav">Ventas pagadas</h2>
          {pagadas.length === 0 ? <SinDatos texto="No hay ventas pagadas con estos filtros." /> : (
            <Tabla encabezados={['Factura', 'Fecha', 'Vendedor', 'Método', 'Total']} derecha={[4]}
              filas={pagadas.map((v) => [`#${v.id}`, formatoFecha(v.fecha), v.vendedor, v.metodo, formatoPesos(v.total)])} />
          )}
          <h2 className="font-sub text-lg text-nav">Ventas anuladas</h2>
          {anuladas.length === 0 ? <p className="text-t2">No hay ventas anuladas en el periodo.</p> : (
            <Tabla encabezados={['Factura', 'Fecha', 'Vendedor', 'Motivo', 'Total']} derecha={[4]}
              filas={anuladas.map((v) => [`#${v.id}`, formatoFecha(v.fecha), v.vendedor, v.motivo, formatoPesos(v.total)])} />
          )}
        </>
      )}
    </section>
  )
}

const SalesPrintReport = () => <CargarReporte>{(data) => <Contenido data={data} />}</CargarReporte>

export default SalesPrintReport
