-- =====================================================================
-- Migración 06 - Restricciones CHECK en arqueo_caja (controlstore_sena, MySQL 8.4)
--
-- Revisión de normalización del 12-11-2026: las 18 tablas cumplen 1FN, 2FN y 3FN.
-- Solo faltaba proteger los montos del turno de caja: ningún valor puede ser negativo.
-- No cambia la estructura ni los datos: agrega 4 restricciones.
--
-- Requiere la migración 05 (modelo de 18 tablas) ya aplicada.
-- NO trae "USE": se ejecuta en la base de la conexión.
-- Primero en controlstore_sena_prueba; si todo sale bien, en controlstore_sena (con respaldo antes).
-- =====================================================================

-- BLOQUE 0 · Comprobar en qué base se está trabajando
SELECT DATABASE() AS base_actual;

-- BLOQUE 1 · Comprobación previa: debe devolver vacío
-- (si un turno ya tuviera un monto negativo, la restricción no se podría crear)
SELECT id_arqueo, monto_inicial, monto_final, total_ventas, total_efectivo
  FROM arqueo_caja
 WHERE monto_inicial < 0 OR monto_final < 0 OR total_ventas < 0 OR total_efectivo < 0;

-- BLOQUE 2 · Las restricciones
-- monto_final, total_ventas y total_efectivo quedan en NULL mientras el turno está abierto:
-- un CHECK con NULL no se viola, así que el turno abierto se sigue pudiendo guardar.
-- diferencia NO lleva CHECK: es una columna generada y puede ser negativa (faltante de caja).
ALTER TABLE arqueo_caja
  ADD CONSTRAINT chk_arqueo_monto_inicial  CHECK (monto_inicial  >= 0),
  ADD CONSTRAINT chk_arqueo_monto_final    CHECK (monto_final    >= 0),
  ADD CONSTRAINT chk_arqueo_total_ventas   CHECK (total_ventas   >= 0),
  ADD CONSTRAINT chk_arqueo_total_efectivo CHECK (total_efectivo >= 0);

-- BLOQUE 3 · Verificación
-- Deben salir las 4 restricciones nuevas
SELECT constraint_name FROM information_schema.table_constraints
 WHERE table_schema = DATABASE() AND table_name = 'arqueo_caja' AND constraint_type = 'CHECK'
 ORDER BY constraint_name;
-- En total el esquema queda con 16 restricciones CHECK (12 de la migración 05 + 4)
SELECT COUNT(*) AS checks_total FROM information_schema.table_constraints
 WHERE table_schema = DATABASE() AND constraint_type = 'CHECK';
-- Prueba: debe FALLAR con el error 3819 (Check constraint 'chk_arqueo_monto_inicial' is violated)
-- UPDATE arqueo_caja SET monto_inicial = -1000 WHERE id_arqueo = 2;
