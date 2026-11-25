// src/config/api.js
// Configuración central de la API.
// Capítulo III: JSON Server (http://localhost:3001). Capítulo IV: Node + Express + MySQL.
// Para cambiar de servidor solo se cambia BASE_URL: las vistas no se enteran.

const API_CONFIG = {
  BASE_URL: 'http://localhost:3000/api', // backend/nodejs_express
  TIMEOUT: 10000,
  ENDPOINTS: {
    LOGIN: '/auth/login', // crea la cookie con el JWT
    REGISTER: '/auth/register', // cuenta nueva inactiva hasta que el admin la active
    ME: '/auth/me', // ¿quién soy? (lee la cookie)
    LOGOUT: '/auth/logout', // borra la cookie
    USERS: '/users',
    ROLES: '/users/roles'
  }
}

export default API_CONFIG
