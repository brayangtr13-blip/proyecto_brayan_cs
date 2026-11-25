// src/views/auth/RegisterView.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { ROUTES } from '../../config/routes'
import AlertMessage from '../common/AlertMessage'

// Campos del formulario: [name, etiqueta, type]
const CAMPOS = [
  ['documento', 'Documento', 'text'],
  ['nombre', 'Nombre', 'text'],
  ['apellido', 'Apellido', 'text'],
  ['telefono', 'Celular (opcional)', 'tel'],
  ['email', 'Correo electrónico', 'email'],
  ['password', 'Contraseña', 'password'],
  ['confirmPassword', 'Confirmar contraseña', 'password']
]

const VACIO = Object.fromEntries(CAMPOS.map(([name]) => [name, '']))

const RegisterView = () => {
  const { register, loading } = useAuth()
  const navigate = useNavigate()
  const [userData, setUserData] = useState(VACIO)
  const [fields, setFields] = useState({}) // errores por campo
  const [error, setError] = useState('')

  const handleChange = (e) => setUserData({ ...userData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const result = await register(userData)
    if (result.success) {
      // Al login con un aviso; la cuenta queda lista para entrar
      navigate(ROUTES.LOGIN, { replace: true, state: { registrado: userData.email, mensaje: result.message } })
      return
    }
    setFields(result.fields ?? {})
    setError(result.error)
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-nav to-pri p-6">
      <div className="w-full max-w-xl rounded-2xl bg-card p-8 shadow-xl">
        <p className="font-sub text-sm uppercase tracking-widest text-acc">Control Store</p>
        <h1 className="mt-1 font-titulo text-2xl text-nav">Crear Cuenta</h1>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2" noValidate>
          <div className="sm:col-span-2"><AlertMessage type="error" message={error} /></div>

          {CAMPOS.map(([name, etiqueta, type]) => (
            <label key={name} className="grid content-start gap-1 font-medium">
              {etiqueta}
              <input
                type={type} name={name} value={userData[name]} onChange={handleChange}
                aria-invalid={Boolean(fields[name])}
                className={`rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-acc/30 ${fields[name] ? 'border-err' : 'border-borde focus:border-acc'}`}
              />
              {fields[name] && <span className="text-sm font-normal text-err">{fields[name]}</span>}
            </label>
          ))}

          <button
            type="submit" disabled={loading}
            className="rounded-xl bg-acc py-3 font-sub text-white transition hover:bg-pri disabled:opacity-60 sm:col-span-2"
          >
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-6 text-center text-t2">
          ¿Ya tienes cuenta?{' '}
          <Link to={ROUTES.LOGIN} className="font-semibold text-acc hover:underline">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterView
