// src/hooks/useUsers.js
// HOOK: expone la lista de usuarios y las acciones del CRUD a las vistas
import { useCallback, useEffect, useState } from 'react'
import UserController from '../controllers/UserController'

// Usuarios y roles al mismo tiempo (Promise.all): una sola espera en vez de dos
const pedirDatos = () => Promise.all([UserController.getUsers(), UserController.getRoles()])

const useUsers = () => {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Guarda en el estado lo que respondió el controlador
  const aplicar = useCallback(([respUsers, respRoles]) => {
    setUsers(respUsers.success ? respUsers.data : [])
    setRoles(respRoles.success ? respRoles.data : [])
    setError(respUsers.success ? '' : respUsers.error)
    setLoading(false)
  }, [])

  // Recarga manual (después de crear, editar o borrar)
  const cargar = useCallback(async () => aplicar(await pedirDatos()), [aplicar])

  // Al montar se piden los datos; "activo" evita actualizar una vista que ya se cerró
  useEffect(() => {
    let activo = true
    pedirDatos().then((datos) => {
      if (activo) aplicar(datos)
    })
    return () => {
      activo = false
    }
  }, [aplicar])

  // Cada acción, si sale bien, vuelve a cargar la lista para verla actualizada
  const conRecarga = (accion) => async (...args) => {
    const result = await accion(...args)
    if (result.success) await cargar()
    return result
  }

  return {
    users,
    roles,
    loading,
    error,
    reload: cargar,
    createUser: conRecarga((datos) => UserController.createUser(datos)),
    updateUser: conRecarga((id, datos) => UserController.updateUser(id, datos)),
    toggleActive: conRecarga((user) => UserController.toggleActive(user)),
    deleteUser: conRecarga((user) => UserController.deleteUser(user))
  }
}

export default useUsers
