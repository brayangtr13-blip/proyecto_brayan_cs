-- |||=============================================================================================|||
-- |||                       CONTROL STORE · AUTOSERVICIO AYUELAL · SENA ADSO                       |||
-- |||          03.02 · SENTENCIAS DML · UNA SOLA TABLA (INSERT, UPDATE, DELETE, SELECT)            |||
-- |||=============================================================================================|||
-- |||                                                                                             |||
-- |||  DML = las sentencias que trabajan con los DATOS (filas): agregar, cambiar, borrar, consultar|||
-- |||                                                                                             |||
-- |||  CONTENIDO                                                                                  |||
-- |||    01. INSERT correcto ............... INSERT INTO ____ (____) VALUES (____) ;              |||
-- |||    02. INSERT incorrectos ............ las restricciones de la BD los rechazan               |||
-- |||    03. UPDATE ........................ UPDATE ____ SET ____ WHERE ____ ;                     |||
-- |||    04. DELETE ........................ DELETE FROM ____ WHERE ____ ;                         |||
-- |||    05. SELECT general y específico ... SELECT * / SELECT col1, col2 FROM ____ ;              |||
-- |||    06. WHERE con operadores lógicos .. AND · OR · NOT                                        |||
-- |||    07. Operadores de comparación ..... =  <>  <  >  <=  >=                                   |||
-- |||    08. LIKE .......................... 'A%' empieza · '%a' termina · '%a%' contiene          |||
-- |||    09. BETWEEN e IN .................. rango · lista de valores                              |||
-- |||    10. IS NULL / IS NOT NULL                                                                 |||
-- |||    11. ORDER BY y LIMIT .............. ASC · DESC · los N primeros                           |||
-- |||    12. DISTINCT ...................... sin repetidos                                         |||
-- |||    13. Funciones de agregado ......... COUNT · SUM · AVG · MAX · MIN                         |||
-- |||    14. GROUP BY y HAVING ............. agrupar · filtrar grupos                              |||
-- |||    15. Alias y cálculos .............. AS · ROUND · IVA 19 %                                 |||
-- |||    16. Funciones de texto ............ CONCAT · UPPER · LOWER · LENGTH                       |||
-- |||    17. Funciones de fecha ............ NOW · DATE_FORMAT · TIMESTAMPDIFF · DATEDIFF          |||
-- |||    18. CASE .......................... clasificar con condiciones                           |||
-- |||                                                                                             |||
-- |||  Todo lo que cambia datos usa la fila de práctica id_categoria = 99, que se borra al final:  |||
-- |||  la base queda igual que antes de correr el script.                                         |||
-- |||                                                                                             |||
-- |||  EN CONSOLA: mysql> SOURCE C:/Users/bryan/proyecto_grado_alexander/database/03_sentencias_dml/02_db_dml_una_tabla.sql
-- |||=============================================================================================|||

USE controlstore_sena;


-- ---------------------------------------------------------------------------------------------------
-- 01. INSERT CORRECTO .................................... INSERT INTO ____ (____) VALUES (____) ;
-- ---------------------------------------------------------------------------------------------------
INSERT INTO categorias (id_categoria, nombre, descripcion)
VALUES (99, 'Práctica', 'Categoría temporal para practicar DML');

SELECT * FROM categorias WHERE id_categoria = 99;


-- ---------------------------------------------------------------------------------------------------
-- 02. INSERT INCORRECTOS · la base de datos protege los datos (quitar el -- para ver cada error)
-- ---------------------------------------------------------------------------------------------------
-- a) Llave primaria repetida
-- INSERT INTO categorias (id_categoria, nombre) VALUES (99, 'Otra');
--    -> ERROR 1062: Duplicate entry '99' for key 'categorias.PRIMARY'

-- b) Valor único repetido (ya existe un usuario con ese documento)
-- INSERT INTO usuarios (documento, nombre, apellido, email, id_rol, contrasena_hash)
-- SELECT documento, 'X', 'Y', 'x@y.com', 2, 'hash' FROM usuarios WHERE id_usuario = 1;
--    -> ERROR 1062: Duplicate entry ... for key 'usuarios.uq_usuario_documento'

-- c) Llave foránea que no existe (no hay categoría 500)
-- INSERT INTO productos (codigo_producto, id_categoria, nombre, precio_compra, precio_unitario)
-- VALUES ('9999999999', 500, 'Producto fantasma', 1000, 1500);
--    -> ERROR 1452: Cannot add or update a child row: a foreign key constraint fails

-- d) CHECK: cantidad negativa en un movimiento
-- INSERT INTO movimientos_inventario (codigo_producto, id_usuario, tipo, cantidad)
-- VALUES ('7702001001', 1, 'entrada', -5);
--    -> ERROR 3819: Check constraint 'chk_mov_cantidad' is violated

