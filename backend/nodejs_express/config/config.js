// config/config.js
// Conexión a MySQL. Se usa mysql2 (no mysql) porque MySQL 8.4 autentica con caching_sha2_password.
// Un pool reutiliza conexiones: no se abre una nueva por cada petición.
require('dotenv').config({ quiet: true });
const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true // las fechas llegan como texto 'AAAA-MM-DD HH:MM:SS'
});

module.exports = db;
