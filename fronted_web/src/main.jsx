// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import AuthProvider from './hooks/AuthProvider'
import './index.css' // Tailwind y los colores/fuentes de Control Store
import './App.css'
import './styles/common.css'

// AuthProvider envuelve la app: todas las vistas comparten la misma sesión
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
