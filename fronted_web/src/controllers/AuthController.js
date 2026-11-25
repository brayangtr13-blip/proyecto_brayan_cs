// src/controllers/AuthController.js
// CONTROLADOR: valida lo que escribe el usuario y coordina al modelo. No toca la API directamente.
import AuthModel from '../models/AuthModel'
import AuditModel from '../models/AuditModel'
import { MODULOS, USER_ROLES } from '../config/constants'
import { isRequired, isValidDocument, isValidEmail, isValidPassword, isValidPhone } from '../utils/validators'

class AuthController {
  // Login: primero validar (sin gastar una petición), luego pedir al modelo
  static async handleLogin(credentials) {
    if (!isRequired(credentials.email) || !isRequired(credentials.password)) {
      return { success: false, error: 'Escribe tu correo y tu contraseña.' }
    }
    if (!isValidEmail(credentials.email)) {
      return { success: false, error: 'El correo no tiene un formato válido.' }
    }
    const result = await AuthModel.login(credentials)
    // RNF04: cada inicio de sesión queda en log_auditoria (ya con el token, porque la tabla exige sesión)
    if (result.success) await AuditModel.registrar({ idUsuario: result.user.id, idModulo: MODULOS.USUARIOS, accion: 'login', detalle: 'Inicio de sesión exitoso' })
    return result
  }

  // Registro: devuelve los errores por campo para mostrarlos junto a cada input
  static async handleRegister(userData) {
    const errores = {}
    if (!isValidDocument(userData.documento)) errores.documento = 'El documento tiene de 6 a 10 dígitos.'
    if (!isRequired(userData.nombre)) errores.nombre = 'Escribe tu nombre.'
    if (!isRequired(userData.apellido)) errores.apellido = 'Escribe tu apellido.'
    if (!isValidEmail(userData.email)) errores.email = 'El correo no tiene un formato válido.'
    if (!isValidPhone(userData.telefono)) errores.telefono = 'El celular tiene 10 dígitos y empieza por 3.'
    if (!isValidPassword(userData.password)) errores.password = 'Mínimo 8 caracteres, con letras y números.'
    if (userData.password !== userData.confirmPassword) errores.confirmPassword = 'Las contraseñas no coinciden.'

    if (Object.keys(errores).length > 0) {
      return { success: false, error: 'Revisa los campos marcados.', fields: errores }
    }
    return AuthModel.register(userData)
  }

  // Primero se registra la salida (todavía hay token) y después se borra la sesión
  static async handleLogout() {
    const usuario = AuthModel.getCurrentUser()
    if (usuario && AuthModel.isAuthenticated()) {
      await AuditModel.registrar({ idUsuario: usuario.id, idModulo: MODULOS.USUARIOS, accion: 'logout', detalle: 'Cierre de sesión' })
    }
    return AuthModel.logout()
  }

  // Cambiar contraseña (cambiar_contrasena.html): la actual se comprueba contra el hash del servidor,
  // la nueva cumple la misma regla del registro y no puede ser igual a la actual.
  // Al terminar se cierra la sesión para entrar con la contraseña nueva.
  static async handleChangePassword({ actual, nueva, confirmar }) {
    const errores = {}
    if (!isRequired(actual)) errores.actual = 'Escribe tu contraseña actual.'
    if (!isValidPassword(nueva)) errores.nueva = 'Mínimo 8 caracteres, con letras y números.'
    else if (nueva === actual) errores.nueva = 'La nueva contraseña no puede ser igual a la actual.'
    if (confirmar !== nueva) errores.confirmar = 'Las contraseñas no coinciden.'
    if (Object.keys(errores).length > 0) return { success: false, error: 'Revisa los campos marcados.', fields: errores }

    const usuario = AuthModel.getCurrentUser()
    if (!(await AuthModel.verifyPassword(usuario.email, actual))) {
      return { success: false, error: 'La contraseña actual no es correcta.', fields: { actual: 'No coincide con tu contraseña.' } }
    }
    const result = await AuthModel.changePassword(usuario.id, nueva)
    if (!result.success) return result
    await AuditModel.registrar({ idUsuario: usuario.id, idModulo: MODULOS.USUARIOS, accion: 'actualizar', detalle: 'Cambió su contraseña' })
    await this.handleLogout()
    return { success: true, message: 'Contraseña actualizada. Inicia sesión con la nueva.' }
  }

  // Recuperar contraseña (recuperar_contrasena.html): sin servidor de correo, se simula el envío.
  // El mensaje es el mismo exista o no el correo, para no revelar qué cuentas hay.
  static handleRecoverPassword(email) {
    if (!isValidEmail(email)) return { success: false, error: 'El correo no tiene un formato válido.' }
    return { success: true, message: 'Si el correo está registrado, te enviaremos un enlace para crear una contraseña nueva.' }
  }

  // Estado actual de la sesión (lo usa useAuth al montar)
  static getAuthState() {
    return {
      isAuthenticated: AuthModel.isAuthenticated(),
      currentUser: AuthModel.getCurrentUser(),
      currentToken: AuthModel.getCurrentToken()
    }
  }

  static getUserRole() {
    return AuthModel.getCurrentUser()?.role ?? null
  }

  // ¿El usuario tiene alguno de estos roles? Ej.: hasAnyRole(['administrador', 'cajero'])
  static hasAnyRole(allowedRoles) {
    return allowedRoles.includes(this.getUserRole())
  }

  static isAdmin() {
    return this.getUserRole() === USER_ROLES.ADMIN
  }
}

export default AuthController
