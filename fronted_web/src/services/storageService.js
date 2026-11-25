// src/services/storageService.js
// Wrapper de localStorage: guarda la sesión (token, usuario y rol) con las llaves de constants.js
import { STORAGE_KEYS } from '../config/constants'

class StorageService {
  constructor() {
    this.storage = localStorage
  }

  // ---------- Sesión ----------

  setToken(token) {
    return this.setItem(STORAGE_KEYS.TOKEN, token)
  }

  getToken() {
    return this.getItem(STORAGE_KEYS.TOKEN)
  }

  // El usuario se guarda como texto JSON porque localStorage solo guarda strings
  setUser(user) {
    return this.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
  }

  getUser() {
    const user = this.getItem(STORAGE_KEYS.USER)
    try {
      return user ? JSON.parse(user) : null
    } catch {
      return null // dato dañado: se trata como sin sesión
    }
  }

  setUserRole(role) {
    return this.setItem(STORAGE_KEYS.ROLE, role)
  }

  getUserRole() {
    return this.getItem(STORAGE_KEYS.ROLE)
  }

  // Cierra la sesión: borra solo lo nuestro, no todo el localStorage
  clearSession() {
    this.removeItem(STORAGE_KEYS.TOKEN)
    this.removeItem(STORAGE_KEYS.USER)
    this.removeItem(STORAGE_KEYS.ROLE)
  }

  // ---------- Operaciones base (Paso 4) ----------

  setItem(key, value) {
    try {
      this.storage.setItem(key, value)
      return true
    } catch (error) {
      console.error('Error al guardar en storage:', error)
      return false
    }
  }

  getItem(key) {
    try {
      return this.storage.getItem(key)
    } catch (error) {
      console.error('Error al leer del storage:', error)
      return null
    }
  }

  removeItem(key) {
    try {
      this.storage.removeItem(key)
      return true
    } catch (error) {
      console.error('Error al eliminar del storage:', error)
      return false
    }
  }

  clear() {
    try {
      this.storage.clear()
      return true
    } catch (error) {
      console.error('Error al limpiar storage:', error)
      return false
    }
  }
}

export default new StorageService()
