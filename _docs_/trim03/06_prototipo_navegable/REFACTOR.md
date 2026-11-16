# Refactor del prototipo navegable

Bitácora técnica del prototipo hecha con Claude Code: qué cambió, por qué y cómo se probó.
Se actualiza en cada punto. Para saber qué es el prototipo y cómo usarlo, ver [README.md](README.md).

## Plan de trabajo

**Refactor de arquitectura** (rama `refactor/arquitectura-prototipo`, PR #37)

1. Arquitectura (carpetas, cómo se escribe el código, cómo se comenta) ✅ completo (7 de 7 puntos)
2. Patrones de diseño en HTML, CSS y JS (referencia: https://refactoring.guru/es/design-patterns)
3. Lógica de programación
4. Mejoras visuales y estéticas

**Fase 1 · Completar el prototipo** según la matriz de requisitos y Jira (CS-179, CS-193)

1. Una sola fuente de usuarios ✅ (rama `feature/CS-208-fuente-unica-usuarios`)
2. Catálogos únicos: métodos de pago y clientes
3. Log de auditoría con JS (RNF04)
4. Reportes con JS + reporte de domicilios (RF26–RF30)
5. Kárdex en consultar producto (RF10.2) y paginación real
6. Responsive y revisión visual

**Fase 2 · API falsa** (CS-189): JSON Server con `db.json`, login con JWT simulado y guards por rol.

Regla: se avanza paso a paso y cada cambio se revisa antes de seguir.

## Paso 1 · Diagnóstico de arquitectura

- **Tipo:** prototipo estático multipágina (HTML + CSS + JS sin build).
- **Shell con iframe:** `pages/roles/*.html` tiene la barra lateral; cada módulo se carga en `<iframe name="area_trabajo">`.
- **Capas:** Pantalla (`*.js` por página) → Service (reglas) → Repository (datos en `localStorage`).
- **Fortalezas:** comentarios que explican el porqué, trazabilidad a HU/CU (`CS-18 · MOD_03_HU01`),
  notas de qué cambia con Django, librerías locales en `vendor/`.

### Problemas encontrados y estado

| # | Problema | Estado |
|---|---|---|
| 1 | Carpetas mezclan inglés y español | ✅ Resuelto |
| 2 | Inventario y Usuarios sin Repository/Service | ✅ Resuelto |
| 3 | Productos duplicados entre módulos | ✅ Resuelto |
| 4 | Carpeta `_mains_/` con nombre raro | ✅ Resuelto |
| 5 | `delete.txt.txt` en la raíz | ✅ Resuelto |
| 6 | Orden manual de `<script>` sin control | ✅ Resuelto |
| 7 | Variables globales (`const usuario`, `const el`) | ✅ Resuelto |

## Cambios realizados

### 1 · Carpetas en español
`pages/modules/`: `sales→ventas`, `deliveries→domicilios`, `inventory→inventario`, `users→usuarios`,
`reports→reportes`, `security→seguridad`. Se actualizaron los enlaces del menú (admin, cajero,
domiciliario), los `src` de los iframes y los accesos del dashboard. Verificado: 0 enlaces rotos.

### 2 · Repository y Service para Inventario y Usuarios
```
assets/js/inventario/  inventario_datos.js (RepositorioInventario) · inventario_servicio.js (ServicioInventario) · pantallas
assets/js/usuarios/    usuarios_datos.js (RepositorioUsuarios)     · usuarios_servicio.js (ServicioUsuarios)     · pantallas
```
- Las reglas repetidas (precio, tildes, stock bajo, orden de alertas, duplicados CS-12, borrado lógico CS-16)
  pasan al Service.
- La tabla de usuarios ya no está escrita a mano en el HTML: se dibuja desde el Repository.
- Registrar, editar y dar de baja ahora se guardan y se ven en las demás pantallas.
- La contraseña no se guarda en el prototipo (no debe quedar en texto plano).

### 3 · Una sola fuente de productos
- `RepositorioInventario` es el **único dueño de la tabla productos**.
- `RepositorioVentas` y `RepositorioDomicilios` ya no tienen su copia: sus `obtenerProducto(s)` delegan
  en Inventario, y al guardar una venta o un pedido también guardan el stock modificado.
- El estado del producto se unifica en `estado: 'activo' | 'inactivo'` (Ventas usaba `activo: true`).
- `dashboard_inicio.js` cuenta las alertas con `ServicioInventario.obtenerAlertas()` en vez de su propio arreglo.
- Las páginas de Ventas, Domicilios, el dashboard y `roles/domiciliario.html` cargan `inventario_datos.js` antes.
- Probado: un producto registrado en Inventario aparece en el Punto de venta y en Domicilios; al venderlo,
  el stock baja en Inventario.

### Punto 4 · `_mains_/` → `dashboard/`
- `git mv pages/modules/_mains_ pages/modules/dashboard` (conserva el historial).
- Actualizados el enlace "Inicio" y el `src` del iframe en `pages/roles/admin.html` y las migas de pan
  de Inventario y Domicilios. Las rutas a `assets/` no cambian (misma profundidad).

### Punto 5 · `delete.txt.txt`
- Archivo vacío (0 bytes) sin referencias en el proyecto; eliminado con `git rm`.

### Punto 6 · Orden de `<script>`
- Cada Repository/Service que depende de otro archivo revisa al cargar que exista, por ejemplo en `ventas_datos.js`:
  `if (typeof RepositorioInventario === 'undefined') throw new Error('ventas_datos.js: falta cargar antes inventario/inventario_datos.js');`
- Aplicado en `ventas_datos`, `ventas_servicio`, `inventario_servicio`, `usuarios_servicio`, `domicilios_datos`,
  `domicilios_servicio` y `domicilios_notificaciones`. Si un HTML carga los scripts en otro orden, la consola dice cuál falta.
- Se mantienen scripts clásicos (no módulos ES) para que el prototipo siga abriendo sin servidor.
- Probado: las 34 páginas cargan en Chromium sin errores en consola.

### Punto 7 · Globales en las pantallas
- Los 26 JS de pantalla quedan envueltos en una IIFE `(function () { ... })();`: `usuario`, `el`, `parametros`,
  `carrito`, etc. ya no son globales y no chocan entre scripts.
- No se envuelven `sesion.js` ni `ventas/comprobante_venta.js`: ya son módulos (`Sesion`, `ComprobanteVenta`)
  que otras pantallas usan. Ningún HTML usa `onclick=""`, así que nada dependía de esas globales.
- Probado: las 34 páginas cargan sin errores; registrar un producto, venderlo en el Punto de venta y verlo
  con el stock descontado en Inventario funciona sin errores en consola.

## Fase 1 · Paso 1 · Una sola fuente de usuarios

**Problema:** los usuarios estaban en 7 lugares que no coincidían entre sí ni con la BD: Usuarios
(Laura y Carlos, rol «vendedor»), `sesion.js`, una copia en Ventas, otra en Domicilios (Diana y Jorge,
que no existen; el id 4 de la BD es una cajera), `mis_pedidos.js` y `consultar_pedido.js` con un usuario
fijo, y `registro.js` con su propia lista de correos. Inactivar a alguien no tenía efecto en el resto.

**Solución:** lo mismo que con los productos: `RepositorioUsuarios` es el único dueño de `usuarios` y `roles`.

| Commit | Qué cambió |
|---|---|
| `2da5cb1` refactor(usuarios) | Usuarios 1–7 de `controlstore_sena` y catálogo de roles (1 administrador, 2 cajero, 3 domiciliario). Llave `idUsuario` (antes `documento`). Rol «Vendedor» → «Cajero» con `value` = `id_rol`. Teléfono opcional (NULL en la BD). Correo y documento únicos (RF04.2). Clave `v1 → v2`. |
| `1741c11` refactor(sesion) | `Sesion.iniciar()` busca en el Repository por alias o correo. Usuario desconocido → error (RF01.2; antes entraba como administrador). Inactivo → no entra (RF01.3). `Sesion.cerrar()` (RF02). |
| `7b63a44` refactor(prototipo) | Ventas y Domicilios delegan en `RepositorioUsuarios` (pedido #3 → Kevin Mora; clave Domicilios `v2 → v3`). Las pantallas de Domicilios y el menú de perfil usan `Sesion.actual()`. Corrige un error que borraba el inventario: `guardar()` escribía `null` después de `recargar()`. |
| `f2d58ae` feat(usuarios) | «Regístrate» pide el rol (Cajero o Domiciliario, varios); la cuenta nace inactiva con ese rol (`id_rol` es NOT NULL). Un solo administrador: no se registra ni se edita otro, y no se puede inactivar. |

**Por qué así:**
- Las pantallas no cambiaron: `RepositorioVentas.obtenerUsuario()` y `RepositorioDomicilios.obtenerDomiciliarios()`
  devuelven la misma forma de antes (`{ idUsuario, nombre }` y `{ id, nombre, activo }`), pero leída de Usuarios.
- Las reglas (duplicados, un administrador) viven en `ServicioUsuarios`: se cumplen venga de la pantalla que venga.
- Los campos usan los nombres de la BD (`idUsuario`, `idRol`): en la Fase 2 el `db.json` sale casi directo.

**Probado en el navegador (sin errores en consola):** login con alias, correo en mayúsculas, inactivo y
desconocido; Kevin ve solo su pedido y el historial guarda su nombre; inactivar a Yeison en Usuarios lo
muestra «Inactivo» al asignar en Domicilios; filtro de cajeros en Ventas; registro con rol y duplicados;
un solo administrador; cuenta registrada → activada → entra a su panel.

## Cómo probar en local
Abrir la carpeta `06_prototipo_navegable` con Live Server de VS Code y entrar por `index.html`.
Para volver a los datos de ejemplo, en la consola del navegador: `localStorage.clear()` y recargar.
Si un cambio no se ve, recargar sin caché (Ctrl + Shift + R).

## Cómo continuar en local

Estado: refactor de arquitectura completo (7 de 7). Fase 1: paso 1 (una sola fuente de usuarios) completo.
Sigue el paso 2 de la Fase 1 (catálogos únicos: métodos de pago y clientes).

### Forma de trabajo acordada
- Un punto a la vez: se hace, se muestra el resultado, se revisa y se da el aval antes del siguiente.
- Cada punto va en su propio commit; los cambios llegan a `develop` mediante un pull request.
- Este archivo se actualiza en el mismo commit de cada punto.

### Para retomar con Claude Code en local
Abrir Claude Code en la carpeta del repo, en una rama nueva creada desde `develop`, y decir:
> Lee `_docs_/trim03/06_prototipo_navegable/REFACTOR.md` y continúa con el siguiente paso de la Fase 1, de la misma forma (uno por uno, con mi aval).

### Verificar que nada se rompió
- Servidor local: `python -m http.server` en la carpeta del prototipo (o Live Server) y abrir `index.html`.
- Revisar la consola del navegador (F12) en cada pantalla tocada: no debe haber errores.
- `localStorage.clear()` en la consola para volver a los datos de ejemplo.
