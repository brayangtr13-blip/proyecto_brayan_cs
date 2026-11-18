// src/views/layouts/MainLayout.jsx
// Plantilla de las pantallas con sesión: barra arriba y contenido debajo
import Navbar from '../common/Navbar'

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-fondo">
      <Navbar />
      <main>{children}</main>
    </div>
  )
}

export default MainLayout
