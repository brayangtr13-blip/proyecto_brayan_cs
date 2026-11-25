// src/views/auth/LoginView.jsx
// VISTA: solo dibuja el formulario y llama a useAuth; no sabe de fetch ni de localStorage
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { ROUTES } from '../../config/routes'
import AlertMessage from '../common/AlertMessage'

const LoginView = () => {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  // Desde el registro llega el correo nuevo; desde "cambiar contraseña", un aviso y el correo
  const { registrado, aviso, correo } = useLocation().state ?? {}
  const [credentials, setCredentials] = useState({ email: registrado ?? correo ?? '', password: '' })
  const [error, setError] = useState('')

  // Formulario controlado: cada input actualiza su campo en el estado
  const handleChange = (e) => setCredentials({ ...credentials, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault() // evita que el navegador recargue la página
    setError('')
    const result = await login(credentials)
    if (result.success) navigate(ROUTES.DASHBOARD, { replace: true })
    else setError(result.error)
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-nav to-pri p-6">
      <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-xl">
        <p className="font-sub text-sm uppercase tracking-widest text-acc">Control Store</p>
        <h1 className="mt-1 font-titulo text-2xl text-nav">Iniciar Sesión</h1>
        <p className="mt-1 text-t2">Autoservicio Ayuelal</p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4" noValidate>
          {registrado && !error && <AlertMessage type="success" message="Cuenta creada. Ya puedes iniciar sesión." />}
          {aviso && !error && <AlertMessage type="success" message={aviso} />}
          <AlertMessage type="error" message={error} />

          <label className="grid gap-1 font-medium">
            Correo electrónico
            <input
              type="email" name="email" autoComplete="username" required
              value={credentials.email} onChange={handleChange}
              className="rounded-xl border border-borde px-4 py-3 outline-none focus:border-acc focus:ring-2 focus:ring-acc/30"
            />
          </label>

          <label className="grid gap-1 font-medium">
            Contraseña
            <input
              type="password" name="password" autoComplete="current-password" required
              value={credentials.password} onChange={handleChange}
              className="rounded-xl border border-borde px-4 py-3 outline-none focus:border-acc focus:ring-2 focus:ring-acc/30"
            />
          </label>

          <Link to={ROUTES.RECOVER_PASSWORD} className="-mt-2 justify-self-end text-sm text-acc hover:underline">¿Olvidaste tu contraseña?</Link>

          <button
            type="submit" disabled={loading}
            className="rounded-xl bg-acc py-3 font-sub text-white transition hover:bg-pri disabled:opacity-60"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="mt-6 text-center text-t2">
          ¿No tienes cuenta?{' '}
          <Link to={ROUTES.REGISTER} className="font-semibold text-acc hover:underline">Crear cuenta</Link>
        </p>
      </div>
    </div>
  )
}

export default LoginView
