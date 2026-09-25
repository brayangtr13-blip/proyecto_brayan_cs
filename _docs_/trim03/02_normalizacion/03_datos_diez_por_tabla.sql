-- =====================================================================
-- Control Store - Autoservicio Ayuelal
-- 03 - Datos de prueba: minimo 10 registros en cada una de las 14 tablas
-- MySQL 8.4 · base controlstore_sena · 25/09/2026
--
-- PUNTO DE PARTIDA
--   El volcado del 23/09/2026 (controlstore_codigo.sql) con los datos de
--   datos_demo_sustentacion.sql. Este script SOLO AGREGA filas: no borra
--   ni cambia la estructura. Los ids van escritos a mano para que los
--   documentos de la sustentacion puedan citar cada registro.
--
-- SI SE EJECUTA DOS VECES
--   Se detiene en el primer INSERT con "#1062 - Duplicate entry" y no
--   agrega nada (todo va dentro de una transaccion).
--
-- POR QUE ALGUNAS TABLAS QUEDAN CON MAS DE 10
--   ventas tiene 12 porque domicilios necesita 10 ventas distintas
--   (id_venta es UNIQUE: un domicilio por venta) y 2 ventas son de
--   mostrador. Cada venta tiene al menos un renglon, asi que
--   detalle_venta queda con 20, y el kardex (movimientos_inventario)
--   registra una salida por renglon: 26.
--
-- LO QUE NO SE ESCRIBE A MANO (lo calcula el motor)
--   ventas.total          -> triggers de detalle_venta
--   detalle_venta.subtotal -> columna GENERATED
--   arqueo_caja.diferencia -> columna GENERATED
--   productos.stock_actual -> se recalcula desde el kardex al final
--
-- COMO EJECUTARLO EN phpMyAdmin
--   Base controlstore_sena -> pestana SQL -> pegar todo -> Continuar.
--   No necesita cambiar el delimitador (no crea triggers).
-- =====================================================================

USE controlstore_sena;

START TRANSACTION;

-- ===== 1. roles (3 -> 10) =====
-- Catalogo: el nombre depende solo de id_rol (y es UNIQUE).
INSERT INTO roles (id_rol, nombre) VALUES
  (4, 'supervisor'), (5, 'bodeguero'), (6, 'contador'), (7, 'auxiliar'),
  (8, 'gerente'), (9, 'soporte'), (10, 'auditor');

-- ===== 2. categorias (5 -> 10) =====
INSERT INTO categorias (id_categoria, nombre, descripcion) VALUES
  (6,  'Carnes y embutidos', 'Carnes frias, salchichas y embutidos'),
  (7,  'Frutas y verduras',  'Productos frescos del dia'),
  (8,  'Snacks y dulces',    'Paquetes, galletas y confiteria'),
  (9,  'Enlatados',          'Conservas, atun y granos en lata'),
  (10, 'Mascotas',           'Alimento y aseo para mascotas');

-- ===== 3. metodos_pago (4 -> 10) =====
-- Movii queda inactivo: el catalogo conserva el historico sin ofrecerlo.
INSERT INTO metodos_pago (id_metodo_pago, nombre, activo) VALUES
  (5, 'Daviplata', 1), (6, 'QR Bancolombia', 1), (7, 'PSE', 1),
  (8, 'Credito tienda', 1), (9, 'Bono regalo', 1), (10, 'Movii', 0);

