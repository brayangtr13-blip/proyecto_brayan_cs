-- |||=============================================================================================|||
-- |||                       CONTROL STORE · AUTOSERVICIO AYUELAL · SENA ADSO                       |||
-- |||           03.03 · SENTENCIAS DML · VARIAS TABLAS (JOIN, UNION, SUBCONSULTAS)                 |||
-- |||=============================================================================================|||
-- |||                                                                                             |||
-- |||  CONTENIDO                                                                                  |||
-- |||    01. Crear tabla desde consulta .... CREATE TABLE ____ AS SELECT ... ;                     |||
-- |||    02. Insertar desde consulta ....... INSERT INTO ____ SELECT ... ;                         |||
-- |||    03. UNION y UNION ALL ............. juntar resultados (sin / con repetidos)               |||
-- |||    04. INNER JOIN .................... solo las filas que coinciden en las dos tablas       |||
-- |||    05. INNER JOIN de 3 o más tablas                                                          |||
-- |||    06. INNER JOIN con DISTINCT y con condición                                               |||
-- |||    07. LEFT JOIN ..................... todas las de la izquierda, aunque no coincidan       |||
-- |||    08. RIGHT JOIN .................... todas las de la derecha, aunque no coincidan         |||
-- |||    09. JOIN con GROUP BY ............. reportes                                              |||
-- |||    10. Subconsulta escalonada ........ WHERE col = (SELECT ...)  (devuelve un valor)          |||
-- |||    11. Subconsulta de lista .......... WHERE col IN (SELECT ...)  (devuelve varios)          |||
-- |||    12. Subconsulta correlacionada .... la subconsulta usa la fila de afuera                 |||
-- |||    13. EXISTS / NOT EXISTS                                                                   |||
-- |||    14. UPDATE y DELETE con JOIN ...... cambiar/borrar usando otra tabla                      |||
-- |||    15. Borrar en tablas relacionadas . ON DELETE CASCADE vs RESTRICT                         |||
-- |||    16. Limpieza ...................... DROP TABLE de las tablas de práctica                 |||
-- |||                                                                                             |||
-- |||  Las tablas que empiezan por tmp_ son de práctica y se borran al final.                     |||
-- |||                                                                                             |||
-- |||  EN CONSOLA: mysql> SOURCE C:/Users/bryan/proyecto_grado_alexander/database/03_sentencias_dml/03_db_dml_multitabla.sql
-- |||=============================================================================================|||

USE controlstore_sena;
DROP TABLE IF EXISTS tmp_productos_bebidas;
DROP TABLE IF EXISTS tmp_contactos;


-- ---------------------------------------------------------------------------------------------------
-- 01. CREAR TABLA DESDE UNA CONSULTA ..................... CREATE TABLE ____ AS SELECT ... ;
--     Crea la tabla con las columnas del SELECT y la llena con sus filas.
-- ---------------------------------------------------------------------------------------------------
CREATE TABLE tmp_productos_bebidas AS
SELECT p.codigo_producto, p.nombre, p.precio_unitario
  FROM productos p
 INNER JOIN categorias c ON c.id_categoria = p.id_categoria
 WHERE c.nombre = 'Bebidas';

SELECT * FROM tmp_productos_bebidas;


-- ---------------------------------------------------------------------------------------------------
-- 02. INSERTAR DESDE UNA CONSULTA .............................. INSERT INTO ____ SELECT ... ;
-- ---------------------------------------------------------------------------------------------------
INSERT INTO tmp_productos_bebidas (codigo_producto, nombre, precio_unitario)
SELECT p.codigo_producto, p.nombre, p.precio_unitario
  FROM productos p
 INNER JOIN categorias c ON c.id_categoria = p.id_categoria
 WHERE c.nombre = 'Lácteos';

SELECT * FROM tmp_productos_bebidas;


