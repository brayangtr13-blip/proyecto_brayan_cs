// src/utils/validators.js
// Reglas de formato reutilizables: las usan los controladores antes de llamar a la API

// texto@dominio.algo, sin espacios
export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? '').trim())

// Mínimo 8 caracteres, con al menos una letra y un número
export const isValidPassword = (password) => {
  const texto = String(password ?? '')
  return texto.length >= 8 && /[A-Za-z]/.test(texto) && /\d/.test(texto)
}

// Documento colombiano: solo dígitos, de 6 a 10
export const isValidDocument = (documento) => /^\d{6,10}$/.test(String(documento ?? ''))

// Celular colombiano: 10 dígitos que empiezan por 3 (opcional: vacío también es válido)
export const isValidPhone = (telefono) => !telefono || /^3\d{9}$/.test(String(telefono))

// Campo obligatorio: no vacío después de quitar espacios
export const isRequired = (valor) => String(valor ?? '').trim().length > 0