-- ===== 4. usuarios (3 -> 10) =====
-- Diego queda inactivo (se retiro), pero su turno del 13/09 sigue en la
-- base: desactivar no borra la historia.
INSERT INTO usuarios (id_usuario, documento, nombre, apellido, email, telefono, id_rol, contrasena_hash, activo, fecha_registro) VALUES
  (4,  '1000000004', 'Sandra Milena',  'Ortiz',    'sandra.ortiz@controlstore.com',  '3001230004', 2, 'pbkdf2_sha256$demo', 1, '2026-09-01 08:00:00'),
  (5,  '1000000005', 'Diego Alejandro','Rojas',    'diego.rojas@controlstore.com',   '3001230005', 2, 'pbkdf2_sha256$demo', 0, '2026-09-01 08:05:00'),
  (6,  '1000000006', 'Kevin Stiven',   'Mora',     'kevin.mora@controlstore.com',    '3001230006', 3, 'pbkdf2_sha256$demo', 1, '2026-09-02 09:00:00'),
  (7,  '1000000007', 'Yeison Andres',  'Castro',   'yeison.castro@controlstore.com', '3001230007', 3, 'pbkdf2_sha256$demo', 1, '2026-09-02 09:10:00'),
  (8,  '1000000008', 'Paola Andrea',   'Vargas',   'paola.vargas@controlstore.com',  '3001230008', 4, 'pbkdf2_sha256$demo', 1, '2026-09-03 10:00:00'),
  (9,  '1000000009', 'Hernan Dario',   'Lopez',    'hernan.lopez@controlstore.com',  '3001230009', 5, 'pbkdf2_sha256$demo', 1, '2026-09-03 10:30:00'),
  (10, '1000000010', 'Luz Marina',     'Cardenas', 'luz.cardenas@controlstore.com',  '3001230010', 6, 'pbkdf2_sha256$demo', 1, '2026-09-05 14:00:00');

-- ===== 5. productos (5 -> 10) =====
-- Entran con stock 0: el stock real sale del kardex (paso 12).
INSERT INTO productos (codigo_producto, id_categoria, nombre, descripcion, precio_unitario, stock_actual, stock_minimo, unidad_medida, activo) VALUES
  ('7702001006', 2, 'Aceite Girasol 1L',     NULL, 11900.00, 0, 8,  'Botella', 1),
  ('7702001007', 5, 'Jabon de Barra x3',     NULL,  6500.00, 0, 10, 'Paquete', 1),
  ('7702001008', 3, 'Gaseosa Cola 1.5L',     NULL,  4500.00, 0, 12, 'Botella', 1),
  ('7702001009', 6, 'Salchichas x10',        NULL,  8900.00, 0, 6,  'Paquete', 1),
  ('7702001010', 9, 'Atun en Lata 170g',     NULL,  5600.00, 0, 10, 'Lata',    1);

-- ===== 6. clientes (2 -> 10) =====
INSERT INTO clientes (id_cliente, nombre, telefono, direccion, barrio) VALUES
  (3,  'Ana Lucia Torres',   '3125550101', 'Calle 20 # 8-15',       'San Jose'),
  (4,  'Jorge Enrique Diaz', '3135550202', 'Carrera 3 # 10-44',     'El Carmen'),
  (5,  'Luisa Fernanda Gil', '3145550303', 'Calle 5 # 2-18',        'Centro'),
  (6,  'Pedro Pablo Suarez', '3155550404', 'Diagonal 9 # 14-70',    'Villa Nueva'),
  (7,  'Camila Andrea Ruiz', '3165550505', 'Calle 30 # 6-12',       'La Esperanza'),
  (8,  'Oscar Ivan Molina',  '3175550606', 'Carrera 11 # 25-03',    'Los Alamos'),
  (9,  'Diana Marcela Pena', '3185550707', 'Transversal 4 # 18-60', 'Santa Barbara'),
  (10, 'Andres Felipe Rios', '3195550808', 'Calle 8 # 12-09',       'La Playa');