-- ---------------------------------------------------------------------------------------------------
-- 03. UNION Y UNION ALL ..... los SELECT deben tener el mismo número de columnas
--     UNION quita los repetidos · UNION ALL deja todo
-- ---------------------------------------------------------------------------------------------------
-- Directorio de teléfonos: empleados + clientes
CREATE TABLE tmp_contactos AS
SELECT CONCAT(nombre, ' ', apellido) AS nombre, telefono, 'empleado' AS tipo FROM usuarios
UNION
SELECT CONCAT(nombre, ' ', apellido),           telefono, 'cliente'          FROM clientes;

SELECT * FROM tmp_contactos ORDER BY tipo, nombre;

-- Diferencia entre UNION y UNION ALL
SELECT estado FROM ventas UNION     SELECT estado FROM domicilios;   -- cada estado una vez
SELECT estado FROM ventas UNION ALL SELECT estado FROM domicilios;   -- con repetidos


-- ---------------------------------------------------------------------------------------------------
-- 04. INNER JOIN ......... solo las filas que tienen pareja en las dos tablas
-- ---------------------------------------------------------------------------------------------------
SELECT u.id_usuario, u.nombre, u.apellido, r.nombre AS rol
  FROM usuarios u
 INNER JOIN roles r ON r.id_rol = u.id_rol;

SELECT p.nombre AS producto, c.nombre AS categoria
  FROM productos p
 INNER JOIN categorias c ON c.id_categoria = p.id_categoria;


-- ---------------------------------------------------------------------------------------------------
-- 05. INNER JOIN DE 3 O MÁS TABLAS · factura de la venta #2
-- ---------------------------------------------------------------------------------------------------
SELECT v.id_venta, v.fecha,
       CONCAT(u.nombre, ' ', u.apellido) AS cajero,
       p.nombre AS producto, d.cantidad, d.precio_venta, d.subtotal,
       mp.nombre AS metodo_pago
  FROM ventas v
 INNER JOIN usuarios u      ON u.id_usuario = v.id_usuario
 INNER JOIN detalle_venta d ON d.id_venta = v.id_venta
 INNER JOIN productos p     ON p.codigo_producto = d.codigo_producto
 INNER JOIN metodos_pago mp ON mp.id_metodo_pago = v.id_metodo_pago
 WHERE v.id_venta = 2;

-- Permisos de cada rol (tabla intermedia rol_permiso: relación muchos a muchos)
SELECT r.nombre AS rol, m.nombre AS modulo, p.codigo AS permiso
  FROM roles r
 INNER JOIN rol_permiso rp ON rp.id_rol = r.id_rol
 INNER JOIN permisos p     ON p.id_permiso = rp.id_permiso
 INNER JOIN modulos m      ON m.id_modulo = p.id_modulo
 ORDER BY r.id_rol, m.nombre, p.codigo;


-- ---------------------------------------------------------------------------------------------------
-- 06. INNER JOIN CON DISTINCT Y CON CONDICIÓN
-- ---------------------------------------------------------------------------------------------------
-- ¿Qué cajeros han vendido algo? (cada uno una sola vez)
SELECT DISTINCT u.nombre, u.apellido
  FROM usuarios u
 INNER JOIN ventas v ON v.id_usuario = u.id_usuario;

-- Productos vendidos por más de $10.000 en un solo renglón
SELECT v.id_venta, p.nombre, d.subtotal
  FROM detalle_venta d
 INNER JOIN ventas v    ON v.id_venta = d.id_venta
 INNER JOIN productos p ON p.codigo_producto = d.codigo_producto
 WHERE d.subtotal > 10000 AND v.estado = 'pagada';


-- ---------------------------------------------------------------------------------------------------
-- 07. LEFT JOIN · todos los de la izquierda; si no tienen pareja, salen columnas en NULL
-- ---------------------------------------------------------------------------------------------------
-- Todos los productos y cuántas unidades se han vendido (0 si nunca se vendió)
SELECT p.nombre, IFNULL(SUM(d.cantidad), 0) AS unidades_vendidas
  FROM productos p
  LEFT JOIN detalle_venta d ON d.codigo_producto = p.codigo_producto
 GROUP BY p.codigo_producto, p.nombre
 ORDER BY unidades_vendidas;

