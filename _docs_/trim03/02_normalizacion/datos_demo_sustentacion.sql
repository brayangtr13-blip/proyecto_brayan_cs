-- =====================================================================
-- Control Store - Datos de demostracion para la sustentacion
--
-- YA CARGADO en el volcado del 23/09/2026. Para llegar a 10 registros
-- por tabla se ejecuta DESPUES 03_datos_diez_por_tabla.sql (25/09/2026).
--
-- Simula UN turno de caja completo y real: apertura, tres ventas con
-- distintos metodos de pago, un domicilio, reposicion de inventario,
-- auditoria del sistema y una conversacion activa del ChatBot con el
-- carrito ya normalizado (la prueba viva de la migracion 04).
--
-- Estos datos quedan PERMANENTES en controlstore_sena, a diferencia de
-- las pruebas de la migracion 04 (aquellas se insertaron y se borraron).
-- El objetivo es que en la sustentacion se pueda abrir phpMyAdmin y
-- mostrar la base funcionando con informacion real, no vacia.
--
-- No se escribe ningun total a mano: los TOTALES DE LAS VENTAS los
-- calculan solos los tres triggers de la migracion 04. Eso es, de
-- hecho, la demostracion mas convincente de que funcionan.
-- =====================================================================

USE controlstore_sena;


-- ===== 1. Clientes =====
INSERT INTO clientes (nombre, telefono, direccion, barrio) VALUES
  ('Maria Restrepo', '3011234567', 'Calle 12 # 4-30', 'Centro'),
  ('Carlos Ruiz',     '3109876543', 'Carrera 7 # 15-02', 'La Playa');

SET @cliente_maria  = (SELECT id_cliente FROM clientes WHERE telefono = '3011234567');
SET @cliente_carlos = (SELECT id_cliente FROM clientes WHERE telefono = '3109876543');


-- ===== 2. Apertura de caja (turno de la tarde, cajero Juan Carlos) =====
-- Se abre con fecha_cierre en NULL: la caja queda "abierta" mientras
-- se registran las ventas del turno, igual que en la operacion real.
INSERT INTO arqueo_caja (id_usuario, fecha_apertura, monto_inicial)
VALUES (2, NOW() - INTERVAL 3 HOUR, 20000.00);

SET @arqueo = LAST_INSERT_ID();


-- ===== 3. Venta 1 - mostrador, efectivo =====
INSERT INTO ventas (id_usuario, id_arqueo, id_cliente, id_metodo_pago, fecha, total, estado)
VALUES (2, @arqueo, NULL, 1, NOW() - INTERVAL 2 HOUR, 0, 'pagada');
SET @venta1 = LAST_INSERT_ID();

INSERT INTO detalle_venta (id_venta, codigo_producto, cantidad, precio_venta) VALUES
  (@venta1, '7702001001', 2, 2850.00),   -- Leche Entera 1L
  (@venta1, '7702001005', 1, 3000.00);   -- Pan Tajado
-- El trigger trg_detalle_after_insert ya dejo ventas.total = 8700.00


-- ===== 4. Venta 2 - Maria, paga con Nequi, pide domicilio =====
INSERT INTO ventas (id_usuario, id_arqueo, id_cliente, id_metodo_pago, fecha, total, estado)
VALUES (2, @arqueo, @cliente_maria, 2, NOW() - INTERVAL 90 MINUTE, 0, 'pagada');
SET @venta2 = LAST_INSERT_ID();

INSERT INTO detalle_venta (id_venta, codigo_producto, cantidad, precio_venta) VALUES
  (@venta2, '7702001002', 1, 12500.00),  -- Arroz Blanco 5kg
  (@venta2, '7702001003', 2, 9900.00);   -- Cafe Molido 250g
-- El trigger deja ventas.total = 32300.00

INSERT INTO domicilios (id_venta, id_domiciliario, direccion_entrega, barrio,
                        telefono_contacto, estado, fecha_asignacion, fecha_entrega, observacion)
VALUES (@venta2, 3, 'Calle 12 # 4-30', 'Centro', '3011234567', 'entregado',
        NOW() - INTERVAL 80 MINUTE, NOW() - INTERVAL 40 MINUTE, 'Entregado en porteria');


-- ===== 5. Venta 3 - Carlos, efectivo =====
INSERT INTO ventas (id_usuario, id_arqueo, id_cliente, id_metodo_pago, fecha, total, estado)
VALUES (2, @arqueo, @cliente_carlos, 1, NOW() - INTERVAL 30 MINUTE, 0, 'pagada');
SET @venta3 = LAST_INSERT_ID();

INSERT INTO detalle_venta (id_venta, codigo_producto, cantidad, precio_venta) VALUES
  (@venta3, '7702001001', 3, 2850.00),   -- Leche Entera 1L
  (@venta3, '7702001002', 1, 12500.00);  -- Arroz Blanco 5kg
-- El trigger deja ventas.total = 21050.00


-- ===== 6. Cierre de caja =====
-- total_ventas: los TRES metodos de pago (para el reporte de facturacion)
-- total_efectivo: SOLO venta1 y venta3, que se pagaron en efectivo
-- monto_final: lo que debe haber fisicamente en el cajon
UPDATE arqueo_caja
   SET fecha_cierre   = NOW(),
       total_ventas   = (SELECT SUM(total) FROM ventas WHERE id_arqueo = @arqueo),
       total_efectivo = (SELECT SUM(v.total) FROM ventas v
                           JOIN metodos_pago m ON m.id_metodo_pago = v.id_metodo_pago
                          WHERE v.id_arqueo = @arqueo AND m.nombre = 'Efectivo'),
       monto_final    = 20000.00 + (SELECT SUM(v.total) FROM ventas v
                                      JOIN metodos_pago m ON m.id_metodo_pago = v.id_metodo_pago
                                     WHERE v.id_arqueo = @arqueo AND m.nombre = 'Efectivo'),
       observacion    = 'Turno de la tarde, sin novedades'
 WHERE id_arqueo = @arqueo;
