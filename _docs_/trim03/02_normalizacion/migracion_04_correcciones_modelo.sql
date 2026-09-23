-- #####################################################################
-- ESTADO: YA APLICADA en controlstore_sena  (21/09/2026)
--
-- NO VOLVER A EJECUTAR. Se conserva como evidencia de la correccion.
-- El volcado del 23/09/2026 (controlstore_codigo.sql) ya trae:
--   * arqueo_caja.total_efectivo y la formula corregida de diferencia
--   * la tabla carrito_chatbot (tabla 14 del modelo)
--   * sesiones_chatbot SIN la columna JSON carrito
-- Si se corre por error, se detiene en la guarda del PASO 0 con
-- "#1054 - Unknown column 'carrito'", sin modificar nada.
-- #####################################################################

-- =====================================================================
-- Control Store - Autoservicio Ayuelal
-- Migracion 04: correcciones al modelo de datos
--
-- Corrige dos defectos detectados en la auditoria de normalizacion:
--
--   A. arqueo_caja.diferencia comparaba el efectivo contado en el cajon
--      contra el total de TODAS las ventas del turno, incluyendo Nequi,
--      transferencia y tarjeta. Esa plata nunca entra al cajon, de modo
--      que el arqueo reportaba un descuadre falso todos los dias.
--
--   B. sesiones_chatbot.carrito guardaba los productos elegidos en una
--      columna JSON. Ademas de violar la Primera Forma Normal, repetia
--      el nombre y el precio que ya viven en productos, e impedia que
--      el motor validara que el producto existiera.
--
-- La tercera correccion (el trigger que protege ventas.total) va en el
-- archivo 01_trigger_total_venta.sql, y NO se puede unir a este script:
-- los triggers exigen cambiar el delimitador a $$ en phpMyAdmin, y
-- mezclarlo con DDL normal en una sola ejecucion produce errores de
-- sintaxis. Se ejecuta aparte, despues de este.
--
-- ORDEN DE EJECUCION
--   1. Exportar respaldo (ver PASO 0)
--   2. Este archivo
--   3. 01_trigger_total_venta.sql  (con delimitador $$)
--
-- =====================================================================

USE controlstore_sena;


-- #####################################################################
-- PASO 0 - ANTES DE EMPEZAR
--
-- 0.1 RESPALDO (obligatorio, no se puede automatizar desde SQL)
--     En phpMyAdmin: seleccionar la base controlstore_sena ->
--     pestaña "Exportar" -> metodo Rapido -> formato SQL -> Continuar.
--     Guardar el .sql antes de correr nada de lo que sigue.
--
-- 0.2 GUARDA DE SEGURIDAD
--     Este script asume que no hay carritos con datos. Ejecutar primero
--     la siguiente consulta: si devuelve algo distinto de 0, DETENERSE
--     y avisar, porque habria que migrar esos carritos a mano.
-- #####################################################################

SELECT COUNT(*) AS carritos_con_datos
  FROM sesiones_chatbot
 WHERE carrito IS NOT NULL
   AND JSON_LENGTH(carrito) > 0;
-- Resultado esperado: 0


-- #####################################################################
-- A PARTIR DE AQUI SE MODIFICA LA BASE
--
-- AVISO IMPORTANTE: este script NO va dentro de una transaccion, y no
-- es un descuido. En MySQL y MariaDB las instrucciones DDL (ALTER TABLE,
-- CREATE TABLE, DROP) producen un COMMIT implicito: se confirman solas
-- apenas se ejecutan, aunque esten escritas entre START TRANSACTION y
-- COMMIT. Poner esa envoltura daria una falsa sensacion de seguridad,
-- porque un ROLLBACK no desharia nada.
--
-- Por eso la unica marcha atras real es el respaldo del PASO 0, o el
-- bloque de REVERSA del final. No ejecutar sin haber exportado antes.
-- #####################################################################


-- =====================================================================
-- PASO 1 - Corregir el arqueo de caja
--
-- El descuadre solo tiene sentido contra el efectivo. Se separa en dos
-- datos distintos:
--   total_ventas    -> todo lo vendido en el turno (para reportes)
--   total_efectivo  -> solo lo que efectivamente entro al cajon
-- y la diferencia pasa a calcularse contra el segundo.
-- =====================================================================

-- 1.1 Se elimina la columna generada para poder redefinir su formula.
--     No se pierde informacion: es un valor calculado, no almacenado
--     por el usuario.
ALTER TABLE arqueo_caja
  DROP COLUMN diferencia;

-- 1.2 Nueva columna con el efectivo del turno
ALTER TABLE arqueo_caja
  ADD COLUMN total_efectivo DECIMAL(12,2) DEFAULT NULL
    COMMENT 'Ventas pagadas en efectivo: lo unico que entra al cajon'
    AFTER total_ventas;

-- 1.3 Se aclara el significado de la columna que ya existia
ALTER TABLE arqueo_caja
  MODIFY COLUMN total_ventas DECIMAL(12,2) DEFAULT NULL
    COMMENT 'Total vendido en el turno, todos los medios de pago (reportes)';

