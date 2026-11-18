// src/services/jwtService.js
// El JWT lo firma el servidor (json-server-auth). Aquí solo se lee su contenido y su vencimiento.
// Ojo: decodificar NO es verificar la firma; eso solo lo puede hacer el servidor con su clave.
import { jwtDecode } from 'jwt-decode'

class JWTService {
  // Contenido del token: { email, sub (id del usuario), iat (emitido), exp (vence) }
  decodeToken(token) {
    try {
      return jwtDecode(token)
    } catch {
      return null // no tiene forma de JWT
    }
  }

  // Válido en el navegador = se puede leer y no ha vencido (exp está en segundos)
  verifyToken(token) {
    const payload = this.decodeToken(token)
    if (!payload?.exp) return false
    return payload.exp * 1000 > Date.now()
  }

  // Milisegundos que le quedan al token (0 si ya venció): sirve para cerrar la sesión a tiempo
  getTokenRemainingTime(token) {
    const payload = this.decodeToken(token)
    if (!payload?.exp) return 0
    return Math.max(0, payload.exp * 1000 - Date.now())
  }
}

export default new JWTService()