-- diferencia se recalcula sola (GENERATED): debe quedar en 0.00


-- ===== 7. Movimientos de inventario =====
-- Reposicion: el azucar estaba en 0 unidades
INSERT INTO movimientos_inventario (codigo_producto, id_usuario, tipo, cantidad, observacion, fecha)
VALUES ('7702001004', 1, 'entrada', 30, 'Reposicion de stock, proveedor Alqueria', NOW() - INTERVAL 1 DAY);
UPDATE productos SET stock_actual = stock_actual + 30 WHERE codigo_producto = '7702001004';

-- Salidas por las ventas del turno (kardex), agrupadas por producto
INSERT INTO movimientos_inventario (codigo_producto, id_usuario, tipo, cantidad, observacion, fecha) VALUES
  ('7702001001', 2, 'salida', 5, 'Venta de mostrador, turno tarde', NOW() - INTERVAL 30 MINUTE),
  ('7702001005', 2, 'salida', 1, 'Venta de mostrador, turno tarde', NOW() - INTERVAL 2 HOUR),
  ('7702001002', 2, 'salida', 2, 'Venta de mostrador, turno tarde', NOW() - INTERVAL 30 MINUTE),
  ('7702001003', 2, 'salida', 2, 'Venta de mostrador, turno tarde', NOW() - INTERVAL 90 MINUTE);

UPDATE productos SET stock_actual = stock_actual - 5 WHERE codigo_producto = '7702001001';
UPDATE productos SET stock_actual = stock_actual - 1 WHERE codigo_producto = '7702001005';
UPDATE productos SET stock_actual = stock_actual - 2 WHERE codigo_producto = '7702001002';
UPDATE productos SET stock_actual = stock_actual - 2 WHERE codigo_producto = '7702001003';


-- ===== 8. Bitacora de auditoria =====
INSERT INTO log_auditoria (id_usuario, accion, modulo, detalle, ip, fecha) VALUES
  (2, 'login',      'usuarios',   'Inicio de sesion exitoso', '192.168.1.15', NOW() - INTERVAL 3 HOUR),
  (2, 'registrar',  'ventas',     CONCAT('Registro la venta #', @venta1, ' por $8.700'), '192.168.1.15', NOW() - INTERVAL 2 HOUR),
  (2, 'registrar',  'ventas',     CONCAT('Registro la venta #', @venta2, ' por $32.300'), '192.168.1.15', NOW() - INTERVAL 90 MINUTE),
  (1, 'actualizar', 'inventario', 'Ingreso de stock: Azucar Blanca 2kg, +30 unidades', '192.168.1.10', NOW() - INTERVAL 1 DAY),
  (3, 'actualizar', 'domicilios', CONCAT('Marco el domicilio de la venta #', @venta2, ' como entregado'), '192.168.1.22', NOW() - INTERVAL 40 MINUTE);


-- ===== 9. Conversacion activa del ChatBot =====
-- Un cliente nuevo, todavia sin identificar (id_cliente NULL), armando
-- su pedido. Esta es la prueba viva de la migracion 04: el carrito ya
-- NO es una columna JSON, son filas normalizadas con llave foranea real.
INSERT INTO sesiones_chatbot (telefono, paso, direccion_temp, barrio_temp)
VALUES ('3204445566', 'esperando_confirmacion', 'Carrera 15 # 22-10', 'Los Alamos');
SET @sesion = LAST_INSERT_ID();

INSERT INTO carrito_chatbot (id_sesion, codigo_producto, cantidad) VALUES
  (@sesion, '7702001003', 1),   -- Cafe Molido 250g
  (@sesion, '7702001005', 2);   -- Pan Tajado


-- =====================================================================
-- VERIFICACION - confirma que todo el turno cuadra
-- =====================================================================

SELECT 'Resumen del turno' AS reporte,
       a.id_arqueo, a.monto_inicial, a.total_ventas, a.total_efectivo,
       a.monto_final, a.diferencia,
       IF(a.diferencia = 0, 'CAJA CUADRADA', 'REVISAR') AS estado
  FROM arqueo_caja a WHERE a.id_arqueo = @arqueo;

SELECT 'Ventas del turno' AS reporte, v.id_venta, v.total, m.nombre AS metodo_pago, v.estado
  FROM ventas v JOIN metodos_pago m ON m.id_metodo_pago = v.id_metodo_pago
 WHERE v.id_arqueo = @arqueo;

SELECT 'Carrito del ChatBot (normalizado)' AS reporte,
       s.telefono, p.nombre AS producto, c.cantidad, p.precio_unitario,
       c.cantidad * p.precio_unitario AS subtotal
  FROM carrito_chatbot c
  JOIN sesiones_chatbot s ON s.id_sesion = c.id_sesion
  JOIN productos p ON p.codigo_producto = c.codigo_producto
 WHERE s.id_sesion = @sesion;

SELECT 'Stock actualizado' AS reporte, codigo_producto, nombre, stock_actual FROM productos;
