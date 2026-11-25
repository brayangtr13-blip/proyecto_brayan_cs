// src/views/reportes/SalesChartReport.jsx
// VISTA: RF26 · reporte gráfico de ventas (reporte_grafico_ventas.html). Solo filtra y dibuja:
// los cálculos son de ReportController.
import { useState } from 'react'
import ReportController from '../../controllers/ReportController'
import { formatoPesos } from '../../utils/helpers'
import { Apilada, Barras, CargarReporte, Encabezado, Fecha, Filtros, Indicador, SinDatos, Tarjeta } from './PartesReporte'

const TITULOS = { dia: 'Total de ventas por día', semana: 'Total de ventas por semana', mes: 'Total de ventas por mes' }
const plural = (n) => `${n} ${n === 1 ? 'venta' : 'ventas'}`

const Contenido = ({ data }) => {
  const [rango, setRango] = useState(() => ReportController.rangoInicial(data.ventas.map((v) => v.fecha)))
  const [agrupacion, setAgrupacion] = useState('dia')

  const { pagadas } = ReportController.ventasDelPeriodo(data.ventas, rango)
  const resumen = ReportController.resumenVentas(pagadas)
  const top = ReportController.productosVendidos(pagadas, data.productos).slice(0, 10)
    .map((p) => ({ etiqueta: p.etiqueta, valor: p.unidades, total: p.valor }))

  return (
    <section className="grid gap-4">
      <Encabezado titulo="Gráfico de ventas" descripcion="Solo cuenta las ventas pagadas: las anuladas y los domicilios sin entregar no son plata recibida." />
      <Filtros>
        <Fecha etiqueta="Desde" value={rango.desde} onChange={(desde) => setRango({ ...rango, desde })} />
        <Fecha etiqueta="Hasta" value={rango.hasta} onChange={(hasta) => setRango({ ...rango, hasta })} />
        <fieldset className="grid gap-1 text-sm font-medium sm:col-span-2">
          <legend>Agrupar por</legend>
          <div className="flex gap-2">
            {[['dia', 'Día'], ['semana', 'Semana'], ['mes', 'Mes']].map(([valor, texto]) => (
              <button key={valor} type="button" aria-pressed={agrupacion === valor} onClick={() => setAgrupacion(valor)}
                className={`rounded-full border px-4 py-1.5 ${agrupacion === valor ? 'border-acc bg-acc text-white' : 'border-borde hover:border-acc'}`}>
                {texto}
              </button>
            ))}
          </div>
        </fieldset>
      </Filtros>

      {/* HU01: sin ventas en el rango no se dibuja el gráfico, se avisa */}
      {pagadas.length === 0 ? <SinDatos texto="No hay ventas pagadas en el periodo elegido." /> : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Indicador titulo="Total vendido" valor={formatoPesos(resumen.total)} />
            <Indicador titulo="Número de ventas" valor={resumen.cantidad} />
            <Indicador titulo="Ticket promedio" valor={formatoPesos(resumen.ticket)} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Tarjeta titulo={TITULOS[agrupacion]}>
              <Barras items={ReportController.ventasPorPeriodo(pagadas, agrupacion)} formato={(v, i) => `${formatoPesos(v)} · ${plural(i.cantidad)}`} />
            </Tarjeta>
            <Tarjeta titulo="Ventas por método de pago">
              <Apilada items={ReportController.ventasPorMetodo(pagadas, data.metodos)} formato={formatoPesos} detalle={(m) => plural(m.cantidad)} />
            </Tarjeta>
          </div>
          <Tarjeta titulo="Top 10 productos más vendidos">
            <Barras items={top} color="bg-ok" destacarPrimero formato={(v, p) => `${v} und. · ${formatoPesos(p.total)}`} />
          </Tarjeta>
        </>
      )}
    </section>
  )
}

const SalesChartReport = () => <CargarReporte>{(data) => <Contenido data={data} />}</CargarReporte>

export default SalesChartReport
