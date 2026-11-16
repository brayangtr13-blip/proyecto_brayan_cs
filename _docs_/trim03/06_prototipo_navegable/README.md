# Control Store · Prototipo navegable

Prototipo web del sistema **Control Store** para el **Autoservicio Ayuelal**: inventario, ventas y caja,
domicilios con chatbot, usuarios y reportes.
Proyecto de grado de la Tecnología en Análisis y Desarrollo de Software (ADSO) del SENA.

| | |
|---|---|
| **Equipo** | Brayan Alexander Torres Peña · David Alejandro Ortegón Acosta |
| **Repositorio** | [brayangtr13-blip/proyecto_brayan_cs](https://github.com/brayangtr13-blip/proyecto_brayan_cs) |
| **Seguimiento** | Jira, proyecto `CS` (tarjetas CS-179 y CS-193: prototipo · CS-189: API falsa) |
| **Requisitos** | [Matriz de requisitos funcionales](../../trim01/04_requisitos/CS_RequistosFuncionales_Matrix_.xlsx) (30 RF, IEEE 830) |
| **Base de datos** | MySQL 8.4 · esquema `controlstore_sena` ([modelo relacional](../01_modelo_relacional/)) |
| **Bitácora técnica** | [REFACTOR.md](REFACTOR.md): qué cambió, por qué y cómo se probó |

> Es un **prototipo**: no tiene servidor. Los datos se guardan en el navegador (`localStorage`) y empiezan
> con los mismos registros de la base `controlstore_sena`, para que lo que se ve coincida con la BD.

---

## Cómo abrirlo

1. Abrir esta carpeta (`06_prototipo_navegable`) en **Visual Studio Code**.
2. Clic derecho sobre `index.html` → **Open with Live Server**.
   (Sin Live Server: `python -m http.server` en esta carpeta y abrir `http://localhost:8000`).
3. Entrar con uno de los usuarios de prueba.

**Volver a los datos de ejemplo:** en la consola del navegador (F12) escribir `localStorage.clear()` y recargar.
**Si un cambio no se ve:** recargar sin caché con `Ctrl + Shift + R`.

## Usuarios de prueba

En el login se escribe el **alias** o el **correo**. La contraseña puede ser cualquiera: el prototipo no la
valida porque no la guarda (en la BD va cifrada y la validará el backend).

| Alias | Correo | Rol | Panel |
|---|---|---|---|
| `admin` | admin@controlstore.com | Administrador | Todos los módulos |
| `juan` | juan.perez@controlstore.com | Cajero | Punto de venta, historial y cierre de caja |
| `luis` | luis.p@controlstore.com | Domiciliario | Mis pedidos |
| — | kevin.mora@controlstore.com | Domiciliario | Mis pedidos (tiene el pedido #3) |
| — | diego.rojas@controlstore.com | Cajero **inactivo** | No entra: sirve para probar RF01.3 |

Son los usuarios 1 a 7 de `controlstore_sena`, con los mismos id, documentos y correos.

**Reglas de usuarios:**
- Desde «Regístrate» cualquiera puede crear una cuenta de **Cajero** o **Domiciliario**; nace **inactiva**
  y entra solo cuando el administrador la activa.
- Hay **un solo administrador**: no se registra ni se asigna otro, y no se puede inactivar.

---

## Módulos y pantallas

✅ funciona con datos (JS + `localStorage`) · 🟡 pantalla lista, sin datos reales (solo diseño o validación del formulario) · ⬜ pendiente

### Usuarios y acceso
| RF | Funcionalidad | Pantalla | Estado |
|---|---|---|---|
| RF01 | Iniciar sesión (usuario inexistente o inactivo no entra) | `pages/company/login.html` | ✅ |
| RF02 | Cerrar sesión | menú de perfil de cada panel | ✅ |
| RF03 | Recuperar contraseña | `pages/company/recuperar_contrasena.html`, `actualizar_contrasena.html` | 🟡 |
| RF04 | Registrar usuario (documento y correo únicos) | `pages/modules/usuarios/registrar_usuario.html` · `pages/company/registro.html` | ✅ |
| RF05 | Editar usuario | `pages/modules/usuarios/editar_usuario.html` | ✅ |
| RF06 | Activar / inactivar usuario | `pages/modules/usuarios/listar_usuarios.html` | ✅ |
| RF07 | Cambiar contraseña | `pages/modules/perfil/cambiar_contrasena.html` | 🟡 |

### Inventario
| RF | Funcionalidad | Pantalla | Estado |
|---|---|---|---|
| RF08 | Registrar producto (código duplicado) | `pages/modules/inventario/registrar_producto.html` | ✅ |
| RF09 | Listar productos | `pages/modules/inventario/listar_productos.html` | ✅ (paginación pendiente) |
| RF10 | Consultar producto | `pages/modules/inventario/consultar_producto.html` | ✅ (historial de movimientos pendiente) |
| RF11 | Editar producto | `pages/modules/inventario/editar_producto.html` | ✅ |
| RF12 | Eliminar producto (borrado lógico) | `pages/modules/inventario/listar_productos.html` | ✅ |
| RF13 | Alerta de stock mínimo | `pages/modules/inventario/alertas_stock.html` | ✅ (vencimiento: la BD no tiene la columna) |

### Ventas y caja
| RF | Funcionalidad | Pantalla | Estado |
|---|---|---|---|
| RF14 | Registrar venta (descuenta stock, comprobante) | `pages/modules/ventas/registrar_venta.html` | ✅ |
| RF15 | Listar ventas | `pages/modules/ventas/listar_ventas.html` | ✅ |
| RF16 | Consultar venta | `pages/modules/ventas/consultar_venta.html` | ✅ |
| RF17 | Anular venta (devuelve stock) | `pages/modules/ventas/listar_ventas.html` | ✅ |
| RF18 | Cierre de caja | `pages/modules/ventas/cierre_caja.html` | ✅ |

### Domicilios
| RF | Funcionalidad | Pantalla | Estado |
|---|---|---|---|
| RF19–RF21 | Pedido por chatbot (simulador de WhatsApp) | `pages/modules/domicilios/simulador_chatbot.html` | ✅ |
| RF22 | Registrar pedido | `pages/modules/domicilios/registrar_pedido.html` | ✅ |
| RF23 | Asignar domiciliario | `pages/modules/domicilios/listar_domicilios.html` | ✅ |
| RF24 | Actualizar estado del pedido | `pages/modules/domicilios/consultar_pedido.html` · `mis_pedidos.html` | ✅ |
| RF25 | Notificar estado al cliente | `pages/modules/domicilios/consultar_pedido.html` | ✅ |

### Reportes y seguridad
| RF | Funcionalidad | Pantalla | Estado |
|---|---|---|---|
| RF26 | Reporte gráfico de ventas | `pages/modules/reportes/reporte_grafico_ventas.html` | 🟡 |
| RF27 | Reporte impreso de ventas | `pages/modules/reportes/reporte_impreso_ventas.html` | 🟡 |
| RF28 | Reporte gráfico de inventario | `pages/modules/reportes/reporte_rotacion_inventario.html` | 🟡 |
| RF29 | Reporte impreso de productos | `pages/modules/reportes/reporte_movimientos_inventario.html` | 🟡 |
| RF30 | Reporte de domicilios | — | ⬜ |
| — | Reportes de usuarios (CS-27, CS-28) | `pages/modules/reportes/reporte_grafico_usuarios.html`, `reporte_impreso_usuarios.html` | 🟡 |
| RNF04 | Log de auditoría | `pages/modules/seguridad/log_auditoria.html` | 🟡 |

---

## Arquitectura

Prototipo **multipágina** sin framework ni compilación. Cada rol tiene un panel (`pages/roles/`) con la
barra lateral, y cada pantalla se carga dentro de un `<iframe>`.

El código JavaScript va en **tres capas** que se llaman en un solo sentido:

```
Pantalla (registrar_venta.js)      → solo lee el formulario y dibuja resultados
   ↓
Service  (ServicioVentas)          → reglas del negocio: validar, calcular, decidir
   ↓
Repository (RepositorioVentas)     → único acceso a los datos (hoy localStorage; mañana la API)
```

- **Una sola fuente por tabla:** `RepositorioInventario` es dueño de los productos y `RepositorioUsuarios`
  de los usuarios y roles. Ventas y Domicilios les piden los datos; no guardan copias.
- **Sesión:** `sesion.js` guarda en `sessionStorage` quién entró (id, nombre y rol). Se borra al cerrar sesión
  o la pestaña.
- **Patrones de diseño usados:** Repository, Service, Module (IIFE), State (estados del pedido),
  Observer (eventos y notificaciones de domicilios) y Adapter (canales de notificación).
- **Por qué así:** cuando exista la API, solo cambian los archivos `*_datos.js`; las pantallas y las reglas
  siguen iguales.

## Estructura de carpetas

```
06_prototipo_navegable/
├── index.html                 Portada → login
├── README.md                  Este archivo
├── REFACTOR.md                Bitácora técnica de los cambios
├── assets/
│   ├── css/                   styles.css, dashboard.css y un CSS por módulo
│   ├── img/                   Imágenes (con CREDITOS.txt)
│   ├── js/
│   │   ├── sesion.js          Sesión simulada
│   │   ├── login.js, registro.js, dashboard.js, ...
│   │   ├── usuarios/          usuarios_datos.js (Repository) · usuarios_servicio.js (Service) · pantallas
│   │   ├── inventario/        inventario_datos.js · inventario_servicio.js · pantallas
│   │   ├── ventas/            ventas_datos.js · ventas_servicio.js · comprobante_venta.js · pantallas
│   │   └── domicilios/        domicilios_datos.js · domicilios_servicio.js · estados · eventos · pantallas
│   └── vendor/                Bootstrap, Bootstrap Icons, Font Awesome y fuente Inter (locales, sin CDN)
└── pages/
    ├── company/               login, registro, recuperar y actualizar contraseña
    ├── roles/                 admin.html, cajero.html, domiciliario.html (paneles)
    └── modules/               dashboard, usuarios, inventario, ventas, domicilios, reportes, seguridad, perfil
```

## Tecnologías

| Tecnología | Versión | Uso |
|---|---|---|
| HTML5 + CSS3 | — | Estructura semántica y estilos propios |
| Bootstrap | 5.3.3 | Rejilla, componentes y validación de formularios (local en `assets/vendor/`) |
| Bootstrap Icons · Font Awesome | locales | Íconos |
| JavaScript | ES5/ES6 sin compilar | Scripts clásicos con IIFE (abre sin servidor de compilación) |
| Web Storage | `localStorage` · `sessionStorage` | Datos del prototipo y sesión |

## Convenciones del equipo

- **Ramas:** una por subtarea de Jira, desde `develop`: `feature/CS-<n>-<descripcion>`.
- **Commits:** `tipo(ámbito): descripción` (`feat`, `fix`, `refactor`, `docs`, `chore`), en español.
- **Integración:** pull request hacia **`develop`** (nunca directo a `main`; `main` solo recibe entregas de trimestre).
- **Código:** identificadores en español y camelCase; cada archivo empieza con un comentario de qué es,
  qué patrón usa y de qué depende; los comentarios explican el **porqué** y citan la HU o el RF.

## Estado y siguientes pasos

**Fase 1 · Completar el prototipo** (ver el detalle en [REFACTOR.md](REFACTOR.md))
- [x] Una sola fuente de usuarios, login contra los usuarios y reglas de rol
- [ ] Catálogos únicos: métodos de pago y clientes (hoy copiados en Ventas y Domicilios)
- [ ] Log de auditoría con JS (RNF04)
- [ ] Reportes con datos reales y reporte de domicilios (RF26–RF30)
- [ ] Historial de movimientos en consultar producto (RF10.2) y paginación real
- [ ] Revisión responsive y visual

**Fase 2 · API falsa** (CS-189)
- [ ] JSON Server con un `db.json` igual a las tablas de `controlstore_sena`
- [ ] Los Repository pasan de `localStorage` a `fetch`
- [ ] Login con JWT simulado y protección de pantallas por rol (guards)

**Pendientes por decidir**
- El formulario de registrar usuario pide un «Usuario» (nombre de usuario) que no existe en la tabla `usuarios`.
- RF13 pide alerta de vencimiento, pero `productos` no tiene fecha de vencimiento.
