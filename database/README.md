# Base de datos · Control Store

Scripts de MySQL 8.4 para la base `controlstore_sena`. Tiene 18 tablas y cumple las tres formas normales (3FN).
Las contraseñas de los usuarios se guardan con **hash bcrypt** y la base no acepta una contraseña en texto plano.

## Equivalencia con el repositorio del instructor

Los nombres de las carpetas son distintos, pero el contenido corresponde uno a uno:

| Instructor (`01_sql/`) | Este repositorio (`database/`) |
|---|---|
| `05_ddl/01_db` (estructura, script de Workbench, diagrama) | `01_base_datos` |
| `05_ddl/02_ddl` (práctica DDL) | `02_sentencias_ddl` |
| `06_dml` (datos, una tabla, multitabla) | `03_sentencias_dml` |
| `07_avan` (vistas, procedimientos, triggers) | `04_programacion_db` |
| `08_seg` (seguridad) | `05_seguridad_db` |
| — | `06_preguntas_sustentacion` (repaso) |
| — | `07_evidencias` (capturas de la ejecución) |

## Carpetas

| Carpeta | Archivo | Qué hace |
|---|---|---|
| `01_base_datos` | `01_db_estructura.sql` | **Borra y crea** la base con las 18 tablas, 24 llaves foráneas y 17 restricciones CHECK. Es el script oficial para crear la base |
| `01_base_datos` | `01_db_workbench.sql` | Las 18 tablas generadas por MySQL Workbench (*Forward Engineer*). Workbench 8.0 no exporta los CHECK, por eso la base se crea con `01_db_estructura.sql` |
| `01_base_datos` | `01_db_proyecto.png` | Diagrama de la base, obtenido con ingeniería inversa (*Reverse Engineer*) |
| `02_sentencias_ddl` | `01_db_ddl.sql` | Práctica de los 27 comandos DDL en una base aparte (`controlstore_practica`) |
| `03_sentencias_dml` | `01_db_dml_datos.sql` | Datos de prueba coherentes: 10 o más filas por tabla, un kárdex que cuadra con el stock y 10 usuarios con hash bcrypt |
| `03_sentencias_dml` | `02_db_dml_una_tabla.sql` | INSERT, UPDATE, DELETE y todos los tipos de SELECT sobre una tabla |
| `03_sentencias_dml` | `03_db_dml_multitabla.sql` | JOIN, UNION, subconsultas y borrado en tablas relacionadas |
| `04_programacion_db` | `01_triggers.sql` | 11 triggers: total de la venta, precio mayor o igual al costo, tarifa del barrio, bloqueo tras 3 intentos, auditoría de precios y reglas del administrador |
| `04_programacion_db` | `02_views.sql` | 6 vistas para los reportes RF26 a RF30, más usuarios sin la contraseña |
| `04_programacion_db` | `03_procedures.sql` | 6 procedimientos: agregar producto a una venta, anular venta, cerrar caja, revisar permisos, etc. |
| `05_seguridad_db` | `01_usuarios_privilegios.sql` | Usuarios y roles de MySQL, GRANT y REVOKE, bloqueo de cuentas, cifrado (SHA2 y AES) y copias de seguridad |
| `06_preguntas_sustentacion` | `01_preguntas_sustentacion.sql` | 95 preguntas posibles del instructor, cada una con su respuesta corta y el SQL que la demuestra |
| `07_evidencias` | `*.png` | Capturas de la ejecución en Workbench y en consola |

## Seguridad de las contraseñas

- La columna `usuarios.contrasena_hash` guarda un **hash bcrypt** (`$2b$10$...`, 60 caracteres). Lo genera el backend con `bcryptjs` (costo 10). La base nunca guarda la contraseña escrita.
- La restricción `chk_usuario_hash_bcrypt` **rechaza** cualquier valor que no sea un hash bcrypt (error 3819).
- Los 10 usuarios de prueba tienen la contraseña `ayuelal2026`. Los 10 hashes son distintos porque bcrypt agrega una sal aleatoria a cada uno.
- Otras medidas: roles con mínimo privilegio, bloqueo de la cuenta tras 3 intentos fallidos, vista `vw_usuarios_roles` sin la columna de la contraseña, bitácora de auditoría y copias con `mysqldump`.

## Orden para ejecutar

1. `01_base_datos/01_db_estructura.sql`
2. `03_sentencias_dml/01_db_dml_datos.sql`
3. `04_programacion_db/01_triggers.sql`
4. `04_programacion_db/02_views.sql`
5. `04_programacion_db/03_procedures.sql`
6. Los de práctica, en cualquier orden: `02_sentencias_ddl/01_db_ddl.sql`, `03_sentencias_dml/02_...` y `03_...`, `05_seguridad_db/01_...`
7. Para repasar la sustentación: `06_preguntas_sustentacion/01_preguntas_sustentacion.sql`. Las líneas que empiezan con `-- ERR>` dan un error a propósito: quita el `-- ERR>` y ejecuta solo esa línea para verlo.

Los scripts de práctica dejan los datos igual que antes. Para eso usan transacciones con `ROLLBACK`, filas temporales que se borran al final o una base aparte.

Todos los scripts empiezan con `SET NAMES utf8mb4`, así las tildes y la ñ se guardan bien tanto desde Workbench como desde CMD.

> ⚠️ El paso 1 **borra** `controlstore_sena`. Antes de correrlo sobre la base real, saca una copia con `mysqldump` (está en `05_seguridad_db`, sección 10) o en Workbench con *Server → Data Export*.

## Ejecutar desde la consola (CMD)

Con la carpeta `bin` de MySQL en el `Path` de Windows (`C:\Program Files\MySQL\MySQL Server 8.4\bin`):

```bat
cd proyecto_grado_alexander\database
mysql -u root -p
```

Ya dentro de `mysql>`, las rutas son relativas a la carpeta `database`:

```sql
SOURCE 01_base_datos/01_db_estructura.sql
SOURCE 03_sentencias_dml/01_db_dml_datos.sql
SOURCE 04_programacion_db/01_triggers.sql
SOURCE 04_programacion_db/02_views.sql
SOURCE 04_programacion_db/03_procedures.sql
```

- En `SOURCE` la ruta va con `/`, no con `\`, y sin comillas.
- La ventana de CMD dibuja mal las tildes (`esper├│`), aunque en la base queden bien guardadas. Para revisarlas, usa Workbench.

## Ejecutar desde MySQL Workbench

1. Abre la conexión a la base.
2. Ve a *File → Open SQL Script* y elige el archivo.
3. Ejecuta todo el script con el rayo ⚡ (`Ctrl + Shift + Enter`), o solo la sentencia donde está el cursor (`Ctrl + Enter`).

Para practicar, es mejor ir sentencia por sentencia y mirar el resultado de cada una.
