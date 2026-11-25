// src/config/routes.js
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  HOME: '/',
  // CRUD de usuarios: rutas hijas de /dashboard
  USERS: '/dashboard/usuarios',
  USER_NEW: '/dashboard/usuarios/nuevo',
  USER_DETAIL: (id) => `/dashboard/usuarios/${id}`,
  USER_EDIT: (id) => `/dashboard/usuarios/${id}/editar`,
  // Módulo de inventario
  PRODUCTS: '/dashboard/inventario',
  PRODUCT_NEW: '/dashboard/inventario/nuevo',
  PRODUCT_ALERTS: '/dashboard/inventario/alertas',
  PRODUCT_DETAIL: (codigo) => `/dashboard/inventario/${codigo}`,
  PRODUCT_EDIT: (codigo) => `/dashboard/inventario/${codigo}/editar`,
  // Módulo de ventas y caja
  POS: '/dashboard/vender',
  SALES: '/dashboard/ventas',
  SALE_DETAIL: (id) => `/dashboard/ventas/${id}`,
  CASH_CLOSE: '/dashboard/caja',
  // Módulo de domicilios
  DELIVERIES: '/dashboard/domicilios',
  DELIVERY_NEW: '/dashboard/domicilios/nuevo',
  DELIVERY_DETAIL: (id) => `/dashboard/domicilios/${id}`,
  MY_DELIVERIES: '/dashboard/mis-pedidos',
  CHATBOT: '/dashboard/domicilios/chatbot',
  // Módulo de reportes (RF26 a RF30)
  REPORTS: '/dashboard/reportes',
  REPORT_SALES: '/dashboard/reportes/ventas',
  REPORT_SALES_PRINT: '/dashboard/reportes/ventas/impreso',
  REPORT_INVENTORY: '/dashboard/reportes/inventario',
  REPORT_ROTATION: '/dashboard/reportes/rotacion',
  REPORT_DELIVERIES: '/dashboard/reportes/domicilios',
  REPORT_USERS: '/dashboard/reportes/usuarios',
  REPORT_USERS_PRINT: '/dashboard/reportes/usuarios/impreso'
}

export const PROTECTED_ROUTES = [ROUTES.DASHBOARD]
export const PUBLIC_ROUTES = [ROUTES.LOGIN, ROUTES.REGISTER, ROUTES.HOME]