-- 1.4 La diferencia vuelve, ahora con la formula correcta
ALTER TABLE arqueo_caja
  ADD COLUMN diferencia DECIMAL(12,2)
    GENERATED ALWAYS AS (`monto_final` - `monto_inicial` - `total_efectivo`) STORED
    COMMENT 'Descuadre real: efectivo contado menos efectivo esperado'
    AFTER total_efectivo;


-- =====================================================================
-- PASO 2 - Normalizar el carrito del ChatBot
--
-- El JSON se reemplaza por una tabla hija. Con esto:
--   - cada producto del carrito es una fila (1FN)
--   - el nombre y el precio dejan de estar duplicados: salen por JOIN
--   - el motor valida que el producto exista (llave foranea)
--   - al borrarse la sesion, su carrito se borra solo (CASCADE)
-- =====================================================================

CREATE TABLE carrito_chatbot (
  id_sesion       INT         NOT NULL COMMENT 'FK: sesion de WhatsApp a la que pertenece',
  codigo_producto VARCHAR(20) NOT NULL COMMENT 'FK: producto elegido por el cliente',
  cantidad        INT         NOT NULL COMMENT 'Unidades elegidas',
  PRIMARY KEY (id_sesion, codigo_producto),
  CONSTRAINT fk_carrito_sesion   FOREIGN KEY (id_sesion)
    REFERENCES sesiones_chatbot(id_sesion) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_carrito_producto FOREIGN KEY (codigo_producto)
    REFERENCES productos(codigo_producto) ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_spanish_ci
  COMMENT='Productos que el cliente va eligiendo en la conversacion del ChatBot';

-- La llave primaria compuesta (sesion, producto) impide que el mismo
-- producto aparezca dos veces en el mismo carrito: si el cliente pide
-- mas, se suma la cantidad, no se agrega otra fila.

-- Ya no hace falta la columna JSON
ALTER TABLE sesiones_chatbot
  DROP COLUMN carrito;


-- #####################################################################
-- VERIFICACION - ejecutar despues de los pasos anteriores
-- #####################################################################

-- V1. El arqueo quedo con las tres columnas y la formula corregida
SHOW CREATE TABLE arqueo_caja;
-- Debe leerse: GENERATED ALWAYS AS (`monto_final` - `monto_inicial` - `total_efectivo`)

-- V2. La tabla del carrito existe con sus dos llaves foraneas
SHOW CREATE TABLE carrito_chatbot;

-- V3. La columna JSON ya no esta
DESCRIBE sesiones_chatbot;
-- No debe aparecer la columna `carrito`

-- V4. El modelo quedo en 14 tablas (13 anteriores + carrito_chatbot)
SELECT COUNT(*) AS total_tablas
  FROM information_schema.tables
 WHERE table_schema = 'controlstore_sena'
   AND table_type   = 'BASE TABLE';
-- Resultado esperado: 14

-- V5. Prueba de que la llave foranea del carrito funciona.
--     Esta consulta DEBE fallar con error 1452 (producto inexistente).
--     Ese error es la demostracion: el JSON no podia hacer esto.
-- INSERT INTO carrito_chatbot (id_sesion, codigo_producto, cantidad)
-- VALUES (1, '0000000000', 1);


-- #####################################################################
-- COMO SE CONSULTA UN CARRITO AHORA
-- El nombre y el precio ya no se guardan: se traen del catalogo, que es
-- la unica fuente de verdad. Asi, si cambia el precio mientras el
-- cliente conversa, el carrito muestra el precio correcto.
-- #####################################################################

SELECT s.telefono,
       p.nombre                          AS producto,
       c.cantidad,
       p.precio_unitario,
       c.cantidad * p.precio_unitario    AS subtotal
  FROM carrito_chatbot c
  JOIN sesiones_chatbot s ON s.id_sesion       = c.id_sesion
  JOIN productos        p ON p.codigo_producto = c.codigo_producto
 ORDER BY s.telefono;


-- #####################################################################
-- REVERSA  (solo si algo sale mal y no se quiere restaurar el respaldo)
-- #####################################################################
/*
DROP TABLE IF EXISTS carrito_chatbot;

ALTER TABLE sesiones_chatbot
  ADD COLUMN carrito LONGTEXT
    CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
    COMMENT 'Productos elegidos: [{"codigo","nombre","cantidad","precio"}]'
    CHECK (json_valid(`carrito`))
    AFTER paso;

ALTER TABLE arqueo_caja DROP COLUMN diferencia;
ALTER TABLE arqueo_caja DROP COLUMN total_efectivo;
ALTER TABLE arqueo_caja
  ADD COLUMN diferencia DECIMAL(12,2)
    GENERATED ALWAYS AS (`monto_final` - `monto_inicial` - `total_ventas`) STORED
    COMMENT 'Calculado: descuadre de la caja';
*/
