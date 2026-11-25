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

## Módulo de Domicilios (del prototipo navegable)

| Pantalla del prototipo | En React | Ruta | Rol |
|---|---|---|---|
| `listar_domicilios.html` | `DeliveriesView` (pestañas por estado y asignación) | `/dashboard/domicilios` | administrador |
| `registrar_pedido.html` | `NewDeliveryView` | `/dashboard/domicilios/nuevo` | administrador |
| `consultar_pedido.html` | `DeliveryDetails` (productos, recorrido, histórico) | `/dashboard/domicilios/:id` | administrador, domiciliario (solo los suyos) |
| `mis_pedidos.html` | `MyDeliveriesView` | `/dashboard/mis-pedidos` | domiciliario |
| `simulador_chatbot.html` | `ChatbotView` | `/dashboard/domicilios/chatbot` | administrador |

- **Datos:** `domicilios`, `barrios` (tarifa y cobertura), `clientes`, `ventas` y `detalle_venta` en `db.json`.
- **Registrar (HU04):** se busca al cliente por teléfono (`clientes.telefono` es UNIQUE); se valida
  teléfono, dirección, barrio con cobertura, stock y método de pago **antes** de guardar. La venta queda
  "pendiente" (contra entrega) y el envío sale de la tarifa del barrio. El stock no baja todavía.
- **Estados (patrón State, `DeliveryStates.js`):** pendiente → asignado → en camino → entregado, sin saltos;
  desde cualquiera no final se puede cancelar (con motivo). Entregado y cancelado ya no se modifican.
  El domiciliario solo pone "en camino" y "entregado", y solo en sus pedidos.
- **Entregar:** descuenta el stock ("salida" con "Domicilio #n") y la venta pasa a "pagada".
  **Cancelar:** la venta pasa a "anulada" (si ya estaba pagada, el stock vuelve con una "entrada").
- **Notificaciones (HU07, patrón Observer + Adapter):** el controlador publica `estadoCambiado`;
  `DeliveryNotifications` escucha, arma el mensaje con la plantilla y lo manda por un canal simulado
  (localStorage). El chatbot muestra esos mensajes y solo informa pedidos del teléfono del cliente.
- **Auditoría:** registrar, asignar y cada cambio de estado escriben en `log_auditoria` (módulo 4);
  de ahí sale el histórico del pedido.

### Pruebas del módulo (30 de 30 correctas)

Administrador: menú con Domicilios; 10 pedidos, filtro "En camino" muestra solo el #7; solo los activos
tienen el selector de asignar; registrar vacío marca los campos; el teléfono 3011234567 trae a María
Restrepo; leche ×999 rechazada por stock; leche ×2 crea el pedido #11 (venta pendiente, cliente 1,
envío $2.000, stock sigue en 53) con "Registrado" en el histórico; asignado a Kevin; cancelar el #10 sin
motivo se rechaza, con motivo queda cancelado y su venta anulada.
Domiciliario (Kevin): menú solo Inicio y Mis pedidos; ve solo el #11 por entregar; "Salir a entregar" →
en camino; "Confirmar entrega" → entregado con fecha, leche 53 → 51 y venta pagada; el #7 (de Yeison)
responde "El pedido no existe"; `/dashboard/domicilios` lo devuelve al inicio; histórico con 4 pasos.
Chatbot: María ve los avisos "salió con…" y "fue entregado"; preguntar por el #7 responde que no es suyo;
preguntar por el #11 responde su estado. Cajera: sin menú de Domicilios.

## Módulo de Reportes (del prototipo navegable)

| Pantalla del prototipo | En React | Ruta | Rol |
|---|---|---|---|
| (menú de reportes) | `ReportsView` | `/dashboard/reportes` | administrador, cajero |
| `reporte_grafico_ventas.html` | `SalesChartReport` (RF26) | `/dashboard/reportes/ventas` | administrador, cajero (sus ventas) |
| `reporte_impreso_ventas.html` | `SalesPrintReport` (RF27) | `/dashboard/reportes/ventas/impreso` | administrador, cajero (sus ventas) |
| `reporte_movimientos_inventario.html` | `InventoryReport` (RF28) | `/dashboard/reportes/inventario` | administrador, cajero |
| `reporte_rotacion_inventario.html` | `RotationReport` (RF29) | `/dashboard/reportes/rotacion` | administrador, cajero |
| `reporte_domicilios.html` | `DeliveriesReport` (RF30) | `/dashboard/reportes/domicilios` | administrador |
| `reporte_grafico_usuarios.html` | `UsersChartReport` | `/dashboard/reportes/usuarios` | administrador |
| `reporte_impreso_usuarios.html` | `UsersPrintReport` | `/dashboard/reportes/usuarios/impreso` | administrador |

- **Solo lectura:** `ReportModel` trae las colecciones y las une como los JOIN del backend real;
  `ReportController` hace todos los cálculos (es `reportes_servicio.js` del prototipo). Nada se guarda.
- **Permisos (`rol_permiso`):** `reportes.ventas` y `reportes.inventario` para administrador y cajero;
  `reportes.domicilios` y `reportes.usuarios` solo administrador. El cajero solo ve sus propias ventas.
- **Ventas:** solo cuentan las pagadas (las anuladas y los domicilios sin entregar no son plata recibida);
  agrupación por día, semana o mes; el motivo de una anulación sale de `log_auditoria`.
- **Inventario:** el kárdex se reconstruye hacia atrás desde el stock actual (stock anterior y resultante);
  rotación = salidas − reversos (entradas por anulación o cancelación).
