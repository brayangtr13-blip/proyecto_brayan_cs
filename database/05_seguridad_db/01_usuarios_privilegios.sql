-- |||=============================================================================================|||
-- |||                       CONTROL STORE · AUTOSERVICIO AYUELAL · SENA ADSO                       |||
-- |||          05.01 · SEGURIDAD: USUARIOS, ROLES, PRIVILEGIOS Y CIFRADO · MySQL 8.4               |||
-- |||=============================================================================================|||
-- |||                                                                                             |||
-- |||  Hay DOS niveles de usuarios, y no hay que confundirlos:                                    |||
-- |||   · Usuarios de la APLICACIÓN: filas de la tabla usuarios (admin, cajeros, domiciliarios).  |||
-- |||   · Usuarios de MySQL: cuentas que se conectan al servidor. Aquí se crean estos.           |||
-- |||  Principio de MÍNIMO PRIVILEGIO: cada cuenta solo puede hacer lo que necesita.             |||
-- |||                                                                                             |||
-- |||  CONTENIDO                                                                                  |||
-- |||    01. Ver usuarios de MySQL ......... SELECT user, host FROM mysql.user ;                  |||
-- |||    02. Crear roles ................... CREATE ROLE ____ ;                                    |||
-- |||    03. Dar privilegios a los roles ... GRANT ____ ON ____ TO ____ ;                          |||
-- |||    04. Crear usuarios con política ... CREATE USER ... FAILED_LOGIN_ATTEMPTS ...             |||
-- |||    05. Asignar roles a usuarios ...... GRANT rol TO usuario ; SET DEFAULT ROLE ...           |||
-- |||    06. Ver privilegios ............... SHOW GRANTS FOR ____ ;                                |||
-- |||    07. Quitar privilegios ............ REVOKE ____ ON ____ FROM ____ ;                       |||
-- |||    08. Cambiar contraseña y bloquear . ALTER USER ... ; ACCOUNT LOCK / UNLOCK                |||
-- |||    09. Cifrado de datos .............. SHA2 (hash) · AES_ENCRYPT / AES_DECRYPT              |||
-- |||    10. Copias de seguridad ........... mysqldump (se ejecuta en CMD, no en mysql>)           |||
-- |||    11. Eliminar usuarios y roles ..... DROP USER ; DROP ROLE                                 |||
-- |||                                                                                             |||
-- |||  Las contraseñas de este archivo son SOLO de práctica. En un servidor real se cambian.     |||
-- |||  Se ejecuta conectado como root.                                                           |||
-- |||                                                                                             |||
-- |||  EN CONSOLA: mysql> SOURCE C:/Users/bryan/proyecto_grado_alexander/database/05_seguridad_db/01_usuarios_privilegios.sql
-- |||=============================================================================================|||

USE controlstore_sena;
SET NAMES utf8mb4;   -- el archivo está en UTF-8: así las tildes y la ñ llegan bien también desde CMD

-- Para poder correr el script varias veces: se borra lo que haya quedado de una vez anterior
DROP USER IF EXISTS 'cs_admin'@'localhost', 'cs_cajero'@'localhost', 'cs_reportes'@'localhost';
DROP ROLE IF EXISTS 'rol_cs_admin', 'rol_cs_cajero', 'rol_cs_reportes';


-- ---------------------------------------------------------------------------------------------------
-- 01. VER USUARIOS DE MySQL ....................................... SELECT user, host FROM mysql.user ;
-- ---------------------------------------------------------------------------------------------------
SELECT user, host, account_locked FROM mysql.user ORDER BY user;
SELECT CURRENT_USER() AS conectado_como;


-- ---------------------------------------------------------------------------------------------------
-- 02. CREAR ROLES .................................................................. CREATE ROLE ;
--     Un rol es un paquete de permisos. Se le dan permisos al rol y el rol a las personas.
-- ---------------------------------------------------------------------------------------------------
CREATE ROLE 'rol_cs_admin', 'rol_cs_cajero', 'rol_cs_reportes';


-- ---------------------------------------------------------------------------------------------------
-- 03. DAR PRIVILEGIOS A LOS ROLES ............................... GRANT ____ ON base.tabla TO ____ ;
-- ---------------------------------------------------------------------------------------------------
-- Administrador del sistema: todo dentro de controlstore_sena (pero no sobre otras bases)
GRANT ALL PRIVILEGES ON controlstore_sena.* TO 'rol_cs_admin';

