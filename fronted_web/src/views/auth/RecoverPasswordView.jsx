// src/views/auth/RecoverPasswordView.jsx
// VISTA pública: recuperar contraseña (company/recuperar_contrasena.html). No hay servidor de correo:
// se simula el envío, con el mismo mensaje exista o no el correo (así no se revela qué cuentas hay).
import { useState } from 'react'
import { Link } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { ROUTES } from '../../config/routes'
import AlertMessage from '../common/AlertMessage'

const RecoverPasswordView = () => {
  const { recoverPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [resultado, setResultado] = useState(null)

  const enviar = (e) => {
    e.preventDefault()
    setResultado(recoverPassword(email))
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-nav to-pri p-6">
      <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-xl">
        <p className="font-sub text-sm uppercase tracking-widest text-acc">Control Store</p>
        <h1 className="mt-1 font-titulo text-2xl text-nav">Recuperar contraseña</h1>
        <p className="mt-1 text-t2">Escribe el correo de tu cuenta y te enviaremos un enlace.</p>

        <form onSubmit={enviar} className="mt-6 grid gap-4" noValidate>
          {resultado && <AlertMessage type={resultado.success ? 'success' : 'error'} message={resultado.success ? resultado.message : resultado.error} />}
          <label className="grid gap-1 font-medium">
            Correo electrónico
            <input type="email" name="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-borde px-4 py-3 outline-none focus:border-acc focus:ring-2 focus:ring-acc/30" />
          </label>
          <button type="submit" className="rounded-xl bg-acc py-3 font-sub text-white transition hover:bg-pri">Enviar enlace</button>
          <p className="text-sm text-t2">Simulación: este proyecto no tiene servidor de correo, así que no se envía ningún mensaje real.</p>
        </form>

        <p className="mt-6 text-center text-t2">
          <Link to={ROUTES.LOGIN} className="font-semibold text-acc hover:underline">Volver a iniciar sesión</Link>
        </p>
      </div>
    </div>
  )
}

export default RecoverPasswordView