-- Ventas de mostrador (sin cliente): el LEFT JOIN deja el cliente en NULL
SELECT v.id_venta, v.total, c.nombre AS cliente
  FROM ventas v
  LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
 WHERE c.id_cliente IS NULL;


-- ---------------------------------------------------------------------------------------------------
-- 08. RIGHT JOIN · lo mismo, pero se conservan todos los de la derecha
-- ---------------------------------------------------------------------------------------------------
-- Todos los barrios y cuántos domicilios ha tenido cada uno
SELECT b.nombre AS barrio, COUNT(d.id_domicilio) AS domicilios
  FROM domicilios d
 RIGHT JOIN barrios b ON b.id_barrio = d.id_barrio
 GROUP BY b.id_barrio, b.nombre
 ORDER BY domicilios DESC;


-- ---------------------------------------------------------------------------------------------------
-- 09. JOIN CON GROUP BY · reportes
-- ---------------------------------------------------------------------------------------------------
-- Ventas por cajero
SELECT CONCAT(u.nombre, ' ', u.apellido) AS cajero,
       COUNT(v.id_venta) AS ventas, SUM(v.total) AS dinero
  FROM usuarios u
 INNER JOIN ventas v ON v.id_usuario = u.id_usuario
 WHERE v.estado = 'pagada'
 GROUP BY u.id_usuario, u.nombre, u.apellido
 ORDER BY dinero DESC;

-- Ventas por categoría
SELECT c.nombre AS categoria, SUM(d.subtotal) AS dinero
  FROM categorias c
 INNER JOIN productos p     ON p.id_categoria = c.id_categoria
 INNER JOIN detalle_venta d ON d.codigo_producto = p.codigo_producto
 GROUP BY c.id_categoria, c.nombre
HAVING SUM(d.subtotal) > 20000;


-- ---------------------------------------------------------------------------------------------------
-- 10. SUBCONSULTA ESCALONADA · el SELECT de adentro devuelve UN valor
-- ---------------------------------------------------------------------------------------------------
-- Productos más caros que el promedio
SELECT nombre, precio_unitario
  FROM productos
 WHERE precio_unitario > (SELECT AVG(precio_unitario) FROM productos);

-- La venta más grande
SELECT id_venta, fecha, total
  FROM ventas
 WHERE total = (SELECT MAX(total) FROM ventas);


-- ---------------------------------------------------------------------------------------------------
-- 11. SUBCONSULTA DE LISTA · el SELECT de adentro devuelve VARIOS valores (IN / NOT IN)
-- ---------------------------------------------------------------------------------------------------
-- Productos que nunca se han vendido
SELECT codigo_producto, nombre
  FROM productos
 WHERE codigo_producto NOT IN (SELECT DISTINCT codigo_producto FROM detalle_venta);

-- Clientes que han pedido domicilio
SELECT nombre, apellido
  FROM clientes
 WHERE id_cliente IN (SELECT v.id_cliente FROM ventas v
                       INNER JOIN domicilios d ON d.id_venta = v.id_venta);


-- ---------------------------------------------------------------------------------------------------
-- 12. SUBCONSULTA CORRELACIONADA · se ejecuta una vez por cada fila de afuera (usa p.)
-- ---------------------------------------------------------------------------------------------------
-- Productos que valen más que el promedio DE SU PROPIA categoría
SELECT p.nombre, p.precio_unitario, p.id_categoria
  FROM productos p
 WHERE p.precio_unitario > (SELECT AVG(p2.precio_unitario)
                              FROM productos p2
                             WHERE p2.id_categoria = p.id_categoria);

