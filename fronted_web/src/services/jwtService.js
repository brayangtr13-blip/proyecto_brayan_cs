// src/services/jwtService.js
// Capítulo IV: el JWT está en una cookie HttpOnly, así que el navegador NO puede leerlo ni decodificarlo.
// Firmarlo, verificarlo y revisar su vencimiento lo hace solo el servidor (middlewares/authMiddleware.js).
// Para saber quién está conectado, el frontend pregunta a GET /auth/me (ver AuthModel.me).
class JWTService {}

export default new JWTService()
