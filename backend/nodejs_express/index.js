// index.js
// Punto de entrada: revisa la conexión a MySQL y arranca el servidor HTTP
require('dotenv').config({ quiet: true });
const app = require('./server');
const db = require('./config/config');

const port = process.env.PORT || 3000;

db.query('SELECT 1')
  .then(() => {
    console.log(`Base de datos conectada: ${process.env.DB_NAME}`);
    app.listen(port, () => console.log(`Servidor corriendo en http://localhost:${port}`));
  })
  .catch((err) => {
    console.error('No se pudo conectar a MySQL. Revisa los datos DB_* del archivo .env:', err.message);
    process.exit(1);
  });
