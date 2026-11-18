// src/views/dashboard/UserDetails.jsx
// VISTA: ficha de un usuario (solo lectura)
import { Link, useParams } from 'react-router-dom'
import useUsers from '../../hooks/useUsers'
import { ROUTES } from '../../config/routes'
import AlertMessage from '../common/AlertMessage'
import LoadingSpinner from '../common/LoadingSpinner'

const UserDetails = () => {
  const { id } = useParams()
  const { users, loading, error } = useUsers()

  if (loading) return <LoadingSpinner />
  const user = users.find((u) => u.id === Number(id))
  if (!user) return <AlertMessage type="error" message={error || 'El usuario no existe.'} />

  // Pares etiqueta → valor de la ficha
  const datos = [
    ['Documento', user.documento],
    ['Correo', user.email],
    ['Celular', user.telefono ?? 'Sin registrar'],
    ['Rol', user.role],
    ['Estado', user.activo ? 'Activo' : 'Inactivo']
  ]

  return (
    <section className="grid max-w-2xl gap-4">
      <Link to={ROUTES.USERS} className="text-sm text-t2 hover:text-acc">← Volver a usuarios</Link>
      <div className="rounded-2xl border border-borde bg-card p-6">
        <div className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-2xl bg-acc font-sub text-xl text-white">
            {user.nombre[0]}{user.apellido?.[0]}
          </span>
          <div>
            <h1 className="font-titulo text-2xl text-nav">{user.nombre} {user.apellido}</h1>
            <p className="capitalize text-t2">{user.role}</p>
          </div>
        </div>
        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          {datos.map(([etiqueta, valor]) => (
            <div key={etiqueta} className="rounded-xl bg-fondo px-4 py-3">
              <dt className="font-sub text-xs uppercase tracking-wider text-t2">{etiqueta}</dt>
              <dd className="mt-1 font-semibold">{valor}</dd>
            </div>
          ))}
        </dl>
        <Link to={ROUTES.USER_EDIT(user.id)} className="mt-6 inline-block rounded-xl bg-acc px-5 py-2.5 font-sub text-white hover:bg-pri">
          Editar
        </Link>
      </div>
    </section>
  )
}

export default UserDetails
