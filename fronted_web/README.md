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

## Limitaciones de la API falsa (se resuelven en el Capítulo IV con Express)

- json-server-auth solo exige **sesión**, no **rol**: las reglas por rol viven en los controladores
  del navegador. En Express pasarán al servidor.
- `GET /users` envía el hash de la contraseña; `UserModel` lo quita antes de dárselo a las vistas.
- El token vive en `localStorage`; en el Capítulo IV pasa a una cookie `HttpOnly`.
- La cuenta inactiva se revisa en el navegador después del login.
