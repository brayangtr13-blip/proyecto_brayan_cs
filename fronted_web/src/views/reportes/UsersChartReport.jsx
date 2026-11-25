// src/views/reportes/UsersChartReport.jsx
// VISTA: reporte gráfico de usuarios (reporte_grafico_usuarios.html): vendedor destacado,
// total y número de ventas por vendedor, usuarios por rol y por estado.
import { useState } from 'react'
import ReportController from '../../controllers/ReportController'
import { formatoPesos } from '../../utils/helpers'
import { Apilada, Barras, CargarReporte, Encabezado, Fecha, Filtros, Tarjeta } from './PartesReporte'

const ventasTexto = (n) => `${n} ${n === 1 ? 'venta' : 'ventas'}`

const Contenido = ({ data }) => {
  const [rango, setRango] = useState(() => ReportController.rangoInicial(data.ventas.map((v) => v.fecha)))
  const vendedores = ReportController.ventasPorVendedor(data.ventas, data.usuarios, rango)
  const mejor = vendedores[0]
  const activos = data.usuarios.filter((u) => u.activo).length

  return (
    <section className="grid gap-4">
      <Encabezado titulo="Gráfico de usuarios" descripcion="Las ventas son del periodo; los usuarios por rol y estado son de hoy." />
      <Filtros>
        <Fecha etiqueta="Desde" value={rango.desde} onChange={(desde) => setRango({ ...rango, desde })} />
        <Fecha etiqueta="Hasta" value={rango.hasta} onChange={(hasta) => setRango({ ...rango, hasta })} />
      </Filtros>

      {mejor?.valor > 0 && (
        <p className="rounded-2xl border border-warn/40 bg-warn/10 px-5 py-4">
          🏆 <strong>Vendedor destacado:</strong> {mejor.etiqueta} · {ventasTexto(mejor.cantidad)} · {formatoPesos(mejor.valor)}
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Tarjeta titulo="Total vendido por vendedor">
          <Barras items={vendedores} formato={formatoPesos} destacarPrimero />
        </Tarjeta>
        <Tarjeta titulo="Número de ventas por vendedor">
          <Barras items={vendedores.map((v) => ({ etiqueta: v.etiqueta, valor: v.cantidad })).sort((a, b) => b.valor - a.valor)} formato={ventasTexto} color="bg-pri" destacarPrimero />
        </Tarjeta>
        <Tarjeta titulo="Usuarios por rol">
          <Apilada items={ReportController.usuariosPorRol(data.usuarios, data.roles)} detalle={(r) => r.usuarios.map((u) => u.nombreCompleto).join(', ')} />
        </Tarjeta>
        <Tarjeta titulo="Usuarios por estado">
          <Barras maximo={data.usuarios.length} items={[
            { etiqueta: 'Activos', valor: activos, color: 'bg-ok' },
            { etiqueta: 'Inactivos', valor: data.usuarios.length - activos, color: 'bg-t2' }
          ]} />
        </Tarjeta>
      </div>
    </section>
  )
}

const UsersChartReport = () => <CargarReporte>{(data) => <Contenido data={data} />}</CargarReporte>

export default UsersChartReport