-- Cajero: consulta productos y registra ventas; NO borra ventas ni toca usuarios (RF09 a RF16)
GRANT SELECT                 ON controlstore_sena.productos      TO 'rol_cs_cajero';
GRANT SELECT                 ON controlstore_sena.categorias     TO 'rol_cs_cajero';
GRANT SELECT                 ON controlstore_sena.metodos_pago   TO 'rol_cs_cajero';
GRANT SELECT, INSERT         ON controlstore_sena.clientes       TO 'rol_cs_cajero';
GRANT SELECT, INSERT, UPDATE ON controlstore_sena.ventas         TO 'rol_cs_cajero';
GRANT SELECT, INSERT         ON controlstore_sena.detalle_venta  TO 'rol_cs_cajero';
GRANT SELECT, INSERT, UPDATE ON controlstore_sena.arqueo_caja    TO 'rol_cs_cajero';
GRANT EXECUTE ON PROCEDURE controlstore_sena.pa_agregar_producto_venta TO 'rol_cs_cajero';

-- Reportes (solo lectura): ve las vistas, nunca las tablas con datos sensibles
GRANT SELECT ON controlstore_sena.vw_ventas_diarias         TO 'rol_cs_reportes';
GRANT SELECT ON controlstore_sena.vw_productos_mas_vendidos TO 'rol_cs_reportes';
GRANT SELECT ON controlstore_sena.vw_inventario_stock_bajo  TO 'rol_cs_reportes';
GRANT SELECT ON controlstore_sena.vw_arqueos_caja           TO 'rol_cs_reportes';
GRANT SELECT ON controlstore_sena.vw_domicilios_detalle     TO 'rol_cs_reportes';
GRANT SELECT ON controlstore_sena.vw_usuarios_roles         TO 'rol_cs_reportes';   -- sin contraseñas


-- ---------------------------------------------------------------------------------------------------
-- 04. CREAR USUARIOS CON POLÍTICA DE CONTRASEÑA
--     FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 -> 3 intentos fallidos = bloqueado 1 día
--     PASSWORD EXPIRE INTERVAL 90 DAY              -> obliga a cambiarla cada 90 días
-- ---------------------------------------------------------------------------------------------------
CREATE USER 'cs_admin'@'localhost'
  IDENTIFIED BY 'Admin*Practica2026'
  FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1
  PASSWORD EXPIRE INTERVAL 90 DAY;

CREATE USER 'cs_cajero'@'localhost'
  IDENTIFIED BY 'Cajero*Practica2026'
  FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1;

CREATE USER 'cs_reportes'@'localhost'
  IDENTIFIED BY 'Reportes*Practica2026'
  FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1;


-- ---------------------------------------------------------------------------------------------------
-- 05. ASIGNAR ROLES A USUARIOS ............. GRANT rol TO usuario ; SET DEFAULT ROLE rol TO usuario ;
--     SET DEFAULT ROLE hace que el rol quede activo apenas el usuario inicia sesión.
-- ---------------------------------------------------------------------------------------------------
GRANT 'rol_cs_admin'    TO 'cs_admin'@'localhost';
GRANT 'rol_cs_cajero'   TO 'cs_cajero'@'localhost';
GRANT 'rol_cs_reportes' TO 'cs_reportes'@'localhost';

SET DEFAULT ROLE 'rol_cs_admin'    TO 'cs_admin'@'localhost';
SET DEFAULT ROLE 'rol_cs_cajero'   TO 'cs_cajero'@'localhost';
SET DEFAULT ROLE 'rol_cs_reportes' TO 'cs_reportes'@'localhost';


-- ---------------------------------------------------------------------------------------------------
-- 06. VER PRIVILEGIOS ................................................. SHOW GRANTS FOR ____ ;
-- ---------------------------------------------------------------------------------------------------
SHOW GRANTS FOR 'cs_cajero'@'localhost';
SHOW GRANTS FOR 'cs_cajero'@'localhost' USING 'rol_cs_cajero';   -- con el detalle del rol
SHOW GRANTS FOR 'rol_cs_reportes';


-- ---------------------------------------------------------------------------------------------------
-- 07. QUITAR PRIVILEGIOS .................................. REVOKE ____ ON ____ FROM ____ ;
--     Ejemplo: el cajero ya no puede modificar ventas (solo crearlas)
-- ---------------------------------------------------------------------------------------------------
REVOKE UPDATE ON controlstore_sena.ventas FROM 'rol_cs_cajero';
SHOW GRANTS FOR 'rol_cs_cajero';
GRANT  UPDATE ON controlstore_sena.ventas TO 'rol_cs_cajero';     -- se devuelve (lo necesita para cobrar)


