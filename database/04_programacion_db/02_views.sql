-- |||=============================================================================================|||
-- |||                       CONTROL STORE · AUTOSERVICIO AYUELAL · SENA ADSO                       |||
-- |||                           04.02 · VISTAS (VIEWS) · MySQL 8.4                                 |||
-- |||=============================================================================================|||
-- |||                                                                                             |||
-- |||  Una VISTA es una consulta guardada con nombre. No guarda datos: cada vez que se consulta    |||
-- |||  vuelve a leer las tablas. Sirve para los reportes (RF26 a RF30) y para no repetir JOINs.    |||
-- |||                                                                                             |||
-- |||  CONTENIDO                                                                                  |||
-- |||    01. Crear vista ............. CREATE OR REPLACE VIEW ____ AS SELECT ... ;                  |||
-- |||        vw_ventas_diarias        RF26 · ventas por día y método de pago                       |||
-- |||        vw_productos_mas_vendidos RF27 · unidades y dinero por producto                       |||
-- |||        vw_inventario_stock_bajo RF28 · productos en o por debajo del stock mínimo            |||
-- |||        vw_arqueos_caja          RF29 · cierres de caja con su diferencia                      |||
-- |||        vw_domicilios_detalle    RF30 · domicilios con cliente, barrio y domiciliario          |||
-- |||        vw_usuarios_roles        usuarios sin la contraseña (seguridad)                         |||
-- |||    02. Consultar vista ......... SELECT * FROM ____ ;                                         |||
-- |||    03. Ver vistas .............. SHOW FULL TABLES WHERE Table_type = 'VIEW' ;                 |||
-- |||                                   SHOW CREATE VIEW ____ ;                                     |||
-- |||    04. Eliminar vista .......... DROP VIEW IF EXISTS ____ ;                                    |||
-- |||                                                                                             |||
-- |||  EN CONSOLA: mysql> SOURCE C:/Users/bryan/proyecto_grado_alexander/database/04_programacion_db/02_views.sql
-- |||=============================================================================================|||

USE controlstore_sena;

-- ---------------------------------------------------------------------------------------------------
-- 01. CREAR VISTAS ............................................. CREATE OR REPLACE VIEW ____ AS ;
-- ---------------------------------------------------------------------------------------------------

-- RF26 · Reporte de ventas diarias. Las ventas anuladas no suman.
CREATE OR REPLACE VIEW vw_ventas_diarias AS
SELECT DATE(v.fecha)        AS dia,
       mp.nombre            AS metodo_pago,
       COUNT(*)             AS cantidad_ventas,
       SUM(v.total)         AS total_vendido
  FROM ventas v
 INNER JOIN metodos_pago mp ON mp.id_metodo_pago = v.id_metodo_pago
 WHERE v.estado <> 'anulada'
 GROUP BY DATE(v.fecha), mp.nombre;

-- RF27 · Productos más vendidos (solo ventas no anuladas).
CREATE OR REPLACE VIEW vw_productos_mas_vendidos AS
SELECT p.codigo_producto,
       p.nombre             AS producto,
       c.nombre             AS categoria,
       SUM(d.cantidad)      AS unidades_vendidas,
       SUM(d.subtotal)      AS dinero_vendido
  FROM detalle_venta d
 INNER JOIN ventas v     ON v.id_venta = d.id_venta
 INNER JOIN productos p  ON p.codigo_producto = d.codigo_producto
 INNER JOIN categorias c ON c.id_categoria = p.id_categoria
 WHERE v.estado <> 'anulada'
 GROUP BY p.codigo_producto, p.nombre, c.nombre;

-- RF28 · Alerta de inventario: productos activos en o por debajo del mínimo.
CREATE OR REPLACE VIEW vw_inventario_stock_bajo AS
SELECT p.codigo_producto,
       p.nombre                          AS producto,
       p.stock_actual,
       p.stock_minimo,
       p.stock_minimo - p.stock_actual   AS faltan_para_minimo
  FROM productos p
 WHERE p.activo = 1
   AND p.stock_actual <= p.stock_minimo;

