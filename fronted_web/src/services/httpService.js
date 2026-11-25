// src/services/httpService.js
// Wrapper de fetch. Capítulo IV: el JWT viaja en una cookie HttpOnly que el navegador envía solo;
// por eso ya no se arma el encabezado Authorization ni se lee ningún token aquí.
import API_CONFIG from '../config/api'

class HttpService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
    this.onUnauthorized = null // AuthProvider lo define: qué hacer si la sesión vence (401)
  }

  // Respuesta de Express: { success, message, data, fields? }
  async handleResponse(response) {
    let cuerpo = null
    try {
      cuerpo = await response.json()
    } catch {
      cuerpo = null // respuesta sin JSON
    }

    if (!response.ok) {
      const error = new Error(cuerpo?.message || `Error HTTP: ${response.status}`)
      error.status = response.status // 401 sin sesión, 403 sin permiso, 409 regla de negocio
      error.fields = cuerpo?.fields // errores por campo para mostrarlos en el formulario
      if (response.status === 401 && this.onUnauthorized) this.onUnauthorized()
      throw error
    }
    return cuerpo
  }

  async request(method, endpoint, data) {
    let response
    try {
      response = await fetch(`${this.baseURL}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // IV.3: envía y recibe la cookie de sesión
        body: data === undefined ? undefined : JSON.stringify(data)
      })
    } catch {
      throw new Error('No hay conexión con el servidor. ¿Está encendido el backend (puerto 3000)?')
    }
    return this.handleResponse(response)
  }

  get(endpoint) {
    return this.request('GET', endpoint)
  }

  post(endpoint, data) {
    return this.request('POST', endpoint, data)
  }

  patch(endpoint, data) {
    return this.request('PATCH', endpoint, data)
  }

  delete(endpoint) {
    return this.request('DELETE', endpoint)
  }
}

export default new HttpService()
