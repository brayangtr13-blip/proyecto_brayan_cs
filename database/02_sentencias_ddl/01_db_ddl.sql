-- |||=============================================================================================|||
-- |||                       CONTROL STORE · AUTOSERVICIO AYUELAL · SENA ADSO                       |||
-- |||               02.01 · SENTENCIAS DDL (DATA DEFINITION LANGUAGE) · MySQL 8.4                  |||
-- |||=============================================================================================|||
-- |||                                                                                             |||
-- |||  DDL = las sentencias que crean, cambian o borran la ESTRUCTURA (bases, tablas, columnas,    |||
-- |||  índices, llaves). No tocan los datos uno por uno: eso es DML.                              |||
-- |||                                                                                             |||
-- |||  IMPORTANTE: se practica en una base aparte, controlstore_practica, con copias de las        |||
-- |||  tablas reales. Así se puede borrar y cambiar todo sin dañar controlstore_sena.              |||
-- |||                                                                                             |||
-- |||  CONTENIDO                                                                                  |||
-- |||    01. Mostrar bases de datos ........ SHOW DATABASES ;                                      |||
-- |||    02. Crear base de datos ........... CREATE DATABASE ____ ;                                |||
-- |||    03. Usar base de datos ............ USE ____ ;                                            |||
-- |||    04. Copiar tablas para practicar .. CREATE TABLE ____ LIKE ____ ; INSERT ... SELECT       |||
-- |||    05. Mostrar tablas ................ SHOW TABLES ;                                         |||
-- |||    06. Mostrar columnas .............. SHOW COLUMNS FROM ____ ; DESCRIBE ____ ;              |||
-- |||    07. Agregar columna ............... ALTER TABLE ____ ADD ____ ;                           |||
-- |||    08. Renombrar / cambiar columna ... ALTER TABLE ____ CHANGE ____ ____ ;                   |||
-- |||                                        ALTER TABLE ____ MODIFY ____ ;                         |||
-- |||    09. Eliminar columna .............. ALTER TABLE ____ DROP COLUMN ____ ;                   |||
-- |||    10. Agregar valor por defecto ..... ALTER TABLE ____ ALTER ____ SET DEFAULT ____ ;        |||
-- |||    11. Eliminar valor por defecto .... ALTER TABLE ____ ALTER ____ DROP DEFAULT ;            |||
-- |||    12. Mostrar creación de tabla ..... SHOW CREATE TABLE ____ ;                              |||
-- |||    13. Crear restricción (CHECK) ..... ALTER TABLE ____ ADD CONSTRAINT ____ CHECK (____) ;   |||
-- |||    14. Eliminar restricción .......... ALTER TABLE ____ DROP CONSTRAINT ____ ;               |||
-- |||    15. Crear índice de un campo ...... CREATE INDEX ____ ON ____ (____) ;                    |||
-- |||    16. Crear índice multicampo ....... CREATE INDEX ____ ON ____ (____, ____) ;              |||
-- |||    17. Crear índice único ............ CREATE UNIQUE INDEX ____ ON ____ (____) ;             |||
-- |||    18. Mostrar / eliminar índice ..... SHOW INDEX FROM ____ ; DROP INDEX ____ ON ____ ;      |||
-- |||    19. Eliminar llave primaria ....... ALTER TABLE ____ DROP PRIMARY KEY ;                   |||
-- |||    20. Crear llave primaria .......... ALTER TABLE ____ ADD PRIMARY KEY (____) ;             |||
-- |||    21. Crear llave foránea ........... ALTER TABLE ____ ADD CONSTRAINT ____ FOREIGN KEY ...  |||
-- |||    22. Eliminar llave foránea ........ ALTER TABLE ____ DROP FOREIGN KEY ____ ;              |||
-- |||    23. Crear tabla ................... CREATE TABLE ____ ( ... ) ;                           |||
-- |||    24. Renombrar tabla ............... RENAME TABLE ____ TO ____ ;                           |||
-- |||    25. Limpiar registros ............. TRUNCATE TABLE ____ ;                                 |||
-- |||    26. Eliminar tabla ................ DROP TABLE IF EXISTS ____ ;                           |||
-- |||    27. Eliminar base de datos ........ DROP DATABASE IF EXISTS ____ ;                        |||
-- |||                                                                                             |||
-- |||  EN CONSOLA: mysql> SOURCE C:/Users/bryan/proyecto_grado_alexander/database/02_sentencias_ddl/01_db_ddl.sql
-- |||  Para practicar, mejor copiar y pegar una sentencia a la vez y mirar el resultado.         |||
-- |||=============================================================================================|||


