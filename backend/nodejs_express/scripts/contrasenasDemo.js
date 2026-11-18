// scripts/contrasenasDemo.js
// npm run contrasenas-demo: pone la contraseña de prueba "ayuelal2026" (con bcrypt) a los usuarios
// que todavía tienen el valor de ejemplo del script de datos ('pbkdf2_sha256$demo').
// No toca a quien ya tenga una contraseña real.
require('dotenv').config({ quiet: true });
const bcrypt = require('bcryptjs');
const db = require('../config/config');

const CONTRASENA_DEMO = 'ayuelal2026';

(async () => {
  try {
    const hash = await bcrypt.hash(CONTRASENA_DEMO, 10);
    const [res] = await db.query(
      "UPDATE usuarios SET contrasena_hash = ? WHERE contrasena_hash NOT LIKE '$2%'", // $2a/$2b = ya es bcrypt
      [hash]
    );
    console.log(`Listo: ${res.affectedRows} usuario(s) con la contraseña de prueba "${CONTRASENA_DEMO}".`);
  } catch (err) {
    console.error('No se pudo actualizar:', err.message);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
})();
