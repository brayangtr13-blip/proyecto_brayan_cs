// src/config/routes.js
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  HOME: '/'
}

export const PROTECTED_ROUTES = [ROUTES.DASHBOARD]
export const PUBLIC_ROUTES = [ROUTES.LOGIN, ROUTES.REGISTER, ROUTES.HOME]
