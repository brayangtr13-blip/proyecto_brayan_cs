// src/config/api.js
// Configuración central de la API: JSON Server + json-server-auth (backend simulado).
// Cada colección de db.json lleva el nombre de su tabla en controlstore_sena.

const API_CONFIG = {
  BASE_URL: 'http://localhost:3001', // backend/jsonserver
  TIMEOUT: 10000,
  ENDPOINTS: {
    LOGIN: '/login',
    REGISTER: '/register', // ruta pública de json-server-auth (/users exige sesión)
    USERS: '/users',
    ROLES: '/roles', // lectura pública (routes.json: 444)
    USER_BY_ID: '/users/:id',
    // Módulo de inventario (tablas productos, categorias y movimientos_inventario)
    PRODUCTS: '/productos',
    CATEGORIES: '/categorias',
    MOVEMENTS: '/movimientos_inventario',
    // Módulo de ventas y caja
    SALES: '/ventas',
    SALE_DETAILS: '/detalle_venta',
    PAYMENT_METHODS: '/metodos_pago',
    CASH: '/arqueo_caja',
    CUSTOMERS: '/clientes',
    DELIVERIES: '/domicilios',
    NEIGHBORHOODS: '/barrios',
    AUDIT_LOG: '/log_auditoria',
    MODULES: '/modulos' // tabla modulos (FK de log_auditoria.id_modulo)
  }
}

export default API_CONFIG
