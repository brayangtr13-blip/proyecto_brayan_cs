# Control Store · Frontend Web

Frontend del sistema **Control Store** (Autoservicio Ayuelal), construido paso a paso con la guía
del instructor ([estructura_base](https://github.com/ProfeAlbeiro/estructura_base), *Curso React*).

| Tecnología | Versión | Para qué |
|---|---|---|
| React | 19.2.4 | Componentes de la interfaz |
| Vite | 8.0.4 | Servidor de desarrollo y compilación |
| React Router DOM | 7.14.0 | Rutas: `/login`, `/register`, `/dashboard/...` |
| Tailwind CSS | 4.3.5 | Estilos con los colores y fuentes de Control Store |
| ESLint | 9.39.4 | Revisión del código |
| Backend: Node.js + Express 4 + MySQL 8.4 | — | API real con JWT en cookie HttpOnly (carpeta `backend/nodejs_express`) |
| JSON Server + json-server-auth | 0.17.4 + 2.1.0 | API falsa del Capítulo III (carpeta `backend/jsonserver`) |

## Cómo arrancarlo (Capítulo IV: API real)

Se necesitan **dos terminales**: primero el backend y después el frontend.

```bash
# Terminal 1 — Backend en http://localhost:3000/api
cd backend/nodejs_express
npm install
# La primera vez: copiar .env.example como .env y escribir la contraseña de MySQL en DB_PASSWORD
npm run dev
```

```bash
# Terminal 2 — Frontend en http://localhost:5173
cd fronted_web
npm install
npm run dev
```

> Para volver a la API falsa del Capítulo III: encender `backend/jsonserver` (`npm start`) y poner
> `BASE_URL: 'http://localhost:3001'` en `src/config/api.js`. Así se demuestra que cambiar de servidor
> solo toca la configuración y los modelos, no las vistas.

## Cuentas de prueba

Todas usan la contraseña **`ayuelal2026`** (en MySQL está guardada con bcrypt, columna `contrasena_hash`).

| Correo | Rol | Qué puede hacer |
|---|---|---|
| `admin@controlstore.com` | administrador | Indicadores y CRUD de usuarios |
| `sandra.ortiz@controlstore.com` | cajero | Solo el inicio |
| `luis.p@controlstore.com` | domiciliario | Solo el inicio |
| `diego.rojas@controlstore.com` | cajero (inactivo) | No puede entrar |

## Arquitectura MVC en React

Regla de la guía **C‑S‑M‑C‑H‑V**: cada capa solo habla con la de abajo.

```
VISTA (views/)          dibuja y recibe clics — no sabe de fetch ni de cookies
   ↓ usa
HOOK (hooks/)           estado de React — useAuth lee la sesión que comparte AuthProvider
   ↓ llama
CONTROLADOR (controllers/)  validaciones del formulario y cálculos (indicadores)
   ↓ usa
MODELO (models/)        habla con la API (/auth, /users)
   ↓ usa
SERVICIOS (services/)   httpService: fetch con credentials: 'include'
   ↓
CONFIG (config/)        URL de la API, rutas y roles
```

| Funcionalidad | Modelo | Controlador | Hook | Vistas |
|---|---|---|---|---|
| Sesión | `AuthModel` | `AuthController` | `AuthProvider` + `useAuth` | `LoginView`, `RegisterView`, `Navbar` |
| Usuarios | `UserModel` | `UserController` | `useUsers` | `UsersView`, `UserForm`, `UserDetails` |
| Inicio | `DashboardModel` | `DashboardController` | `useDashboard` | `DashboardView`, `DashboardHeader`, `DashboardStats` |

**Patrones usados:** MVC, Provider (`AuthProvider` comparte la sesión con Context), Singleton (cada
servicio exporta una sola instancia), Guard (`ProtectedRoute`, `PublicRoute`, `SoloAdmin`) y
Container/Presentational (`UserForm` → `FormularioUsuario`, `DashboardStats`).

## Flujo de autenticación (Capítulo IV: JWT en cookie HttpOnly)

1. `LoginView` → `useAuth().login()` → `AuthController` valida → `AuthModel` hace `POST /auth/login`.
2. Express compara la contraseña con **bcrypt**, firma el **JWT** y lo envía en una **cookie HttpOnly**
   (`cs_token`, `SameSite=Lax`, 8 horas). El JavaScript del navegador **no puede leerla**.
3. Cada petición lleva la cookie sola gracias a `credentials: 'include'` en `httpService`.
4. Al abrir o recargar la app, `AuthProvider` pregunta **`GET /auth/me`**: si la cookie es válida,
   el servidor responde quién es. Mientras tanto las rutas protegidas muestran "Cargando…".
5. Cerrar sesión llama a **`POST /auth/logout`**, que borra la cookie en el servidor.

### Qué cambió del Capítulo III al IV

| | Capítulo III (JSON Server) | Capítulo IV (Express + MySQL) |
|---|---|---|
| Dónde vive el token | `localStorage` (JavaScript lo puede leer) | Cookie HttpOnly (JavaScript no la ve) |
| ¿Quién soy? | Se decodificaba el JWT en el navegador | `GET /auth/me` al servidor |
| Reglas por rol | En los controladores del navegador | `authorizeRoles` en Express (403) |
| Documento único y administrador único | Se revisaban en el navegador | UNIQUE y triggers de MySQL (409) |
| Bloqueo tras 3 intentos | No existía | Trigger `trg_usuarios_bloqueo_bu` (15 minutos) |
| Registro público | Cuenta activa | Cuenta **inactiva** hasta que el administrador la active |

## Pruebas del flujo (Capítulo IV.10)

Hechas en el navegador contra Express y MySQL. Resultado: **21 de 21 correctas**.

| # | Prueba | Resultado esperado |
|---|---|---|
| 1 | Abrir `/dashboard` sin sesión | Redirige a `/login` |
| 2 | Contraseña equivocada | "No coinciden. Te quedan 2 intento(s)." |
| 3 | Login con `diego.rojas` (inactivo) | "Tu cuenta está inactiva…" |
| 4 | Login como administrador | Entra a `/dashboard` con indicadores |
| 5 | Recargar la página (F5) | La sesión se mantiene (`/auth/me`) |
| 6 | Revisar la cookie | `HttpOnly`, `SameSite=Lax`; `document.cookie` y `localStorage` vacíos |
| 7 | Ir a `/login` con sesión | Vuelve a `/dashboard` |
| 8 | Crear usuario con documento repetido | "Ya hay una cuenta con ese documento" (UNIQUE) |
| 9 | Crear un segundo administrador | "Ya existe un administrador…" (trigger) |
| 10–11 | Crear y editar un usuario | La tabla muestra el cambio |
| 12 | Inactivar la propia cuenta | "No puedes inactivar tu propia cuenta" |
| 13 | Eliminar un usuario con ventas | "…inactívalo en lugar de eliminarlo" (llave foránea) |
| 14 | Eliminar un usuario sin ventas | Desaparece de la tabla |
| 15–16 | Cerrar sesión | El servidor borra la cookie; `/dashboard` vuelve al login |
| 17 | Registro público | "Cuenta creada. Un administrador debe activarla." |
| 18 | Entrar con la cuenta recién creada | "Tu cuenta está inactiva…" |
| 19–20 | Login como cajera | El menú solo muestra "Inicio"; `/dashboard/usuarios` vuelve al inicio |
| 21 | 3 contraseñas equivocadas seguidas | "Cuenta bloqueada por 15 minutos…" (trigger) |
