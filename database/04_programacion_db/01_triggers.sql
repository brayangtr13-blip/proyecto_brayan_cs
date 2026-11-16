-- |||=============================================================================================|||
-- |||                       CONTROL STORE · AUTOSERVICIO AYUELAL · SENA ADSO                       |||
-- |||                         04.01 · TRIGGERS (DISPARADORES) · MySQL 8.4                          |||
-- |||=============================================================================================|||
-- |||                                                                                             |||
-- |||  CONTENIDO                                                                                  |||
-- |||    01. Trigger AFTER INSERT ...... CREATE TRIGGER ____ AFTER INSERT ON ____ FOR EACH ROW     |||
-- |||        trg_detalle_after_insert : recalcula ventas.total al agregar un renglón              |||
-- |||    02. Trigger AFTER UPDATE ...... CREATE TRIGGER ____ AFTER UPDATE ON ____ FOR EACH ROW     |||
-- |||        trg_detalle_after_update : recalcula ventas.total al cambiar un renglón              |||
-- |||    03. Trigger AFTER DELETE ...... CREATE TRIGGER ____ AFTER DELETE ON ____ FOR EACH ROW     |||
-- |||        trg_detalle_after_delete : recalcula ventas.total al quitar un renglón               |||
-- |||    04. Trigger BEFORE INSERT ..... CREATE TRIGGER ____ BEFORE INSERT ON ____ FOR EACH ROW    |||
-- |||        trg_productos_precio_bi  : no deja vender por debajo del costo                       |||
-- |||        trg_domicilios_costo_bi  : copia la tarifa del barrio y rechaza barrios sin cobertura |||
-- |||    05. Trigger BEFORE UPDATE ..... CREATE TRIGGER ____ BEFORE UPDATE ON ____ FOR EACH ROW    |||
-- |||        trg_productos_precio_bu  : no deja vender por debajo del costo                       |||
-- |||        trg_usuarios_bloqueo_bu  : bloquea 15 minutos tras 3 intentos fallidos              |||
-- |||    06. Trigger AFTER UPDATE (auditoría)                                                     |||
-- |||        trg_productos_precio_au  : deja en log_auditoria cada cambio de precio              |||
-- |||    07. Ver y eliminar triggers ... SHOW TRIGGERS ; DROP TRIGGER IF EXISTS ____ ;             |||
-- |||    08. Pruebas (dentro de una transacción con ROLLBACK: no cambian los datos)               |||
-- |||                                                                                             |||
-- |||  NEW = la fila nueva (INSERT y UPDATE) · OLD = la fila anterior (UPDATE y DELETE)           |||
-- |||  SIGNAL SQLSTATE '45000' = el trigger rechaza la operación con un mensaje propio            |||
-- |||                                                                                             |||
-- |||  DELIMITER: el cuerpo de un trigger lleva ';' adentro. Se cambia el delimitador a $$ para   |||
-- |||  que la consola no corte la instrucción en el primer ';' y al final se devuelve a ';'.      |||
-- |||                                                                                             |||
-- |||  EN CONSOLA: mysql> SOURCE C:/Users/bryan/proyecto_grado_alexander/database/04_programacion_db/01_triggers.sql
-- |||=============================================================================================|||

USE controlstore_sena;

DROP TRIGGER IF EXISTS trg_detalle_after_insert;
DROP TRIGGER IF EXISTS trg_detalle_after_update;
DROP TRIGGER IF EXISTS trg_detalle_after_delete;
DROP TRIGGER IF EXISTS trg_productos_precio_bi;
DROP TRIGGER IF EXISTS trg_productos_precio_bu;
DROP TRIGGER IF EXISTS trg_productos_precio_au;
DROP TRIGGER IF EXISTS trg_domicilios_costo_bi;
DROP TRIGGER IF EXISTS trg_usuarios_bloqueo_bu;

DELIMITER $$

-- ---------------------------------------------------------------------------------------------------
-- 01. AFTER INSERT · ventas.total es la suma de sus renglones (desnormalización controlada)
-- ---------------------------------------------------------------------------------------------------
CREATE TRIGGER trg_detalle_after_insert
AFTER INSERT ON detalle_venta
FOR EACH ROW
BEGIN
  UPDATE ventas
     SET total = (SELECT IFNULL(SUM(subtotal), 0) FROM detalle_venta WHERE id_venta = NEW.id_venta)
   WHERE id_venta = NEW.id_venta;
END$$

-- ---------------------------------------------------------------------------------------------------
-- 02. AFTER UPDATE · si el renglón cambia de venta, se recalculan las dos
-- ---------------------------------------------------------------------------------------------------
CREATE TRIGGER trg_detalle_after_update
AFTER UPDATE ON detalle_venta
FOR EACH ROW
BEGIN
  UPDATE ventas
     SET total = (SELECT IFNULL(SUM(subtotal), 0) FROM detalle_venta WHERE id_venta = NEW.id_venta)
   WHERE id_venta = NEW.id_venta;
  IF OLD.id_venta <> NEW.id_venta THEN
    UPDATE ventas
       SET total = (SELECT IFNULL(SUM(subtotal), 0) FROM detalle_venta WHERE id_venta = OLD.id_venta)
     WHERE id_venta = OLD.id_venta;
  END IF;
END$$

-- ---------------------------------------------------------------------------------------------------
-- 03. AFTER DELETE
-- ---------------------------------------------------------------------------------------------------
CREATE TRIGGER trg_detalle_after_delete
AFTER DELETE ON detalle_venta
FOR EACH ROW
BEGIN
  UPDATE ventas
     SET total = (SELECT IFNULL(SUM(subtotal), 0) FROM detalle_venta WHERE id_venta = OLD.id_venta)
   WHERE id_venta = OLD.id_venta;
