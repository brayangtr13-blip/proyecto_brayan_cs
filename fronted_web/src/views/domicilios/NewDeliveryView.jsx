// src/views/domicilios/NewDeliveryView.jsx
// VISTA: registrar un pedido por teléfono (registrar_pedido.html). Solo el administrador.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useNewDelivery } from '../../hooks/useDeliveries'
import SaleController from '../../controllers/SaleController'
import { ROUTES } from '../../config/routes'
import { formatoPesos } from '../../utils/helpers'
import AlertMessage from '../common/AlertMessage'

const campo = (conError) =>
  `w-full rounded-xl border bg-card px-4 py-2.5 outline-none focus:ring-2 focus:ring-acc/30 ${conError ? 'border-err' : 'border-borde focus:border-acc'}`

const CLIENTE_VACIO = { nombre: '', apellido: '', telefono: '', direccion: '', idBarrio: '' }

const NewDeliveryView = () => {
  const navigate = useNavigate()
  const nuevo = useNewDelivery()
  const [cliente, setCliente] = useState(CLIENTE_VACIO)
  const [avisoCliente, setAvisoCliente] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [mismaDireccion, setMismaDireccion] = useState(true)
  const [entrega, setEntrega] = useState({ direccionEntrega: '', idBarrio: '', telefonoContacto: '', observacion: '' })
  const [idMetodoPago, setIdMetodoPago] = useState('')
  const [error, setError] = useState('')
  const [fields, setFields] = useState({})
  const [guardando, setGuardando] = useState(false)

  // Si se entrega en la dirección del cliente, los datos de entrega salen de su ficha
  const datosEntrega = mismaDireccion
    ? { ...entrega, direccionEntrega: cliente.direccion, idBarrio: cliente.idBarrio, telefonoContacto: entrega.telefonoContacto || cliente.telefono }
    : entrega
  const barrio = nuevo.barrios.find((b) => b.id === Number(datosEntrega.idBarrio))
  const envio = barrio?.costoDomicilio ?? 0

  // Si cambia el teléfono ya no es el cliente encontrado: se quita su id para no sobrescribirlo
  const cambiarCliente = (e) => {
    const { id: _id, ...resto } = cliente
    setCliente(e.target.name === 'telefono' ? { ...resto, telefono: e.target.value } : { ...cliente, [e.target.name]: e.target.value })
  }
  const cambiarEntrega = (e) => setEntrega({ ...entrega, [e.target.name]: e.target.value })

  // clientes.telefono es UNIQUE: si ya existe, se llenan sus datos (se pueden corregir si cambiaron)
  const buscarCliente = async () => {
    const result = await nuevo.buscarCliente(cliente.telefono)
    if (result.data) {
      setCliente({ ...result.data, idBarrio: String(result.data.idBarrio ?? '') })
      setAvisoCliente(`Cliente encontrado: ${result.data.nombre} ${result.data.apellido}. Puedes corregir sus datos si cambiaron.`)
    } else {
      setAvisoCliente('Cliente nuevo: completa sus datos y se guardará con el pedido.')
    }
  }

  const agregar = (e) => {
    e.preventDefault()
    const producto = SaleController.buscarProducto(busqueda, nuevo.products)
    if (!producto) return setError('No encontramos ese producto.')
    const falla = nuevo.agregar(producto, Math.max(1, Number(cantidad) || 1))
    setError(falla ?? '')
    if (!falla) {
      setBusqueda('')
      setCantidad('1')
    }
  }

  const registrar = async () => {
    setGuardando(true)
    const result = await nuevo.registrar({ cliente, ...datosEntrega, idMetodoPago })
    setGuardando(false)
    if (result.success) return navigate(ROUTES.DELIVERY_DETAIL(result.data.id))
    setFields(result.fields ?? {})
    setError(result.error)
  }

  const error_ = (nombre) => fields[nombre] && <span className="text-sm font-normal text-err">{fields[nombre]}</span>

  return (
    <section className="grid gap-4">
      <div>
        <Link to={ROUTES.DELIVERIES} className="text-sm text-t2 hover:text-acc">← Volver a domicilios</Link>
        <h1 className="mt-1 font-titulo text-2xl text-nav">Registrar pedido</h1>
      </div>
      <AlertMessage type="error" message={error} />

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="grid content-start gap-4">
          {/* 1. Cliente */}
          <div className="grid gap-3 rounded-2xl border border-borde bg-card p-5 sm:grid-cols-2">
            <h2 className="font-sub text-lg text-nav sm:col-span-2">1 · Cliente</h2>
            <label className="grid gap-1 font-medium sm:col-span-2">Buscar cliente por teléfono
              <div className="flex gap-2">
                <input name="telefono" inputMode="numeric" value={cliente.telefono} onChange={cambiarCliente} placeholder="Ej: 3011234567" className={campo(fields.telefono)} />
                <button type="button" onClick={buscarCliente} className="rounded-xl border border-borde px-4 font-medium hover:border-acc hover:text-acc">Buscar</button>
              </div>
              {error_('telefono')}
            </label>
            {avisoCliente && <p className="text-sm text-t2 sm:col-span-2">{avisoCliente}</p>}
            <label className="grid gap-1 font-medium">Nombre<input name="nombre" value={cliente.nombre} onChange={cambiarCliente} className={campo(fields.nombre)} />{error_('nombre')}</label>
            <label className="grid gap-1 font-medium">Apellido<input name="apellido" value={cliente.apellido} onChange={cambiarCliente} className={campo(false)} /></label>
            <label className="grid gap-1 font-medium">Dirección<input name="direccion" value={cliente.direccion} onChange={cambiarCliente} className={campo(false)} /></label>
            <label className="grid gap-1 font-medium">Barrio
              <select name="idBarrio" value={cliente.idBarrio} onChange={cambiarCliente} className={campo(false)}>
                <option value="">Elige el barrio</option>
                {nuevo.barrios.map((b) => <option key={b.id} value={b.id}>{b.nombre}{b.activo ? '' : ' (sin cobertura)'}</option>)}
              </select>
            </label>
          </div>

          {/* 2. Productos */}
          <div className="grid gap-3 rounded-2xl border border-borde bg-card p-5">
            <h2 className="font-sub text-lg text-nav">2 · Productos</h2>
            <form onSubmit={agregar} className="grid gap-2 sm:grid-cols-[1fr_90px_auto]">
              <input list="productos-pedido" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Ej: 7702001001 o Leche" aria-label="Producto" className={campo(false)} />
              <datalist id="productos-pedido">{nuevo.products.map((p) => <option key={p.codigo} value={`${p.codigo} · ${p.nombre}`} />)}</datalist>
              <input type="number" min={1} value={cantidad} onChange={(e) => setCantidad(e.target.value)} aria-label="Cantidad" className={campo(false)} />
              <button type="submit" className="rounded-xl bg-acc px-4 py-2.5 font-sub text-white hover:bg-pri">Agregar</button>
            </form>
            <ul className="grid gap-2">
              {nuevo.items.length === 0 && <li className="text-t2">Agrega los productos que pidió el cliente.</li>}
              {nuevo.items.map((i) => (
                <li key={i.codigo} className="flex items-center justify-between gap-3 rounded-xl bg-fondo px-4 py-2.5">
                  <span><strong>{i.cantidad} ×</strong> {i.nombre} <span className="text-sm text-t2">({formatoPesos(i.precio)})</span></span>
                  <span className="flex items-center gap-3">
                    <strong className="tabular-nums">{formatoPesos(i.cantidad * i.precio)}</strong>
                    <button type="button" onClick={() => nuevo.quitar(i.codigo)} className="text-sm text-err hover:underline">Quitar</button>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Entrega */}
          <div className="grid gap-3 rounded-2xl border border-borde bg-card p-5 sm:grid-cols-2">
            <h2 className="font-sub text-lg text-nav sm:col-span-2">3 · Entrega</h2>
            <label className="flex items-center gap-2 font-medium sm:col-span-2">
              <input type="checkbox" checked={mismaDireccion} onChange={(e) => setMismaDireccion(e.target.checked)} className="size-4" />
              Entregar en la dirección del cliente
            </label>
            {!mismaDireccion && (
              <>
                <label className="grid gap-1 font-medium">Dirección de entrega<input name="direccionEntrega" value={entrega.direccionEntrega} onChange={cambiarEntrega} className={campo(fields.direccionEntrega)} />{error_('direccionEntrega')}</label>
                <label className="grid gap-1 font-medium">Barrio
                  <select name="idBarrio" value={entrega.idBarrio} onChange={cambiarEntrega} className={campo(fields.idBarrio)}>
                    <option value="">Elige el barrio</option>
                    {nuevo.barrios.map((b) => <option key={b.id} value={b.id}>{b.nombre}{b.activo ? '' : ' (sin cobertura)'}</option>)}
                  </select>
                </label>
              </>
            )}
            {mismaDireccion && error_('direccionEntrega')}
            <label className="grid gap-1 font-medium">Teléfono de quien recibe
              <input name="telefonoContacto" inputMode="numeric" value={entrega.telefonoContacto} onChange={cambiarEntrega} placeholder={cliente.telefono || 'Teléfono de quien recibe'} className={campo(fields.telefonoContacto)} />
              {error_('telefonoContacto')}
            </label>
            <label className="grid gap-1 font-medium">Barrio y tarifa
              <span className={`rounded-xl px-4 py-2.5 ${barrio && !barrio.activo ? 'bg-err/10 text-err' : 'bg-fondo'}`}>
                {barrio ? `${barrio.nombre} · ${barrio.activo ? formatoPesos(barrio.costoDomicilio) : 'sin cobertura'}` : 'Elige un barrio'}
              </span>
              {error_('idBarrio')}
            </label>
            <label className="grid gap-1 font-medium sm:col-span-2">Observaciones (opcional)
              <input name="observacion" value={entrega.observacion} onChange={cambiarEntrega} placeholder="Ej: llamar antes de llegar, dejar en portería..." className={campo(false)} />
            </label>
          </div>
        </div>

        {/* 4. Resumen y pago */}
        <div className="grid content-start gap-3 rounded-2xl border border-borde bg-card p-5">
          <h2 className="font-sub text-lg text-nav">4 · Resumen y pago</h2>
          <p className="flex justify-between"><span className="text-t2">Productos</span><span className="tabular-nums">{formatoPesos(nuevo.total)}</span></p>
          <p className="flex justify-between"><span className="text-t2">Envío</span><span className="tabular-nums">{formatoPesos(envio)}</span></p>
          <p className="flex justify-between border-t border-borde pt-3 font-sub text-2xl text-nav"><span>Total</span><span className="tabular-nums">{formatoPesos(nuevo.total + envio)}</span></p>
          <label className="grid gap-1 font-medium">Método de pago
            <select value={idMetodoPago} onChange={(e) => setIdMetodoPago(e.target.value)} className={campo(fields.idMetodoPago)}>
              <option value="">Selecciona un método</option>
              {nuevo.methods.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
            {error_('idMetodoPago')}
          </label>
          <p className="text-sm text-t2">Se paga contra entrega: la venta queda pendiente hasta que el domiciliario entregue.</p>
          <button type="button" onClick={registrar} disabled={guardando} className="rounded-xl bg-acc py-3 font-sub text-white transition hover:bg-pri disabled:opacity-60">
            {guardando ? 'Registrando…' : 'Registrar pedido'}
          </button>
        </div>
      </div>
    </section>
  )
}

export default NewDeliveryView
