// routes/userRoutes.js
// Todas las rutas de usuarios: sesión válida (verifyToken) + rol administrador (authorizeRoles)
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(verifyToken, authorizeRoles(['administrador']));

router.get('/', userController.getAllUsers);
router.get('/roles', userController.getRoles); // antes de '/:id' para que "roles" no se tome como id
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
