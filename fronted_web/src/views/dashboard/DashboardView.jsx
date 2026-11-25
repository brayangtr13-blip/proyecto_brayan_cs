// src/views/dashboard/DashboardView.jsx
// VISTA: contenedor del dashboard con sus rutas hijas (/dashboard, /dashboard/usuarios, /dashboard/inventario...)
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import useDashboard from '../../hooks/useDashboard'
import { useStockAlerts } from '../../hooks/useProducts'
import AuthController from '../../controllers/AuthController'
import { ROUTES } from '../../config/routes'
import { USER_ROLES } from '../../config/constants'
import AlertMessage from '../common/AlertMessage'
import LoadingSpinner from '../common/LoadingSpinner'
import DashboardHeader from './DashboardHeader'
import DashboardStats from './DashboardStats'
import UsersView from './UsersView'
import UserForm from './UserForm'
import UserDetails from './UserDetails'
import ProductsView from '../inventario/ProductsView'
import EditarProducto, { NuevoProducto } from '../inventario/ProductForm'
import ProductDetails from '../inventario/ProductDetails'
import StockAlertsView from '../inventario/StockAlertsView'
import PosView from '../ventas/PosView'
import SalesView from '../ventas/SalesView'
import SaleDetails from '../ventas/SaleDetails'
import CashCloseView from '../ventas/CashCloseView'
import DeliveriesView from '../domicilios/DeliveriesView'
import NewDeliveryView from '../domicilios/NewDeliveryView'
import DeliveryDetails from '../domicilios/DeliveryDetails'
import MyDeliveriesView from '../domicilios/MyDeliveriesView'
import ChatbotView from '../domicilios/ChatbotView'

const INVENTARIO = [USER_ROLES.ADMIN, USER_ROLES.CAJERO] // rol_permiso: inventario.ver
const VENTAS = [USER_ROLES.ADMIN, USER_ROLES.CAJERO] // rol_permiso: ventas.ver y ventas.registrar
const DOMICILIOS = [USER_ROLES.ADMIN, USER_ROLES.DOMICILIARIO] // rol_permiso: domicilios.ver

// Aviso de inventario en el inicio: cuántos productos hay que pedir
const AvisoInventario = () => {
  const { alerts, loading } = useStockAlerts()
  if (loading || alerts.length === 0) return null
  const agotados = alerts.filter((p) => p.stockActual === 0).length
  return (
    <Link to={ROUTES.PRODUCT_ALERTS} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warn/40 bg-warn/10 px-5 py-4 transition hover:bg-warn/20">
      <span>
        <strong className="font-sub text-warn">{alerts.length} producto(s) en o bajo su stock mínimo</strong>
        {agotados > 0 && <span className="text-t2"> · {agotados} agotado(s)</span>}
      </span>
      <span className="font-medium text-warn">Ver alertas →</span>
    </Link>
  )
}

// Inicio: saludo + aviso de inventario + indicadores (los indicadores de cuentas solo los ve el administrador)
const Inicio = () => {
  const { currentUser } = useAuth()
  const { stats, loading, error } = useDashboard()
  return (
    <div className="grid gap-6">
      <DashboardHeader user={currentUser} />
      {AuthController.hasAnyRole(INVENTARIO) && <AvisoInventario />}
      <AlertMessage type="error" message={error} />
      {loading ? <LoadingSpinner /> : <DashboardStats stats={stats} />}
    </div>
  )
}

// Guard por rol: quien no tenga el rol vuelve al inicio (el servidor igual respondería 403)
const SoloRoles = ({ roles, children }) => {
  if (!AuthController.hasAnyRole(roles)) return <Navigate to={ROUTES.DASHBOARD} replace />
  return children
}

const SoloAdmin = ({ children }) => <SoloRoles roles={[USER_ROLES.ADMIN]}>{children}</SoloRoles>
const ConInventario = ({ children }) => <SoloRoles roles={INVENTARIO}>{children}</SoloRoles>
const ConVentas = ({ children }) => <SoloRoles roles={VENTAS}>{children}</SoloRoles>

const DashboardView = () => {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <Routes>
        <Route index element={<Inicio />} />
        <Route path="usuarios" element={<SoloAdmin><UsersView /></SoloAdmin>} />
        <Route path="usuarios/nuevo" element={<SoloAdmin><UserForm /></SoloAdmin>} />
        <Route path="usuarios/:id" element={<SoloAdmin><UserDetails /></SoloAdmin>} />
        <Route path="usuarios/:id/editar" element={<SoloAdmin><UserForm /></SoloAdmin>} />
        {/* Inventario: ver y registrar (admin y cajero); editar solo admin. "alertas" y "nuevo" van antes de ":codigo" */}
        <Route path="inventario" element={<ConInventario><ProductsView /></ConInventario>} />
        <Route path="inventario/alertas" element={<ConInventario><StockAlertsView /></ConInventario>} />
        <Route path="inventario/nuevo" element={<ConInventario><NuevoProducto /></ConInventario>} />
        <Route path="inventario/:codigo" element={<ConInventario><ProductDetails /></ConInventario>} />
        <Route path="inventario/:codigo/editar" element={<SoloAdmin><EditarProducto /></SoloAdmin>} />
        {/* Ventas y caja: vender y consultar (admin y cajero); cerrar caja solo admin (RF18) */}
        <Route path="vender" element={<ConVentas><PosView /></ConVentas>} />
        <Route path="ventas" element={<ConVentas><SalesView /></ConVentas>} />
        <Route path="ventas/:id" element={<ConVentas><SaleDetails /></ConVentas>} />
        <Route path="caja" element={<SoloAdmin><CashCloseView /></SoloAdmin>} />
        {/* Domicilios: panel, registrar y chatbot (admin); detalle (admin y su domiciliario); mis pedidos (domiciliario).
            "nuevo" y "chatbot" van antes de ":id" */}
        <Route path="domicilios" element={<SoloAdmin><DeliveriesView /></SoloAdmin>} />
        <Route path="domicilios/nuevo" element={<SoloAdmin><NewDeliveryView /></SoloAdmin>} />
        <Route path="domicilios/chatbot" element={<SoloAdmin><ChatbotView /></SoloAdmin>} />
        <Route path="domicilios/:id" element={<SoloRoles roles={DOMICILIOS}><DeliveryDetails /></SoloRoles>} />
        <Route path="mis-pedidos" element={<SoloRoles roles={[USER_ROLES.DOMICILIARIO]}><MyDeliveriesView /></SoloRoles>} />
        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </div>
  )
}

export default DashboardView
