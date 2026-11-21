-- |||=============================================================================================|||
-- |||                       CONTROL STORE · AUTOSERVICIO AYUELAL · SENA ADSO                       |||
-- |||                 04.03 · PROCEDIMIENTOS ALMACENADOS (PROCEDURES) · MySQL 8.4                  |||
-- |||=============================================================================================|||
-- |||                                                                                             |||
-- |||  Un PROCEDIMIENTO es un bloque de SQL guardado en la base de datos que se ejecuta con CALL.  |||
-- |||  Recibe parámetros (IN = entra un valor · OUT = devuelve un valor) y puede hacer varias      |||
-- |||  operaciones juntas dentro de una transacción: o se hacen todas o no se hace ninguna.       |||
-- |||                                                                                             |||
-- |||  CONTENIDO                                                                                  |||
-- |||    01. Procedimiento sin parámetros ... pa_listar_stock_bajo()                              |||
-- |||    02. Procedimiento con IN ........... pa_ventas_por_fecha(fecha_ini, fecha_fin)            |||
-- |||    03. Procedimiento con IN y OUT ..... pa_tiene_permiso(usuario, permiso, OUT resultado)    |||
-- |||    04. Procedimiento con transacción .. pa_agregar_producto_venta(venta, producto, cantidad) |||
-- |||                                         valida stock, agrega renglón, descuenta y registra   |||
-- |||                                         el movimiento en el kárdex                           |||
-- |||    05. Procedimiento con transacción .. pa_anular_venta(venta, usuario)                      |||
-- |||                                         devuelve el stock y deja la anulación en la bitácora |||
-- |||    06. Procedimiento de cierre ........ pa_cerrar_caja(arqueo, monto_contado, OUT diferencia)|||
-- |||    07. Ver procedimientos ............. SHOW PROCEDURE STATUS ; SHOW CREATE PROCEDURE ____ ;  |||
-- |||    08. Eliminar procedimiento ......... DROP PROCEDURE IF EXISTS ____ ;                       |||
-- |||    09. Pruebas con CALL (dentro de una transacción con ROLLBACK)                             |||
-- |||                                                                                             |||
-- |||  DECLARE = variable local · SIGNAL = lanzar un error propio · FOR UPDATE = bloquea la fila   |||
-- |||  mientras dura la transacción (dos cajeros no venden la última unidad al mismo tiempo).     |||
-- |||                                                                                             |||
-- |||  EN CONSOLA: mysql> SOURCE C:/Users/bryan/proyecto_grado_alexander/database/04_programacion_db/03_procedures.sql
-- |||  REQUISITO : antes correr 01_triggers.sql (ventas.total lo recalcula un trigger)            |||
-- |||=============================================================================================|||

USE controlstore_sena;
SET NAMES utf8mb4;   -- el archivo está en UTF-8: así las tildes y la ñ llegan bien también desde CMD

DROP PROCEDURE IF EXISTS pa_listar_stock_bajo;
DROP PROCEDURE IF EXISTS pa_ventas_por_fecha;
DROP PROCEDURE IF EXISTS pa_tiene_permiso;
DROP PROCEDURE IF EXISTS pa_agregar_producto_venta;
DROP PROCEDURE IF EXISTS pa_anular_venta;
DROP PROCEDURE IF EXISTS pa_cerrar_caja;

DELIMITER $$

-- ---------------------------------------------------------------------------------------------------
-- 01. SIN PARÁMETROS
-- ---------------------------------------------------------------------------------------------------
CREATE PROCEDURE pa_listar_stock_bajo()
BEGIN
  SELECT codigo_producto, nombre, stock_actual, stock_minimo
    FROM productos
   WHERE activo = 1 AND stock_actual <= stock_minimo
   ORDER BY stock_actual;
END$$

