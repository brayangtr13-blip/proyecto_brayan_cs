// src/views/inventario/ProductForm.jsx
// VISTA: registrar (/inventario/nuevo) o editar (/inventario/:codigo/editar) un producto.
// Al editar, el código y el stock no se cambian: el código es la llave y el stock va por movimientos.
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCategories, useProduct } from '../../hooks/useProducts'
import ProductController from '../../controllers/ProductController'
import { ROUTES } from '../../config/routes'
import AlertMessage from '../common/AlertMessage'
import LoadingSpinner from '../common/LoadingSpinner'

const UNIDADES = ['Unidad', 'Kilogramo', 'Litro', 'Paquete'] // las del prototipo
const VACIO = { codigo: '', nombre: '', idCategoria: '', unidadMedida: 'Unidad', precioCompra: '', precioUnitario: '', stockActual: '0', stockMinimo: '0', descripcion: '' }

const input = (conError) =>
  `w-full rounded-xl border bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-acc/30 disabled:bg-fondo disabled:text-t2 ${conError ? 'border-err' : 'border-borde focus:border-acc'}`

// Contenedor para registrar: solo necesita las categorías
export const NuevoProducto = () => {
  const categories = useCategories()
  return <FormularioProducto inicial={VACIO} categorias={categories} esNuevo guardar={(d) => ProductController.createProduct(d)} />
}

// Contenedor para editar: espera el producto y monta el formulario con sus valores
const EditarProducto = () => {
  const { codigo } = useParams()
  const { product, loading, error } = useProduct(codigo)
  const categories = useCategories()
  if (loading) return <LoadingSpinner />
  if (!product) return <AlertMessage type="error" message={error || 'El producto no existe.'} />
  const inicial = {
    ...VACIO,
    ...product,
    idCategoria: String(product.idCategoria),
    unidadMedida: product.unidadMedida ?? 'Unidad',
    descripcion: product.descripcion ?? ''
  }
  return (
    <FormularioProducto inicial={inicial} categorias={categories} esNuevo={false}
      guardar={(d) => ProductController.updateProduct(codigo, d)} />
  )
}

const FormularioProducto = ({ inicial, categorias, esNuevo, guardar }) => {
  const navigate = useNavigate()
  const [datos, setDatos] = useState(inicial)
  const [fields, setFields] = useState({})
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const handleChange = (e) => setDatos({ ...datos, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)
    const result = await guardar(datos)
    setGuardando(false)
    if (result.success) {
      navigate(ROUTES.PRODUCT_DETAIL(result.data.codigo))
      return
    }
    setFields(result.fields ?? {})
    setError(result.error)
  }

  // Campo con etiqueta, ayuda opcional y su error debajo
  const campo = (name, etiqueta, props = {}, ayuda) => (
    <label className="grid content-start gap-1 font-medium">
      {etiqueta}
      <input name={name} value={datos[name]} onChange={handleChange} aria-invalid={Boolean(fields[name])} className={input(fields[name])} {...props} />
      {fields[name] ? <span className="text-sm font-normal text-err">{fields[name]}</span>
        : ayuda && <span className="text-sm font-normal text-t2">{ayuda}</span>}
    </label>
  )

  return (
    <section className="grid max-w-3xl gap-4">
      <div>
        <Link to={ROUTES.PRODUCTS} className="text-sm text-t2 hover:text-acc">← Volver al inventario</Link>
        <h1 className="mt-1 font-titulo text-2xl text-nav">{esNuevo ? 'Registrar producto' : `Editar ${inicial.nombre}`}</h1>
      </div>

      <form onSubmit={handleSubmit} noValidate className="grid gap-4 rounded-2xl border border-borde bg-card p-6 sm:grid-cols-2">
        <div className="sm:col-span-2"><AlertMessage type="error" message={error} /></div>

        {campo('codigo', 'Código de barras', { inputMode: 'numeric', disabled: !esNuevo }, esNuevo ? 'Solo números, de 6 a 20 dígitos.' : 'El código no se cambia: es la llave del producto.')}
        {campo('nombre', 'Nombre')}

        <label className="grid content-start gap-1 font-medium">
          Categoría
          <select name="idCategoria" value={datos.idCategoria} onChange={handleChange} aria-invalid={Boolean(fields.idCategoria)} className={input(fields.idCategoria)}>
            <option value="">Elige una categoría</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          {fields.idCategoria && <span className="text-sm font-normal text-err">{fields.idCategoria}</span>}
        </label>

        <label className="grid content-start gap-1 font-medium">
          Unidad de medida
          <select name="unidadMedida" value={datos.unidadMedida} onChange={handleChange} className={input(false)}>
            {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>

        {campo('precioCompra', 'Precio de compra (COP)', { type: 'number', min: 0, inputMode: 'numeric' }, 'Lo que cuesta al proveedor.')}
        {campo('precioUnitario', 'Precio de venta (COP)', { type: 'number', min: 1, inputMode: 'numeric' }, 'No puede ser menor que el de compra.')}
        {campo('stockActual', esNuevo ? 'Stock inicial' : 'Stock actual', { type: 'number', min: 0, inputMode: 'numeric', disabled: !esNuevo },
          esNuevo ? 'Queda en el kárdex como "Inventario inicial".' : 'Se cambia con una entrada o un ajuste en la ficha.')}
        {campo('stockMinimo', 'Stock mínimo', { type: 'number', min: 0, inputMode: 'numeric' }, 'Al llegar aquí aparece la alerta.')}

        <label className="grid content-start gap-1 font-medium sm:col-span-2">
          Descripción (opcional)
          <textarea name="descripcion" value={datos.descripcion} onChange={handleChange} rows={2} maxLength={255} className={input(false)} />
        </label>

        <div className="flex justify-end gap-3 sm:col-span-2">
          <Link to={ROUTES.PRODUCTS} className="rounded-xl border border-borde px-5 py-2.5 font-medium">Cancelar</Link>
          <button type="submit" disabled={guardando} className="rounded-xl bg-acc px-5 py-2.5 font-sub text-white transition hover:bg-pri disabled:opacity-60">
            {guardando ? 'Guardando…' : esNuevo ? 'Registrar producto' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default EditarProducto