-- ===== 7. arqueo_caja (1 -> 10) =====
-- Se abren sin cierre; los totales se calculan en el paso 11.
-- El turno 11 queda ABIERTO (fecha_cierre NULL): es el turno de hoy.
INSERT INTO arqueo_caja (id_arqueo, id_usuario, fecha_apertura, monto_inicial) VALUES
  (3,  2, '2026-09-12 08:00:00', 20000.00),
  (4,  4, '2026-09-12 14:00:00', 20000.00),
  (5,  5, '2026-09-13 08:00:00', 15000.00),
  (6,  2, '2026-09-15 08:00:00', 20000.00),
  (7,  4, '2026-09-16 14:00:00', 20000.00),
  (8,  2, '2026-09-18 08:00:00', 20000.00),
  (9,  4, '2026-09-19 14:00:00', 20000.00),
  (10, 2, '2026-09-21 08:00:00', 20000.00),
  (11, 4, '2026-09-24 08:00:00', 20000.00);

-- ===== 8. ventas (3 -> 12) =====
-- total = 0: los triggers lo llenan al insertar el detalle.
INSERT INTO ventas (id_venta, id_usuario, id_arqueo, id_cliente, id_metodo_pago, fecha, total, estado) VALUES
  (5,  2, 3,  3,  1, '2026-09-12 10:15:00', 0, 'pagada'),
  (6,  4, 4,  4,  5, '2026-09-12 16:30:00', 0, 'pagada'),
  (7,  5, 5,  5,  1, '2026-09-13 11:00:00', 0, 'pagada'),
  (8,  2, 6,  6,  2, '2026-09-15 09:45:00', 0, 'pagada'),
  (9,  4, 7,  NULL, 6, '2026-09-16 15:20:00', 0, 'pagada'),
  (10, 2, 8,  8,  1, '2026-09-18 10:05:00', 0, 'pagada'),
  (11, 4, 9,  9,  8, '2026-09-19 17:40:00', 0, 'pagada'),
  (12, 2, 10, 10, 3, '2026-09-21 12:00:00', 0, 'pagada'),
  (13, 4, 11, 1,  1, '2026-09-24 09:30:00', 0, 'pagada');

-- ===== 9. detalle_venta (6 -> 20) =====
-- precio_venta = precio del dia (hecho historico, ver PARTE 4 del guion).
INSERT INTO detalle_venta (id_detalle, id_venta, codigo_producto, cantidad, precio_venta) VALUES
  (9,  5,  '7702001006', 1, 11900.00),
  (10, 5,  '7702001008', 2,  4500.00),
  (11, 6,  '7702001010', 3,  5600.00),
  (12, 7,  '7702001007', 2,  6500.00),
  (13, 8,  '7702001009', 2,  8900.00),
  (14, 8,  '7702001003', 1,  9900.00),
  (15, 9,  '7702001002', 1, 12500.00),
  (16, 10, '7702001006', 1, 11900.00),
  (17, 10, '7702001001', 2,  2850.00),
  (18, 11, '7702001008', 3,  4500.00),
  (19, 12, '7702001010', 2,  5600.00),
  (20, 12, '7702001005', 1,  3000.00),
  (21, 13, '7702001009', 1,  8900.00),
  (22, 13, '7702001006', 1, 11900.00);

-- La venta 7 se anula (devolucion). Conserva su total: la anulacion es
-- un estado, no un borrado. No suma en el arqueo ni en los reportes.
UPDATE ventas SET estado = 'anulada' WHERE id_venta = 7;