-- ---------------------------------------------------------------------------------------------------
-- 02. CON PARÁMETROS IN · ventas entre dos fechas (RF26)
-- ---------------------------------------------------------------------------------------------------
CREATE PROCEDURE pa_ventas_por_fecha(IN p_desde DATE, IN p_hasta DATE)
BEGIN
  SELECT v.id_venta, v.fecha, CONCAT(u.nombre, ' ', u.apellido) AS cajero,
         mp.nombre AS metodo_pago, v.total, v.estado
    FROM ventas v
   INNER JOIN usuarios u      ON u.id_usuario = v.id_usuario
   INNER JOIN metodos_pago mp ON mp.id_metodo_pago = v.id_metodo_pago
   WHERE DATE(v.fecha) BETWEEN p_desde AND p_hasta
   ORDER BY v.fecha;
END$$

-- ---------------------------------------------------------------------------------------------------
-- 03. CON IN Y OUT · ¿el usuario tiene este permiso? (RF18: lo decide su rol)
-- ---------------------------------------------------------------------------------------------------
CREATE PROCEDURE pa_tiene_permiso(IN p_id_usuario INT, IN p_codigo VARCHAR(50), OUT p_resultado TINYINT)
BEGIN
  SELECT COUNT(*) > 0 INTO p_resultado
    FROM usuarios u
   INNER JOIN rol_permiso rp ON rp.id_rol = u.id_rol
   INNER JOIN permisos p     ON p.id_permiso = rp.id_permiso
   WHERE u.id_usuario = p_id_usuario
     AND u.activo = 1
     AND p.codigo = p_codigo;
END$$

-- ---------------------------------------------------------------------------------------------------
-- 04. TRANSACCIÓN · agregar un producto a una venta (RF09, RF10)
--     1) la venta debe estar pendiente  2) debe haber stock  3) se agrega el renglón con el precio
--     vigente  4) se descuenta el stock  5) queda la salida en el kárdex. Si algo falla: ROLLBACK.
-- ---------------------------------------------------------------------------------------------------
CREATE PROCEDURE pa_agregar_producto_venta(IN p_id_venta INT, IN p_codigo VARCHAR(20), IN p_cantidad INT)
BEGIN
  DECLARE v_estado VARCHAR(20);
  DECLARE v_stock  INT;
  DECLARE v_precio DECIMAL(10,2);
  DECLARE v_usuario INT;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;            -- deshace todo y vuelve a lanzar el error original
  END;

  START TRANSACTION;

  SELECT estado, id_usuario INTO v_estado, v_usuario FROM ventas WHERE id_venta = p_id_venta FOR UPDATE;
  IF v_estado IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La venta no existe';
  ELSEIF v_estado <> 'pendiente' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Solo se pueden agregar productos a una venta pendiente';
  END IF;

  SELECT stock_actual, precio_unitario INTO v_stock, v_precio
    FROM productos WHERE codigo_producto = p_codigo AND activo = 1 FOR UPDATE;
  IF v_stock IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El producto no existe o está inactivo';
  ELSEIF v_stock < p_cantidad THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock insuficiente';
  END IF;

  INSERT INTO detalle_venta (id_venta, codigo_producto, cantidad, precio_venta)
  VALUES (p_id_venta, p_codigo, p_cantidad, v_precio);

  UPDATE productos SET stock_actual = stock_actual - p_cantidad WHERE codigo_producto = p_codigo;

  INSERT INTO movimientos_inventario (codigo_producto, id_usuario, tipo, cantidad, observacion)
  VALUES (p_codigo, v_usuario, 'salida', p_cantidad, CONCAT('Venta #', p_id_venta));

  COMMIT;
END$$

