# Refactor del prototipo navegable

Bitácora de la revisión de arquitectura hecha con Claude Code (rama `refactor/arquitectura-prototipo`).
Se actualiza en cada punto, en el mismo commit del cambio.

## Plan de trabajo

1. Arquitectura (carpetas, cómo se escribe el código, cómo se comenta) ← en curso
2. Patrones de diseño en HTML, CSS y JS (referencia: https://refactoring.guru/es/design-patterns)
3. Lógica de programación
4. Mejoras visuales y estéticas

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
| 4 | Carpeta `_mains_/` con nombre raro | Pendiente |
| 5 | `delete.txt.txt` en la raíz | Pendiente |
| 6 | Orden manual de `<script>` sin control | Pendiente |
| 7 | Variables globales (`const usuario`, `const el`) | Pendiente |

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

## Cómo probar en local
```bash
git fetch origin && git checkout refactor/arquitectura-prototipo && git pull
```
Abrir `index.html` con un servidor local (Live Server de VS Code). Para volver a los datos de ejemplo,
en la consola del navegador: `localStorage.clear()` y recargar.
