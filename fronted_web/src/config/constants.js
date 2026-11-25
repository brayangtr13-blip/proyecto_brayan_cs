// src/config/constants.js
export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'user_data',
  ROLE: 'user_role'
}

// Roles de Control Store (tabla roles de controlstore_sena)
export const USER_ROLES = {
  ADMIN: 'administrador',
  CAJERO: 'cajero',
  DOMICILIARIO: 'domiciliario'
}

// Tabla modulos: a qué módulo pertenece cada registro de log_auditoria
export const MODULOS = { USUARIOS: 1, INVENTARIO: 2, VENTAS: 3, DOMICILIOS: 4, REPORTES: 5 }

// id_metodo_pago de Efectivo: el único que pide valor recibido y da cambio
export const METODO_EFECTIVO = 1