-- ---------------------------------------------------------------------------------------------------
-- 05. TRANSACCIÓN · anular una venta (RF17): solo el administrador; devuelve el stock al kárdex
-- ---------------------------------------------------------------------------------------------------
CREATE PROCEDURE pa_anular_venta(IN p_id_venta INT, IN p_id_usuario INT)
BEGIN
  DECLARE v_estado VARCHAR(20);
  DECLARE v_permiso TINYINT;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  CALL pa_tiene_permiso(p_id_usuario, 'ventas.anular', v_permiso);
  IF v_permiso = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El usuario no tiene permiso para anular ventas';
  END IF;

  START TRANSACTION;

  SELECT estado INTO v_estado FROM ventas WHERE id_venta = p_id_venta FOR UPDATE;
  IF v_estado IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La venta no existe';
  ELSEIF v_estado = 'anulada' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La venta ya estaba anulada';
  END IF;

  -- UPDATE con JOIN: devuelve a cada producto lo que se había vendido
  UPDATE productos p
   INNER JOIN detalle_venta d ON d.codigo_producto = p.codigo_producto
     SET p.stock_actual = p.stock_actual + d.cantidad
   WHERE d.id_venta = p_id_venta;

  -- INSERT ... SELECT: una entrada en el kárdex por cada renglón
  INSERT INTO movimientos_inventario (codigo_producto, id_usuario, tipo, cantidad, observacion)
  SELECT codigo_producto, p_id_usuario, 'entrada', cantidad, CONCAT('Anulación venta #', p_id_venta)
    FROM detalle_venta WHERE id_venta = p_id_venta;

  UPDATE ventas SET estado = 'anulada' WHERE id_venta = p_id_venta;

  INSERT INTO log_auditoria (id_usuario, id_modulo, accion, detalle)
  VALUES (p_id_usuario, 3, 'anular', CONCAT('Venta #', p_id_venta, ' anulada'));

  COMMIT;
END$$

-- ---------------------------------------------------------------------------------------------------
-- 06. CIERRE DE CAJA (RF14, RF15) · calcula el efectivo esperado y devuelve la diferencia
--     diferencia es columna VIRTUAL: = monto_final - (monto_inicial + total_efectivo)
-- ---------------------------------------------------------------------------------------------------
CREATE PROCEDURE pa_cerrar_caja(IN p_id_arqueo INT, IN p_monto_contado DECIMAL(10,2), OUT p_diferencia DECIMAL(10,2))
BEGIN
  DECLARE v_cierre DATETIME;
  DECLARE v_existe INT;

  SELECT COUNT(*), MAX(fecha_cierre) INTO v_existe, v_cierre FROM arqueo_caja WHERE id_arqueo = p_id_arqueo;
  IF v_existe = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El arqueo no existe';
  ELSEIF v_cierre IS NOT NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La caja ya estaba cerrada';
  END IF;

  UPDATE arqueo_caja a
     SET a.total_ventas   = (SELECT IFNULL(SUM(total), 0) FROM ventas
                              WHERE id_arqueo = p_id_arqueo AND estado = 'pagada'),
         a.total_efectivo = (SELECT IFNULL(SUM(v.total), 0) FROM ventas v
                              INNER JOIN metodos_pago mp ON mp.id_metodo_pago = v.id_metodo_pago
                              WHERE v.id_arqueo = p_id_arqueo AND v.estado = 'pagada' AND mp.nombre = 'Efectivo'),
         a.monto_final    = p_monto_contado,
         a.fecha_cierre   = NOW()
   WHERE a.id_arqueo = p_id_arqueo;

  SELECT diferencia INTO p_diferencia FROM arqueo_caja WHERE id_arqueo = p_id_arqueo;
END$$

DELIMITER ;


-- ---------------------------------------------------------------------------------------------------
-- 07. VER PROCEDIMIENTOS ........... SHOW PROCEDURE STATUS WHERE Db = ____ ; SHOW CREATE PROCEDURE ;
-- ---------------------------------------------------------------------------------------------------
SHOW PROCEDURE STATUS WHERE Db = 'controlstore_sena';
-- SHOW CREATE PROCEDURE pa_cerrar_caja;


