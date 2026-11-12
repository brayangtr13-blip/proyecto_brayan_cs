-- =====================================================================
-- Migración 07 - Columnas calculadas VIRTUAL (controlstore_sena, MySQL 8.4)
--
-- Auditoría del 12-11-2026: detalle_venta.subtotal y arqueo_caja.diferencia
-- se calculan con otras columnas de su misma tabla que no son llave. Como
-- columnas generadas STORED, MySQL las guardaba en disco: un dato repetido.
-- Como VIRTUAL, MySQL las calcula al leerlas y no guarda nada, así que la
-- Tercera Forma Normal se cumple en sentido estricto. Se consultan igual.
--
-- MySQL no permite cambiar STORED por VIRTUAL directamente (error 3106):
-- se borra la columna y se vuelve a crear. No se pierde información, porque
-- el valor siempre se puede calcular con las demás columnas.
--
-- Requiere las migraciones 05 y 06 aplicadas. NO trae "USE".
-- Primero en controlstore_sena_prueba; después en controlstore_sena (con respaldo antes).
-- =====================================================================

-- BLOQUE 0 · Comprobar en qué base se está trabajando (si sale NULL o la base equivocada, DETENERSE)
SELECT DATABASE() AS base_actual;

-- BLOQUE 1 · Valores ANTES del cambio (para compararlos al final)
SELECT id_detalle, cantidad, precio_venta, subtotal FROM detalle_venta ORDER BY id_detalle;
SELECT id_arqueo, monto_inicial, monto_final, total_efectivo, diferencia FROM arqueo_caja ORDER BY id_arqueo;

-- BLOQUE 2 · detalle_venta.subtotal pasa a VIRTUAL
-- (su CHECK se quita y se vuelve a poner, porque depende de la columna)
ALTER TABLE detalle_venta
  DROP CHECK chk_detalle_subtotal,
  DROP COLUMN subtotal;
ALTER TABLE detalle_venta
  ADD COLUMN subtotal DECIMAL(12,2)
    GENERATED ALWAYS AS (cantidad * precio_venta) VIRTUAL
    COMMENT 'cantidad x precio_venta (calculado al leer, no se almacena)',
  ADD CONSTRAINT chk_detalle_subtotal CHECK (subtotal >= 0);

-- BLOQUE 3 · arqueo_caja.diferencia pasa a VIRTUAL (puede ser negativa: faltante de caja)
ALTER TABLE arqueo_caja
  DROP COLUMN diferencia;
ALTER TABLE arqueo_caja
  ADD COLUMN diferencia DECIMAL(12,2)
    GENERATED ALWAYS AS (monto_final - monto_inicial - total_efectivo) VIRTUAL
    COMMENT 'Faltante (-) o sobrante (+) del turno (calculado al leer, no se almacena)'
    AFTER total_efectivo;

-- BLOQUE 4 · Verificación
-- Los valores deben ser IGUALES a los del bloque 1
SELECT id_detalle, cantidad, precio_venta, subtotal FROM detalle_venta ORDER BY id_detalle;
SELECT id_arqueo, monto_inicial, monto_final, total_efectivo, diferencia FROM arqueo_caja ORDER BY id_arqueo;
-- Las dos columnas deben decir VIRTUAL GENERATED
SELECT table_name, column_name, extra FROM information_schema.columns
 WHERE table_schema = DATABASE() AND column_name IN ('subtotal', 'diferencia');
-- El total de cada venta sigue cuadrando con sus renglones (debe devolver vacío)
SELECT v.id_venta, v.total, IFNULL(SUM(d.subtotal), 0) AS suma_renglones
  FROM ventas v LEFT JOIN detalle_venta d ON d.id_venta = v.id_venta
 GROUP BY v.id_venta, v.total HAVING v.total <> IFNULL(SUM(d.subtotal), 0);
-- Siguen siendo 16 restricciones CHECK
SELECT COUNT(*) AS checks_total FROM information_schema.table_constraints
 WHERE table_schema = DATABASE() AND constraint_type = 'CHECK';
