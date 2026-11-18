// src/views/dashboard/UserForm.jsx
// VISTA: formulario para crear (/usuarios/nuevo) o editar (/usuarios/:id/editar) un usuario
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import useUsers from '../../hooks/useUsers'
import { ROUTES } from '../../config/routes'
import AlertMessage from '../common/AlertMessage'
import LoadingSpinner from '../common/LoadingSpinner'

const VACIO = { documento: '', nombre: '', apellido: '', telefono: '', email: '', role: '', password: '' }

const input = (conError) =>
  `rounded-xl border bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-acc/30 ${conError ? 'border-err' : 'border-borde focus:border-acc'}`

// Contenedor: espera a tener los datos y entonces monta el formulario con sus valores iniciales
const UserForm = () => {
  const { id } = useParams()
  const esNuevo = id === undefined
  const { users, roles, loading, createUser, updateUser } = useUsers()

  if (loading) return <LoadingSpinner />
  const user = esNuevo ? null : users.find((u) => u.id === Number(id))
  if (!esNuevo && !user) return <AlertMessage type="error" message="El usuario no existe." />

  return (
    <FormularioUsuario
      inicial={user ? { ...VACIO, ...user, telefono: user.telefono ?? '', password: '' } : VACIO}
      roles={roles}
      guardar={(datos) => (esNuevo ? createUser(datos) : updateUser(user.id, datos))}
      esNuevo={esNuevo}
    />
  )
}

const FormularioUsuario = ({ inicial, roles, guardar, esNuevo }) => {
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
      navigate(ROUTES.USERS)
      return
    }
    setFields(result.fields ?? {})
    setError(result.error)
  }

  // Un campo de texto con su etiqueta y su error
  const campo = (name, etiqueta, type = 'text', extra = {}) => (
    <label className="grid content-start gap-1 font-medium">
      {etiqueta}
      <input type={type} name={name} value={datos[name]} onChange={handleChange} aria-invalid={Boolean(fields[name])} className={input(fields[name])} {...extra} />
      {fields[name] && <span className="text-sm font-normal text-err">{fields[name]}</span>}
    </label>
  )

  return (
    <section className="grid max-w-3xl gap-4">
      <div>
        <Link to={ROUTES.USERS} className="text-sm text-t2 hover:text-acc">← Volver a usuarios</Link>
        <h1 className="mt-1 font-titulo text-2xl text-nav">{esNuevo ? 'Nuevo usuario' : `Editar a ${inicial.nombre}`}</h1>
      </div>

      <form onSubmit={handleSubmit} noValidate className="grid gap-4 rounded-2xl border border-borde bg-card p-6 sm:grid-cols-2">
        <div className="sm:col-span-2"><AlertMessage type="error" message={error} /></div>
        {campo('documento', 'Documento', 'text', { inputMode: 'numeric' })}
        {campo('nombre', 'Nombre')}
        {campo('apellido', 'Apellido')}
        {campo('telefono', 'Celular (opcional)', 'tel')}
        {campo('email', 'Correo electrónico', 'email')}

        <label className="grid content-start gap-1 font-medium">
          Rol
          <select name="role" value={datos.role} onChange={handleChange} aria-invalid={Boolean(fields.role)} className={`${input(fields.role)} capitalize`}>
            <option value="">Elige un rol</option>
            {roles.map((r) => <option key={r.id} value={r.nombre}>{r.nombre}</option>)}
          </select>
          {fields.role && <span className="text-sm font-normal text-err">{fields.role}</span>}
        </label>

        {campo('password', esNuevo ? 'Contraseña' : 'Nueva contraseña (vacía = no cambia)', 'password', { autoComplete: 'new-password' })}

        <div className="flex justify-end gap-3 sm:col-span-2">
          <Link to={ROUTES.USERS} className="rounded-xl border border-borde px-5 py-2.5 font-medium">Cancelar</Link>
          <button type="submit" disabled={guardando} className="rounded-xl bg-acc px-5 py-2.5 font-sub text-white transition hover:bg-pri disabled:opacity-60">
            {guardando ? 'Guardando…' : esNuevo ? 'Crear usuario' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default UserForm
