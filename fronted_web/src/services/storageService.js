// src/services/storageService.js
// Wrapper de localStorage. Capítulo IV: la sesión YA NO se guarda aquí (el JWT vive en una cookie
// HttpOnly que JavaScript no puede leer). Queda para preferencias que no son secretas.
class StorageService {
  constructor() {
    this.storage = localStorage
  }

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
