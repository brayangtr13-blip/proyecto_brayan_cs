// src/views/reportes/RotationReport.jsx
// VISTA: RF29 · rotación de inventario (reporte_rotacion_inventario.html): productos de mayor y menor
// salida, evolución del stock total y entradas contra salidas por día.
import { useState } from 'react'
import ReportController from '../../controllers/ReportController'
import { Barras, CargarReporte, Encabezado, Fecha, Filtros, Selector, SinDatos, Tarjeta } from './PartesReporte'

const und = (v) => `${v} und.`

const Contenido = ({ data }) => {
  const [f, setF] = useState(() => ({ ...ReportController.rangoInicial(data.movimientos.map((m) => m.fecha)), idCategoria: '' }))
  const cambiar = (campo) => (valor) => setF({ ...f, [campo]: valor })
  const filtros = { ...f, idCategoria: Number(f.idCategoria) || null }

  // El kárdex completo se calcula UNA vez y los cuatro gráficos lo reutilizan
  const base = ReportController.kardexCompleto(data.movimientos, data.productos)
  const hay = ReportController.kardex(base, filtros).length > 0
  const rotacion = ReportController.rotacion(base, data.productos, filtros)
  const maximo = Math.max(...rotacion.map((r) => r.valor), 1)
  const dias = ReportController.entradasYSalidasPorDia(base, filtros)
  const tope = Math.max(...dias.map((d) => Math.max(d.entradas, d.salidas)), 1)

  return (
    <section className="grid gap-4">
      <Encabezado titulo="Rotación de inventario" descripcion="Rotación = unidades que salieron por ventas o entregas, menos las que volvieron por anulaciones." />
      <Filtros>
        <Fecha etiqueta="Desde" value={f.desde} onChange={cambiar('desde')} />
        <Fecha etiqueta="Hasta" value={f.hasta} onChange={cambiar('hasta')} />
        <Selector etiqueta="Categoría" value={f.idCategoria} onChange={cambiar('idCategoria')} todos="Todas" opciones={data.categorias.map((c) => ({ value: c.id, label: c.nombre }))} />
      </Filtros>

      {!hay ? <SinDatos texto="No hay movimientos de inventario en el periodo elegido." /> : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Tarjeta titulo="Mayor rotación (top 5)">
              <Barras items={[...rotacion].sort((a, b) => b.valor - a.valor).slice(0, 5)} formato={und} color="bg-ok" maximo={maximo} />
            </Tarjeta>
            <Tarjeta titulo="Menor rotación (top 5)">
              <Barras items={[...rotacion].sort((a, b) => a.valor - b.valor).slice(0, 5)} formato={und} color="bg-err" maximo={maximo} />
            </Tarjeta>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Tarjeta titulo="Evolución del stock total">
              <Barras items={ReportController.evolucionStock(base, data.productos, filtros)} formato={und} />
            </Tarjeta>
            <Tarjeta titulo="Entradas y salidas por día">
              {dias.map((d) => (
                <div key={d.etiqueta} className="grid gap-1">
                  <p className="text-sm font-semibold">{d.etiqueta}</p>
                  <Barras maximo={tope} formato={und} items={[
                    { etiqueta: 'Entradas', valor: d.entradas, color: 'bg-ok' },
                    { etiqueta: 'Salidas', valor: d.salidas, color: 'bg-err' }
                  ]} />
                </div>
              ))}
            </Tarjeta>
          </div>
        </>
      )}
    </section>
  )
}

const RotationReport = () => <CargarReporte>{(data) => <Contenido data={data} />}</CargarReporte>

export default RotationReport
