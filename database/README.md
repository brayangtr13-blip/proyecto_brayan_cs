# Base de datos · Control Store

Scripts de MySQL 8.4 para la base `controlstore_sena`, que tiene 18 tablas y cumple las tres formas normales (3FN).
Siguen la estructura del repositorio del instructor (05_ddl, 06_dml, 07_avan, 08_seg).

## Carpetas

| Carpeta | Archivo | Qué hace |
|---|---|---|
| `01_base_datos` | `01_db_estructura.sql` | **Borra y crea** la base con las 18 tablas, 24 llaves foráneas y los CHECK |
| `03_sentencias_dml` | `01_db_dml_datos.sql` | Carga datos de prueba coherentes (10 o más filas por tabla y un kárdex que cuadra con el stock) |
| `04_programacion_db` | `01_triggers.sql` | 8 triggers: total de la venta, precio mayor o igual al costo, tarifa del barrio, bloqueo tras 3 intentos y auditoría de precios |
| `04_programacion_db` | `02_views.sql` | 6 vistas para los reportes RF26 a RF30, más usuarios sin la contraseña |
| `04_programacion_db` | `03_procedures.sql` | 6 procedimientos: agregar producto a una venta, anular venta, cerrar caja, revisar permisos, etc. |
| `02_sentencias_ddl` | `01_db_ddl.sql` | Práctica de los 27 comandos DDL en una base aparte (`controlstore_practica`) |
| `03_sentencias_dml` | `02_db_dml_una_tabla.sql` | INSERT, UPDATE, DELETE y todos los tipos de SELECT sobre una tabla |
| `03_sentencias_dml` | `03_db_dml_multitabla.sql` | JOIN, UNION, subconsultas y borrado en tablas relacionadas |
| `05_seguridad_db` | `01_usuarios_privilegios.sql` | Usuarios y roles de MySQL, GRANT y REVOKE, bloqueo de cuentas, cifrado (SHA2 y AES) y copias de seguridad |
| `06_preguntas_sustentacion` | `01_preguntas_sustentacion.sql` | 95 preguntas posibles del instructor, cada una con su respuesta corta y el SQL que la demuestra |

## Orden para ejecutar

1. `01_base_datos/01_db_estructura.sql`
2. `03_sentencias_dml/01_db_dml_datos.sql`
3. `04_programacion_db/01_triggers.sql`
4. `04_programacion_db/02_views.sql`
5. `04_programacion_db/03_procedures.sql`
6. Los de práctica, en cualquier orden: `02_sentencias_ddl/01_db_ddl.sql`, `03_sentencias_dml/02_...` y `03_...`, `05_seguridad_db/01_...`
7. Para repasar la sustentación: `06_preguntas_sustentacion/01_preguntas_sustentacion.sql`. Las líneas que empiezan con `-- ERR>` dan un error a propósito: quita el `-- ERR>` y ejecuta solo esa línea para verlo.

Los scripts de práctica dejan los datos igual que antes. Para eso usan transacciones con `ROLLBACK`, filas temporales que se borran al final o una base aparte.

> ⚠️ El paso 1 **borra** `controlstore_sena`. Antes de correrlo sobre la base real, saca una copia con `mysqldump` (está en `05_seguridad_db`, sección 10).

## Ejecutar desde la consola (CMD)

```bat
cd "C:\Program Files\MySQL\MySQL Server 8.4\bin"
mysql -u root -p --default-character-set=utf8mb4
```

Ya dentro de `mysql>`:

```sql
SOURCE C:/Users/bryan/proyecto_grado_alexander/database/01_base_datos/01_db_estructura.sql
SOURCE C:/Users/bryan/proyecto_grado_alexander/database/03_sentencias_dml/01_db_dml_datos.sql
SOURCE C:/Users/bryan/proyecto_grado_alexander/database/04_programacion_db/01_triggers.sql
SOURCE C:/Users/bryan/proyecto_grado_alexander/database/04_programacion_db/02_views.sql
SOURCE C:/Users/bryan/proyecto_grado_alexander/database/04_programacion_db/03_procedures.sql
```

En `SOURCE` la ruta va con `/`, no con `\`.

## Ejecutar desde MySQL Workbench

1. Abre la conexión a la base.
2. Ve a *File → Open SQL Script* y elige el archivo.
3. Ejecuta todo el script con el rayo ⚡, o solo la línea donde está el cursor con `Ctrl + Enter`.

Para practicar, es mejor ir sentencia por sentencia y mirar el resultado de cada una.