-- ---------------------------------------------------------------------------------------------------
-- 08. ELIMINAR ................................................. DROP PROCEDURE IF EXISTS ____ ;
-- ---------------------------------------------------------------------------------------------------
-- DROP PROCEDURE IF EXISTS pa_listar_stock_bajo;   -- quitar el -- para probar


-- ---------------------------------------------------------------------------------------------------
-- 09. PRUEBAS CON CALL
-- ---------------------------------------------------------------------------------------------------
CALL pa_listar_stock_bajo();
CALL pa_ventas_por_fecha('2026-09-12', '2026-09-16');

CALL pa_tiene_permiso(1, 'ventas.anular', @puede);   -- administrador
SELECT @puede AS admin_puede_anular;
CALL pa_tiene_permiso(2, 'ventas.anular', @puede);   -- cajero
SELECT @puede AS cajero_puede_anular;

-- Los que cambian datos hacen su propio COMMIT, así que la prueba crea una venta de práctica
-- en la caja abierta (arqueo 11) y al final la borra para dejar todo como estaba.
SET @stock_antes = (SELECT stock_actual FROM productos WHERE codigo_producto = '7702001005');
SET @max_mov     = (SELECT MAX(id_movimiento) FROM movimientos_inventario);
SET @max_log     = (SELECT MAX(id_log) FROM log_auditoria);

INSERT INTO ventas (id_usuario, id_arqueo, id_cliente, id_metodo_pago, total, estado)
SELECT id_usuario, id_arqueo, NULL, 1, 0, 'pendiente' FROM arqueo_caja WHERE id_arqueo = 11;
SET @venta_prueba = LAST_INSERT_ID();

-- 09.01. Agregar 2 panes: el total pasa de 0 al precio x 2 y el stock baja 2
CALL pa_agregar_producto_venta(@venta_prueba, '7702001005', 2);
SELECT v.id_venta, v.total, p.stock_actual AS stock_pan
  FROM ventas v, productos p
 WHERE v.id_venta = @venta_prueba AND p.codigo_producto = '7702001005';

-- 09.02. Anular la venta (usuario 1 = administrador): el stock vuelve
CALL pa_anular_venta(@venta_prueba, 1);
SELECT v.id_venta, v.estado, p.stock_actual AS stock_pan
  FROM ventas v, productos p
 WHERE v.id_venta = @venta_prueba AND p.codigo_producto = '7702001005';

-- 09.03. Cerrar la caja 11: base $20.000 + venta en efectivo $20.800 = $40.800 contados -> diferencia 0
CALL pa_cerrar_caja(11, 40800, @dif);
SELECT @dif AS diferencia_caja_11;

-- 09.04. Deshacer la práctica
DELETE FROM detalle_venta WHERE id_venta = @venta_prueba;
DELETE FROM ventas WHERE id_venta = @venta_prueba;
DELETE FROM movimientos_inventario WHERE id_movimiento > @max_mov;
DELETE FROM log_auditoria WHERE id_log > @max_log;
UPDATE productos SET stock_actual = @stock_antes WHERE codigo_producto = '7702001005';
UPDATE arqueo_caja SET fecha_cierre = NULL, monto_final = NULL, total_ventas = NULL, total_efectivo = NULL
 WHERE id_arqueo = 11;
ALTER TABLE ventas AUTO_INCREMENT = 1;   -- el contador vuelve a seguir al último id real

-- Pruebas que deben FALLAR (quitar el -- para ver el error):
-- CALL pa_agregar_producto_venta(2, '7702001001', 1);    -> Solo se pueden agregar productos a una venta pendiente
-- CALL pa_anular_venta(2, 2);                            -> El usuario no tiene permiso para anular ventas
-- CALL pa_anular_venta(7, 1);                            -> La venta ya estaba anulada
-- CALL pa_cerrar_caja(2, 50000, @dif);                   -> La caja ya estaba cerrada
