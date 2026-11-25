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
  PRODUCT_EDIT: (codigo) => `/dashboard/inventario/${codigo}/editar`
}

export const PROTECTED_ROUTES = [ROUTES.DASHBOARD]
export const PUBLIC_ROUTES = [ROUTES.LOGIN, ROUTES.REGISTER, ROUTES.HOME]