END$$

-- ---------------------------------------------------------------------------------------------------
-- 04. BEFORE INSERT · validaciones antes de guardar
-- ---------------------------------------------------------------------------------------------------
CREATE TRIGGER trg_productos_precio_bi
BEFORE INSERT ON productos
FOR EACH ROW
BEGIN
  IF NEW.precio_unitario < NEW.precio_compra THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El precio de venta no puede ser menor que el precio de compra';
  END IF;
END$$

-- El domicilio copia la tarifa vigente del barrio (si no se envió) y no acepta barrios sin cobertura.
CREATE TRIGGER trg_domicilios_costo_bi
BEFORE INSERT ON domicilios
FOR EACH ROW
BEGIN
  DECLARE v_activo TINYINT;
  DECLARE v_tarifa DECIMAL(10,2);
  SELECT activo, costo_domicilio INTO v_activo, v_tarifa FROM barrios WHERE id_barrio = NEW.id_barrio;
  IF v_activo = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El barrio está fuera de la zona de cobertura';
  END IF;
  IF NEW.costo_envio = 0 THEN
    SET NEW.costo_envio = v_tarifa;
  END IF;
END$$

-- ---------------------------------------------------------------------------------------------------
-- 05. BEFORE UPDATE · se puede cambiar NEW antes de que se guarde
-- ---------------------------------------------------------------------------------------------------
CREATE TRIGGER trg_productos_precio_bu
BEFORE UPDATE ON productos
FOR EACH ROW
BEGIN
  IF NEW.precio_unitario < NEW.precio_compra THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El precio de venta no puede ser menor que el precio de compra';
  END IF;
END$$

-- Seguridad (RNF02): al tercer intento fallido la cuenta se bloquea 15 minutos;
-- cuando los intentos vuelven a 0 (inicio de sesión correcto) se desbloquea.
CREATE TRIGGER trg_usuarios_bloqueo_bu
BEFORE UPDATE ON usuarios
FOR EACH ROW
BEGIN
  IF NEW.intentos_fallidos >= 3 AND OLD.intentos_fallidos < 3 THEN
    SET NEW.bloqueado_hasta = NOW() + INTERVAL 15 MINUTE;
  ELSEIF NEW.intentos_fallidos = 0 THEN
    SET NEW.bloqueado_hasta = NULL;
  END IF;
END$$

-- ---------------------------------------------------------------------------------------------------
-- 06. AFTER UPDATE · auditoría (RNF04): cada cambio de precio queda en la bitácora.
--     @id_usuario_app es una variable de sesión que la aplicación fija con el usuario conectado.
-- ---------------------------------------------------------------------------------------------------
CREATE TRIGGER trg_productos_precio_au
AFTER UPDATE ON productos
FOR EACH ROW
BEGIN
  IF NEW.precio_unitario <> OLD.precio_unitario THEN
    INSERT INTO log_auditoria (id_usuario, id_modulo, accion, detalle)
    VALUES (@id_usuario_app, 2, 'actualizar',
            CONCAT('Precio de ', NEW.nombre, ': $', OLD.precio_unitario, ' -> $', NEW.precio_unitario));
  END IF;
END$$

DELIMITER ;


-- ---------------------------------------------------------------------------------------------------
-- 07. VER Y ELIMINAR TRIGGERS ................ SHOW TRIGGERS ; DROP TRIGGER IF EXISTS ____ ;
-- ---------------------------------------------------------------------------------------------------
SHOW TRIGGERS FROM controlstore_sena;                -- deben salir 8
-- DROP TRIGGER IF EXISTS trg_productos_precio_au;   -- así se elimina uno (quitar el -- para probar)


-- ---------------------------------------------------------------------------------------------------
-- 08. PRUEBAS · todo dentro de una transacción que termina en ROLLBACK: los datos no cambian
-- ---------------------------------------------------------------------------------------------------
START TRANSACTION;

-- 08.01. Agregar un renglón a la venta #2 recalcula su total ($8.700 -> $14.500)
SELECT id_venta, total AS total_antes FROM ventas WHERE id_venta = 2;
INSERT INTO detalle_venta (id_venta, codigo_producto, cantidad, precio_venta) VALUES (2, '7702001004', 1, 5800);
SELECT id_venta, total AS total_despues FROM ventas WHERE id_venta = 2;

-- 08.02. Cambiar un precio deja el registro en la bitácora
SET @id_usuario_app = 1;
UPDATE productos SET precio_unitario = 3000 WHERE codigo_producto = '7702001001';
SELECT id_log, id_usuario, accion, detalle FROM log_auditoria ORDER BY id_log DESC LIMIT 1;

-- 08.03. Tercer intento fallido: la cuenta queda bloqueada 15 minutos
UPDATE usuarios SET intentos_fallidos = 3 WHERE id_usuario = 4;
SELECT id_usuario, intentos_fallidos, bloqueado_hasta FROM usuarios WHERE id_usuario = 4;

ROLLBACK;

-- 08.04. Pruebas que deben FALLAR (quitar el -- de la línea para ver el error):
-- UPDATE productos SET precio_unitario = 1000 WHERE codigo_producto = '7702001001';
--   -> ERROR 1644: El precio de venta no puede ser menor que el precio de compra
-- INSERT INTO domicilios (id_venta, id_barrio, direccion_entrega, telefono_contacto) VALUES (2, 10, 'Calle 1', '3000000000');
--   -> ERROR 1644: El barrio está fuera de la zona de cobertura