-- ===== 10. domicilios (1 -> 10) =====
-- Las ventas 2 y 9 son de mostrador y no tienen domicilio.
INSERT INTO domicilios (id_domicilio, id_venta, id_domiciliario, direccion_entrega, barrio, telefono_contacto, estado, fecha_asignacion, fecha_entrega, observacion) VALUES
  (2,  4,  6,    'Carrera 7 # 15-02',     'La Playa',      '3109876543', 'entregado', '2026-09-23 11:20:00', '2026-09-23 11:55:00', NULL),
  (3,  5,  3,    'Calle 20 # 8-15',       'San Jose',      '3125550101', 'entregado', '2026-09-12 10:25:00', '2026-09-12 11:05:00', 'Dejar con el vigilante'),
  (4,  6,  6,    'Carrera 3 # 10-44',     'El Carmen',     '3135550202', 'entregado', '2026-09-12 16:40:00', '2026-09-12 17:10:00', NULL),
  (5,  7,  7,    'Calle 5 # 2-18',        'Centro',        '3145550303', 'cancelado', '2026-09-13 11:10:00', NULL,                  'Cliente devolvio el pedido'),
  (6,  8,  3,    'Diagonal 9 # 14-70',    'Villa Nueva',   '3155550404', 'entregado', '2026-09-15 10:00:00', '2026-09-15 10:40:00', NULL),
  (7,  10, 7,    'Carrera 11 # 25-03',    'Los Alamos',    '3175550606', 'entregado', '2026-09-18 10:15:00', '2026-09-18 10:50:00', 'Timbre danado, llamar'),
  (8,  11, 6,    'Transversal 4 # 18-60', 'Santa Barbara', '3185550707', 'entregado', '2026-09-19 17:50:00', '2026-09-19 18:30:00', NULL),
  (9,  12, 3,    'Oficina 204, Calle 8 # 12-09', 'La Playa','3195550808', 'entregado', '2026-09-21 12:10:00', '2026-09-21 12:45:00', 'Entregar en la oficina'),
  (10, 13, 6,    'Calle 12 # 4-30',       'Centro',        '3011234567', 'asignado',  '2026-09-24 09:40:00', NULL,                  NULL);

-- ===== 11. Cierre de los turnos 3 a 10 =====
-- Totales desde las ventas PAGADAS (la anulada no cuenta).
-- monto_final = lo contado en el cajon; dos turnos con descuadre para
-- que la columna generada diferencia muestre faltante y sobrante.
UPDATE arqueo_caja a
   SET a.total_ventas   = (SELECT IFNULL(SUM(v.total), 0) FROM ventas v
                            WHERE v.id_arqueo = a.id_arqueo AND v.estado = 'pagada'),
       a.total_efectivo = (SELECT IFNULL(SUM(v.total), 0) FROM ventas v
                            WHERE v.id_arqueo = a.id_arqueo AND v.estado = 'pagada'
                              AND v.id_metodo_pago = 1)
 WHERE a.id_arqueo BETWEEN 3 AND 10;

UPDATE arqueo_caja
   SET monto_final  = monto_inicial + total_efectivo,
       fecha_cierre = fecha_apertura + INTERVAL 6 HOUR,
       observacion  = 'Caja cuadrada'
 WHERE id_arqueo BETWEEN 3 AND 10;

UPDATE arqueo_caja SET monto_final = monto_final + 500,
       observacion = 'Sobrante: cliente no espero el cambio' WHERE id_arqueo = 4;
UPDATE arqueo_caja SET observacion = 'Unica venta anulada por devolucion' WHERE id_arqueo = 5;
UPDATE arqueo_caja SET monto_final = monto_final - 700,
       observacion = 'Faltante: se dio mal un cambio' WHERE id_arqueo = 8;

