-- #####################################################################
-- ESTADO: YA INSTALADO en controlstore_sena  (21/09/2026)
--
-- Los tres triggers vienen incluidos en el volcado del 23/09/2026
-- (controlstore_codigo.sql). Este script se puede volver a ejecutar sin
-- riesgo: primero borra los triggers (DROP TRIGGER IF EXISTS) y luego
-- los crea otra vez, identicos.
-- Prueba de que funcionan con los datos reales: las ventas 2, 3 y 4 se
-- insertaron con total = 0 y hoy valen 8.700, 32.300 y 21.050.
-- #####################################################################

-- =====================================================================
-- Control Store - Autoservicio Ayuelal
-- Blindaje del dato derivado `ventas.total`
--
-- EL PROBLEMA
--   `detalle_venta.subtotal` y `arqueo_caja.diferencia` son columnas
--   GENERATED ALWAYS AS (...) STORED: el motor las calcula y es
--   imposible desincronizarlas.
--
--   `ventas.total` NO puede ser generada, porque MySQL solo
--   permite que una columna generada lea columnas de SU MISMA fila,
--   y el total depende de otra tabla (la suma de sus renglones).
--   Queda entonces como un decimal comun que la aplicacion debe
--   mantener... y si alguien edita un renglon por fuera del sistema,
--   la cabecera queda mintiendo.
--
-- LA SOLUCION
--   Tres triggers sobre detalle_venta que recalculan la cabecera.
--   Asi el dato derivado deja de depender de la buena fe de la
--   aplicacion y pasa a estar garantizado por el motor.
--
-- COMO EJECUTARLO EN phpMyAdmin
--   Pestaña SQL -> en el recuadro "Delimitador" (abajo a la derecha)
--   escribir  $$  antes de dar Continuar. Sin eso, phpMyAdmin corta
--   el trigger en el primer punto y coma y da error de sintaxis.
-- =====================================================================

USE controlstore_sena;

-- Por si se vuelve a ejecutar el script
DROP TRIGGER IF EXISTS trg_detalle_after_insert;
DROP TRIGGER IF EXISTS trg_detalle_after_update;
DROP TRIGGER IF EXISTS trg_detalle_after_delete;

DELIMITER $$

-- ===== Se agrega un renglon a la venta =====
CREATE TRIGGER trg_detalle_after_insert
AFTER INSERT ON detalle_venta
FOR EACH ROW
BEGIN
  UPDATE ventas
     SET total = (SELECT IFNULL(SUM(subtotal), 0)
                    FROM detalle_venta
                   WHERE id_venta = NEW.id_venta)
   WHERE id_venta = NEW.id_venta;
END$$

-- ===== Se corrige un renglon (cambia cantidad o precio) =====
CREATE TRIGGER trg_detalle_after_update
AFTER UPDATE ON detalle_venta
FOR EACH ROW
BEGIN
  UPDATE ventas
     SET total = (SELECT IFNULL(SUM(subtotal), 0)
                    FROM detalle_venta
                   WHERE id_venta = NEW.id_venta)
   WHERE id_venta = NEW.id_venta;

  -- Caso raro pero posible: el renglon se movio a otra venta.
  -- Hay que recalcular tambien la venta de la que salio.
  IF OLD.id_venta <> NEW.id_venta THEN
    UPDATE ventas
       SET total = (SELECT IFNULL(SUM(subtotal), 0)
                      FROM detalle_venta
                     WHERE id_venta = OLD.id_venta)
     WHERE id_venta = OLD.id_venta;
  END IF;
END$$

-- ===== Se elimina un renglon =====
-- Nota: cuando se borra la VENTA completa, el ON DELETE CASCADE borra
-- los renglones sin disparar este trigger. No importa: la cabecera que
-- habria que actualizar ya no existe.
CREATE TRIGGER trg_detalle_after_delete
AFTER DELETE ON detalle_venta
FOR EACH ROW
BEGIN
  UPDATE ventas
     SET total = (SELECT IFNULL(SUM(subtotal), 0)
                    FROM detalle_venta
                   WHERE id_venta = OLD.id_venta)
   WHERE id_venta = OLD.id_venta;
END$$

DELIMITER ;


-- =====================================================================
-- VERIFICACION: ninguna venta puede quedar descuadrada
-- Con los triggers activos, esta consulta debe devolver 0 filas SIEMPRE.
-- Es la prueba que se puede correr en vivo en la sustentacion.
-- =====================================================================
SELECT v.id_venta,
       v.total                        AS total_cabecera,
       IFNULL(SUM(d.subtotal), 0)     AS suma_renglones,
       v.total - IFNULL(SUM(d.subtotal), 0) AS descuadre
  FROM ventas v
  LEFT JOIN detalle_venta d ON d.id_venta = v.id_venta
 GROUP BY v.id_venta, v.total
HAVING descuadre <> 0;


-- =====================================================================
-- OPCIONAL: el mismo criterio para arqueo_caja.total_ventas
--
-- `arqueo_caja.total_ventas` tiene exactamente el mismo problema: es la
-- suma de las ventas del turno guardada a mano. Gracias a la FK
-- ventas.id_arqueo (migracion 03) ahora SI se puede verificar.
--
-- Se deja como consulta de verificacion y no como trigger, para no
-- encadenar disparadores (detalle -> ventas -> arqueo). El cierre de
-- caja lo hace el cajero una sola vez, asi que basta con que la
-- aplicacion calcule el total con este mismo SELECT al cerrar el turno.
-- =====================================================================
SELECT a.id_arqueo,
       a.total_ventas                 AS total_registrado,
       IFNULL(SUM(v.total), 0)        AS total_real_del_turno,
       a.total_ventas - IFNULL(SUM(v.total), 0) AS descuadre
  FROM arqueo_caja a
  LEFT JOIN ventas v ON v.id_arqueo = a.id_arqueo
                    AND v.estado = 'pagada'
 GROUP BY a.id_arqueo, a.total_ventas
HAVING descuadre <> 0;
