-- |||=============================================================================================|||
-- |||                       CONTROL STORE · AUTOSERVICIO AYUELAL · SENA ADSO                       |||
-- |||                         01 · ESTRUCTURA DE LA BASE DE DATOS (DDL)                            |||
-- |||                           MySQL 8.4 · base controlstore_sena · 18 tablas                       |||
-- |||=============================================================================================|||
-- |||                                                                                             |||
-- |||  CONTENIDO                                                                                  |||
-- |||    00. Crear la base de datos ......................... CREATE DATABASE ____ ;              |||
-- |||    01. Módulo Usuarios y seguridad (6 tablas) ......... roles, modulos, permisos,            |||
-- |||                                                         rol_permiso, usuarios, log_auditoria |||
-- |||    02. Módulo Inventario (3 tablas) ................... categorias, productos,                |||
-- |||                                                         movimientos_inventario               |||
-- |||    03. Módulo Ventas y caja (4 tablas) ................ metodos_pago, arqueo_caja, ventas,    |||
-- |||                                                         detalle_venta                        |||
-- |||    04. Módulo Domicilios (2 tablas) ................... barrios, domicilios                   |||
-- |||    05. Módulo Clientes y ChatBot (3 tablas) ........... clientes, sesiones_chatbot,          |||
-- |||                                                         carrito_chatbot                      |||
-- |||    06. Verificación ................................... SHOW TABLES ; DESCRIBE ____ ;         |||
-- |||                                                                                             |||
-- |||  ORDEN DE EJECUCIÓN DE LOS SCRIPTS                                                          |||
-- |||    1) 01_base_datos/01_db_estructura.sql      (este)                                         |||
-- |||    2) 03_sentencias_dml/01_db_dml_datos.sql                                                  |||
-- |||    3) 04_programacion_db/01_triggers.sql, 02_views.sql, 03_procedures.sql                    |||
-- |||    4) 02_sentencias_ddl, 03_sentencias_dml (02 y 03) y 05_seguridad_db: práctica              |||
-- |||                                                                                             |||
-- |||  EN CONSOLA (CMD de Windows):                                                               |||
-- |||    cd "C:\Program Files\MySQL\MySQL Server 8.4\bin"                                         |||
-- |||    mysql -h localhost -u root -p --default-character-set=utf8mb4                            |||
-- |||    mysql> SOURCE C:/Users/bryan/proyecto_grado_alexander/database/01_base_datos/01_db_estructura.sql
-- |||                                                                                             |||
-- |||  ⚠ ATENCIÓN: la línea DROP DATABASE BORRA la base controlstore_sena con todos sus datos.    |||
-- |||    Antes de ejecutar este script sobre una base que ya existe, haga un respaldo:            |||
-- |||    mysqldump -u root -p --routines --triggers controlstore_sena > respaldo.sql              |||
-- |||                                                                                             |||
-- |||  CONVENCIONES                                                                               |||
-- |||    PK: id_<tabla> (salvo productos, que usa el código de barras) · FK: fk_<hija>_<padre>     |||
-- |||    UNIQUE: uq_<tabla>_<columna> · CHECK: chk_<tabla>_<regla>                                 |||
-- |||    Motor InnoDB (necesario para llaves foráneas y transacciones) · utf8mb4_spanish_ci        |||
-- |||=============================================================================================|||


-- ---------------------------------------------------------------------------------------------------
-- 00. CREAR LA BASE DE DATOS ........................................... CREATE DATABASE ____ ;
-- ---------------------------------------------------------------------------------------------------
-- Las tablas se crean agrupadas por módulo, así que algunas apuntan a otras que se crean después
-- (ventas -> clientes). Mientras se crean se apaga la revisión de llaves foráneas y al final se
-- vuelve a encender (sección 06). Es lo mismo que hace mysqldump en sus volcados.
SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS controlstore_sena;
CREATE DATABASE controlstore_sena
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_spanish_ci;
USE controlstore_sena;


-- ===================================================================================================
-- 01. MÓDULO USUARIOS Y SEGURIDAD
-- ===================================================================================================

-- 01.01. roles: catálogo de roles del personal (administrador, cajero, domiciliario...)
CREATE TABLE roles (
  id_rol  TINYINT     NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del rol',
  nombre  VARCHAR(30) NOT NULL                COMMENT 'Nombre del rol: administrador, cajero, domiciliario...',
  PRIMARY KEY (id_rol),
  UNIQUE KEY uq_roles_nombre (nombre)
) ENGINE = InnoDB COMMENT = 'Catálogo de roles que puede tener un usuario del sistema';

