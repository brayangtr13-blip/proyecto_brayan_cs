// src/views/perfil/ProfileView.jsx
// VISTA: mi perfil y cambiar contraseña (perfil/cambiar_contrasena.html). Para cualquier usuario con sesión.
// Las reglas están en AuthController.handleChangePassword; aquí solo se dibuja el formulario.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { ROUTES } from '../../config/routes'
import AlertMessage from '../common/AlertMessage'

const VACIO = { actual: '', nueva: '', confirmar: '' }
const campo = (conError) =>
  `w-full rounded-xl border bg-card px-4 py-2.5 outline-none focus:ring-2 focus:ring-acc/30 ${conError ? 'border-err' : 'border-borde focus:border-acc'}`

const Dato = ({ titulo, children }) => (
  <div><dt className="text-sm text-t2">{titulo}</dt><dd className="font-medium">{children || '—'}</dd></div>
)

const ProfileView = () => {
  const { currentUser, changePassword, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(VACIO)
  const [error, setError] = useState('')
  const [fields, setFields] = useState({})

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const guardar = async (e) => {
    e.preventDefault()
    const correo = currentUser.email // se guarda antes: al salir bien, la sesión se borra
    const result = await changePassword(form)
    if (result.success) {
      // Ya se cerró la sesión: al login con el aviso
      return navigate(ROUTES.LOGIN, { replace: true, state: { aviso: result.message, correo } })
    }
    setError(result.error)
    setFields(result.fields ?? {})
  }

  const error_ = (nombre) => fields[nombre] && <span className="text-sm font-normal text-err">{fields[nombre]}</span>

  // Entre cerrar la sesión y llegar al login no hay usuario: no se dibuja nada
  if (!currentUser) return null

  return (
    <section className="grid gap-4">
      <h1 className="font-titulo text-2xl text-nav">Mi perfil</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        <dl className="grid content-start gap-3 rounded-2xl border border-borde bg-card p-5 sm:grid-cols-2">
          <h2 className="font-sub text-lg text-nav sm:col-span-2">Mis datos</h2>
          <Dato titulo="Nombre">{`${currentUser.nombre} ${currentUser.apellido ?? ''}`}</Dato>
          <Dato titulo="Rol"><span className="capitalize">{currentUser.role}</span></Dato>
          <Dato titulo="Correo">{currentUser.email}</Dato>
          <Dato titulo="Documento">{currentUser.documento}</Dato>
          <Dato titulo="Teléfono">{currentUser.telefono}</Dato>
          <p className="text-sm text-t2 sm:col-span-2">Para cambiar tus datos o tu rol, pídeselo al administrador.</p>
        </dl>

        <form onSubmit={guardar} noValidate className="grid content-start gap-3 rounded-2xl border border-borde bg-card p-5">
          <h2 className="font-sub text-lg text-nav">Cambiar contraseña</h2>
          <AlertMessage type="error" message={error} />
          <label className="grid gap-1 font-medium">Contraseña actual
            <input type="password" name="actual" autoComplete="current-password" value={form.actual} onChange={cambiar} className={campo(fields.actual)} />
            {error_('actual')}
          </label>
          <label className="grid gap-1 font-medium">Contraseña nueva
            <input type="password" name="nueva" autoComplete="new-password" value={form.nueva} onChange={cambiar} className={campo(fields.nueva)} />
            {error_('nueva') || <span className="text-sm font-normal text-t2">Mínimo 8 caracteres, con letras y números.</span>}
          </label>
          <label className="grid gap-1 font-medium">Confirmar contraseña nueva
            <input type="password" name="confirmar" autoComplete="new-password" value={form.confirmar} onChange={cambiar} className={campo(fields.confirmar)} />
            {error_('confirmar')}
          </label>
          <p className="text-sm text-t2">Al guardar se cerrará tu sesión y entrarás con la contraseña nueva.</p>
          <button type="submit" disabled={loading} className="rounded-xl bg-acc py-3 font-sub text-white transition hover:bg-pri disabled:opacity-60">
            {loading ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </section>
  )
}

export default ProfileView