-- ===== 12. movimientos_inventario (5 -> 26) =====
-- Kardex: entradas de los productos nuevos, una salida por renglon
-- vendido, el reverso de la venta anulada y una merma.
INSERT INTO movimientos_inventario (id_movimiento, codigo_producto, id_usuario, tipo, cantidad, observacion, fecha) VALUES
  (6,  '7702001006', 9, 'entrada', 24, 'Compra inicial al proveedor',          '2026-09-10 07:30:00'),
  (7,  '7702001007', 9, 'entrada', 30, 'Compra inicial al proveedor',          '2026-09-10 07:35:00'),
  (8,  '7702001008', 9, 'entrada', 36, 'Compra inicial al proveedor',          '2026-09-10 07:40:00'),
  (9,  '7702001009', 9, 'entrada', 20, 'Compra inicial al proveedor',          '2026-09-10 07:45:00'),
  (10, '7702001010', 9, 'entrada', 40, 'Compra inicial al proveedor',          '2026-09-10 07:50:00'),
  (11, '7702001006', 2, 'salida',  1,  'Venta #5',  '2026-09-12 10:15:00'),
  (12, '7702001008', 2, 'salida',  2,  'Venta #5',  '2026-09-12 10:15:00'),
  (13, '7702001010', 4, 'salida',  3,  'Venta #6',  '2026-09-12 16:30:00'),
  (14, '7702001007', 5, 'salida',  2,  'Venta #7',  '2026-09-13 11:00:00'),
  (15, '7702001007', 8, 'entrada', 2,  'Reverso: anulacion de la venta #7',    '2026-09-13 12:30:00'),
  (16, '7702001009', 2, 'salida',  2,  'Venta #8',  '2026-09-15 09:45:00'),
  (17, '7702001003', 2, 'salida',  1,  'Venta #8',  '2026-09-15 09:45:00'),
  (18, '7702001002', 4, 'salida',  1,  'Venta #9',  '2026-09-16 15:20:00'),
  (19, '7702001006', 2, 'salida',  1,  'Venta #10', '2026-09-18 10:05:00'),
  (20, '7702001001', 2, 'salida',  2,  'Venta #10', '2026-09-18 10:05:00'),
  (21, '7702001008', 4, 'salida',  3,  'Venta #11', '2026-09-19 17:40:00'),
  (22, '7702001010', 2, 'salida',  2,  'Venta #12', '2026-09-21 12:00:00'),
  (23, '7702001005', 2, 'salida',  1,  'Venta #12', '2026-09-21 12:00:00'),
  (24, '7702001009', 4, 'salida',  1,  'Venta #13', '2026-09-24 09:30:00'),
  (25, '7702001006', 4, 'salida',  1,  'Venta #13', '2026-09-24 09:30:00'),
  (26, '7702001001', 9, 'ajuste',  2,  'Merma: leche vencida',                 '2026-09-24 07:00:00');

-- El stock se recalcula desde el kardex nuevo (ids 6 a 26):
-- entrada suma; salida y ajuste (merma) restan.
UPDATE productos p
  JOIN (SELECT codigo_producto,
               SUM(CASE tipo WHEN 'entrada' THEN cantidad ELSE -cantidad END) AS neto
          FROM movimientos_inventario
         WHERE id_movimiento BETWEEN 6 AND 26
         GROUP BY codigo_producto) k ON k.codigo_producto = p.codigo_producto
   SET p.stock_actual = p.stock_actual + k.neto;

-- ===== 13. log_auditoria (5 -> 10) =====
-- id_usuario NULL = intento anonimo (login fallido).
INSERT INTO log_auditoria (id_log, id_usuario, accion, modulo, detalle, ip, fecha) VALUES
  (6,  1,    'registrar', 'usuarios', 'Registro la cuenta de Luz Marina Cardenas (contador)', '192.168.1.10', '2026-09-05 14:00:00'),
  (7,  1,    'login',     'usuarios', 'Inicio de sesion exitoso',                              '192.168.1.10', '2026-09-12 07:55:00'),
  (8,  8,    'anular',    'ventas',   'Anulo la venta #7. Devolucion: producto en mal estado', '192.168.1.18', '2026-09-13 12:30:00'),
  (9,  NULL, 'login',     'usuarios', 'Intento fallido con el correo desconocido@correo.com',  '192.168.1.40', '2026-09-13 22:10:00'),
  (10, 4,    'cerrar',    'ventas',   'Cierre de caja del turno #9 sin diferencia',            '192.168.1.16', '2026-09-19 20:00:00');

