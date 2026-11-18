// utils/errores.js
// Traduce los errores de MySQL a respuestas claras con su código HTTP
function responderErrorBD(res, err) {
  // 1062: valor repetido en una columna UNIQUE (documento o email)
  if (err.errno === 1062) {
    const campo = /email/i.test(err.message) ? 'email' : 'documento';
    const message = campo === 'email' ? 'Ya hay una cuenta con ese correo.' : 'Ya hay una cuenta con ese documento.';
    return res.status(409).json({ success: false, message, fields: { [campo]: message } });
  }
  // 1644: SIGNAL de un trigger (ej. administrador único); su texto ya está en español
  if (err.errno === 1644) {
    return res.status(409).json({ success: false, message: err.sqlMessage });
  }
  // 1451: la fila tiene registros relacionados (ventas, cierres de caja...) y la FK no deja borrarla
  if (err.errno === 1451) {
    return res.status(409).json({
      success: false,
      message: 'Este usuario tiene ventas u otros registros asociados: inactívalo en lugar de eliminarlo.'
    });
  }
  console.error(err);
  return res.status(500).json({ success: false, message: 'Error en el servidor. Intenta de nuevo.' });
}

module.exports = { responderErrorBD };
