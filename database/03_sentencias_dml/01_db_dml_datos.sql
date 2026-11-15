-- |||=============================================================================================|||
-- |||                       CONTROL STORE · AUTOSERVICIO AYUELAL · SENA ADSO                       |||
-- |||                   01 · DML: DATOS DE LA BASE (CONSULTAS DE ACCIÓN · INSERT INTO)             |||
-- |||                                   MySQL 8.4 · controlstore_sena                              |||
-- |||=============================================================================================|||
-- |||                                                                                             |||
-- |||  QUÉ HACE                                                                                   |||
-- |||    Carga los datos de las 18 tablas: al menos 10 registros por tabla (modulos tiene 5,       |||
-- |||    porque el sistema tiene exactamente cinco módulos). Los ids van escritos a mano para que  |||
-- |||    los documentos puedan citar cada registro (venta #3, turno #2...).                       |||
-- |||                                                                                             |||
-- |||  REQUISITO: ejecutar antes 01_base_datos/01_db_estructura.sql (base vacía).                 |||
-- |||                                                                                             |||
-- |||  DATOS COHERENTES (calculados, no inventados al azar)                                       |||
-- |||    - ventas.total = suma de sus renglones (detalle_venta.subtotal).                          |||
-- |||    - arqueo_caja: total_ventas y total_efectivo salen de las ventas PAGADAS del turno;       |||
-- |||      la venta #7 está anulada y no suma.                                                     |||
-- |||    - Kárdex: inventario inicial + compras - una salida por renglón vendido + el reverso de   |||
-- |||      la venta anulada - una merma. productos.stock_actual es exactamente ese saldo.           |||
-- |||    - domicilios.costo_envio = tarifa del barrio de entrega.                                  |||
-- |||                                                                                             |||
-- |||  TODO VA EN UNA TRANSACCIÓN: si algo falla, no queda nada a medias.                         |||
-- |||  Si se ejecuta dos veces se detiene con el error 1062 (Duplicate entry).                    |||
-- |||                                                                                             |||
-- |||  EN CONSOLA:  mysql> SOURCE C:/Users/bryan/proyecto_grado_alexander/database/03_sentencias_dml/01_db_dml_datos.sql
-- |||=============================================================================================|||

USE controlstore_sena;
START TRANSACTION;

-- ===================================================================================================
-- 01. MÓDULO USUARIOS Y SEGURIDAD
-- ===================================================================================================

-- ---------------------------------------------------------------------------------------------------
-- 01.01. roles ........................................ INSERT INTO ____ ( ____ ) VALUES ( ____ ) ;
-- ---------------------------------------------------------------------------------------------------
INSERT INTO roles (id_rol, nombre) VALUES
  (1, 'administrador'),
  (2, 'cajero'),
  (3, 'domiciliario'),
  (4, 'supervisor'),
  (5, 'bodeguero'),
  (6, 'contador'),
  (7, 'auxiliar'),
  (8, 'gerente'),
  (9, 'soporte'),
  (10, 'auditor');

-- ---------------------------------------------------------------------------------------------------
-- 01.02. modulos (los cinco módulos del sistema)
-- ---------------------------------------------------------------------------------------------------
INSERT INTO modulos (id_modulo, nombre, descripcion) VALUES
  (1, 'Usuarios', 'Acceso, cuentas, roles y permisos'),
  (2, 'Inventario', 'Productos, categorías y kárdex'),
  (3, 'Ventas y caja', 'Punto de venta, anulaciones y cierre de caja'),
  (4, 'Domicilios', 'Pedidos a domicilio, asignación y entrega'),
  (5, 'Reportes', 'Reportes gráficos e impresos');

-- ---------------------------------------------------------------------------------------------------
-- 01.03. permisos (uno por requisito funcional de la matriz)
-- ---------------------------------------------------------------------------------------------------
INSERT INTO permisos (id_permiso, id_modulo, codigo, descripcion) VALUES
  (1, 1, 'usuarios.ver', 'Listar y consultar usuarios'),
  (2, 1, 'usuarios.registrar', 'Registrar usuarios (RF04)'),
  (3, 1, 'usuarios.editar', 'Editar usuarios (RF05)'),
  (4, 1, 'usuarios.cambiar_estado', 'Activar o inactivar usuarios (RF06)'),
  (5, 2, 'inventario.ver', 'Listar y consultar productos (RF09, RF10)'),
  (6, 2, 'inventario.registrar', 'Registrar productos (RF08)'),
  (7, 2, 'inventario.editar', 'Editar productos (RF11)'),
  (8, 2, 'inventario.eliminar', 'Dar de baja productos (RF12)'),
  (9, 2, 'inventario.ajustar', 'Registrar entradas y ajustes de stock'),
  (10, 3, 'ventas.registrar', 'Registrar ventas (RF14)'),
  (11, 3, 'ventas.ver', 'Listar y consultar ventas (RF15, RF16)'),
  (12, 3, 'ventas.anular', 'Anular ventas (RF17)'),
  (13, 3, 'ventas.cerrar_caja', 'Cierre de caja (RF18)'),
  (14, 4, 'domicilios.ver', 'Listar y consultar pedidos'),
  (15, 4, 'domicilios.registrar', 'Registrar pedidos (RF22)'),
  (16, 4, 'domicilios.asignar', 'Asignar domiciliario (RF23)'),
  (17, 4, 'domicilios.actualizar_estado', 'Actualizar el estado del pedido (RF24)'),
  (18, 5, 'reportes.ventas', 'Reportes de ventas (RF26, RF27)'),
  (19, 5, 'reportes.inventario', 'Reportes de inventario (RF28, RF29)'),
  (20, 5, 'reportes.domicilios', 'Reporte de domicilios (RF30)'),
  (21, 5, 'reportes.usuarios', 'Reportes de usuarios');

-- ---------------------------------------------------------------------------------------------------
-- 01.04. rol_permiso
-- ---------------------------------------------------------------------------------------------------
-- Administrador (1): los 21 permisos. Cajero (2): inventario, ventas y reportes; NO anula ni
-- cierra caja (RF17, RF18). Domiciliario (3): ver domicilios y actualizar su estado (RF24).
INSERT INTO rol_permiso (id_rol, id_permiso) VALUES
  (1, 1),
  (1, 2),
  (1, 3),
  (1, 4),
  (1, 5),
  (1, 6),
  (1, 7),
  (1, 8),
  (1, 9),
  (1, 10),
  (1, 11),
  (1, 12),
  (1, 13),
  (1, 14),
  (1, 15),
  (1, 16),
  (1, 17),
  (1, 18),
  (1, 19),
  (1, 20),
  (1, 21),
  (2, 5),
  (2, 6),
  (2, 10),
  (2, 11),
  (2, 18),
  (2, 19),
  (3, 14),
  (3, 17);

-- ---------------------------------------------------------------------------------------------------
-- 01.05. usuarios
-- ---------------------------------------------------------------------------------------------------
-- contrasena_hash: valor de demostración; la aplicación guarda el hash bcrypt real.
-- Diego (5) está inactivo y Luz Marina (10) quedó bloqueada tras 3 intentos fallidos.
INSERT INTO usuarios (id_usuario, documento, nombre, apellido, email, telefono, id_rol, contrasena_hash, activo, intentos_fallidos, bloqueado_hasta, fecha_registro) VALUES
  (1, '1000000001', 'Andres', 'Gomez', 'admin@controlstore.com', NULL, 1, 'pbkdf2_sha256$demo', 1, 0, NULL, '2026-08-18 18:28:08'),
  (2, '1000000002', 'Juan Carlos', 'Perez', 'juan.perez@controlstore.com', NULL, 2, 'pbkdf2_sha256$demo', 1, 0, NULL, '2026-08-18 18:28:08'),
  (3, '1000000003', 'Luis', 'Perez', 'luis.p@controlstore.com', NULL, 3, 'pbkdf2_sha256$demo', 1, 0, NULL, '2026-08-18 18:28:08'),
  (4, '1000000004', 'Sandra Milena', 'Ortiz', 'sandra.ortiz@controlstore.com', '3001230004', 2, 'pbkdf2_sha256$demo', 1, 0, NULL, '2026-09-01 08:00:00'),
  (5, '1000000005', 'Diego Alejandro', 'Rojas', 'diego.rojas@controlstore.com', '3001230005', 2, 'pbkdf2_sha256$demo', 0, 0, NULL, '2026-09-01 08:05:00'),
  (6, '1000000006', 'Kevin Stiven', 'Mora', 'kevin.mora@controlstore.com', '3001230006', 3, 'pbkdf2_sha256$demo', 1, 0, NULL, '2026-09-02 09:00:00'),
  (7, '1000000007', 'Yeison Andres', 'Castro', 'yeison.castro@controlstore.com', '3001230007', 3, 'pbkdf2_sha256$demo', 1, 0, NULL, '2026-09-02 09:10:00'),
  (8, '1000000008', 'Paola Andrea', 'Vargas', 'paola.vargas@controlstore.com', '3001230008', 4, 'pbkdf2_sha256$demo', 1, 0, NULL, '2026-09-03 10:00:00'),
  (9, '1000000009', 'Hernan Dario', 'Lopez', 'hernan.lopez@controlstore.com', '3001230009', 5, 'pbkdf2_sha256$demo', 1, 0, NULL, '2026-09-03 10:30:00'),
  (10, '1000000010', 'Luz Marina', 'Cardenas', 'luz.cardenas@controlstore.com', '3001230010', 6, 'pbkdf2_sha256$demo', 1, 3, '2026-09-24 20:15:00', '2026-09-05 14:00:00');

-- ---------------------------------------------------------------------------------------------------
-- 01.06. log_auditoria
-- ---------------------------------------------------------------------------------------------------
-- id_usuario NULL = intento de acceso con un correo que no existe (log 9).
INSERT INTO log_auditoria (id_log, id_usuario, id_modulo, accion, detalle, ip, fecha) VALUES
  (1, 2, 1, 'login', 'Inicio de sesión exitoso', '192.168.1.15', '2026-09-23 08:40:30'),
  (2, 2, 3, 'registrar', 'Registró la venta #2 por $8.700', '192.168.1.15', '2026-09-23 09:40:30'),
  (3, 2, 3, 'registrar', 'Registró la venta #3 por $32.300', '192.168.1.15', '2026-09-23 10:10:30'),
  (4, 9, 2, 'actualizar', 'Ingreso de stock: Azúcar Blanca 2kg, +30 unidades', '192.168.1.10', '2026-09-22 11:40:30'),
  (5, 3, 4, 'actualizar', 'Marcó el domicilio de la venta #3 como entregado', '192.168.1.22', '2026-09-23 11:00:30'),
  (6, 1, 1, 'registrar', 'Registró la cuenta de Luz Marina Cardenas (contador)', '192.168.1.10', '2026-09-05 14:00:00'),
  (7, 1, 1, 'login', 'Inicio de sesión exitoso', '192.168.1.10', '2026-09-12 07:55:00'),
  (8, 1, 3, 'anular', 'Anuló la venta #7. Devolución: producto en mal estado', '192.168.1.10', '2026-09-13 12:30:00'),
  (9, NULL, 1, 'login', 'Intento fallido con el correo desconocido@correo.com', '192.168.1.40', '2026-09-13 22:10:00'),
  (10, 4, 3, 'cerrar', 'Cierre de caja del turno #9 sin diferencia', '192.168.1.16', '2026-09-19 20:00:00'),
  (11, 10, 1, 'login', 'Cuenta bloqueada 15 minutos tras 3 intentos fallidos', '192.168.1.33', '2026-09-24 20:00:00'),
  (12, 1, 5, 'consultar', 'Generó el reporte gráfico de ventas de septiembre', '192.168.1.10', '2026-09-24 21:00:00');

-- ===================================================================================================
-- 02. MÓDULO INVENTARIO
-- ===================================================================================================

-- ---------------------------------------------------------------------------------------------------
-- 02.01. categorias
-- ---------------------------------------------------------------------------------------------------
INSERT INTO categorias (id_categoria, nombre, descripcion) VALUES
  (1, 'Lácteos', 'Leches, quesos y derivados'),
  (2, 'Abarrotes', 'Granos, aceites y despensa'),
  (3, 'Bebidas', 'Gaseosas, jugos y café'),
  (4, 'Panadería', 'Pan y repostería'),
  (5, 'Aseo', 'Aseo personal y del hogar'),
  (6, 'Carnes y embutidos', 'Carnes frías, salchichas y embutidos'),
  (7, 'Frutas y verduras', 'Productos frescos del día'),
  (8, 'Snacks y dulces', 'Paquetes, galletas y confitería'),
  (9, 'Enlatados', 'Conservas, atún y granos en lata'),
  (10, 'Mascotas', 'Alimento y aseo para mascotas');

-- ---------------------------------------------------------------------------------------------------
-- 02.02. productos
-- ---------------------------------------------------------------------------------------------------
-- stock_actual = saldo del kárdex (ver 02.03). El Café queda bajo el mínimo: sirve para la alerta.
INSERT INTO productos (codigo_producto, id_categoria, nombre, precio_compra, precio_unitario, stock_actual, stock_minimo, unidad_medida) VALUES
  ('7702001001', 1, 'Leche Entera 1L', '2000.00', '2850.00', 53, 20, 'Litro'),
  ('7702001002', 2, 'Arroz Blanco 5kg', '9000.00', '12500.00', 12, 10, 'Paquete'),
  ('7702001003', 3, 'Café Molido 250g', '7000.00', '9900.00', 4, 20, 'Paquete'),
  ('7702001004', 2, 'Azúcar Blanca 2kg', '4200.00', '5800.00', 30, 15, 'Paquete'),
  ('7702001005', 4, 'Pan Tajado', '2100.00', '3000.00', 32, 10, 'Unidad'),
  ('7702001006', 2, 'Aceite Girasol 1L', '8300.00', '11900.00', 21, 8, 'Botella'),
  ('7702001007', 5, 'Jabón de Barra x3', '4500.00', '6500.00', 30, 10, 'Paquete'),
  ('7702001008', 3, 'Gaseosa Cola 1.5L', '3100.00', '4500.00', 31, 12, 'Botella'),
  ('7702001009', 6, 'Salchichas x10', '6200.00', '8900.00', 17, 6, 'Paquete'),
  ('7702001010', 9, 'Atún en Lata 170g', '3900.00', '5600.00', 35, 10, 'Lata');

-- ---------------------------------------------------------------------------------------------------
-- 02.03. movimientos_inventario (kárdex)
-- ---------------------------------------------------------------------------------------------------
-- Orden cronológico. entrada suma; salida y ajuste (merma) restan. Una salida por renglón vendido.
INSERT INTO movimientos_inventario (id_movimiento, codigo_producto, id_usuario, tipo, cantidad, observacion, fecha) VALUES
  (1, '7702001001', 9, 'entrada', 62, 'Inventario inicial de apertura', '2026-09-01 07:00:00'),
  (2, '7702001002', 9, 'entrada', 15, 'Inventario inicial de apertura', '2026-09-01 07:00:00'),
  (3, '7702001003', 9, 'entrada', 7, 'Inventario inicial de apertura', '2026-09-01 07:00:00'),
  (4, '7702001005', 9, 'entrada', 34, 'Inventario inicial de apertura', '2026-09-01 07:00:00'),
  (5, '7702001006', 9, 'entrada', 24, 'Inventario inicial de apertura', '2026-09-01 07:00:00'),
  (6, '7702001007', 9, 'entrada', 30, 'Inventario inicial de apertura', '2026-09-01 07:00:00'),
  (7, '7702001008', 9, 'entrada', 36, 'Inventario inicial de apertura', '2026-09-01 07:00:00'),
  (8, '7702001009', 9, 'entrada', 20, 'Inventario inicial de apertura', '2026-09-01 07:00:00'),
  (9, '7702001010', 9, 'entrada', 40, 'Inventario inicial de apertura', '2026-09-01 07:00:00'),
  (10, '7702001006', 2, 'salida', 1, 'Venta #5', '2026-09-12 10:15:00'),
  (11, '7702001008', 2, 'salida', 2, 'Venta #5', '2026-09-12 10:15:00'),
  (12, '7702001010', 4, 'salida', 3, 'Venta #6', '2026-09-12 16:30:00'),
  (13, '7702001007', 5, 'salida', 2, 'Venta #7', '2026-09-13 11:00:00'),
  (14, '7702001007', 1, 'entrada', 2, 'Reverso: anulación de la venta #7', '2026-09-13 12:30:00'),
  (15, '7702001003', 2, 'salida', 1, 'Venta #8', '2026-09-15 09:45:00'),
  (16, '7702001009', 2, 'salida', 2, 'Venta #8', '2026-09-15 09:45:00'),
  (17, '7702001002', 4, 'salida', 1, 'Venta #9', '2026-09-16 15:20:00'),
  (18, '7702001001', 2, 'salida', 2, 'Venta #10', '2026-09-18 10:05:00'),
  (19, '7702001006', 2, 'salida', 1, 'Venta #10', '2026-09-18 10:05:00'),
  (20, '7702001008', 4, 'salida', 3, 'Venta #11', '2026-09-19 17:40:00'),
  (21, '7702001005', 2, 'salida', 1, 'Venta #12', '2026-09-21 12:00:00'),
  (22, '7702001010', 2, 'salida', 2, 'Venta #12', '2026-09-21 12:00:00'),
  (23, '7702001004', 9, 'entrada', 30, 'Compra al proveedor Alquería', '2026-09-22 11:40:30'),
  (24, '7702001001', 2, 'salida', 2, 'Venta #2', '2026-09-23 09:40:30'),
  (25, '7702001005', 2, 'salida', 1, 'Venta #2', '2026-09-23 09:40:30'),
  (26, '7702001002', 2, 'salida', 1, 'Venta #3', '2026-09-23 10:10:30'),
  (27, '7702001003', 2, 'salida', 2, 'Venta #3', '2026-09-23 10:10:30'),
  (28, '7702001001', 2, 'salida', 3, 'Venta #4', '2026-09-23 11:10:30'),
  (29, '7702001002', 2, 'salida', 1, 'Venta #4', '2026-09-23 11:10:30'),
  (30, '7702001001', 9, 'ajuste', 2, 'Merma: leche vencida', '2026-09-24 07:00:00'),
  (31, '7702001006', 4, 'salida', 1, 'Venta #13', '2026-09-24 09:30:00'),
  (32, '7702001009', 4, 'salida', 1, 'Venta #13', '2026-09-24 09:30:00');

-- ===================================================================================================
-- 03. BARRIOS Y CLIENTES (se cargan antes de las ventas, que los referencian)
-- ===================================================================================================

-- ---------------------------------------------------------------------------------------------------
-- 03.01. barrios
-- ---------------------------------------------------------------------------------------------------
-- Las Palmas queda fuera de la cobertura (activo = 0).
INSERT INTO barrios (id_barrio, nombre, costo_domicilio, activo) VALUES
  (1, 'Centro', '2000.00', 1),
  (2, 'La Playa', '3000.00', 1),
  (3, 'Los Alamos', '3500.00', 1),
  (4, 'San José', '2500.00', 1),
  (5, 'El Carmen', '3000.00', 1),
  (6, 'Villa Nueva', '4000.00', 1),
  (7, 'La Esperanza', '3500.00', 1),
  (8, 'Santa Bárbara', '4000.00', 1),
  (9, 'El Prado', '3000.00', 1),
  (10, 'Las Palmas', '5000.00', 0);

-- ---------------------------------------------------------------------------------------------------
-- 03.02. clientes
-- ---------------------------------------------------------------------------------------------------
INSERT INTO clientes (id_cliente, nombre, apellido, telefono, direccion, id_barrio) VALUES
  (1, 'Maria', 'Restrepo', '3011234567', 'Calle 12 # 4-30', 1),
  (2, 'Carlos', 'Ruiz', '3109876543', 'Carrera 7 # 15-02', 2),
  (3, 'Ana Lucía', 'Torres', '3125550101', 'Calle 20 # 8-15', 4),
  (4, 'Jorge Enrique', 'Díaz', '3135550202', 'Carrera 3 # 10-44', 5),
  (5, 'Luisa Fernanda', 'Gil', '3145550303', 'Calle 5 # 2-18', 1),
  (6, 'Pedro Pablo', 'Suárez', '3155550404', 'Diagonal 9 # 14-70', 6),
  (7, 'Camila Andrea', 'Ruiz', '3165550505', 'Calle 30 # 6-12', 7),
  (8, 'Óscar Iván', 'Molina', '3175550606', 'Carrera 11 # 25-03', 3),
  (9, 'Diana Marcela', 'Peña', '3185550707', 'Transversal 4 # 18-60', 8),
  (10, 'Andrés Felipe', 'Ríos', '3195550808', 'Calle 8 # 12-09', 2);

-- ===================================================================================================
-- 04. MÓDULO VENTAS Y CAJA
-- ===================================================================================================

-- ---------------------------------------------------------------------------------------------------
-- 04.01. metodos_pago
-- ---------------------------------------------------------------------------------------------------
-- Movii queda inactivo: no se ofrece, pero se conserva el histórico.
INSERT INTO metodos_pago (id_metodo_pago, nombre, activo) VALUES
  (1, 'Efectivo', 1),
  (2, 'Nequi', 1),
  (3, 'Transferencia', 1),
  (4, 'Tarjeta', 1),
  (5, 'Daviplata', 1),
  (6, 'QR Bancolombia', 1),
  (7, 'PSE', 1),
  (8, 'Crédito tienda', 1),
  (9, 'Bono regalo', 1),
  (10, 'Movii', 0);

-- ---------------------------------------------------------------------------------------------------
-- 04.02. arqueo_caja
-- ---------------------------------------------------------------------------------------------------
-- diferencia NO se inserta: es una columna calculada. Turno 4 = sobrante de $500, turno 8 = faltante
-- de $700, turno 11 = abierto (hoy). Los demás cuadran en $0.
INSERT INTO arqueo_caja (id_arqueo, id_usuario, fecha_apertura, fecha_cierre, monto_inicial, monto_final, total_ventas, total_efectivo, observacion) VALUES
  (2, 2, '2026-09-23 08:40:30', '2026-09-23 11:40:30', '20000.00', '49750.00', '62050.00', '29750.00', 'Turno de la tarde, sin novedades'),
  (3, 2, '2026-09-12 08:00:00', '2026-09-12 14:00:00', '20000.00', '40900.00', '20900.00', '20900.00', 'Caja cuadrada'),
  (4, 4, '2026-09-12 14:00:00', '2026-09-12 20:00:00', '20000.00', '20500.00', '16800.00', '0.00', 'Sobrante: un cliente no esperó el cambio'),
  (5, 5, '2026-09-13 08:00:00', '2026-09-13 14:00:00', '15000.00', '15000.00', '0.00', '0.00', 'Única venta anulada por devolución'),
  (6, 2, '2026-09-15 08:00:00', '2026-09-15 14:00:00', '20000.00', '20000.00', '27700.00', '0.00', 'Caja cuadrada'),
  (7, 4, '2026-09-16 14:00:00', '2026-09-16 20:00:00', '20000.00', '20000.00', '12500.00', '0.00', 'Caja cuadrada'),
  (8, 2, '2026-09-18 08:00:00', '2026-09-18 14:00:00', '20000.00', '36900.00', '17600.00', '17600.00', 'Faltante: se dio mal un cambio'),
  (9, 4, '2026-09-19 14:00:00', '2026-09-19 20:00:00', '20000.00', '20000.00', '13500.00', '0.00', 'Caja cuadrada'),
  (10, 2, '2026-09-21 08:00:00', '2026-09-21 14:00:00', '20000.00', '20000.00', '14200.00', '0.00', 'Caja cuadrada'),
  (11, 4, '2026-09-24 08:00:00', NULL, '20000.00', NULL, NULL, NULL, NULL);

-- ---------------------------------------------------------------------------------------------------
-- 04.03. ventas
-- ---------------------------------------------------------------------------------------------------
-- total = suma de los renglones de 04.04. La venta #7 está anulada (devolución): conserva su total.
INSERT INTO ventas (id_venta, id_usuario, id_arqueo, id_cliente, id_metodo_pago, fecha, total, estado) VALUES
  (2, 2, 2, NULL, 1, '2026-09-23 09:40:30', '8700.00', 'pagada'),
  (3, 2, 2, 1, 2, '2026-09-23 10:10:30', '32300.00', 'pagada'),
  (4, 2, 2, 2, 1, '2026-09-23 11:10:30', '21050.00', 'pagada'),
  (5, 2, 3, 3, 1, '2026-09-12 10:15:00', '20900.00', 'pagada'),
  (6, 4, 4, 4, 5, '2026-09-12 16:30:00', '16800.00', 'pagada'),
  (7, 5, 5, 5, 1, '2026-09-13 11:00:00', '13000.00', 'anulada'),
  (8, 2, 6, 6, 2, '2026-09-15 09:45:00', '27700.00', 'pagada'),
  (9, 4, 7, NULL, 6, '2026-09-16 15:20:00', '12500.00', 'pagada'),
  (10, 2, 8, 8, 1, '2026-09-18 10:05:00', '17600.00', 'pagada'),
  (11, 4, 9, 9, 8, '2026-09-19 17:40:00', '13500.00', 'pagada'),
  (12, 2, 10, 10, 3, '2026-09-21 12:00:00', '14200.00', 'pagada'),
  (13, 4, 11, 1, 1, '2026-09-24 09:30:00', '20800.00', 'pagada');

-- ---------------------------------------------------------------------------------------------------
-- 04.04. detalle_venta
-- ---------------------------------------------------------------------------------------------------
-- subtotal NO se inserta: es una columna calculada (cantidad x precio_venta).
INSERT INTO detalle_venta (id_detalle, id_venta, codigo_producto, cantidad, precio_venta) VALUES
  (3, 2, '7702001001', 2, '2850.00'),
  (4, 2, '7702001005', 1, '3000.00'),
  (5, 3, '7702001002', 1, '12500.00'),
  (6, 3, '7702001003', 2, '9900.00'),
  (7, 4, '7702001001', 3, '2850.00'),
  (8, 4, '7702001002', 1, '12500.00'),
  (9, 5, '7702001006', 1, '11900.00'),
  (10, 5, '7702001008', 2, '4500.00'),
  (11, 6, '7702001010', 3, '5600.00'),
  (12, 7, '7702001007', 2, '6500.00'),
  (13, 8, '7702001009', 2, '8900.00'),
  (14, 8, '7702001003', 1, '9900.00'),
  (15, 9, '7702001002', 1, '12500.00'),
  (16, 10, '7702001006', 1, '11900.00'),
  (17, 10, '7702001001', 2, '2850.00'),
  (18, 11, '7702001008', 3, '4500.00'),
  (19, 12, '7702001010', 2, '5600.00'),
  (20, 12, '7702001005', 1, '3000.00'),
  (21, 13, '7702001009', 1, '8900.00'),
  (22, 13, '7702001006', 1, '11900.00');

-- ===================================================================================================
-- 05. MÓDULO DOMICILIOS
-- ===================================================================================================

-- ---------------------------------------------------------------------------------------------------
-- 05.01. domicilios
-- ---------------------------------------------------------------------------------------------------
-- Uno por venta (id_venta UNIQUE). costo_envio = tarifa del barrio. El domicilio 5 se canceló con la venta #7.
INSERT INTO domicilios (id_domicilio, id_venta, id_domiciliario, id_barrio, direccion_entrega, costo_envio, telefono_contacto, estado, fecha_asignacion, fecha_entrega, observacion) VALUES
  (1, 3, 3, 1, 'Calle 12 # 4-30', '2000.00', '3011234567', 'entregado', '2026-09-23 10:20:30', '2026-09-23 11:00:30', 'Entregado en portería'),
  (2, 4, 6, 2, 'Carrera 7 # 15-02', '3000.00', '3109876543', 'entregado', '2026-09-23 11:20:00', '2026-09-23 11:55:00', NULL),
  (3, 5, 3, 4, 'Calle 20 # 8-15', '2500.00', '3125550101', 'entregado', '2026-09-12 10:25:00', '2026-09-12 11:05:00', 'Dejar con el vigilante'),
  (4, 6, 6, 5, 'Carrera 3 # 10-44', '3000.00', '3135550202', 'entregado', '2026-09-12 16:40:00', '2026-09-12 17:10:00', NULL),
  (5, 7, 7, 1, 'Calle 5 # 2-18', '2000.00', '3145550303', 'cancelado', '2026-09-13 11:10:00', NULL, 'El cliente devolvió el pedido'),
  (6, 8, 3, 6, 'Diagonal 9 # 14-70', '4000.00', '3155550404', 'entregado', '2026-09-15 10:00:00', '2026-09-15 10:40:00', NULL),
  (7, 10, 7, 3, 'Carrera 11 # 25-03', '3500.00', '3175550606', 'en_camino', '2026-09-18 10:15:00', NULL, 'Timbre dañado, llamar al llegar'),
  (8, 11, 6, 8, 'Transversal 4 # 18-60', '4000.00', '3185550707', 'entregado', '2026-09-19 17:50:00', '2026-09-19 18:30:00', NULL),
  (9, 12, 3, 2, 'Oficina 204, Calle 8 # 12-09', '3000.00', '3195550808', 'entregado', '2026-09-21 12:10:00', '2026-09-21 12:45:00', 'Entregar en la oficina'),
  (10, 13, 6, 1, 'Calle 12 # 4-30', '2000.00', '3011234567', 'asignado', '2026-09-24 09:40:00', NULL, NULL);

-- ===================================================================================================
-- 06. MÓDULO CHATBOT
-- ===================================================================================================

-- ---------------------------------------------------------------------------------------------------
-- 06.01. sesiones_chatbot
-- ---------------------------------------------------------------------------------------------------
-- La sesión existe antes de saber quién es el cliente: id_cliente se llena cuando se identifica.
INSERT INTO sesiones_chatbot (id_sesion, telefono, id_cliente, paso, direccion_temp, id_barrio_temp, fecha_actualizacion) VALUES
  (2, '3204445566', NULL, 'esperando_confirmacion', 'Carrera 15 # 22-10', 3, '2026-09-23 11:40:30'),
  (3, '3125550101', 3, 'finalizado', NULL, NULL, '2026-09-12 10:10:00'),
  (4, '3135550202', 4, 'eligiendo_productos', NULL, NULL, '2026-09-24 18:05:00'),
  (5, '3145550303', 5, 'pidiendo_direccion', NULL, NULL, '2026-09-24 18:20:00'),
  (6, '3155550404', 6, 'finalizado', NULL, NULL, '2026-09-15 09:40:00'),
  (7, '3165550505', 7, 'esperando_confirmacion', 'Calle 30 # 6-12', 7, '2026-09-24 19:00:00'),
  (8, '3175550606', 8, 'menu', NULL, NULL, '2026-09-24 19:15:00'),
  (9, '3001112233', NULL, 'inicio', NULL, NULL, '2026-09-24 19:30:00'),
  (10, '3002223344', NULL, 'eligiendo_productos', NULL, NULL, '2026-09-24 19:45:00'),
  (11, '3185550707', 9, 'pidiendo_direccion', NULL, NULL, '2026-09-24 20:00:00');

-- ---------------------------------------------------------------------------------------------------
-- 06.02. carrito_chatbot
-- ---------------------------------------------------------------------------------------------------
INSERT INTO carrito_chatbot (id_sesion, codigo_producto, cantidad) VALUES
  (2, '7702001003', 1),
  (2, '7702001005', 2),
  (4, '7702001006', 1),
  (4, '7702001008', 2),
  (5, '7702001010', 3),
  (7, '7702001001', 2),
  (7, '7702001002', 1),
  (10, '7702001009', 1),
  (10, '7702001007', 1),
  (11, '7702001003', 1);

COMMIT;


-- ===================================================================================================
-- 07. VERIFICACIÓN (solo lectura)
-- ===================================================================================================

-- V1. Registros por tabla (todas >= 10, salvo modulos = 5)
SELECT 'roles' AS tabla, COUNT(*) AS filas FROM roles
UNION ALL SELECT 'modulos', COUNT(*) FROM modulos
UNION ALL SELECT 'permisos', COUNT(*) FROM permisos
UNION ALL SELECT 'rol_permiso', COUNT(*) FROM rol_permiso
UNION ALL SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL SELECT 'log_auditoria', COUNT(*) FROM log_auditoria
UNION ALL SELECT 'categorias', COUNT(*) FROM categorias
UNION ALL SELECT 'productos', COUNT(*) FROM productos
UNION ALL SELECT 'movimientos_inventario', COUNT(*) FROM movimientos_inventario
UNION ALL SELECT 'metodos_pago', COUNT(*) FROM metodos_pago
UNION ALL SELECT 'arqueo_caja', COUNT(*) FROM arqueo_caja
UNION ALL SELECT 'ventas', COUNT(*) FROM ventas
UNION ALL SELECT 'detalle_venta', COUNT(*) FROM detalle_venta
UNION ALL SELECT 'barrios', COUNT(*) FROM barrios
UNION ALL SELECT 'domicilios', COUNT(*) FROM domicilios
UNION ALL SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL SELECT 'sesiones_chatbot', COUNT(*) FROM sesiones_chatbot
UNION ALL SELECT 'carrito_chatbot', COUNT(*) FROM carrito_chatbot;

-- V2. Ventas cuyo total no es la suma de sus renglones (debe salir vacío)
SELECT v.id_venta, v.total, SUM(d.subtotal) AS suma_renglones
  FROM ventas v JOIN detalle_venta d ON d.id_venta = v.id_venta
 GROUP BY v.id_venta, v.total
HAVING v.total <> SUM(d.subtotal);

-- V3. Stock que no coincide con el kárdex (debe salir vacío)
SELECT p.codigo_producto, p.nombre, p.stock_actual,
       SUM(CASE m.tipo WHEN 'entrada' THEN m.cantidad ELSE -m.cantidad END) AS saldo_kardex
  FROM productos p JOIN movimientos_inventario m ON m.codigo_producto = p.codigo_producto
 GROUP BY p.codigo_producto, p.nombre, p.stock_actual
HAVING p.stock_actual <> saldo_kardex;

-- V4. Arqueos: la diferencia la calcula el motor
SELECT id_arqueo, total_ventas, total_efectivo, monto_final, diferencia, observacion
  FROM arqueo_caja ORDER BY id_arqueo;