-- Cada usuario con su número de ventas (subconsulta en el SELECT)
SELECT u.nombre, u.apellido,
       (SELECT COUNT(*) FROM ventas v WHERE v.id_usuario = u.id_usuario) AS ventas
  FROM usuarios u;


-- ---------------------------------------------------------------------------------------------------
-- 13. EXISTS / NOT EXISTS · ¿hay al menos una fila que cumpla?
-- ---------------------------------------------------------------------------------------------------
-- Domiciliarios que tienen algún domicilio asignado
SELECT u.nombre, u.apellido
  FROM usuarios u
 WHERE EXISTS (SELECT 1 FROM domicilios d WHERE d.id_domiciliario = u.id_usuario);

-- Categorías sin productos
SELECT c.nombre
  FROM categorias c
 WHERE NOT EXISTS (SELECT 1 FROM productos p WHERE p.id_categoria = c.id_categoria);


-- ---------------------------------------------------------------------------------------------------
-- 14. UPDATE Y DELETE CON JOIN (sobre la tabla de práctica)
-- ---------------------------------------------------------------------------------------------------
-- Subir 10 % solo a las bebidas, usando la categoría de la tabla productos
UPDATE tmp_productos_bebidas t
 INNER JOIN productos p  ON p.codigo_producto = t.codigo_producto
 INNER JOIN categorias c ON c.id_categoria = p.id_categoria
   SET t.precio_unitario = ROUND(t.precio_unitario * 1.10, 0)
 WHERE c.nombre = 'Bebidas';

-- Borrar de la tabla de práctica los lácteos
DELETE t
  FROM tmp_productos_bebidas t
 INNER JOIN productos p  ON p.codigo_producto = t.codigo_producto
 INNER JOIN categorias c ON c.id_categoria = p.id_categoria
 WHERE c.nombre = 'Lácteos';

SELECT * FROM tmp_productos_bebidas;


-- ---------------------------------------------------------------------------------------------------
-- 15. BORRAR EN TABLAS RELACIONADAS
--     Cada llave foránea dice qué pasa al borrar al padre:
--       RESTRICT -> no deja borrar si tiene hijos (ventas -> usuarios)
--       CASCADE  -> borra también los hijos      (ventas -> detalle_venta)
--       SET NULL -> deja el hijo sin padre        (ventas -> clientes)
--     Se prueba dentro de una transacción y se deshace con ROLLBACK.
-- ---------------------------------------------------------------------------------------------------
SELECT table_name AS tabla_hija, constraint_name, referenced_table_name AS tabla_padre, delete_rule
  FROM information_schema.referential_constraints
 WHERE constraint_schema = 'controlstore_sena'
 ORDER BY referenced_table_name;

START TRANSACTION;
  SELECT COUNT(*) AS renglones_venta_2_antes FROM detalle_venta WHERE id_venta = 2;
  DELETE FROM domicilios WHERE id_venta = 2;       -- primero el hijo que es RESTRICT (si lo hay)
  DELETE FROM ventas WHERE id_venta = 2;           -- CASCADE: sus renglones se van con ella
  SELECT COUNT(*) AS renglones_venta_2_despues FROM detalle_venta WHERE id_venta = 2;
ROLLBACK;
SELECT COUNT(*) AS renglones_venta_2_restaurados FROM detalle_venta WHERE id_venta = 2;

-- Prueba que debe FALLAR (RESTRICT): un usuario con ventas no se puede borrar
-- DELETE FROM usuarios WHERE id_usuario = 2;
--   -> ERROR 1451: Cannot delete or update a parent row: a foreign key constraint fails


-- ---------------------------------------------------------------------------------------------------
-- 16. LIMPIEZA
-- ---------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS tmp_productos_bebidas;
DROP TABLE IF EXISTS tmp_contactos;
SHOW TABLES;                                       -- vuelven a ser las 18 tablas (+ las vistas)