-- ---------------------------------------------------------------------------------------------------
-- 01. MOSTRAR BASES DE DATOS ....................................................... SHOW DATABASES ;
-- ---------------------------------------------------------------------------------------------------
SHOW DATABASES;

-- ---------------------------------------------------------------------------------------------------
-- 02. CREAR BASE DE DATOS .................................................... CREATE DATABASE ____ ;
-- ---------------------------------------------------------------------------------------------------
DROP DATABASE IF EXISTS controlstore_practica;
CREATE DATABASE controlstore_practica
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_spanish_ci;

-- ---------------------------------------------------------------------------------------------------
-- 03. USAR BASE DE DATOS ................................................................ USE ____ ;
-- ---------------------------------------------------------------------------------------------------
USE controlstore_practica;
SET NAMES utf8mb4;   -- el archivo está en UTF-8: así las tildes y la ñ llegan bien también desde CMD

-- ---------------------------------------------------------------------------------------------------
-- 04. COPIAR TABLAS PARA PRACTICAR .............. CREATE TABLE ____ LIKE ____ ; INSERT ... SELECT ;
--     LIKE copia columnas, índices y CHECK (no copia llaves foráneas ni datos).
-- ---------------------------------------------------------------------------------------------------
CREATE TABLE categorias LIKE controlstore_sena.categorias;
INSERT INTO categorias SELECT * FROM controlstore_sena.categorias;

CREATE TABLE productos LIKE controlstore_sena.productos;
INSERT INTO productos SELECT * FROM controlstore_sena.productos;

CREATE TABLE clientes LIKE controlstore_sena.clientes;
INSERT INTO clientes SELECT * FROM controlstore_sena.clientes;

-- ---------------------------------------------------------------------------------------------------
-- 05. MOSTRAR TABLAS ................................................................. SHOW TABLES ;
-- ---------------------------------------------------------------------------------------------------
SHOW TABLES;

-- ---------------------------------------------------------------------------------------------------
-- 06. MOSTRAR COLUMNAS ......................... SHOW COLUMNS FROM ____ ; DESCRIBE ____ ; (son iguales)
-- ---------------------------------------------------------------------------------------------------
SHOW COLUMNS FROM clientes;
DESCRIBE productos;

-- ---------------------------------------------------------------------------------------------------
-- 07. AGREGAR COLUMNA ............................................ ALTER TABLE ____ ADD ____ ____ ;
--     AFTER ____ la pone después de esa columna (sin AFTER queda de última).
-- ---------------------------------------------------------------------------------------------------
ALTER TABLE clientes ADD correo VARCHAR(100) NULL AFTER telefono;
ALTER TABLE clientes ADD puntos INT NOT NULL DEFAULT 0;
DESCRIBE clientes;

-- ---------------------------------------------------------------------------------------------------
-- 08. RENOMBRAR / CAMBIAR COLUMNA
--     CHANGE nombre_viejo nombre_nuevo TIPO  -> cambia nombre y tipo
--     MODIFY nombre TIPO                     -> cambia solo el tipo (o NULL / NOT NULL)
-- ---------------------------------------------------------------------------------------------------
ALTER TABLE clientes CHANGE correo email VARCHAR(120) NULL;
ALTER TABLE clientes MODIFY puntos SMALLINT NOT NULL DEFAULT 0;
DESCRIBE clientes;

