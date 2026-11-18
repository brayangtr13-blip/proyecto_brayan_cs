// src/controllers/AuthController.js
import AuthModel from '../models/AuthModel'

class AuthController {
  static getAuthState() {
    return {
      isAuthenticated: AuthModel.isAuthenticated(),
      currentUser: AuthModel.getCurrentUser(),
      currentToken: AuthModel.getCurrentToken()
    }
  }
}

export default AuthController
