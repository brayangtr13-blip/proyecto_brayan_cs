// src/models/AuthModel.js
class AuthModel {
  static async login(_credentials) {
    return { success: false, error: 'No implementado aún' }
  }

  static async logout() {
    return { success: true }
  }

  static isAuthenticated() {
    return false
  }

  static getCurrentUser() {
    return null
  }

  static getCurrentToken() {
    return null
  }
}

export default AuthModel