-- RF29 · Arqueos de caja: quién abrió, cuánto vendió y si cuadró.
CREATE OR REPLACE VIEW vw_arqueos_caja AS
SELECT a.id_arqueo,
       CONCAT(u.nombre, ' ', u.apellido) AS cajero,
       a.fecha_apertura,
       a.fecha_cierre,
       a.monto_inicial,
       a.total_efectivo,
       a.monto_final,
       a.diferencia,
       CASE
         WHEN a.fecha_cierre IS NULL THEN 'abierta'
         WHEN a.diferencia = 0       THEN 'cuadrada'
         WHEN a.diferencia > 0       THEN 'sobrante'
         ELSE                             'faltante'
       END                               AS resultado
  FROM arqueo_caja a
 INNER JOIN usuarios u ON u.id_usuario = a.id_usuario;

-- RF30 · Domicilios: LEFT JOIN porque un domicilio pendiente todavía no tiene domiciliario.
CREATE OR REPLACE VIEW vw_domicilios_detalle AS
SELECT d.id_domicilio,
       d.id_venta,
       CONCAT(c.nombre, ' ', c.apellido)  AS cliente,
       b.nombre                           AS barrio,
       d.direccion_entrega,
       d.costo_envio,
       d.estado,
       CONCAT(u.nombre, ' ', u.apellido)  AS domiciliario,
       d.fecha_asignacion,
       d.fecha_entrega
  FROM domicilios d
 INNER JOIN ventas v   ON v.id_venta = d.id_venta
 LEFT  JOIN clientes c ON c.id_cliente = v.id_cliente
 INNER JOIN barrios b  ON b.id_barrio = d.id_barrio
 LEFT  JOIN usuarios u ON u.id_usuario = d.id_domiciliario;

-- Seguridad · lista de usuarios SIN la columna contrasena_hash (a quien solo tenga
-- permiso sobre esta vista nunca le llega el hash).
CREATE OR REPLACE VIEW vw_usuarios_roles AS
SELECT u.id_usuario,
       u.documento,
       CONCAT(u.nombre, ' ', u.apellido)  AS usuario,
       u.email,
       r.nombre                           AS rol,
       IF(u.activo = 1, 'activo', 'inactivo') AS estado,
       u.intentos_fallidos
  FROM usuarios u
 INNER JOIN roles r ON r.id_rol = u.id_rol;


-- ---------------------------------------------------------------------------------------------------
-- 02. CONSULTAR VISTAS ........................................................ SELECT * FROM ____ ;
-- ---------------------------------------------------------------------------------------------------
SELECT * FROM vw_ventas_diarias ORDER BY dia, metodo_pago;
SELECT * FROM vw_productos_mas_vendidos ORDER BY unidades_vendidas DESC LIMIT 5;
SELECT * FROM vw_inventario_stock_bajo;
SELECT * FROM vw_arqueos_caja ORDER BY id_arqueo;
SELECT * FROM vw_domicilios_detalle ORDER BY id_domicilio;
SELECT * FROM vw_usuarios_roles;

-- Una vista se usa como una tabla: se le puede poner WHERE, ORDER BY, funciones...
SELECT SUM(total_vendido) AS total_general FROM vw_ventas_diarias;


-- ---------------------------------------------------------------------------------------------------
-- 03. VER VISTAS .................. SHOW FULL TABLES WHERE Table_type = 'VIEW' ; SHOW CREATE VIEW ;
-- ---------------------------------------------------------------------------------------------------
SHOW FULL TABLES WHERE Table_type = 'VIEW';
SHOW CREATE VIEW vw_inventario_stock_bajo;


-- ---------------------------------------------------------------------------------------------------
-- 04. ELIMINAR VISTA ................................................... DROP VIEW IF EXISTS ____ ;
-- ---------------------------------------------------------------------------------------------------
-- DROP VIEW IF EXISTS vw_usuarios_roles;   -- quitar el -- para probar; se vuelve a crear con este script