-- e) Campo obligatorio vacío (nombre es NOT NULL)
-- INSERT INTO categorias (id_categoria, nombre) VALUES (98, NULL);
--    -> ERROR 1048: Column 'nombre' cannot be null

-- f) Valor fuera del ENUM
-- UPDATE ventas SET estado = 'regalada' WHERE id_venta = 2;
--    -> ERROR 1265: Data truncated for column 'estado'


-- ---------------------------------------------------------------------------------------------------
-- 03. UPDATE ............................................... UPDATE ____ SET ____ WHERE ____ ;
--     ¡Siempre con WHERE! Sin WHERE se cambian TODAS las filas.
-- ---------------------------------------------------------------------------------------------------
UPDATE categorias
   SET descripcion = 'Descripción cambiada con UPDATE'
 WHERE id_categoria = 99;

SELECT * FROM categorias WHERE id_categoria = 99;


-- ---------------------------------------------------------------------------------------------------
-- 04. DELETE ................................................... DELETE FROM ____ WHERE ____ ;
-- ---------------------------------------------------------------------------------------------------
DELETE FROM categorias WHERE id_categoria = 99;

SELECT COUNT(*) AS queda_la_fila_99 FROM categorias WHERE id_categoria = 99;   -- 0


-- ---------------------------------------------------------------------------------------------------
-- 05. SELECT GENERAL Y ESPECÍFICO
-- ---------------------------------------------------------------------------------------------------
SELECT * FROM productos;                                                  -- todas las columnas
SELECT codigo_producto, nombre, precio_unitario FROM productos;           -- solo algunas


-- ---------------------------------------------------------------------------------------------------
-- 06. WHERE CON OPERADORES LÓGICOS ................................................ AND · OR · NOT
-- ---------------------------------------------------------------------------------------------------
-- AND: las dos condiciones se cumplen (cajeros activos)
SELECT id_usuario, nombre, apellido FROM usuarios WHERE id_rol = 2 AND activo = 1;

-- OR: basta con una (administradores o domiciliarios)
SELECT id_usuario, nombre, id_rol FROM usuarios WHERE id_rol = 1 OR id_rol = 3;

-- NOT: lo contrario (ventas que NO están pagadas)
SELECT id_venta, estado, total FROM ventas WHERE NOT estado = 'pagada';


-- ---------------------------------------------------------------------------------------------------
-- 07. OPERADORES DE COMPARACIÓN .............................................. = <> < > <= >=
-- ---------------------------------------------------------------------------------------------------
SELECT nombre, precio_unitario FROM productos WHERE precio_unitario =  4500;
SELECT nombre, precio_unitario FROM productos WHERE precio_unitario <> 4500;
SELECT nombre, precio_unitario FROM productos WHERE precio_unitario <  5000;
SELECT nombre, precio_unitario FROM productos WHERE precio_unitario >  10000;
SELECT nombre, stock_actual    FROM productos WHERE stock_actual    <= stock_minimo;   -- stock bajo
SELECT id_venta, total         FROM ventas    WHERE total           >= 20000;


-- ---------------------------------------------------------------------------------------------------
-- 08. LIKE ........................................... % = cualquier texto · _ = un solo carácter
-- ---------------------------------------------------------------------------------------------------
SELECT nombre FROM productos WHERE nombre LIKE 'A%';        -- empieza por A
SELECT nombre FROM productos WHERE nombre LIKE '%L';        -- termina en L (1L, 1.5L)
SELECT nombre FROM productos WHERE nombre LIKE '%lata%';    -- contiene "lata"
SELECT email  FROM usuarios  WHERE email  LIKE '%@controlstore.com';   -- correos de la empresa


-- ---------------------------------------------------------------------------------------------------
-- 09. BETWEEN (rango, incluye los extremos) e IN (lista)
-- ---------------------------------------------------------------------------------------------------
SELECT nombre, precio_unitario FROM productos WHERE precio_unitario BETWEEN 3000 AND 6000;
SELECT id_venta, fecha FROM ventas WHERE fecha BETWEEN '2026-09-12' AND '2026-09-16 23:59:59';
SELECT nombre, costo_domicilio FROM barrios WHERE nombre IN ('Centro', 'La Playa', 'San José');
SELECT id_domicilio, estado FROM domicilios WHERE estado NOT IN ('entregado', 'cancelado');


-- ---------------------------------------------------------------------------------------------------
-- 10. IS NULL / IS NOT NULL ........................ con NULL no sirve el =, se usa IS
-- ---------------------------------------------------------------------------------------------------
SELECT id_arqueo, fecha_apertura FROM arqueo_caja WHERE fecha_cierre IS NULL;      -- cajas abiertas
SELECT id_venta, id_cliente      FROM ventas      WHERE id_cliente   IS NOT NULL;  -- con cliente


