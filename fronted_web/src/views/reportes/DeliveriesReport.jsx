// src/views/reportes/DeliveriesReport.jsx
// VISTA: RF30 · reporte de domicilios (reporte_domicilios.html): resumen, pedidos por estado,
// por domiciliario y por barrio, y la tabla de pedidos. Imprimir y exportar.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import ReportController, { TEXTO_ESTADO_PEDIDO } from '../../controllers/ReportController'
import { ROUTES } from '../../config/routes'
import { formatoFecha, formatoPesos } from '../../utils/helpers'
import { exportarCSV } from '../../utils/exportar'
import { Apilada, Barras, Boton, CargarReporte, Encabezado, Fecha, Filtros, Indicador, RangoImpreso, Selector, SinDatos, Tabla, Tarjeta } from './PartesReporte'

const COLOR_ESTADO = { pendiente: 'bg-warn', asignado: 'bg-acc', en_camino: 'bg-pri', entregado: 'bg-ok', cancelado: 'bg-err' }
const pedidosTexto = (n) => `${n} ${n === 1 ? 'pedido' : 'pedidos'}`

const Contenido = ({ data }) => {
  const [f, setF] = useState(() => ({ ...ReportController.rangoInicial(data.pedidos.map((p) => p.fecha)), estado: '', idDomiciliario: '', idBarrio: '' }))
  const cambiar = (campo) => (valor) => setF({ ...f, [campo]: valor })

  const pedidos = ReportController.pedidosDelPeriodo(data.pedidos, { ...f, idDomiciliario: Number(f.idDomiciliario) || null, idBarrio: Number(f.idBarrio) || null })
  const r = ReportController.resumenDomicilios(pedidos)

  const exportar = () => exportarCSV('reporte_domicilios.csv', ['Pedido', 'Fecha', 'Cliente', 'Barrio', 'Domiciliario', 'Estado', 'Productos', 'Envío'],
    pedidos.map((p) => [p.id, formatoFecha(p.fecha), p.cliente, p.barrio, p.domiciliario, TEXTO_ESTADO_PEDIDO[p.estado], p.total, p.costoEnvio]))

  return (
    <section className="grid gap-4">
      <Encabezado titulo="Reporte de domicilios" descripcion="El valor cobrado solo cuenta los pedidos entregados.">
        <Boton onClick={() => window.print()} disabled={!pedidos.length}>Imprimir</Boton>
        <Boton onClick={exportar} disabled={!pedidos.length}>Exportar a Excel</Boton>
      </Encabezado>
      <Filtros>
        <Fecha etiqueta="Desde" value={f.desde} onChange={cambiar('desde')} />
        <Fecha etiqueta="Hasta" value={f.hasta} onChange={cambiar('hasta')} />
        <Selector etiqueta="Estado" value={f.estado} onChange={cambiar('estado')} opciones={Object.entries(TEXTO_ESTADO_PEDIDO).map(([value, label]) => ({ value, label }))} />
        <Selector etiqueta="Domiciliario" value={f.idDomiciliario} onChange={cambiar('idDomiciliario')} opciones={data.domiciliarios.map((d) => ({ value: d.id, label: d.nombre }))} />
        <Selector etiqueta="Barrio" value={f.idBarrio} onChange={cambiar('idBarrio')} opciones={data.barrios.map((b) => ({ value: b.id, label: b.nombre }))} />
      </Filtros>
      <RangoImpreso desde={f.desde} hasta={f.hasta} />

      {pedidos.length === 0 ? <SinDatos texto="No hay pedidos con estos filtros." /> : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Indicador titulo="Pedidos" valor={r.total} detalle={`${r.enCurso} en curso · ${r.cancelados} cancelados`} />
            <Indicador titulo="Entregados" valor={r.entregados} />
            <Indicador titulo="Tiempo promedio de entrega" valor={r.minutosPromedio === null ? '—' : `${r.minutosPromedio} min`} detalle="De la asignación a la entrega" />
            <Indicador titulo="Valor cobrado" valor={formatoPesos(r.valorProductos + r.valorEnvios)} detalle={`${formatoPesos(r.valorProductos)} productos + ${formatoPesos(r.valorEnvios)} envíos`} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Tarjeta titulo="Pedidos por estado">
              <Apilada items={ReportController.pedidosPorEstado(pedidos).map((e) => ({ ...e, color: COLOR_ESTADO[e.id] }))} formato={pedidosTexto} />
            </Tarjeta>
            <Tarjeta titulo="Entregas por domiciliario">
              <Barras items={ReportController.pedidosPorDomiciliario(pedidos, data.domiciliarios)} color="bg-ok" destacarPrimero formato={(n, d) => `${n} de ${d.asignados}`} />
            </Tarjeta>
            <Tarjeta titulo="Pedidos por barrio">
              <Barras items={ReportController.pedidosPorBarrio(pedidos, data.barrios)} formato={pedidosTexto} />
            </Tarjeta>
          </div>
          <Tabla encabezados={['Pedido', 'Fecha', 'Cliente', 'Barrio', 'Domiciliario', 'Estado', 'Productos', 'Envío', '']} derecha={[6, 7]}
            filas={[...pedidos].reverse().map((p) => [`#${p.id}`, formatoFecha(p.fecha), p.cliente, p.barrio, p.domiciliario, TEXTO_ESTADO_PEDIDO[p.estado],
              formatoPesos(p.total), formatoPesos(p.costoEnvio),
              <Link key="v" to={ROUTES.DELIVERY_DETAIL(p.id)} className="text-acc hover:underline print:hidden">Ver</Link>])} />
        </>
      )}
    </section>
  )
}

const DeliveriesReport = () => <CargarReporte>{(data) => <Contenido data={data} />}</CargarReporte>

export default DeliveriesReport
