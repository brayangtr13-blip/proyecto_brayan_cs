// src/views/inventario/StockBadge.jsx
// VISTA: etiqueta de color según el nivel de stock (agotado, bajo o normal)
import ProductController from '../../controllers/ProductController'

const ESTILO = {
  agotado: ['bg-err/10 text-err', 'Agotado'],
  bajo: ['bg-warn/10 text-warn', 'Stock bajo'],
  normal: ['bg-ok/10 text-ok', 'Disponible']
}

const StockBadge = ({ producto }) => {
  const [clase, texto] = ESTILO[ProductController.nivelStock(producto)]
  return <span className={`rounded-lg px-2 py-1 text-sm font-medium whitespace-nowrap ${clase}`}>{texto}</span>
}

export default StockBadge