-- ---------------------------------------------------------------------------------------------------
-- 09. ELIMINAR COLUMNA ....................................... ALTER TABLE ____ DROP COLUMN ____ ;
-- ---------------------------------------------------------------------------------------------------
ALTER TABLE clientes DROP COLUMN email;

-- ---------------------------------------------------------------------------------------------------
-- 10. AGREGAR VALOR POR DEFECTO ........................ ALTER TABLE ____ ALTER ____ SET DEFAULT ;
-- ---------------------------------------------------------------------------------------------------
ALTER TABLE productos ALTER unidad_medida SET DEFAULT 'unidad';

-- ---------------------------------------------------------------------------------------------------
-- 11. ELIMINAR VALOR POR DEFECTO ...................... ALTER TABLE ____ ALTER ____ DROP DEFAULT ;
-- ---------------------------------------------------------------------------------------------------
ALTER TABLE clientes ALTER puntos DROP DEFAULT;
SHOW COLUMNS FROM clientes LIKE 'puntos';               -- Default ahora es NULL

-- ---------------------------------------------------------------------------------------------------
-- 12. MOSTRAR CREACIÓN DE TABLA ................................................ SHOW CREATE TABLE ;
--     Muestra el CREATE TABLE completo: así se ven los nombres de llaves, índices y CHECK.
-- ---------------------------------------------------------------------------------------------------
SHOW CREATE TABLE productos;

-- ---------------------------------------------------------------------------------------------------
-- 13. CREAR RESTRICCIÓN CHECK .................. ALTER TABLE ____ ADD CONSTRAINT ____ CHECK (____) ;
-- ---------------------------------------------------------------------------------------------------
ALTER TABLE clientes ADD CONSTRAINT chk_cliente_puntos CHECK (puntos >= 0);

-- ---------------------------------------------------------------------------------------------------
-- 14. ELIMINAR RESTRICCIÓN ................................ ALTER TABLE ____ DROP CONSTRAINT ____ ;
-- ---------------------------------------------------------------------------------------------------
ALTER TABLE clientes DROP CONSTRAINT chk_cliente_puntos;
ALTER TABLE clientes DROP COLUMN puntos;

-- ---------------------------------------------------------------------------------------------------
-- 15. CREAR ÍNDICE DE UN CAMPO ...................................... CREATE INDEX ____ ON ____ (__) ;
--     Un índice hace más rápidas las búsquedas por esa columna (como el índice de un libro).
-- ---------------------------------------------------------------------------------------------------
CREATE INDEX ind_cliente_apellido ON clientes (apellido);

-- ---------------------------------------------------------------------------------------------------
-- 16. CREAR ÍNDICE MULTICAMPO ............................. CREATE INDEX ____ ON ____ (____, ____) ;
-- ---------------------------------------------------------------------------------------------------
CREATE INDEX ind_producto_cat_nombre ON productos (id_categoria, nombre);

-- ---------------------------------------------------------------------------------------------------
-- 17. CREAR ÍNDICE ÚNICO ...................................... CREATE UNIQUE INDEX ____ ON ____ ;
--     Además de acelerar, no deja repetir el valor.
-- ---------------------------------------------------------------------------------------------------
CREATE UNIQUE INDEX uq_producto_nombre ON productos (nombre);

-- ---------------------------------------------------------------------------------------------------
-- 18. MOSTRAR / ELIMINAR ÍNDICE .................. SHOW INDEX FROM ____ ; DROP INDEX ____ ON ____ ;
-- ---------------------------------------------------------------------------------------------------
SHOW INDEX FROM clientes;
DROP INDEX ind_cliente_apellido ON clientes;
DROP INDEX uq_producto_nombre ON productos;
DROP INDEX ind_producto_cat_nombre ON productos;

-- ---------------------------------------------------------------------------------------------------
-- 19. ELIMINAR LLAVE PRIMARIA ........................... ALTER TABLE ____ DROP PRIMARY KEY ;
--     Si la columna es AUTO_INCREMENT primero hay que quitárselo (MODIFY), porque
--     AUTO_INCREMENT exige que la columna sea llave.
-- ---------------------------------------------------------------------------------------------------
ALTER TABLE categorias MODIFY id_categoria INT NOT NULL;
ALTER TABLE categorias DROP PRIMARY KEY;

