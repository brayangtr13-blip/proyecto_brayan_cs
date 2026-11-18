// src/config/api.js
// Configuración central de la API.
// NOTA: en el Capítulo III (JSON Server) apuntaremos a http://localhost:3001
// En el Capítulo IV (Node + Express) cambiaremos a http://localhost:3000/api

const API_CONFIG = {
  BASE_URL: 'http://localhost:3001', // JSON Server (temporal)
  TIMEOUT: 10000,
  ENDPOINTS: {
    LOGIN: '/login',
    REGISTER: '/register', // ruta pública de json-server-auth (/users exige sesión)
    USERS: '/users',
    USER_BY_ID: '/users/:id'
  }
}

export default API_CONFIG
