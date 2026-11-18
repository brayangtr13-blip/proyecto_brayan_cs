// src/views/dashboard/UsersView.jsx
// VISTA: tabla de usuarios con sus acciones (ver, editar, activar/inactivar, eliminar)
import { useState } from 'react'
import { Link } from 'react-router-dom'
import useUsers from '../../hooks/useUsers'
import { ROUTES } from '../../config/routes'
import AlertMessage from '../common/AlertMessage'
import LoadingSpinner from '../common/LoadingSpinner'

const boton = 'rounded-lg border border-borde px-3 py-1.5 text-sm font-medium transition hover:border-acc hover:text-acc'

const UsersView = () => {
  const { users, loading, error, toggleActive, deleteUser } = useUsers()
  const [mensaje, setMensaje] = useState(null) // { type, message } del resultado de una acción
  const [aBorrar, setABorrar] = useState(null) // usuario que espera confirmación para eliminarse

  // Muestra el resultado de cualquier acción en una sola alerta
  const ejecutar = async (accion, exito) => {
    const result = await accion()
    setMensaje(result.success ? { type: 'success', message: exito } : { type: 'error', message: result.error })
  }

  if (loading) return <LoadingSpinner />

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-titulo text-2xl text-nav">Usuarios</h1>
          <p className="text-t2">{users.length} cuentas registradas</p>
        </div>
        <Link to={ROUTES.USER_NEW} className="rounded-xl bg-acc px-4 py-2.5 font-sub text-white transition hover:bg-pri">
          Nuevo usuario
        </Link>
      </div>

      <AlertMessage type="error" message={error} />
      {mensaje && <AlertMessage type={mensaje.type} message={mensaje.message} />}

      {/* Confirmación antes de eliminar: borrar no se puede deshacer */}
      {aBorrar && (
        <div role="alertdialog" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-err/30 bg-err/10 px-4 py-3">
          <span>¿Eliminar a <strong>{aBorrar.nombre} {aBorrar.apellido}</strong>? Esta acción no se puede deshacer.</span>
          <span className="flex gap-2">
            <button type="button" className={boton} onClick={() => setABorrar(null)}>Cancelar</button>
            <button
              type="button"
              className="rounded-lg bg-err px-3 py-1.5 text-sm font-medium text-white"
              onClick={async () => {
                const user = aBorrar
                setABorrar(null)
                await ejecutar(() => deleteUser(user), `Se eliminó la cuenta de ${user.nombre}.`)
              }}
            >
              Sí, eliminar
            </button>
          </span>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-borde bg-card">
        <table className="w-full min-w-[720px] text-left">
          <thead className="border-b border-borde font-sub text-xs uppercase tracking-wider text-t2">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Documento</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-borde last:border-0">
                <td className="px-4 py-3 font-semibold">{u.nombre} {u.apellido}</td>
                <td className="px-4 py-3 tabular-nums">{u.documento}</td>
                <td className="px-4 py-3 text-t2">{u.email}</td>
                <td className="px-4 py-3 capitalize">{u.role}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-lg px-2 py-1 text-sm font-medium ${u.activo ? 'bg-ok/10 text-ok' : 'bg-err/10 text-err'}`}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link to={ROUTES.USER_DETAIL(u.id)} className={boton}>Ver</Link>
                    <Link to={ROUTES.USER_EDIT(u.id)} className={boton}>Editar</Link>
                    <button
                      type="button" className={boton}
                      onClick={() => ejecutar(() => toggleActive(u), `${u.nombre} quedó ${u.activo ? 'inactivo' : 'activo'}.`)}
                    >
                      {u.activo ? 'Inactivar' : 'Activar'}
                    </button>
                    <button type="button" className={`${boton} hover:border-err hover:text-err`} onClick={() => setABorrar(u)}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default UsersView