-- ---------------------------------------------------------------------------------------------------
-- 20. CREAR LLAVE PRIMARIA ......................... ALTER TABLE ____ ADD PRIMARY KEY (____) ;
-- ---------------------------------------------------------------------------------------------------
ALTER TABLE categorias ADD PRIMARY KEY (id_categoria);
ALTER TABLE categorias MODIFY id_categoria INT NOT NULL AUTO_INCREMENT;

-- ---------------------------------------------------------------------------------------------------
-- 21. CREAR LLAVE FORÁNEA
--     ALTER TABLE hija ADD CONSTRAINT ____ FOREIGN KEY (columna) REFERENCES padre (columna)
--     ON DELETE (qué pasa si borran al padre) ON UPDATE (qué pasa si cambia su id)
-- ---------------------------------------------------------------------------------------------------
ALTER TABLE productos
  ADD CONSTRAINT fk_practica_producto_categoria
  FOREIGN KEY (id_categoria) REFERENCES categorias (id_categoria)
  ON DELETE RESTRICT ON UPDATE CASCADE;
SHOW CREATE TABLE productos;

-- ---------------------------------------------------------------------------------------------------
-- 22. ELIMINAR LLAVE FORÁNEA ...................... ALTER TABLE ____ DROP FOREIGN KEY ____ ;
-- ---------------------------------------------------------------------------------------------------
ALTER TABLE productos DROP FOREIGN KEY fk_practica_producto_categoria;

-- ---------------------------------------------------------------------------------------------------
-- 23. CREAR TABLA ............................................. CREATE TABLE ____ ( ... ) ;
--     Ejemplo: proveedores (posible mejora futura del sistema).
-- ---------------------------------------------------------------------------------------------------
CREATE TABLE proveedores (
  id_proveedor  INT          NOT NULL AUTO_INCREMENT,
  nit           VARCHAR(20)  NOT NULL,
  razon_social  VARCHAR(100) NOT NULL,
  telefono      VARCHAR(20)  NULL,
  activo        TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id_proveedor),
  UNIQUE KEY uq_proveedor_nit (nit),
  CONSTRAINT chk_proveedor_activo CHECK (activo IN (0, 1))
) ENGINE = InnoDB;
DESCRIBE proveedores;

-- ---------------------------------------------------------------------------------------------------
-- 24. RENOMBRAR TABLA ................................................. RENAME TABLE ____ TO ____ ;
-- ---------------------------------------------------------------------------------------------------
RENAME TABLE proveedores TO proveedores_tienda;
SHOW TABLES;

-- ---------------------------------------------------------------------------------------------------
-- 25. LIMPIAR REGISTROS ........................................... TRUNCATE TABLE ____ ;
--     Borra TODAS las filas y reinicia el AUTO_INCREMENT. La estructura queda.
-- ---------------------------------------------------------------------------------------------------
INSERT INTO proveedores_tienda (nit, razon_social) VALUES ('900123456-1', 'Lácteos del Valle S.A.S.');
SELECT * FROM proveedores_tienda;
TRUNCATE TABLE proveedores_tienda;
SELECT COUNT(*) AS filas_despues_de_truncate FROM proveedores_tienda;

-- ---------------------------------------------------------------------------------------------------
-- 26. ELIMINAR TABLA ............................................... DROP TABLE IF EXISTS ____ ;
-- ---------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS proveedores_tienda;

-- ---------------------------------------------------------------------------------------------------
-- 27. ELIMINAR BASE DE DATOS ...................................... DROP DATABASE IF EXISTS ____ ;
--     Al terminar la práctica se borra la base de práctica completa. ¡NUNCA controlstore_sena!
-- ---------------------------------------------------------------------------------------------------
DROP DATABASE IF EXISTS controlstore_practica;
SHOW DATABASES;
