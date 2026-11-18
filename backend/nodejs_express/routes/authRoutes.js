// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/login', authController.login); // pública: crea la cookie
router.post('/register', authController.register); // pública: cuenta inactiva hasta que el admin la active
router.get('/me', verifyToken, authController.me); // ¿quién soy? (lee la cookie)
router.post('/logout', authController.logout); // borra la cookie

module.exports = router;
