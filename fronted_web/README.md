# Control Store · Frontend Web

Frontend del sistema **Control Store** (Autoservicio Ayuelal), construido paso a paso con la guía
del instructor ([estructura_base](https://github.com/ProfeAlbeiro/estructura_base), *Curso React*).

| Tecnología | Versión | Para qué |
|---|---|---|
| React | 19.2.4 | Componentes de la interfaz |
| Vite | 8.0.4 | Servidor de desarrollo y compilación |
| React Router DOM | 7.14.0 | Rutas: `/login`, `/register`, `/dashboard/...` |
| jwt-decode | 4.0.0 | Leer el contenido y el vencimiento del JWT |
| Tailwind CSS | 4.3.5 | Estilos con los colores y fuentes de Control Store |
| ESLint | 9.39.4 | Revisión del código |
| JSON Server + json-server-auth | 0.17.4 + 2.1.0 | API falsa con login JWT (carpeta `backend/jsonserver`) |

## Cómo cumple la entrega del Front-End

| Lo que pide el criterio | Dónde se ve |
|---|---|
| Front-End funcional con un framework | React 19 + Vite, arquitectura MVC de la guía del instructor |
| De acuerdo con el diseño del prototipo y la base de datos | Las pantallas de `_docs_/trim03/06_prototipo_navegable` pasadas a React; `db.json` usa las tablas y columnas de `controlstore_sena` |
| Backend simulado con JSON Server | `backend/jsonserver` (puerto 3001) con json-server-auth |
| Simulación de autenticación con JWT en localStorage | Al iniciar sesión se guardan `auth_token`, `user_data` y `user_role` en `localStorage` (F12 → Application → Local Storage) |

> En `backend/nodejs_express` hay además un backend real con Express + MySQL (Capítulo IV de la guía),
> que guarda el token en una cookie HttpOnly. Queda como trabajo adelantado: **la entrega usa JSON Server**.

## Cómo arrancarlo

Se necesitan **dos terminales**: primero la API falsa y después el frontend.

```bash
# Terminal 1 — API falsa en http://localhost:3001
cd backend/jsonserver
npm install
npm start
```

```bash
# Terminal 2 — Frontend en http://localhost:5173
cd fronted_web
npm install
npm run dev
```

## Cuentas de prueba

Todas usan la contraseña **`ayuelal2026`** (en `db.json` está guardada con bcrypt).

| Correo | Rol | Qué puede hacer |
|---|---|---|
| `admin@controlstore.com` | administrador | Indicadores y CRUD de usuarios |
| `sandra.ortiz@controlstore.com` | cajero | Solo el inicio |
| `luis.p@controlstore.com` | domiciliario | Solo el inicio |
| `diego.rojas@controlstore.com` | cajero (inactivo) | No puede entrar |

## Arquitectura MVC en React

Regla de la guía **C‑S‑M‑C‑H‑V**: cada capa solo habla con la de abajo.

```
VISTA (views/)          dibuja y recibe clics — no sabe de fetch ni de localStorage
   ↓ usa
HOOK (hooks/)           estado de React (useState, useEffect) — llama al controlador
   ↓ llama
CONTROLADOR (controllers/)  reglas de negocio y validaciones
   ↓ usa
MODELO (models/)        habla con la API y guarda la sesión
   ↓ usa
SERVICIOS (services/)   fetch (httpService), localStorage (storageService), JWT (jwtService)
   ↓
CONFIG (config/)        URL de la API, rutas, roles y llaves de storage
```

| Funcionalidad | Modelo | Controlador | Hook | Vistas |
|---|---|---|---|---|
| Sesión | `AuthModel` | `AuthController` | `useAuth` | `LoginView`, `RegisterView`, `Navbar` |
| Usuarios | `UserModel` | `UserController` | `useUsers` | `UsersView`, `UserForm`, `UserDetails` |
| Inicio | `DashboardModel` | `DashboardController` | `useDashboard` | `DashboardView`, `DashboardHeader`, `DashboardStats` |
| Inventario | `ProductModel` | `ProductController` | `useProducts`, `useProduct`, `useStockAlerts` | `ProductsView`, `ProductForm`, `ProductDetails`, `StockAlertsView` |
| Ventas | `SaleModel` | `SaleController` | `useSales`, `useSale`, `usePos` | `PosView`, `SalesView`, `SaleDetails`, `Comprobante` |
| Caja | `CashModel` | `CashController` | `useCash`, `useShiftSummary` | `CashCloseView` |
| Auditoría (escritura) | `AuditModel` | — | — | — |

**Patrones usados:** MVC, Singleton (cada servicio exporta una sola instancia: `new HttpService()`),
Guard (`ProtectedRoute`, `PublicRoute`, `SoloAdmin`), Container/Presentational (`UserForm` espera los
datos y monta `FormularioUsuario`; `DashboardStats` solo dibuja lo que recibe).

## Flujo de autenticación

1. `LoginView` envía el formulario → `useAuth.login()` → `AuthController.handleLogin()` valida el correo.
2. `AuthModel.login()` hace `POST /login`; json-server-auth compara la contraseña con **bcrypt** y
   responde un **JWT firmado** (1 hora) y el usuario.
3. El token, el usuario y el rol se guardan en `localStorage` (`storageService`).
4. Cada petición siguiente lleva `Authorization: Bearer <token>` (`httpService`).
5. `ProtectedRoute` deja entrar a `/dashboard` solo si hay token y no ha vencido (`jwtService`).
6. Cerrar sesión borra el token del navegador.

## Pruebas del flujo (Capítulo III.10)

Pruebas hechas en el navegador contra JSON Server. Resultado: **todas correctas**.

| # | Prueba | Resultado esperado |
|---|---|---|
| 1 | Abrir `/dashboard` sin sesión | Redirige a `/login` |
| 2 | Login con contraseña equivocada | "El correo o la contraseña no coinciden." |
| 3 | Login con `diego.rojas` (inactivo) | "Tu cuenta está inactiva…" |
| 4 | Login como administrador | Entra a `/dashboard`: saludo, fecha e indicadores |
| 5 | Recargar la página (F5) | La sesión se mantiene |
| 6 | Ir a `/login` con sesión | Vuelve a `/dashboard` |
| 7 | Registro con el formulario vacío | Un error junto a cada campo obligatorio |
| 8 | Registro correcto | Vuelve al login con "Cuenta creada" y el correo escrito |
| 9 | Crear usuario con documento repetido o como 2.º administrador | Error en el campo y no se guarda |
| 10 | Crear, ver, editar e inactivar un usuario | La tabla y la ficha muestran el cambio |
| 11 | Inactivar o eliminar al administrador | Lo impide con un mensaje |
| 12 | Eliminar un usuario | Pide confirmación y desaparece de la tabla |
| 13 | Login como cajera | El menú solo muestra "Inicio" |
| 14 | Cajera escribe `/dashboard/usuarios` | Vuelve a `/dashboard` |
| 15 | Cerrar sesión | Vuelve a `/login` y el token se borra |

## Módulo de Inventario (del prototipo navegable)

| Pantalla del prototipo | En React | Ruta | Rol |
|---|---|---|---|
| `listar_productos.html` | `ProductsView` | `/dashboard/inventario` | administrador, cajero |
| `registrar_producto.html` | `NuevoProducto` | `/dashboard/inventario/nuevo` | administrador, cajero |
| `consultar_producto.html` | `ProductDetails` (con kárdex) | `/dashboard/inventario/:codigo` | administrador, cajero |
| `editar_producto.html` | `EditarProducto` | `/dashboard/inventario/:codigo/editar` | administrador |
| `alertas_stock.html` | `StockAlertsView` | `/dashboard/inventario/alertas` | administrador, cajero |

- **Datos:** colecciones `productos`, `categorias` y `movimientos_inventario` de `db.json`, con las columnas
  de MySQL (`stock_actual`, `precio_unitario`...). `ProductModel` las convierte a camelCase (patrón **Adapter**).
- **Reglas** (de `inventario_servicio.js` del prototipo, ahora en `ProductController`): agotado manda sobre
  stock bajo; el código de barras no se repite; el precio de venta no es menor que el de compra; el stock
  solo cambia con una entrada (suma) o un ajuste (resta) y nunca queda negativo; registrar deja el
  "Inventario inicial" en el kárdex; dar de baja = `activo: false`.
- **Kárdex:** `db.json` guarda la cantidad de cada movimiento; el stock anterior y resultante se calculan
  desde el stock actual hacia atrás (`kardexConSaldos`).

### Pruebas del módulo (27 de 27 correctas)

Sesión con el JWT en `localStorage`; recargar mantiene la sesión; lista de 10 productos; búsqueda por
categoría sin tildes ("lacteos"); alertas con el café (faltan 16); kárdex con los nombres de quien hizo
cada movimiento; registro con precio menor (rechazado), código repetido (rechazado) y correcto (con
inventario inicial); entrada +10; ajuste −50 rechazado por stock negativo; ajuste −21 (saldos 0 → 15 →
25 → 4); edición con código y stock bloqueados; dar de baja y filtro "Dados de baja"; la cajera ve y
registra pero no edita; el domiciliario no entra; cerrar sesión borra el token.

## Módulo de Ventas y caja (del prototipo navegable)

| Pantalla del prototipo | En React | Ruta | Rol |
|---|---|---|---|
| `registrar_venta.html` | `PosView` (abrir caja + punto de venta) | `/dashboard/vender` | administrador, cajero |
| `listar_ventas.html` | `SalesView` (filtros y anulación) | `/dashboard/ventas` | administrador, cajero (solo sus ventas) |
| `consultar_venta.html` | `SaleDetails` + `Comprobante` | `/dashboard/ventas/:id` | administrador, cajero (solo sus ventas) |
| `cierre_caja.html` | `CashCloseView` | `/dashboard/caja` | solo administrador (RF18) |

- **Datos:** `ventas`, `detalle_venta`, `arqueo_caja`, `metodos_pago`, `clientes`, `domicilios` y
  `log_auditoria` en `db.json`, con las columnas y datos de `controlstore_sena`.
- **Reglas** (de `ventas_servicio.js`): para vender hay que tener el turno abierto; no se vende un producto
  inactivo, sin stock o por encima del stock; en efectivo lo recibido debe alcanzar y se calcula el cambio;
  vender descuenta el stock y deja una "salida" en el kárdex con "Venta #n"; el cajero solo ve sus ventas.
- **Anular / devolución (HU04):** solo el administrador (rol_permiso no le da `ventas.anular` al cajero),
  con motivo de mínimo 10 caracteres; la venta queda como "anulada" y el stock vuelve con una "entrada".
  Las ventas con domicilio se cancelan desde Domicilios.
- **Cierre de caja (HU05):** suma solo las ventas pagadas del turno, por método de pago;
  diferencia = contado − base − ventas en efectivo (la misma fórmula de la columna calculada
  `arqueo_caja.diferencia`); con diferencia, la observación es obligatoria.
- **Auditoría (RNF04):** registrar, anular, abrir caja y cerrar caja escriben en `log_auditoria`.

### Pruebas del módulo (26 de 26 correctas)

Cajera: menú sin Caja ni Usuarios; vende en su turno #11 (leche ×2 + arroz = $18.200); café ×10 rechazado
por stock; $5.000 no alcanza; con $20.000 el cambio es $1.800; comprobante #14; solo ve sus 5 ventas y no
puede anular; la leche baja a 51 con "Venta #14" en el kárdex; `/dashboard/caja` la devuelve al inicio.
Administrador: ve las 13 ventas, filtra por Nequi (2) y por factura #7 (anulada); anulación con motivo corto
rechazada; devolución de la #14 (estado anulada, leche vuelve a 53, motivo en la factura); cierre del turno
#11: esperado $40.800, contado $40.000 → faltante −$800 que exige observación; después la cajera debe abrir
un turno nuevo para vender.

## Limitaciones de la API falsa (se resuelven en el Capítulo IV con Express)

- json-server-auth solo exige **sesión**, no **rol**: las reglas por rol viven en los controladores
  del navegador. En Express pasarán al servidor.
- `GET /users` envía el hash de la contraseña; `UserModel` lo quita antes de dárselo a las vistas.
- El token vive en `localStorage`; en el Capítulo IV pasa a una cookie `HttpOnly`.
- La cuenta inactiva se revisa en el navegador después del login.
- JSON Server no tiene transacciones: una entrada o ajuste guarda el stock y luego el renglón del kárdex
  en dos peticiones. El backend real lo hace en una sola transacción.
