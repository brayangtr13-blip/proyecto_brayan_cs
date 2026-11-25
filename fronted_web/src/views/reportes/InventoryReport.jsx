// src/views/reportes/InventoryReport.jsx
// VISTA: RF28 · reporte de movimientos de inventario (reporte_movimientos_inventario.html):
// existencias actuales y kárdex del periodo con stock anterior y resultante. Imprimir y exportar.
import { useState } from 'react'
import ReportController from '../../controllers/ReportController'
import { formatoFecha, formatoPesos } from '../../utils/helpers'
import { exportarCSV } from '../../utils/exportar'
import { Boton, CargarReporte, Encabezado, Fecha, Filtros, Indicador, RangoImpreso, Selector, SinDatos, Tabla } from './PartesReporte'

const TIPOS = { entrada: ['Entrada', 'bg-ok/10 text-ok'], salida: ['Salida', 'bg-err/10 text-err'], ajuste: ['Ajuste', 'bg-warn/10 text-warn'], reverso: ['Reverso', 'bg-acc/10 text-acc'] }
const Etiqueta = ({ tipo }) => <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${TIPOS[tipo][1]}`}>{TIPOS[tipo][0]}</span>
const conSigno = (n) => (n > 0 ? `+${n}` : String(n))

const Contenido = ({ data }) => {
  const [f, setF] = useState(() => ({ ...ReportController.rangoInicial(data.movimientos.map((m) => m.fecha)), codigo: '', idCategoria: '', tipo: '' }))
  const cambiar = (campo) => (valor) => setF({ ...f, [campo]: valor })
  const idCategoria = Number(f.idCategoria) || null

  // Existencias: los productos que cumplen los filtros de categoría y producto
  const productos = data.productos.filter((p) => (!idCategoria || p.idCategoria === idCategoria) && (!f.codigo || p.codigo === f.codigo))
  const renglones = ReportController.kardex(ReportController.kardexCompleto(data.movimientos, data.productos), { ...f, idCategoria })
  const resumen = ReportController.resumenKardex(renglones)

  const exportar = () => exportarCSV('reporte_inventario.csv',
    ['Fecha', 'Código', 'Producto', 'Tipo', 'Cantidad', 'Stock anterior', 'Stock resultante', 'Usuario', 'Observación'],
    renglones.map((r) => [formatoFecha(r.fecha), r.codigo, r.producto, TIPOS[r.tipo][0], r.cantidad, r.anterior, r.resultante, r.usuario, r.observacion]))

  return (
    <section className="grid gap-4">
      <Encabezado titulo="Movimientos de inventario" descripcion="Existencias actuales y kárdex del periodo.">
        <Boton onClick={() => window.print()}>Imprimir</Boton>
        <Boton onClick={exportar} disabled={renglones.length === 0}>Exportar kárdex a Excel</Boton>
      </Encabezado>
      <Filtros>
        <Fecha etiqueta="Desde" value={f.desde} onChange={cambiar('desde')} />
        <Fecha etiqueta="Hasta" value={f.hasta} onChange={cambiar('hasta')} />
        <Selector etiqueta="Categoría" value={f.idCategoria} onChange={cambiar('idCategoria')} todos="Todas" opciones={data.categorias.map((c) => ({ value: c.id, label: c.nombre }))} />
        <Selector etiqueta="Producto" value={f.codigo} onChange={cambiar('codigo')} opciones={data.productos.map((p) => ({ value: p.codigo, label: p.nombre }))} />
        <Selector etiqueta="Tipo de movimiento" value={f.tipo} onChange={cambiar('tipo')} opciones={[['entrada', 'Entrada (con reversos)'], ['salida', 'Salida'], ['ajuste', 'Ajuste'], ['reverso', 'Solo reversos']].map(([value, label]) => ({ value, label }))} />
      </Filtros>
      <RangoImpreso desde={f.desde} hasta={f.hasta} />

      <h2 className="font-sub text-lg text-nav">Existencias</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Indicador titulo="Productos en o bajo el mínimo" valor={productos.filter((p) => ReportController.stockBajo(p)).length} />
        <Indicador titulo="Valor del inventario (a precio de venta)" valor={formatoPesos(productos.reduce((s, p) => s + p.stock * p.precio, 0))} />
      </div>
      <Tabla encabezados={['Código', 'Producto', 'Categoría', 'Precio', 'Stock', 'Mínimo', 'Estado', 'Valor']} derecha={[3, 4, 5, 7]}
        claseFila={(n) => (ReportController.stockBajo(productos[n]) ? 'bg-err/5' : '')}
        filas={productos.map((p) => [p.codigo, p.nombre, p.categoria, formatoPesos(p.precio),
          ReportController.stockBajo(p) ? `${p.stock} ⚠` : p.stock, p.stockMinimo, p.activo ? 'Activo' : 'Inactivo', formatoPesos(p.stock * p.precio)])} />

      <h2 className="font-sub text-lg text-nav">Kárdex del periodo</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <Indicador titulo="Unidades que entraron" valor={resumen.entradas} />
        <Indicador titulo="Unidades que salieron" valor={resumen.salidas} />
        <Indicador titulo="Saldo del periodo" valor={conSigno(resumen.saldo)} />
      </div>
      {renglones.length === 0 ? <SinDatos texto="No hay movimientos con estos filtros." /> : (
        <Tabla encabezados={['Fecha', 'Código', 'Producto', 'Tipo', 'Cantidad', 'Anterior', 'Resultante', 'Usuario', 'Observación']} derecha={[4, 5, 6]}
          filas={renglones.map((r) => [formatoFecha(r.fecha), r.codigo, r.producto, <Etiqueta key="t" tipo={r.tipo} />, conSigno(r.cantidad), r.anterior, r.resultante, r.usuario, r.observacion])} />
      )}
    </section>
  )
}

const InventoryReport = () => <CargarReporte>{(data) => <Contenido data={data} />}</CargarReporte>

export default InventoryReport