-- 01.02. modulos: los cinco módulos funcionales del sistema
CREATE TABLE modulos (
  id_modulo    TINYINT      NOT NULL AUTO_INCREMENT COMMENT 'Identificador del módulo',
  nombre       VARCHAR(30)  NOT NULL                COMMENT 'Nombre del módulo funcional',
  descripcion  VARCHAR(150)     NULL                COMMENT 'Descripción del módulo',
  PRIMARY KEY (id_modulo),
  UNIQUE KEY uq_modulo_nombre (nombre)
) ENGINE = InnoDB COMMENT = 'Los cinco módulos funcionales del sistema';

-- 01.03. permisos: cada acción que el sistema puede autorizar (formato modulo.accion)
CREATE TABLE permisos (
  id_permiso   INT          NOT NULL AUTO_INCREMENT COMMENT 'Identificador del permiso',
  id_modulo    TINYINT      NOT NULL                COMMENT 'FK: módulo al que pertenece',
  codigo       VARCHAR(50)  NOT NULL                COMMENT 'Formato modulo.accion, ej. ventas.anular',
  descripcion  VARCHAR(150) NOT NULL                COMMENT 'Qué permite hacer',
  PRIMARY KEY (id_permiso),
  UNIQUE KEY uq_permiso_codigo (codigo),
  CONSTRAINT fk_permiso_modulo FOREIGN KEY (id_modulo)
    REFERENCES modulos (id_modulo) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB COMMENT = 'Acciones concretas que el sistema puede autorizar';

-- 01.04. rol_permiso: relación muchos a muchos entre roles y permisos (llave compuesta)
CREATE TABLE rol_permiso (
  id_rol      TINYINT NOT NULL COMMENT 'FK: rol',
  id_permiso  INT     NOT NULL COMMENT 'FK: permiso concedido',
  PRIMARY KEY (id_rol, id_permiso),
  CONSTRAINT fk_rol_permiso_rol FOREIGN KEY (id_rol)
    REFERENCES roles (id_rol) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_rol_permiso_permiso FOREIGN KEY (id_permiso)
    REFERENCES permisos (id_permiso) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB COMMENT = 'Qué permisos tiene cada rol (relación N:M)';

-- 01.05. usuarios: personal que inicia sesión en el sistema
CREATE TABLE usuarios (
  id_usuario         INT              NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del usuario',
  documento          VARCHAR(15)      NOT NULL                COMMENT 'Documento de identidad',
  nombre             VARCHAR(60)      NOT NULL                COMMENT 'Nombres del usuario',
  apellido           VARCHAR(60)      NOT NULL                COMMENT 'Apellidos del usuario',
  email              VARCHAR(100)     NOT NULL                COMMENT 'Correo electrónico (usado para iniciar sesión)',
  telefono           VARCHAR(20)          NULL                COMMENT 'Teléfono de contacto',
  id_rol             TINYINT          NOT NULL                COMMENT 'FK: rol asignado al usuario',
  contrasena_hash    VARCHAR(255)     NOT NULL                COMMENT 'Contraseña cifrada (nunca en texto plano)',
  activo             TINYINT(1)       NOT NULL DEFAULT 1      COMMENT '1 = activo, 0 = inactivo (baja lógica)',
  intentos_fallidos  TINYINT UNSIGNED NOT NULL DEFAULT 0      COMMENT 'Intentos de inicio de sesión fallidos seguidos',
  bloqueado_hasta    DATETIME             NULL                COMMENT 'Fecha hasta la que el acceso está bloqueado',
  fecha_registro     DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación de la cuenta',
  PRIMARY KEY (id_usuario),
  UNIQUE KEY uq_usuario_documento (documento),
  UNIQUE KEY uq_usuario_email (email),
  CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol)
    REFERENCES roles (id_rol) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB COMMENT = 'Usuarios del sistema: administrador, cajero y domiciliario';

-- 01.06. log_auditoria: bitácora de las acciones (id_usuario NULL = intento de acceso anónimo)
CREATE TABLE log_auditoria (
  id_log      INT          NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del evento',
  id_usuario  INT              NULL                COMMENT 'FK: usuario que ejecutó la acción (NULL = intento anónimo)',
  id_modulo   TINYINT      NOT NULL                COMMENT 'FK: módulo afectado',
  accion      VARCHAR(50)  NOT NULL                COMMENT 'Acción: login, registrar, actualizar, anular...',
  detalle     VARCHAR(255)     NULL                COMMENT 'Descripción del evento',
  ip          VARCHAR(45)      NULL                COMMENT 'Dirección IP de origen (admite IPv6)',
  fecha       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora del evento',
  PRIMARY KEY (id_log),
  CONSTRAINT fk_log_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuarios (id_usuario) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_log_modulo FOREIGN KEY (id_modulo)
    REFERENCES modulos (id_modulo) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB COMMENT = 'Bitácora de auditoría de las acciones del sistema';


-- ===================================================================================================
-- 02. MÓDULO INVENTARIO
-- ===================================================================================================

-- 02.01. categorias
CREATE TABLE categorias (
  id_categoria  INT          NOT NULL AUTO_INCREMENT COMMENT 'Identificador único de la categoría',
  nombre        VARCHAR(50)  NOT NULL                COMMENT 'Nombre de la categoría (Lácteos, Abarrotes...)',
  descripcion   VARCHAR(255)     NULL                COMMENT 'Descripción opcional',
  PRIMARY KEY (id_categoria),
  UNIQUE KEY uq_categoria_nombre (nombre)
) ENGINE = InnoDB COMMENT = 'Categorías que clasifican los productos';

-- 02.02. productos: la llave primaria es el código de barras (llave natural)
CREATE TABLE productos (
  codigo_producto  VARCHAR(20)   NOT NULL              COMMENT 'Código de barras del producto',
  id_categoria     INT           NOT NULL              COMMENT 'FK: categoría',
  nombre           VARCHAR(100)  NOT NULL              COMMENT 'Nombre comercial',
  descripcion      VARCHAR(255)      NULL              COMMENT 'Descripción opcional',
  precio_compra    DECIMAL(10,2) NOT NULL DEFAULT 0    COMMENT 'Costo al proveedor (permite calcular la ganancia)',
  precio_unitario  DECIMAL(10,2) NOT NULL              COMMENT 'Precio de venta vigente (COP)',
  stock_actual     INT           NOT NULL DEFAULT 0    COMMENT 'Unidades disponibles',
  stock_minimo     INT           NOT NULL DEFAULT 0    COMMENT 'Umbral que dispara la alerta de stock',
  unidad_medida    VARCHAR(20)       NULL              COMMENT 'Unidad, litro, paquete...',
  activo           TINYINT(1)    NOT NULL DEFAULT 1    COMMENT '1 = en catálogo, 0 = descontinuado',
  PRIMARY KEY (codigo_producto),
  CONSTRAINT fk_producto_categoria FOREIGN KEY (id_categoria)
    REFERENCES categorias (id_categoria) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_producto_precio_compra CHECK (precio_compra >= 0),
  CONSTRAINT chk_producto_precio        CHECK (precio_unitario > 0),
  CONSTRAINT chk_producto_stock         CHECK (stock_actual >= 0),
  CONSTRAINT chk_producto_stock_minimo  CHECK (stock_minimo >= 0)
) ENGINE = InnoDB COMMENT = 'Catálogo de productos del autoservicio';

-- 02.03. movimientos_inventario: kárdex (entrada suma; salida y ajuste restan)
CREATE TABLE movimientos_inventario (
  id_movimiento    INT          NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del movimiento',
  codigo_producto  VARCHAR(20)  NOT NULL                COMMENT 'FK: producto afectado',
  id_usuario       INT          NOT NULL                COMMENT 'FK: usuario responsable',
  tipo             ENUM('entrada','salida','ajuste') NOT NULL COMMENT 'Naturaleza del movimiento',
  cantidad         INT          NOT NULL                COMMENT 'Unidades (siempre positivas)',
  observacion      VARCHAR(255)     NULL                COMMENT 'Motivo del movimiento',
  fecha            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora',
  PRIMARY KEY (id_movimiento),
  CONSTRAINT fk_mov_producto FOREIGN KEY (codigo_producto)
    REFERENCES productos (codigo_producto) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_mov_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuarios (id_usuario) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_mov_cantidad CHECK (cantidad > 0)
) ENGINE = InnoDB COMMENT = 'Kárdex: entradas, salidas y ajustes de stock';


-- ===================================================================================================
-- 03. MÓDULO VENTAS Y CAJA
-- ===================================================================================================

-- 03.01. metodos_pago
CREATE TABLE metodos_pago (
  id_metodo_pago  INT         NOT NULL AUTO_INCREMENT COMMENT 'Identificador del método de pago',
  nombre          VARCHAR(30) NOT NULL                COMMENT 'Efectivo, Nequi, Transferencia, Tarjeta...',
  activo          TINYINT(1)  NOT NULL DEFAULT 1      COMMENT '1 = disponible para cobrar',
  PRIMARY KEY (id_metodo_pago),
  UNIQUE KEY uq_metodo_nombre (nombre)
) ENGINE = InnoDB COMMENT = 'Métodos de pago aceptados';

-- 03.02. arqueo_caja: turno de caja. diferencia es una columna calculada VIRTUAL (no se almacena)
CREATE TABLE arqueo_caja (
  id_arqueo       INT           NOT NULL AUTO_INCREMENT COMMENT 'Identificador del turno',
  id_usuario      INT           NOT NULL                COMMENT 'FK: cajero que abre el turno',
  fecha_apertura  DATETIME      NOT NULL                COMMENT 'Inicio del turno',
  fecha_cierre    DATETIME          NULL                COMMENT 'Fin del turno (NULL = caja abierta)',
  monto_inicial   DECIMAL(12,2) NOT NULL                COMMENT 'Base de caja',
  monto_final     DECIMAL(12,2)     NULL                COMMENT 'Efectivo contado al cierre',
  total_ventas    DECIMAL(12,2)     NULL                COMMENT 'Total vendido en el turno (todos los medios)',
  total_efectivo  DECIMAL(12,2)     NULL                COMMENT 'Ventas en efectivo: lo único que entra al cajón',
  diferencia      DECIMAL(12,2) GENERATED ALWAYS AS (monto_final - monto_inicial - total_efectivo) VIRTUAL
                                                        COMMENT 'Faltante (-) o sobrante (+), calculado al leer',
  observacion     VARCHAR(255)      NULL                COMMENT 'Notas del cierre',
  PRIMARY KEY (id_arqueo),
  CONSTRAINT fk_arqueo_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuarios (id_usuario) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_arqueo_monto_inicial  CHECK (monto_inicial  >= 0),
  CONSTRAINT chk_arqueo_monto_final    CHECK (monto_final    >= 0),
  CONSTRAINT chk_arqueo_total_ventas   CHECK (total_ventas   >= 0),
  CONSTRAINT chk_arqueo_total_efectivo CHECK (total_efectivo >= 0)
) ENGINE = InnoDB COMMENT = 'Aperturas y cierres de caja por turno';

-- 03.03. ventas: encabezado de la venta (se anula con estado, no se borra)
CREATE TABLE ventas (
  id_venta        INT           NOT NULL AUTO_INCREMENT COMMENT 'Identificador de la venta',
  id_usuario      INT           NOT NULL                COMMENT 'FK: quién registró la venta',
  id_arqueo       INT               NULL                COMMENT 'FK: turno de caja (NULL = venta fuera de turno)',
  id_cliente      INT               NULL                COMMENT 'FK: cliente (NULL = venta de mostrador)',
  id_metodo_pago  INT           NOT NULL                COMMENT 'FK: forma de pago',
  fecha           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora',
  total           DECIMAL(12,2) NOT NULL DEFAULT 0      COMMENT 'Total de la venta (lo mantienen los disparadores)',
  estado          ENUM('pagada','pendiente','anulada') NOT NULL DEFAULT 'pagada' COMMENT 'Estado de la venta',
  PRIMARY KEY (id_venta),
  CONSTRAINT fk_venta_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuarios (id_usuario) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_venta_arqueo FOREIGN KEY (id_arqueo)
    REFERENCES arqueo_caja (id_arqueo) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_venta_cliente FOREIGN KEY (id_cliente)
    REFERENCES clientes (id_cliente) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_venta_metodo FOREIGN KEY (id_metodo_pago)
    REFERENCES metodos_pago (id_metodo_pago) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_venta_total CHECK (total >= 0)
) ENGINE = InnoDB COMMENT = 'Cabecera de cada venta realizada';

-- 03.04. detalle_venta: renglones de la venta. subtotal es una columna calculada VIRTUAL
CREATE TABLE detalle_venta (
  id_detalle       INT           NOT NULL AUTO_INCREMENT COMMENT 'Identificador del renglón',
  id_venta         INT           NOT NULL                COMMENT 'FK: venta',
  codigo_producto  VARCHAR(20)   NOT NULL                COMMENT 'FK: producto vendido',
  cantidad         INT           NOT NULL                COMMENT 'Unidades vendidas',
  precio_venta     DECIMAL(10,2) NOT NULL                COMMENT 'Precio histórico del día de la venta',
  subtotal         DECIMAL(12,2) GENERATED ALWAYS AS (cantidad * precio_venta) VIRTUAL
                                                         COMMENT 'cantidad x precio_venta, calculado al leer',
  PRIMARY KEY (id_detalle),
  UNIQUE KEY uq_detalle_venta_producto (id_venta, codigo_producto),
  CONSTRAINT fk_detalle_venta FOREIGN KEY (id_venta)
    REFERENCES ventas (id_venta) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_detalle_producto FOREIGN KEY (codigo_producto)
    REFERENCES productos (codigo_producto) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_detalle_cantidad CHECK (cantidad > 0),
  CONSTRAINT chk_detalle_precio   CHECK (precio_venta > 0),
  CONSTRAINT chk_detalle_subtotal CHECK (subtotal >= 0)
) ENGINE = InnoDB COMMENT = 'Renglones de cada venta (sin venta no hay detalle)';


-- ===================================================================================================
-- 04. MÓDULO DOMICILIOS
-- ===================================================================================================

-- 04.01. barrios: zona de cobertura y tarifa del domicilio
CREATE TABLE barrios (
  id_barrio        INT           NOT NULL AUTO_INCREMENT COMMENT 'Identificador del barrio',
  nombre           VARCHAR(50)   NOT NULL                COMMENT 'Nombre del barrio',
  costo_domicilio  DECIMAL(10,2) NOT NULL                COMMENT 'Tarifa vigente del domicilio',
  activo           TINYINT(1)    NOT NULL DEFAULT 1      COMMENT '1 = dentro de la cobertura',
  PRIMARY KEY (id_barrio),
  UNIQUE KEY uq_barrio_nombre (nombre),
  CONSTRAINT chk_barrio_costo CHECK (costo_domicilio >= 0)
) ENGINE = InnoDB COMMENT = 'Zona de cobertura y costo de domicilio por barrio';

-- 04.02. domicilios: una venta tiene a lo sumo un domicilio (id_venta UNIQUE)
CREATE TABLE domicilios (
  id_domicilio       INT           NOT NULL AUTO_INCREMENT COMMENT 'Identificador del domicilio',
  id_venta           INT           NOT NULL                COMMENT 'FK única: venta que se despacha',
  id_domiciliario    INT               NULL                COMMENT 'FK: domiciliario asignado (NULL = sin asignar)',
  id_barrio          INT           NOT NULL                COMMENT 'FK: barrio de entrega',
  direccion_entrega  VARCHAR(150)  NOT NULL                COMMENT 'Dirección exacta de entrega',
  costo_envio        DECIMAL(10,2) NOT NULL DEFAULT 0      COMMENT 'Copia de la tarifa del barrio al momento del pedido',
  telefono_contacto  VARCHAR(20)   NOT NULL                COMMENT 'Teléfono de quien recibe',
  estado             ENUM('pendiente','asignado','en_camino','entregado','cancelado')
                                   NOT NULL DEFAULT 'pendiente' COMMENT 'Estado de la entrega',
  fecha_asignacion   DATETIME          NULL                COMMENT 'Cuándo se asignó',
  fecha_entrega      DATETIME          NULL                COMMENT 'Cuándo se entregó',
  observacion        VARCHAR(255)      NULL                COMMENT 'Notas',
  PRIMARY KEY (id_domicilio),
  UNIQUE KEY uq_domicilio_venta (id_venta),
  CONSTRAINT fk_domicilio_venta FOREIGN KEY (id_venta)
    REFERENCES ventas (id_venta) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_domicilio_usuario FOREIGN KEY (id_domiciliario)
    REFERENCES usuarios (id_usuario) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_domicilio_barrio FOREIGN KEY (id_barrio)
    REFERENCES barrios (id_barrio) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_domicilio_costo CHECK (costo_envio >= 0)
) ENGINE = InnoDB COMMENT = 'Entregas a domicilio de una venta';


-- ===================================================================================================
-- 05. MÓDULO CLIENTES Y CHATBOT
-- ===================================================================================================

-- 05.01. clientes: piden por WhatsApp; el teléfono los identifica (UNIQUE)
CREATE TABLE clientes (
  id_cliente  INT          NOT NULL AUTO_INCREMENT COMMENT 'Identificador del cliente',
  nombre      VARCHAR(60)  NOT NULL                COMMENT 'Nombres del cliente',
  apellido    VARCHAR(60)      NULL                COMMENT 'Apellidos del cliente (1FN: separado del nombre)',
  telefono    VARCHAR(20)  NOT NULL                COMMENT 'Número de WhatsApp',
  direccion   VARCHAR(150)     NULL                COMMENT 'Dirección habitual',
  id_barrio   INT              NULL                COMMENT 'FK: barrio del cliente',
  PRIMARY KEY (id_cliente),
  UNIQUE KEY uq_cliente_telefono (telefono),
  CONSTRAINT fk_cliente_barrio FOREIGN KEY (id_barrio)
    REFERENCES barrios (id_barrio) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB COMMENT = 'Clientes que compran o piden a domicilio';

-- 05.02. sesiones_chatbot: conversación en curso (existe antes de saber quién es el cliente)
CREATE TABLE sesiones_chatbot (
  id_sesion            INT          NOT NULL AUTO_INCREMENT COMMENT 'Identificador de la sesión',
  telefono             VARCHAR(20)  NOT NULL                COMMENT 'Número de WhatsApp que escribe',
  id_cliente           INT              NULL                COMMENT 'FK: cliente, si ya se identificó',
  paso                 VARCHAR(30)  NOT NULL DEFAULT 'inicio' COMMENT 'Paso actual de la conversación',
  direccion_temp       VARCHAR(150)     NULL                COMMENT 'Dirección mientras se arma el pedido',
  id_barrio_temp       INT              NULL                COMMENT 'FK: barrio elegido en el chat',
  fecha_actualizacion  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                                                            COMMENT 'Última actividad',
  PRIMARY KEY (id_sesion),
  UNIQUE KEY uq_sesiones_chatbot_telefono (telefono),
  CONSTRAINT fk_sesiones_chatbot_cliente FOREIGN KEY (id_cliente)
    REFERENCES clientes (id_cliente) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_sesion_barrio FOREIGN KEY (id_barrio_temp)
    REFERENCES barrios (id_barrio) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB COMMENT = 'Estado conversacional del ChatBot de WhatsApp';

-- 05.03. carrito_chatbot: productos elegidos en el chat (llave compuesta)
CREATE TABLE carrito_chatbot (
  id_sesion        INT          NOT NULL           COMMENT 'FK: sesión',
  codigo_producto  VARCHAR(20)  NOT NULL           COMMENT 'FK: producto',
  cantidad         INT          NOT NULL DEFAULT 1 COMMENT 'Unidades',
  PRIMARY KEY (id_sesion, codigo_producto),
  CONSTRAINT fk_carrito_sesion FOREIGN KEY (id_sesion)
    REFERENCES sesiones_chatbot (id_sesion) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_carrito_producto FOREIGN KEY (codigo_producto)
    REFERENCES productos (codigo_producto) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_carrito_cantidad CHECK (cantidad > 0)
) ENGINE = InnoDB COMMENT = 'Productos que el cliente va agregando en el chat';


-- ---------------------------------------------------------------------------------------------------
-- 06. VERIFICACIÓN ......................................... SHOW TABLES ; DESCRIBE ____ ;
-- ---------------------------------------------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 1;

SHOW TABLES;                 -- deben salir 18 tablas
DESCRIBE ventas;             -- columnas, tipos, llaves y valores por defecto de una tabla
SELECT table_name AS tabla, constraint_type AS tipo, COUNT(*) AS cantidad
  FROM information_schema.table_constraints
 WHERE table_schema = 'controlstore_sena'
 GROUP BY table_name, constraint_type
 ORDER BY table_name, constraint_type;   -- PRIMARY KEY, FOREIGN KEY, UNIQUE y CHECK por tabla
