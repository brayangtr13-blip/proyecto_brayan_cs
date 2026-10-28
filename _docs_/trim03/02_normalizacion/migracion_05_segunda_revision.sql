-- =====================================================================
-- Migración 05 - Segunda revisión de normalización (controlstore_sena)
-- Escrita a partir de la estructura del volcado del 23-09-2026 (MySQL 8.4.9); ejecutar primero en una copia
-- ANTES DE EJECUTAR: respaldo completo
--   mysqldump -u root -p --routines --triggers --single-transaction \
--     controlstore_sena > respaldo_controlstore_sena_AAAAMMDD_HHMMSS.sql
-- Tras ejecutarla, la base queda con 15 tablas (nueva: barrios).
-- =====================================================================
USE controlstore_sena;

-- ---------------------------------------------------------------------
-- Hallazgo 1: clientes.nombre guarda nombre y apellido (1FN)
-- ---------------------------------------------------------------------
ALTER TABLE clientes
  ADD COLUMN apellido VARCHAR(60) NULL
    COMMENT 'Apellidos del cliente' AFTER nombre;

-- MySQL evalúa las asignaciones de izquierda a derecha: apellido usa el nombre original.
-- Con nombres compuestos («Maria Fernanda Restrepo») revisar el resultado a mano.
UPDATE clientes
   SET apellido = TRIM(SUBSTRING(nombre, LOCATE(' ', nombre) + 1)),
       nombre   = TRIM(SUBSTRING_INDEX(nombre, ' ', 1))
 WHERE LOCATE(' ', nombre) > 0;

-- ---------------------------------------------------------------------
-- Hallazgo 2: unicidad de la pareja (id_venta, codigo_producto)
-- ---------------------------------------------------------------------
-- Revisar antes que no existan duplicados (debe devolver vacío):
SELECT id_venta, codigo_producto, COUNT(*) AS veces
  FROM detalle_venta
 GROUP BY id_venta, codigo_producto
HAVING COUNT(*) > 1;

ALTER TABLE detalle_venta
  ADD CONSTRAINT uq_detalle_venta_producto
  UNIQUE (id_venta, codigo_producto);

-- ---------------------------------------------------------------------
-- Hallazgo 3: barrio como texto libre repetido en clientes y domicilios
--             (dependencia transitiva dirección -> barrio) -> catálogo
-- ---------------------------------------------------------------------
CREATE TABLE barrios (
  id_barrio INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del barrio',
  nombre    VARCHAR(50) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Nombre del barrio o sector',
  PRIMARY KEY (id_barrio),
  UNIQUE KEY uq_barrio_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci
  COMMENT='Catálogo de barrios o sectores de clientes y entregas';

-- Cargar los barrios que ya existen (sin repetir)
INSERT INTO barrios (nombre)
SELECT nombre FROM (
  SELECT TRIM(barrio) AS nombre FROM clientes   WHERE barrio IS NOT NULL AND TRIM(barrio) <> ''
  UNION
  SELECT TRIM(barrio)           FROM domicilios WHERE barrio IS NOT NULL AND TRIM(barrio) <> ''
) AS t
ORDER BY nombre;   -- con los datos actuales: 1 = Centro, 2 = La Playa

-- clientes
ALTER TABLE clientes
  ADD COLUMN id_barrio INT NULL COMMENT 'FK: barrio del cliente (opcional)' AFTER direccion;
UPDATE clientes c JOIN barrios b ON b.nombre = TRIM(c.barrio) SET c.id_barrio = b.id_barrio;
ALTER TABLE clientes
  ADD CONSTRAINT fk_cliente_barrio FOREIGN KEY (id_barrio)
    REFERENCES barrios(id_barrio) ON DELETE SET NULL ON UPDATE CASCADE;

-- domicilios
ALTER TABLE domicilios
  ADD COLUMN id_barrio INT NULL COMMENT 'FK: barrio de entrega (opcional)' AFTER direccion_entrega;
UPDATE domicilios d JOIN barrios b ON b.nombre = TRIM(d.barrio) SET d.id_barrio = b.id_barrio;
ALTER TABLE domicilios
  ADD CONSTRAINT fk_domicilio_barrio FOREIGN KEY (id_barrio)
    REFERENCES barrios(id_barrio) ON DELETE SET NULL ON UPDATE CASCADE;

-- Comprobar que no se perdió ningún barrio ANTES de borrar las columnas (ambas deben devolver vacío):
SELECT id_cliente, barrio   FROM clientes   WHERE barrio IS NOT NULL AND id_barrio IS NULL;
SELECT id_domicilio, barrio FROM domicilios WHERE barrio IS NOT NULL AND id_barrio IS NULL;

ALTER TABLE clientes   DROP COLUMN barrio;
ALTER TABLE domicilios DROP COLUMN barrio;
-- sesiones_chatbot.barrio_temp se conserva: es texto crudo capturado en la conversación,
-- aún no validado (igual que direccion_temp).

-- ---------------------------------------------------------------------
-- Hallazgo 4: verificación permanente de datos derivados (ambas deben devolver vacío)
-- ---------------------------------------------------------------------
SELECT a.id_arqueo, a.total_ventas, IFNULL(SUM(v.total), 0) AS total_real
  FROM arqueo_caja a
  LEFT JOIN ventas v ON v.id_arqueo = a.id_arqueo AND v.estado = 'pagada'
 GROUP BY a.id_arqueo, a.total_ventas
HAVING a.total_ventas <> IFNULL(SUM(v.total), 0);

SELECT a.id_arqueo, a.total_efectivo,
       IFNULL(SUM(CASE WHEN m.nombre = 'Efectivo' THEN v.total END), 0) AS efectivo_real
  FROM arqueo_caja a
  LEFT JOIN ventas v ON v.id_arqueo = a.id_arqueo AND v.estado = 'pagada'
  LEFT JOIN metodos_pago m ON m.id_metodo_pago = v.id_metodo_pago
 GROUP BY a.id_arqueo, a.total_efectivo
HAVING a.total_efectivo <> IFNULL(SUM(CASE WHEN m.nombre = 'Efectivo' THEN v.total END), 0);