-- ===== 14. sesiones_chatbot (1 -> 10) =====
-- telefono es la llave del canal (UNIQUE): la sesion existe antes de
-- saber quien es el cliente; id_cliente se llena cuando se identifica.
INSERT INTO sesiones_chatbot (id_sesion, telefono, id_cliente, paso, direccion_temp, barrio_temp, fecha_actualizacion) VALUES
  (3,  '3125550101', 3,    'finalizado',             NULL,                  NULL,          '2026-09-12 10:10:00'),
  (4,  '3135550202', 4,    'eligiendo_productos',    NULL,                  NULL,          '2026-09-24 18:05:00'),
  (5,  '3145550303', 5,    'pidiendo_direccion',     NULL,                  NULL,          '2026-09-24 18:20:00'),
  (6,  '3155550404', 6,    'finalizado',             NULL,                  NULL,          '2026-09-15 09:40:00'),
  (7,  '3165550505', 7,    'esperando_confirmacion', 'Calle 30 # 6-12',     'La Esperanza','2026-09-24 19:00:00'),
  (8,  '3175550606', 8,    'menu',                   NULL,                  NULL,          '2026-09-24 19:15:00'),
  (9,  '3001112233', NULL, 'inicio',                 NULL,                  NULL,          '2026-09-24 19:30:00'),
  (10, '3002223344', NULL, 'eligiendo_productos',    NULL,                  NULL,          '2026-09-24 19:45:00'),
  (11, '3185550707', 9,    'pidiendo_direccion',     NULL,                  NULL,          '2026-09-24 20:00:00');

-- ===== 15. carrito_chatbot (2 -> 10) =====
-- Solo sesion + producto + cantidad: nombre y precio llegan por JOIN.
INSERT INTO carrito_chatbot (id_sesion, codigo_producto, cantidad) VALUES
  (4,  '7702001006', 1),
  (4,  '7702001008', 2),
  (5,  '7702001010', 3),
  (7,  '7702001001', 2),
  (7,  '7702001002', 1),
  (10, '7702001009', 1),
  (10, '7702001007', 1),
  (11, '7702001003', 1);

COMMIT;


-- =====================================================================
-- VERIFICACION (ejecutar despues)
-- =====================================================================

-- V1. Ninguna tabla con menos de 10 filas
SELECT 'roles' AS tabla, COUNT(*) AS filas FROM roles
UNION ALL SELECT 'usuarios',               COUNT(*) FROM usuarios
UNION ALL SELECT 'categorias',             COUNT(*) FROM categorias
UNION ALL SELECT 'productos',              COUNT(*) FROM productos
UNION ALL SELECT 'metodos_pago',           COUNT(*) FROM metodos_pago
UNION ALL SELECT 'clientes',               COUNT(*) FROM clientes
UNION ALL SELECT 'arqueo_caja',            COUNT(*) FROM arqueo_caja
UNION ALL SELECT 'ventas',                 COUNT(*) FROM ventas
UNION ALL SELECT 'detalle_venta',          COUNT(*) FROM detalle_venta
UNION ALL SELECT 'domicilios',             COUNT(*) FROM domicilios
UNION ALL SELECT 'movimientos_inventario', COUNT(*) FROM movimientos_inventario
UNION ALL SELECT 'log_auditoria',          COUNT(*) FROM log_auditoria
UNION ALL SELECT 'sesiones_chatbot',       COUNT(*) FROM sesiones_chatbot
UNION ALL SELECT 'carrito_chatbot',        COUNT(*) FROM carrito_chatbot;
-- Esperado: 10 en todas, salvo ventas 12, detalle_venta 20 y
-- movimientos_inventario 26.

-- V2. Ninguna venta descuadrada (los triggers llenaron los totales)
SELECT v.id_venta, v.total, IFNULL(SUM(d.subtotal), 0) AS suma
  FROM ventas v LEFT JOIN detalle_venta d ON d.id_venta = v.id_venta
 GROUP BY v.id_venta, v.total
HAVING v.total <> suma;
-- Esperado: 0 filas

-- V3. Los arqueos: diferencia calculada por el motor
SELECT id_arqueo, id_usuario, total_ventas, total_efectivo, monto_final, diferencia, observacion
  FROM arqueo_caja ORDER BY id_arqueo;
-- Esperado: turno 4 = +500, turno 8 = -700, turno 11 abierto (NULL), resto 0
