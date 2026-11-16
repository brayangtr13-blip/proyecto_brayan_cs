-- =====================================================================
-- Migración 05 - Modelo de 18 tablas (controlstore_sena, MySQL 8.4)
-- Documento de referencia: ControlStore_Modelo_BD_18_tablas.docx
--
-- Pasa de 14 a 18 tablas: 4 nuevas (modulos, permisos, rol_permiso, barrios)
-- y 10 ajustadas. Reemplaza a migracion_05_segunda_revision.sql, que nunca
-- se ejecutó: sus cuatro hallazgos quedan incluidos aquí (apellido en clientes,
-- UNIQUE en detalle_venta, catálogo de barrios y verificación del arqueo).
--
-- Decisiones (11-11-2026), que también se corrigen en el documento Word:
--   - clientes.apellido: el nombre se separa (1FN), igual que en usuarios.
--   - Cierre de caja (RF18) solo para el administrador, como dice la matriz.
--   - log_auditoria.id_usuario sigue admitiendo NULL: un intento de inicio de
--     sesión con un correo que no existe no tiene usuario, pero debe registrarse.
--   - ventas.estado conserva 'pagada' (la usan los disparadores y el arqueo).
--
-- ANTES DE EJECUTAR EN LA BASE REAL: respaldo completo
--   mysqldump -u root -p --routines --triggers --single-transaction \
--     controlstore_sena > respaldo_controlstore_sena_AAAAMMDD_HHMMSS.sql
--
-- NO trae "USE": se ejecuta en la base a la que esté conectada la consola.
-- Primero en controlstore_sena_prueba; si todo sale bien, en controlstore_sena.
-- Se ejecuta POR BLOQUES: cada ALTER/CREATE se confirma solo y no se deshace.
-- =====================================================================

-- ---------------------------------------------------------------------
-- BLOQUE 0 · Comprobar en qué base se está trabajando
-- ---------------------------------------------------------------------
SELECT DATABASE() AS base_actual;
-- Workbench bloquea UPDATE sin llave primaria ("Safe Updates"); se apaga solo en esta sesión
SET SQL_SAFE_UPDATES = 0;

