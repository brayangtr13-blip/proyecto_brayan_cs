// src/views/ventas/Comprobante.jsx
// VISTA: tiquete de la venta (comprobante_venta.js del prototipo). Solo dibuja lo que recibe.
import { formatoFecha, formatoPesos } from '../../utils/helpers'

const Comprobante = ({ venta, renglones, cambio = null, recibido = null }) => (
  <div className="mx-auto w-full max-w-sm rounded-2xl border border-dashed border-borde bg-card p-5 font-mono text-sm">
    <div className="text-center">
      <p className="font-titulo text-base text-nav">Control Store</p>
      <p className="text-t2">Autoservicio Ayuelal · NIT 900.123.456-7</p>
      <p className="mt-2">Factura #{venta.id}</p>
      <p className="text-t2">{formatoFecha(venta.fecha)} · {venta.cajero}</p>
    </div>
    <table className="mt-4 w-full">
      <thead className="border-y border-dashed border-borde text-left text-t2">
        <tr><th className="py-1">Producto</th><th className="py-1 text-right">Cant.</th><th className="py-1 text-right">Subtotal</th></tr>
      </thead>
      <tbody>
        {renglones.map((r) => (
          <tr key={r.codigo}>
            <td className="py-1 pr-2">{r.producto ?? r.nombre}</td>
            <td className="py-1 text-right tabular-nums">{r.cantidad}</td>
            <td className="py-1 text-right tabular-nums">{formatoPesos(r.cantidad * r.precio)}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <div className="mt-3 grid gap-1 border-t border-dashed border-borde pt-3">
      <p className="flex justify-between text-base font-semibold"><span>TOTAL</span><span>{formatoPesos(venta.total)}</span></p>
      <p className="flex justify-between text-t2"><span>Pago</span><span>{venta.metodo}</span></p>
      {recibido !== null && <p className="flex justify-between text-t2"><span>Recibido</span><span>{formatoPesos(recibido)}</span></p>}
      {cambio !== null && <p className="flex justify-between font-semibold text-ok"><span>Cambio</span><span>{formatoPesos(cambio)}</span></p>}
      {venta.estado === 'anulada' && <p className="mt-1 text-center font-semibold text-err">VENTA ANULADA</p>}
    </div>
    <p className="mt-4 text-center text-t2">Precios con IVA incluido · ¡Gracias por su compra!</p>
  </div>
)

export default Comprobante
