// server.js
// Configura la aplicación Express: middlewares globales, rutas y manejo de errores
const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const usersRoutes = require('./routes/userRoutes');

const app = express();

// Middlewares globales (el orden importa: CORS y cookies van antes de las rutas)
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // IV.5: llena req.cookies con las cookies que envía el navegador

// IV.6: con cookies, CORS exige el origen exacto (no '*') y credentials: true
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

// Endpoint de prueba
app.get('/', (req, res) => {
  res.send('API de Control Store funcionando');
});

// Ruta que no existe
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'La ruta no existe.' });
});

// Manejo de errores: JSON con mensaje, sin mostrar el detalle interno al navegador
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ success: false, message: 'Error en el servidor.' });
});

module.exports = app;