-- ---------------------------------------------------------------------
-- BLOQUE 1 · Seguridad por permisos: modulos, permisos y rol_permiso (nuevas)
-- ---------------------------------------------------------------------
CREATE TABLE modulos (
  id_modulo   TINYINT      NOT NULL AUTO_INCREMENT COMMENT 'Identificador del módulo',
  nombre      VARCHAR(30)  NOT NULL                COMMENT 'Nombre del módulo funcional',
  descripcion VARCHAR(150) NULL                    COMMENT 'Descripción del módulo',
  PRIMARY KEY (id_modulo),
  UNIQUE KEY uq_modulo_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci
  COMMENT='Los cinco módulos funcionales del sistema';

INSERT INTO modulos (id_modulo, nombre, descripcion) VALUES
  (1, 'Usuarios',      'Acceso, cuentas, roles y permisos'),
  (2, 'Inventario',    'Productos, categorías y kárdex'),
  (3, 'Ventas y caja', 'Punto de venta, anulaciones y cierre de caja'),
  (4, 'Domicilios',    'Pedidos a domicilio, asignación y entrega'),
  (5, 'Reportes',      'Reportes gráficos e impresos');

CREATE TABLE permisos (
  id_permiso  INT          NOT NULL AUTO_INCREMENT COMMENT 'Identificador del permiso',
  id_modulo   TINYINT      NOT NULL                COMMENT 'FK: módulo al que pertenece',
  codigo      VARCHAR(50)  NOT NULL                COMMENT 'Formato modulo.accion, ej. ventas.anular',
  descripcion VARCHAR(150) NOT NULL                COMMENT 'Qué permite hacer',
  PRIMARY KEY (id_permiso),
  UNIQUE KEY uq_permiso_codigo (codigo),
  CONSTRAINT fk_permiso_modulo FOREIGN KEY (id_modulo)
    REFERENCES modulos (id_modulo) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci
  COMMENT='Acciones concretas que el sistema puede autorizar';

-- Un permiso por requisito funcional de la matriz (RF04 a RF30)
INSERT INTO permisos (id_permiso, id_modulo, codigo, descripcion) VALUES
  ( 1, 1, 'usuarios.ver',                 'Listar y consultar usuarios'),
  ( 2, 1, 'usuarios.registrar',           'Registrar usuarios (RF04)'),
  ( 3, 1, 'usuarios.editar',              'Editar usuarios (RF05)'),
  ( 4, 1, 'usuarios.cambiar_estado',      'Activar o inactivar usuarios (RF06)'),
  ( 5, 2, 'inventario.ver',               'Listar y consultar productos (RF09, RF10)'),
  ( 6, 2, 'inventario.registrar',         'Registrar productos (RF08)'),
  ( 7, 2, 'inventario.editar',            'Editar productos (RF11)'),
  ( 8, 2, 'inventario.eliminar',          'Dar de baja productos (RF12)'),
  ( 9, 2, 'inventario.ajustar',           'Registrar entradas y ajustes de stock'),
  (10, 3, 'ventas.registrar',             'Registrar ventas (RF14)'),
  (11, 3, 'ventas.ver',                   'Listar y consultar ventas (RF15, RF16)'),
  (12, 3, 'ventas.anular',                'Anular ventas (RF17)'),
  (13, 3, 'ventas.cerrar_caja',           'Cierre de caja (RF18)'),
  (14, 4, 'domicilios.ver',               'Listar y consultar pedidos'),
  (15, 4, 'domicilios.registrar',         'Registrar pedidos (RF22)'),
  (16, 4, 'domicilios.asignar',           'Asignar domiciliario (RF23)'),
  (17, 4, 'domicilios.actualizar_estado', 'Actualizar el estado del pedido (RF24)'),
  (18, 5, 'reportes.ventas',              'Reportes de ventas (RF26, RF27)'),
  (19, 5, 'reportes.inventario',          'Reportes de inventario (RF28, RF29)'),
  (20, 5, 'reportes.domicilios',          'Reporte de domicilios (RF30)'),
  (21, 5, 'reportes.usuarios',            'Reportes de usuarios');

CREATE TABLE rol_permiso (
  id_rol     TINYINT NOT NULL COMMENT 'FK: rol',
  id_permiso INT     NOT NULL COMMENT 'FK: permiso concedido',
  PRIMARY KEY (id_rol, id_permiso),
  KEY fk_rol_permiso_permiso (id_permiso),
  CONSTRAINT fk_rol_permiso_rol FOREIGN KEY (id_rol)
    REFERENCES roles (id_rol) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_rol_permiso_permiso FOREIGN KEY (id_permiso)
    REFERENCES permisos (id_permiso) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci
  COMMENT='Qué permisos tiene cada rol (relación N:M)';

-- Administrador (1): todos los permisos
INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT 1, id_permiso FROM permisos;
-- Cajero (2) y Domiciliario (3): según la columna de accesos de la matriz de requisitos
INSERT INTO rol_permiso (id_rol, id_permiso) VALUES
  (2, 5), (2, 6),                 -- inventario: ver y registrar (RF08-RF10)
  (2, 10), (2, 11),               -- ventas: registrar y ver (RF14-RF16); anular y cerrar caja son del administrador (RF17, RF18)
  (2, 18), (2, 19),               -- reportes gráficos de ventas e inventario (RF26, RF28)
  (3, 14), (3, 17);               -- domicilios: ver y actualizar estado (RF24)

-- Verificación: 5 módulos, 21 permisos, 21 + 6 + 2 = 29 filas en rol_permiso
SELECT (SELECT COUNT(*) FROM modulos) AS modulos,
       (SELECT COUNT(*) FROM permisos) AS permisos,
       (SELECT COUNT(*) FROM rol_permiso) AS rol_permiso;

-- ---------------------------------------------------------------------
-- BLOQUE 2 · usuarios: bloqueo por intentos fallidos
-- ---------------------------------------------------------------------
ALTER TABLE usuarios
  ADD COLUMN intentos_fallidos TINYINT UNSIGNED NOT NULL DEFAULT 0
    COMMENT 'Intentos de inicio de sesión fallidos seguidos' AFTER activo,
  ADD COLUMN bloqueado_hasta DATETIME NULL
    COMMENT 'Fecha hasta la que el acceso está bloqueado' AFTER intentos_fallidos;

-- ---------------------------------------------------------------------
-- BLOQUE 3 · log_auditoria: el texto "modulo" pasa a la FK id_modulo
-- ---------------------------------------------------------------------
ALTER TABLE log_auditoria
  ADD COLUMN id_modulo TINYINT NULL COMMENT 'FK: módulo afectado' AFTER id_usuario;

UPDATE log_auditoria
   SET id_modulo = CASE LOWER(TRIM(modulo))
                     WHEN 'usuarios'   THEN 1
                     WHEN 'seguridad'  THEN 1
                     WHEN 'inventario' THEN 2
                     WHEN 'ventas'     THEN 3
                     WHEN 'caja'       THEN 3
                     WHEN 'domicilios' THEN 4
                     WHEN 'chatbot'    THEN 4
                     WHEN 'reportes'   THEN 5
                   END;

-- Debe devolver vacío ANTES de seguir (si sale algo, hay un texto sin módulo)
SELECT id_log, modulo FROM log_auditoria WHERE id_modulo IS NULL;

ALTER TABLE log_auditoria
  MODIFY id_modulo TINYINT NOT NULL COMMENT 'FK: módulo afectado (modulos)',
  ADD CONSTRAINT fk_log_modulo FOREIGN KEY (id_modulo)
    REFERENCES modulos (id_modulo) ON DELETE RESTRICT ON UPDATE CASCADE,
  DROP COLUMN modulo;

-- ---------------------------------------------------------------------
-- BLOQUE 4 · productos: precio de compra y restricciones de valores
-- ---------------------------------------------------------------------
ALTER TABLE productos
  ADD COLUMN precio_compra DECIMAL(10,2) NOT NULL DEFAULT 0
    COMMENT 'Costo al proveedor; permite calcular la ganancia' AFTER descripcion,
  ALTER COLUMN stock_minimo SET DEFAULT 0;

-- Costo aproximado de los 5 productos (alrededor del 70 % del precio de venta)
UPDATE productos SET precio_compra = CASE codigo_producto
    WHEN '7702001001' THEN  2000.00   -- Leche Entera 1L      (venta  2.850)
    WHEN '7702001002' THEN  9000.00   -- Arroz Blanco 5kg     (venta 12.500)
    WHEN '7702001003' THEN  7000.00   -- Café Molido 250g     (venta  9.900)
    WHEN '7702001004' THEN  4200.00   -- Azúcar Blanca 2kg    (venta  5.800)
    WHEN '7702001005' THEN  2100.00   -- Pan Tajado           (venta  3.000)
    ELSE precio_compra END;

ALTER TABLE productos
  ADD CONSTRAINT chk_producto_precio_compra CHECK (precio_compra >= 0),
  ADD CONSTRAINT chk_producto_precio        CHECK (precio_unitario > 0),
  ADD CONSTRAINT chk_producto_stock         CHECK (stock_actual >= 0),
  ADD CONSTRAINT chk_producto_stock_minimo  CHECK (stock_minimo >= 0);

-- ---------------------------------------------------------------------
-- BLOQUE 5 · movimientos, ventas y detalle_venta: restricciones
-- ---------------------------------------------------------------------
-- Las tres consultas deben devolver vacío antes de agregar las restricciones
SELECT id_movimiento, cantidad FROM movimientos_inventario WHERE cantidad <= 0;
SELECT id_venta, total FROM ventas WHERE total < 0;
SELECT id_venta, codigo_producto, COUNT(*) AS veces
  FROM detalle_venta GROUP BY id_venta, codigo_producto HAVING COUNT(*) > 1;

ALTER TABLE movimientos_inventario
  ADD CONSTRAINT chk_mov_cantidad CHECK (cantidad > 0);

ALTER TABLE ventas
  ADD CONSTRAINT chk_venta_total CHECK (total >= 0);

ALTER TABLE detalle_venta
  ADD CONSTRAINT uq_detalle_venta_producto UNIQUE (id_venta, codigo_producto),
  ADD CONSTRAINT chk_detalle_cantidad CHECK (cantidad > 0),
  ADD CONSTRAINT chk_detalle_precio   CHECK (precio_venta > 0),
  ADD CONSTRAINT chk_detalle_subtotal CHECK (subtotal >= 0);

-- ---------------------------------------------------------------------
-- BLOQUE 6 · barrios (nueva) y su uso en clientes, domicilios y sesiones_chatbot
-- ---------------------------------------------------------------------
CREATE TABLE barrios (
  id_barrio       INT           NOT NULL AUTO_INCREMENT COMMENT 'Identificador del barrio',
  nombre          VARCHAR(50)   NOT NULL                COMMENT 'Nombre del barrio',
  costo_domicilio DECIMAL(10,2) NOT NULL                COMMENT 'Tarifa vigente del domicilio',
  activo          TINYINT(1)    NOT NULL DEFAULT 1      COMMENT '1 = dentro de la cobertura',
  PRIMARY KEY (id_barrio),
  UNIQUE KEY uq_barrio_nombre (nombre),
  CONSTRAINT chk_barrio_costo CHECK (costo_domicilio >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci
  COMMENT='Zona de cobertura y costo de domicilio por barrio';

-- Los barrios que ya aparecen escritos en clientes, domicilios y sesiones_chatbot
INSERT INTO barrios (id_barrio, nombre, costo_domicilio) VALUES
  (1, 'Centro',     2000.00),
  (2, 'La Playa',   3000.00),
  (3, 'Los Alamos', 3500.00);

-- Debe devolver vacío: ningún texto de barrio queda sin su fila en barrios
SELECT 'clientes' AS tabla, barrio FROM clientes
 WHERE barrio IS NOT NULL AND TRIM(barrio) <> '' AND TRIM(barrio) NOT IN (SELECT nombre FROM barrios)
UNION ALL
SELECT 'domicilios', barrio FROM domicilios
 WHERE barrio IS NULL OR TRIM(barrio) NOT IN (SELECT nombre FROM barrios)
UNION ALL
SELECT 'sesiones_chatbot', barrio_temp FROM sesiones_chatbot
 WHERE barrio_temp IS NOT NULL AND TRIM(barrio_temp) <> '' AND TRIM(barrio_temp) NOT IN (SELECT nombre FROM barrios);

-- clientes: el nombre completo se separa en nombre y apellido (1FN, igual que usuarios en la migración 01)
ALTER TABLE clientes
  MODIFY nombre VARCHAR(60) NOT NULL COMMENT 'Nombres del cliente',
  ADD COLUMN apellido VARCHAR(60) NULL COMMENT 'Apellidos del cliente' AFTER nombre;
-- MySQL asigna de izquierda a derecha: apellido se calcula con el nombre completo original.
-- Con nombres compuestos («Ana Lucia Torres») revisar a mano el resultado.
UPDATE clientes
   SET apellido = TRIM(SUBSTRING(nombre, LOCATE(' ', nombre) + 1)),
       nombre   = TRIM(SUBSTRING_INDEX(nombre, ' ', 1))
 WHERE LOCATE(' ', nombre) > 0;
SELECT id_cliente, nombre, apellido FROM clientes;

-- clientes: barrio (texto) -> id_barrio (FK, opcional)
ALTER TABLE clientes
  ADD COLUMN id_barrio INT NULL COMMENT 'FK: barrio del cliente (opcional)' AFTER direccion;
UPDATE clientes c JOIN barrios b ON b.nombre = TRIM(c.barrio) SET c.id_barrio = b.id_barrio;
ALTER TABLE clientes
  ADD CONSTRAINT fk_cliente_barrio FOREIGN KEY (id_barrio)
    REFERENCES barrios (id_barrio) ON DELETE RESTRICT ON UPDATE CASCADE,
  DROP COLUMN barrio;

-- domicilios: barrio (texto) -> id_barrio (FK, obligatorio) + costo_envio
ALTER TABLE domicilios
  ADD COLUMN id_barrio INT NULL COMMENT 'FK: barrio de entrega' AFTER id_domiciliario,
  ADD COLUMN costo_envio DECIMAL(10,2) NOT NULL DEFAULT 0
    COMMENT 'Copia del costo del barrio al momento del pedido' AFTER direccion_entrega;
UPDATE domicilios d JOIN barrios b ON b.nombre = TRIM(d.barrio)
   SET d.id_barrio = b.id_barrio, d.costo_envio = b.costo_domicilio;
ALTER TABLE domicilios
  MODIFY id_barrio INT NOT NULL COMMENT 'FK: barrio de entrega (barrios)',
  ADD CONSTRAINT fk_domicilio_barrio FOREIGN KEY (id_barrio)
    REFERENCES barrios (id_barrio) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT chk_domicilio_costo CHECK (costo_envio >= 0),
  DROP COLUMN barrio;

-- sesiones_chatbot: barrio_temp (texto) -> id_barrio_temp (FK)
ALTER TABLE sesiones_chatbot
  ADD COLUMN id_barrio_temp INT NULL COMMENT 'FK: barrio elegido en el chat' AFTER direccion_temp;
UPDATE sesiones_chatbot s JOIN barrios b ON b.nombre = TRIM(s.barrio_temp) SET s.id_barrio_temp = b.id_barrio;
ALTER TABLE sesiones_chatbot
  ADD CONSTRAINT fk_sesion_barrio FOREIGN KEY (id_barrio_temp)
    REFERENCES barrios (id_barrio) ON DELETE SET NULL ON UPDATE CASCADE,
  DROP COLUMN barrio_temp;

-- ---------------------------------------------------------------------
-- BLOQUE 7 · carrito_chatbot: cantidad positiva
-- ---------------------------------------------------------------------
ALTER TABLE carrito_chatbot
  ALTER COLUMN cantidad SET DEFAULT 1,
  ADD CONSTRAINT chk_carrito_cantidad CHECK (cantidad > 0);

-- ---------------------------------------------------------------------
-- BLOQUE 8 · Verificación final
-- ---------------------------------------------------------------------
-- 18 tablas
SELECT COUNT(*) AS tablas FROM information_schema.tables WHERE table_schema = DATABASE();
-- Restricciones CHECK nuevas (deben salir 12)
SELECT table_name, constraint_name FROM information_schema.table_constraints
 WHERE table_schema = DATABASE() AND constraint_type = 'CHECK' ORDER BY table_name;
-- Los datos se conservaron
SELECT l.id_log, m.nombre AS modulo, l.accion FROM log_auditoria l JOIN modulos m USING (id_modulo);
SELECT c.id_cliente, c.nombre, c.apellido, b.nombre AS barrio FROM clientes c LEFT JOIN barrios b USING (id_barrio);
-- El cajero ya no tiene ventas.cerrar_caja ni ventas.anular
SELECT r.nombre AS rol, p.codigo FROM rol_permiso rp
  JOIN roles r USING (id_rol) JOIN permisos p USING (id_permiso)
 WHERE r.id_rol IN (2, 3) ORDER BY r.id_rol, p.codigo;
SELECT d.id_domicilio, b.nombre AS barrio, d.costo_envio FROM domicilios d JOIN barrios b USING (id_barrio);
-- Prueba de una restricción: debe FALLAR con el error 3819 (Check constraint ... is violated)
-- UPDATE productos SET stock_actual = -1 WHERE codigo_producto = '7702001001';