-- ---------------------------------------------------------------------------------------------------
-- 08. CAMBIAR CONTRASEÑA Y BLOQUEAR / DESBLOQUEAR CUENTA
-- ---------------------------------------------------------------------------------------------------
ALTER USER 'cs_reportes'@'localhost' IDENTIFIED BY 'Reportes*Nueva2026';
ALTER USER 'cs_reportes'@'localhost' ACCOUNT LOCK;               -- nadie puede entrar con ella
SELECT user, account_locked FROM mysql.user WHERE user LIKE 'cs\_%';
ALTER USER 'cs_reportes'@'localhost' ACCOUNT UNLOCK;


-- ---------------------------------------------------------------------------------------------------
-- 09. CIFRADO DE DATOS
--     HASH (SHA2): de una sola vía, no se puede "descifrar". Se usa para comparar contraseñas.
--     CIFRADO (AES): de dos vías, con una llave se puede volver al texto original.
--     NOTA: la aplicación guarda contrasena_hash con bcrypt (más seguro que SHA2 porque es lento
--     a propósito y le agrega una "sal" distinta a cada contraseña). SHA2 se muestra para entender.
-- ---------------------------------------------------------------------------------------------------
-- 09.01. Hash SHA-256: misma entrada = mismo resultado de 64 caracteres
SELECT SHA2('Cajero123', 256)            AS hash_1,
       SHA2('Cajero123', 256)            AS hash_2_igual,
       SHA2('cajero123', 256)            AS hash_cambia_todo_con_una_letra;

-- 09.02. Verificar una contraseña sin conocerla: se compara el hash de lo que escribió
SET @guardado = SHA2('Cajero123', 256);
SELECT SHA2('Cajero123', 256) = @guardado AS clave_correcta,
       SHA2('Cajero124', 256) = @guardado AS clave_incorrecta;

-- 09.03. Hash con sal: a cada usuario se le agrega un texto distinto antes del hash
SELECT id_usuario, email, SHA2(CONCAT(documento, 'Cajero123'), 256) AS hash_con_sal
  FROM usuarios LIMIT 3;

-- 09.04. AES: cifrar un dato que sí se necesita leer después (por ejemplo un teléfono)
SET @llave = SHA2('llave-secreta-de-practica', 256);
SET @cifrado = AES_ENCRYPT('3001234567', @llave);
SELECT HEX(@cifrado)                                     AS telefono_cifrado,
       CAST(AES_DECRYPT(@cifrado, @llave) AS CHAR)       AS telefono_descifrado,
       AES_DECRYPT(@cifrado, SHA2('otra llave', 256))    AS con_llave_equivocada;   -- NULL


-- ---------------------------------------------------------------------------------------------------
-- 10. COPIAS DE SEGURIDAD · estas líneas se escriben en CMD (no en mysql>), por eso van comentadas
-- ---------------------------------------------------------------------------------------------------
-- cd "C:\Program Files\MySQL\MySQL Server 8.4\bin"
--
-- Copia completa (estructura + datos + triggers + procedimientos):
-- mysqldump -u root -p --routines --triggers --single-transaction controlstore_sena > C:\respaldos\controlstore_sena.sql
--
-- Solo la estructura (sin datos):
-- mysqldump -u root -p --no-data --routines --triggers controlstore_sena > C:\respaldos\controlstore_estructura.sql
--
-- Restaurar una copia (primero se crea la base vacía):
-- mysql -u root -p -e "CREATE DATABASE controlstore_sena_restaurada"
-- mysql -u root -p controlstore_sena_restaurada < C:\respaldos\controlstore_sena.sql
--
-- Probar un usuario nuevo desde CMD:
-- mysql -u cs_cajero -p controlstore_sena
--   mysql> SELECT * FROM productos;          -> funciona
--   mysql> DELETE FROM ventas;                -> ERROR 1142: DELETE command denied


-- ---------------------------------------------------------------------------------------------------
-- 11. ELIMINAR USUARIOS Y ROLES ........................ DROP USER IF EXISTS ; DROP ROLE IF EXISTS ;
--     Quitar los -- solo cuando se quiera borrar todo lo creado en este archivo.
-- ---------------------------------------------------------------------------------------------------
-- DROP USER IF EXISTS 'cs_admin'@'localhost', 'cs_cajero'@'localhost', 'cs_reportes'@'localhost';
-- DROP ROLE IF EXISTS 'rol_cs_admin', 'rol_cs_cajero', 'rol_cs_reportes';