-- ---------------------------------------------------------------------------------------------------
-- 11. ORDER BY Y LIMIT
-- ---------------------------------------------------------------------------------------------------
SELECT nombre, precio_unitario FROM productos ORDER BY precio_unitario ASC;    -- más barato primero
SELECT nombre, precio_unitario FROM productos ORDER BY precio_unitario DESC;   -- más caro primero
SELECT nombre, apellido FROM usuarios ORDER BY apellido, nombre;               -- dos criterios
SELECT id_venta, total FROM ventas ORDER BY total DESC LIMIT 3;                -- las 3 más grandes


-- ---------------------------------------------------------------------------------------------------
-- 12. DISTINCT .................................................. quita los valores repetidos
-- ---------------------------------------------------------------------------------------------------
SELECT DISTINCT estado FROM domicilios;
SELECT DISTINCT id_usuario FROM ventas;


-- ---------------------------------------------------------------------------------------------------
-- 13. FUNCIONES DE AGREGADO ....................................... COUNT · SUM · AVG · MAX · MIN
-- ---------------------------------------------------------------------------------------------------
SELECT COUNT(*)              AS cantidad_productos FROM productos;
SELECT SUM(total)            AS total_vendido      FROM ventas WHERE estado = 'pagada';
SELECT AVG(total)            AS venta_promedio     FROM ventas WHERE estado = 'pagada';
SELECT MAX(precio_unitario)  AS producto_mas_caro  FROM productos;
SELECT MIN(precio_unitario)  AS producto_mas_barato FROM productos;


-- ---------------------------------------------------------------------------------------------------
-- 14. GROUP BY Y HAVING
--     GROUP BY arma grupos · HAVING filtra los grupos (WHERE filtra filas, HAVING filtra grupos)
-- ---------------------------------------------------------------------------------------------------
SELECT id_usuario, COUNT(*) AS ventas_hechas, SUM(total) AS dinero
  FROM ventas
 WHERE estado = 'pagada'
 GROUP BY id_usuario;

SELECT id_categoria, COUNT(*) AS productos
  FROM productos
 GROUP BY id_categoria
HAVING COUNT(*) >= 2;

SELECT tipo, SUM(cantidad) AS unidades FROM movimientos_inventario GROUP BY tipo;


-- ---------------------------------------------------------------------------------------------------
-- 15. ALIAS Y CÁLCULOS ...................................... AS · operaciones · ROUND(valor, 2)
-- ---------------------------------------------------------------------------------------------------
SELECT nombre                                          AS producto,
       precio_compra                                   AS costo,
       precio_unitario                                 AS precio,
       precio_unitario - precio_compra                 AS ganancia,
       ROUND((precio_unitario - precio_compra) / precio_compra * 100, 2) AS margen_pct,
       ROUND(precio_unitario * 0.19, 2)                AS iva_19,
       ROUND(precio_unitario * 1.19, 2)                AS precio_con_iva
  FROM productos;

SELECT nombre, stock_actual * precio_compra AS valor_inventario FROM productos;


-- ---------------------------------------------------------------------------------------------------
-- 16. FUNCIONES DE TEXTO ........................................ CONCAT · UPPER · LOWER · LENGTH
-- ---------------------------------------------------------------------------------------------------
SELECT CONCAT(nombre, ' ', apellido) AS nombre_completo,
       UPPER(apellido)               AS apellido_mayus,
       LOWER(email)                  AS correo,
       LENGTH(documento)             AS digitos_documento
  FROM usuarios;


-- ---------------------------------------------------------------------------------------------------
-- 17. FUNCIONES DE FECHA ................... NOW · CURDATE · DATE_FORMAT · TIMESTAMPDIFF · DATEDIFF
-- ---------------------------------------------------------------------------------------------------
SELECT NOW() AS ahora, CURDATE() AS hoy;

SELECT id_venta,
       DATE_FORMAT(fecha, '%d/%m/%Y %h:%i %p') AS fecha_colombia,
       DATEDIFF(CURDATE(), fecha)              AS dias_desde_la_venta
  FROM ventas;

SELECT id_domicilio,
       TIMESTAMPDIFF(MINUTE, fecha_asignacion, fecha_entrega) AS minutos_en_entregar
  FROM domicilios
 WHERE fecha_entrega IS NOT NULL;

SELECT id_arqueo,
       TIMESTAMPDIFF(HOUR, fecha_apertura, fecha_cierre) AS horas_de_turno
  FROM arqueo_caja;


-- ---------------------------------------------------------------------------------------------------
-- 18. CASE ...................................................... clasificar con condiciones
-- ---------------------------------------------------------------------------------------------------
SELECT nombre, stock_actual, stock_minimo,
       CASE
         WHEN stock_actual = 0             THEN 'AGOTADO'
         WHEN stock_actual <= stock_minimo THEN 'PEDIR YA'
         WHEN stock_actual <= stock_minimo * 2 THEN 'Revisar pronto'
         ELSE                                   'OK'
       END AS alerta
  FROM productos
 ORDER BY stock_actual;
