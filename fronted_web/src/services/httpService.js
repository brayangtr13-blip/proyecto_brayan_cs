// src/services/httpService.js
// Wrapper de fetch: arma la URL, adjunta el token JWT y convierte los errores en Error con mensaje
import API_CONFIG from '../config/api'
import storageService from './storageService'

class HttpService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
  }

  // Token guardado al iniciar sesión (lo pone AuthModel con storageService)
  getToken() {
    return storageService.getToken()
  }

  // Encabezados: JSON siempre; Authorization solo si se pide y hay token
  getHeaders(includeAuth = true) {
    const headers = { 'Content-Type': 'application/json' }
    if (includeAuth) {
      const token = this.getToken()
      if (token) headers.Authorization = `Bearer ${token}`
    }
    return headers
  }

  // Respuesta: si no es 2xx lanza Error con el mensaje del servidor (json-server-auth manda un texto)
  async handleResponse(response) {
    if (!response.ok) {
      const cuerpo = await response.text()
      let mensaje = `Error HTTP: ${response.status}`
      try {
        const datos = JSON.parse(cuerpo)
        mensaje = typeof datos === 'string' ? datos : datos.message || datos.error || mensaje
      } catch {
        if (cuerpo) mensaje = cuerpo
      }
      const error = new Error(mensaje)
      error.status = response.status // 401 = sin sesión, 403 = sin permiso, 404 = no existe
      throw error
    }
    if (response.status === 204) return null
    return response.json()
  }

  // Método común: los demás solo cambian el verbo HTTP y si llevan cuerpo
  async request(method, endpoint, data, includeAuth = true) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method,
      headers: this.getHeaders(includeAuth),
      body: data === undefined ? undefined : JSON.stringify(data)
    })
    return this.handleResponse(response)
  }

  get(endpoint, includeAuth = true) {
    return this.request('GET', endpoint, undefined, includeAuth)
  }

  post(endpoint, data, includeAuth = true) {
    return this.request('POST', endpoint, data, includeAuth)
  }

  put(endpoint, data, includeAuth = true) {
    return this.request('PUT', endpoint, data, includeAuth)
  }

  patch(endpoint, data, includeAuth = true) {
    return this.request('PATCH', endpoint, data, includeAuth)
  }

  delete(endpoint, includeAuth = true) {
    return this.request('DELETE', endpoint, undefined, includeAuth)
  }
}

export default new HttpService()