- **Gráficos:** barras hechas con CSS (como el prototipo con Bootstrap), sin librería y sin internet.
- **Exportar:** CSV con ";" y BOM, que Excel abre con las tildes bien (`utils/exportar.js`). Imprimir usa
  `window.print()`; el menú, los filtros y los botones se ocultan en la hoja (`print:hidden`).

### Pruebas del módulo (29 de 29 correctas)

Administrador: menú con Reportes; la portada muestra 4 grupos y 7 reportes. Ventas: $206.050 en 11 ventas
pagadas (ticket $18.732, igual a la suma en `db.json`); por mes una sola barra y por semana tres que suman
lo mismo; desde el 23 de septiembre, 4 ventas; un rango sin ventas muestra el aviso. Impreso: la venta #7
anulada con "Devolución: producto en mal estado"; filtro Nequi = 2; exporta `reporte_ventas.csv`.
Inventario: 32 movimientos; el último saldo de la leche es 53 (su stock actual); el filtro de salidas solo
deja salidas. Rotación: la leche es la de mayor salida. Domicilios: 10 pedidos, 7 entregados, 37 min de
promedio, filtro de cancelados = 1. Usuarios: vendedor destacado; 10 usuarios, 3 cajeros; ningún hash de
contraseña llega a la página. Cajera: solo ve 4 reportes y sus 4 ventas ($63.600), sin filtro de vendedor;
`/reportes/usuarios` y `/reportes/domicilios` la devuelven al inicio. Domiciliario: sin menú ni acceso.

## Auditoría y perfil (del prototipo navegable)

| Pantalla del prototipo | En React | Ruta | Rol |
|---|---|---|---|
| `seguridad/log_auditoria.html` | `AuditLogView` | `/dashboard/auditoria` | solo administrador (RNF04) |
| `perfil/cambiar_contrasena.html` | `ProfileView` | `/dashboard/perfil` | cualquiera con sesión |
| `company/recuperar_contrasena.html` | `RecoverPasswordView` | `/recuperar-contrasena` | pública |

- **Log de auditoría:** solo lectura (no hay editar ni borrar). `AuditModel.getLog` une `log_auditoria`
  con `users` y `modulos`; `AuditController` filtra por fechas, usuario, módulo y acción, ordena del más
  reciente al más antiguo, resume (eventos, usuarios distintos, accesos fallidos) y pagina de 10 en 10.
  En el DML los intentos fallidos y bloqueos quedaron como `login` con ese detalle: se muestran como
  "Acceso fallido".
- **Inicio y cierre de sesión** ahora quedan en `log_auditoria` (el cierre se registra antes de borrar el token).
- **Cambiar contraseña:** la actual se comprueba contra el hash con `POST /login` (bcrypt, sin guardar ese
  token); la nueva cumple la regla del registro y no puede ser igual a la actual; `PATCH /users/:id` la
  guarda y json-server-auth la cifra con bcrypt. Queda en la auditoría y se cierra la sesión.
- **Recuperar contraseña:** simulado, como en el prototipo (no hay servidor de correo). Responde el mismo
  mensaje exista o no el correo, para no revelar qué cuentas hay.
- **Menú:** "Auditoría" para el administrador; el nombre del usuario lleva a "Mi perfil".

### Pruebas del módulo (36 de 36 correctas)

Administrador: el login queda como evento #13; el log muestra 13 eventos, el más reciente primero, 10 por
página y 3 en la segunda; filtrar por módulo vuelve a la página 1 (Ventas y caja = 4); inicios de sesión
exitosos = 3 y accesos fallidos = 2 (#11 y #9); sin botones de editar o borrar ni hashes en la página;
"Cerrar sesión" deja un evento `logout`. Cajera: sin menú Auditoría y `/dashboard/auditoria` la devuelve al
inicio; en "Mi perfil" ve sus datos; campos vacíos, contraseña débil, confirmación distinta, nueva igual a
la actual y actual incorrecta se rechazan sin cerrar la sesión; con datos correctos se cierra la sesión, el
login muestra el aviso con su correo, la contraseña vieja ya no sirve y la nueva sí; el hash cambió (bcrypt)
y la auditoría tiene "Cambió su contraseña". Recuperar: enlace desde el login, correo inválido rechazado y
el mismo mensaje para un correo que existe y uno que no. El menú del administrador cabe en una línea a
1280 px. Después de probar, `db.json` volvió a sus datos originales.

## Limitaciones de la API falsa (se resuelven en el Capítulo IV con Express)

- json-server-auth solo exige **sesión**, no **rol**: las reglas por rol viven en los controladores
  del navegador. En Express pasarán al servidor.
- `GET /users` envía el hash de la contraseña; `UserModel` lo quita antes de dárselo a las vistas.
- El token vive en `localStorage`; en el Capítulo IV pasa a una cookie `HttpOnly`.
- La cuenta inactiva se revisa en el navegador después del login.
- Los intentos fallidos de login no quedan en la auditoría: `log_auditoria` exige sesión y quien falla
  no tiene token. El backend real los registra en el servidor (y bloquea tras 3, con el trigger).
- Las notificaciones del chatbot se guardan en el navegador (canal simulado); un canal real (WhatsApp o
  Telegram) solo cambiaría el método `enviar` del adaptador.
- JSON Server no tiene transacciones: una entrada o ajuste guarda el stock y luego el renglón del kárdex
  en dos peticiones. El backend real lo hace en una sola transacción.
