-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 23, 2026 at 08:40 PM
-- Server version: 8.4.9
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `controlstore_sena`
--

-- --------------------------------------------------------

--
-- Table structure for table `arqueo_caja`
--

CREATE TABLE `arqueo_caja` (
  `id_arqueo` int NOT NULL COMMENT 'Identificador único del arqueo',
  `id_usuario` int NOT NULL COMMENT 'FK: cajero que abre/cierra la caja',
  `fecha_apertura` datetime NOT NULL COMMENT 'Momento de apertura de la caja',
  `fecha_cierre` datetime DEFAULT NULL COMMENT 'Momento de cierre (NULL = caja abierta)',
  `monto_inicial` decimal(12,2) NOT NULL COMMENT 'Base con la que abre la caja',
  `monto_final` decimal(12,2) DEFAULT NULL COMMENT 'Efectivo contado al cierre',
  `total_ventas` decimal(12,2) DEFAULT NULL COMMENT 'Total vendido en el turno, todos los medios de pago (reportes)',
  `total_efectivo` decimal(12,2) DEFAULT NULL COMMENT 'Ventas pagadas en efectivo: lo unico que entra al cajon',
  `diferencia` decimal(12,2) GENERATED ALWAYS AS (((`monto_final` - `monto_inicial`) - `total_efectivo`)) STORED COMMENT 'Descuadre real: efectivo contado menos efectivo esperado',
  `observacion` varchar(255) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Notas del arqueo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Aperturas y cierres de caja por turno';

--
-- Dumping data for table `arqueo_caja`
--

INSERT INTO `arqueo_caja` (`id_arqueo`, `id_usuario`, `fecha_apertura`, `fecha_cierre`, `monto_inicial`, `monto_final`, `total_ventas`, `total_efectivo`, `observacion`) VALUES
(2, 2, '2026-09-23 08:40:30', '2026-09-23 11:40:30', 20000.00, 49750.00, 62050.00, 29750.00, 'Turno de la tarde, sin novedades');

-- --------------------------------------------------------

--
-- Table structure for table `carrito_chatbot`
--

CREATE TABLE `carrito_chatbot` (
  `id_sesion` int NOT NULL COMMENT 'FK: sesion de WhatsApp a la que pertenece',
  `codigo_producto` varchar(20) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'FK: producto elegido por el cliente',
  `cantidad` int NOT NULL COMMENT 'Unidades elegidas'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Productos que el cliente va eligiendo en la conversacion del ChatBot';

--
-- Dumping data for table `carrito_chatbot`
--

INSERT INTO `carrito_chatbot` (`id_sesion`, `codigo_producto`, `cantidad`) VALUES
(2, '7702001003', 1),
(2, '7702001005', 2);

-- --------------------------------------------------------

--
-- Table structure for table `categorias`
--

CREATE TABLE `categorias` (
  `id_categoria` int NOT NULL COMMENT 'Identificador único de la categoría',
  `nombre` varchar(50) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Nombre de la categoría (Lácteos, Abarrotes...)',
  `descripcion` varchar(255) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Descripción opcional de la categoría'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Categorías que clasifican los productos';

--
-- Dumping data for table `categorias`
--

INSERT INTO `categorias` (`id_categoria`, `nombre`, `descripcion`) VALUES
(1, 'Lácteos', 'Leches, quesos y derivados'),
(2, 'Abarrotes', 'Granos, aceites y despensa'),
(3, 'Bebidas', 'Gaseosas, jugos y café'),
(4, 'Panadería', 'Pan y repostería'),
(5, 'Aseo', 'Aseo personal y del hogar');

-- --------------------------------------------------------

--
-- Table structure for table `clientes`
--

CREATE TABLE `clientes` (
  `id_cliente` int NOT NULL COMMENT 'Identificador único del cliente',
  `nombre` varchar(100) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Nombre del cliente',
  `telefono` varchar(20) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Teléfono (canal del ChatBot de WhatsApp)',
  `direccion` varchar(150) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Dirección registrada del cliente',
  `barrio` varchar(50) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Barrio o sector'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Clientes que compran o piden a domicilio';

--
-- Dumping data for table `clientes`
--

INSERT INTO `clientes` (`id_cliente`, `nombre`, `telefono`, `direccion`, `barrio`) VALUES
(1, 'Maria Restrepo', '3011234567', 'Calle 12 # 4-30', 'Centro'),
(2, 'Carlos Ruiz', '3109876543', 'Carrera 7 # 15-02', 'La Playa');

-- --------------------------------------------------------

--
-- Table structure for table `detalle_venta`
--

CREATE TABLE `detalle_venta` (
  `id_detalle` int NOT NULL COMMENT 'Identificador único del renglón',
  `id_venta` int NOT NULL COMMENT 'FK: venta a la que pertenece el renglón',
  `codigo_producto` varchar(20) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'FK: producto vendido',
  `cantidad` int NOT NULL COMMENT 'Unidades vendidas',
  `precio_venta` decimal(10,2) NOT NULL COMMENT 'Precio histórico al momento de la venta',
  `subtotal` decimal(12,2) GENERATED ALWAYS AS ((`cantidad` * `precio_venta`)) STORED COMMENT 'Calculado por el motor: cantidad x precio'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Renglones de cada venta (composición: sin venta no hay detalle)';

--
-- Dumping data for table `detalle_venta`
--

INSERT INTO `detalle_venta` (`id_detalle`, `id_venta`, `codigo_producto`, `cantidad`, `precio_venta`) VALUES
(3, 2, '7702001001', 2, 2850.00),
(4, 2, '7702001005', 1, 3000.00),
(5, 3, '7702001002', 1, 12500.00),
(6, 3, '7702001003', 2, 9900.00),
(7, 4, '7702001001', 3, 2850.00),
(8, 4, '7702001002', 1, 12500.00);

--
-- Triggers `detalle_venta`
--
DELIMITER $$
CREATE TRIGGER `trg_detalle_after_delete` AFTER DELETE ON `detalle_venta` FOR EACH ROW BEGIN
  UPDATE ventas
     SET total = (SELECT IFNULL(SUM(subtotal), 0)
                    FROM detalle_venta
                   WHERE id_venta = OLD.id_venta)
   WHERE id_venta = OLD.id_venta;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_detalle_after_insert` AFTER INSERT ON `detalle_venta` FOR EACH ROW BEGIN
  UPDATE ventas
     SET total = (SELECT IFNULL(SUM(subtotal), 0)
                    FROM detalle_venta
                   WHERE id_venta = NEW.id_venta)
   WHERE id_venta = NEW.id_venta;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_detalle_after_update` AFTER UPDATE ON `detalle_venta` FOR EACH ROW BEGIN
  UPDATE ventas
     SET total = (SELECT IFNULL(SUM(subtotal), 0)
                    FROM detalle_venta
                   WHERE id_venta = NEW.id_venta)
   WHERE id_venta = NEW.id_venta;

  -- Caso raro pero posible: el renglon se movio a otra venta.
  -- Hay que recalcular tambien la venta de la que salio.
  IF OLD.id_venta <> NEW.id_venta THEN
    UPDATE ventas
       SET total = (SELECT IFNULL(SUM(subtotal), 0)
                      FROM detalle_venta
                     WHERE id_venta = OLD.id_venta)
     WHERE id_venta = OLD.id_venta;
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `domicilios`
--

CREATE TABLE `domicilios` (
  `id_domicilio` int NOT NULL COMMENT 'Identificador único del domicilio',
  `id_venta` int NOT NULL COMMENT 'FK única: venta que se despacha',
  `id_domiciliario` int DEFAULT NULL COMMENT 'FK: usuario domiciliario asignado (NULL = sin asignar)',
  `direccion_entrega` varchar(150) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Dirección exacta de entrega',
  `barrio` varchar(50) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Barrio o sector de entrega',
  `telefono_contacto` varchar(20) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Teléfono de quien recibe',
  `estado` enum('pendiente','asignado','en_camino','entregado','cancelado') COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'pendiente' COMMENT 'Estado del recorrido (CU22.2: inicia Pendiente)',
  `fecha_asignacion` datetime DEFAULT NULL COMMENT 'Momento en que se asignó el domiciliario',
  `fecha_entrega` datetime DEFAULT NULL COMMENT 'Momento en que se entregó el pedido',
  `observacion` varchar(255) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Notas del cliente o del ChatBot'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Entregas a domicilio originadas por el ChatBot o el punto de venta';

--
-- Dumping data for table `domicilios`
--

INSERT INTO `domicilios` (`id_domicilio`, `id_venta`, `id_domiciliario`, `direccion_entrega`, `barrio`, `telefono_contacto`, `estado`, `fecha_asignacion`, `fecha_entrega`, `observacion`) VALUES
(1, 3, 3, 'Calle 12 # 4-30', 'Centro', '3011234567', 'entregado', '2026-09-23 10:20:30', '2026-09-23 11:00:30', 'Entregado en porteria');

-- --------------------------------------------------------

--
-- Table structure for table `log_auditoria`
--

CREATE TABLE `log_auditoria` (
  `id_log` int NOT NULL COMMENT 'Identificador único del evento',
  `id_usuario` int DEFAULT NULL COMMENT 'FK: usuario que ejecutó la acción (NULL = intento anónimo)',
  `accion` varchar(50) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Acción realizada: registrar, actualizar, eliminar, login...',
  `modulo` varchar(30) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Módulo afectado: inventario, ventas, usuarios...',
  `detalle` varchar(255) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Descripción del evento',
  `ip` varchar(45) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Dirección IP de origen',
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora del evento'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Bitácora de auditoría de todas las acciones del sistema';

--
-- Dumping data for table `log_auditoria`
--

INSERT INTO `log_auditoria` (`id_log`, `id_usuario`, `accion`, `modulo`, `detalle`, `ip`, `fecha`) VALUES
(1, 2, 'login', 'usuarios', 'Inicio de sesion exitoso', '192.168.1.15', '2026-09-23 08:40:30'),
(2, 2, 'registrar', 'ventas', 'Registro la venta #2 por $8.700', '192.168.1.15', '2026-09-23 09:40:30'),
(3, 2, 'registrar', 'ventas', 'Registro la venta #3 por $32.300', '192.168.1.15', '2026-09-23 10:10:30'),
(4, 1, 'actualizar', 'inventario', 'Ingreso de stock: Azucar Blanca 2kg, +30 unidades', '192.168.1.10', '2026-09-22 11:40:30'),
(5, 3, 'actualizar', 'domicilios', 'Marco el domicilio de la venta #3 como entregado', '192.168.1.22', '2026-09-23 11:00:30');

-- --------------------------------------------------------

--
-- Table structure for table `metodos_pago`
--

CREATE TABLE `metodos_pago` (
  `id_metodo_pago` int NOT NULL COMMENT 'Identificador único del método de pago',
  `nombre` varchar(30) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Nombre: Efectivo, Nequi, Transferencia, Tarjeta',
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1=disponible para cobrar'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Métodos de pago aceptados por el autoservicio';

--
-- Dumping data for table `metodos_pago`
--

INSERT INTO `metodos_pago` (`id_metodo_pago`, `nombre`, `activo`) VALUES
(1, 'Efectivo', 1),
(2, 'Nequi', 1),
(3, 'Transferencia', 1),
(4, 'Tarjeta', 1);

-- --------------------------------------------------------

--
-- Table structure for table `movimientos_inventario`
--

CREATE TABLE `movimientos_inventario` (
  `id_movimiento` int NOT NULL COMMENT 'Identificador único del movimiento',
  `codigo_producto` varchar(20) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'FK: producto afectado por el movimiento',
  `id_usuario` int NOT NULL COMMENT 'FK: usuario responsable del movimiento',
  `tipo` enum('entrada','salida','ajuste') COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Naturaleza del movimiento de stock',
  `cantidad` int NOT NULL COMMENT 'Unidades del movimiento (positivas)',
  `observacion` varchar(255) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Motivo o nota del movimiento',
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora del movimiento'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Historial de entradas, salidas y ajustes de stock';

--
-- Dumping data for table `movimientos_inventario`
--

INSERT INTO `movimientos_inventario` (`id_movimiento`, `codigo_producto`, `id_usuario`, `tipo`, `cantidad`, `observacion`, `fecha`) VALUES
(1, '7702001004', 1, 'entrada', 30, 'Reposicion de stock, proveedor Alqueria', '2026-09-22 11:40:30'),
(2, '7702001001', 2, 'salida', 5, 'Venta de mostrador, turno tarde', '2026-09-23 11:10:30'),
(3, '7702001005', 2, 'salida', 1, 'Venta de mostrador, turno tarde', '2026-09-23 09:40:30'),
(4, '7702001002', 2, 'salida', 2, 'Venta de mostrador, turno tarde', '2026-09-23 11:10:30'),
(5, '7702001003', 2, 'salida', 2, 'Venta de mostrador, turno tarde', '2026-09-23 10:10:30');

-- --------------------------------------------------------

--
-- Table structure for table `productos`
--

CREATE TABLE `productos` (
  `codigo_producto` varchar(20) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Código de barras del producto (leído con la pistola)',
  `id_categoria` int NOT NULL COMMENT 'FK: categoría que clasifica el producto',
  `nombre` varchar(100) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Nombre comercial del producto',
  `descripcion` varchar(255) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Descripción opcional',
  `precio_unitario` decimal(10,2) NOT NULL COMMENT 'Precio de venta vigente (COP)',
  `stock_actual` int NOT NULL DEFAULT '0' COMMENT 'Unidades disponibles en este momento',
  `stock_minimo` int NOT NULL DEFAULT '5' COMMENT 'Umbral que dispara la alerta de stock',
  `unidad_medida` varchar(20) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Unidad, kilogramo, litro, paquete...',
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1=en catálogo, 0=descontinuado'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Catálogo de productos del autoservicio';

--
-- Dumping data for table `productos`
--

INSERT INTO `productos` (`codigo_producto`, `id_categoria`, `nombre`, `descripcion`, `precio_unitario`, `stock_actual`, `stock_minimo`, `unidad_medida`, `activo`) VALUES
('7702001001', 1, 'Leche Entera 1L', NULL, 2850.00, 57, 20, 'Litro', 1),
('7702001002', 2, 'Arroz Blanco 5kg', NULL, 12500.00, 13, 10, 'Paquete', 1),
('7702001003', 3, 'Café Molido 250g', NULL, 9900.00, 5, 20, 'Paquete', 1),
('7702001004', 2, 'Azúcar Blanca 2kg', NULL, 5800.00, 30, 15, 'Paquete', 1),
('7702001005', 4, 'Pan Tajado', NULL, 3000.00, 33, 10, 'Unidad', 1);

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id_rol` tinyint NOT NULL COMMENT 'Identificador unico del rol',
  `nombre` varchar(30) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Nombre del rol: administrador, cajero o domiciliario'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Catalogo de roles que puede tener un usuario del sistema';

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id_rol`, `nombre`) VALUES
(1, 'administrador'),
(2, 'cajero'),
(3, 'domiciliario');

-- --------------------------------------------------------

--
-- Table structure for table `sesiones_chatbot`
--

CREATE TABLE `sesiones_chatbot` (
  `id_sesion` int NOT NULL COMMENT 'Identificador de la sesión de chat',
  `telefono` varchar(20) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Número de WhatsApp del cliente (sin el prefijo whatsapp:)',
  `id_cliente` int DEFAULT NULL COMMENT 'FK: cliente ya identificado en esta conversación',
  `paso` varchar(30) COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'inicio' COMMENT 'Paso actual del flujo conversacional',
  `direccion_temp` varchar(150) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Dirección de entrega capturada en la conversación',
  `barrio_temp` varchar(50) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Barrio capturado en la conversación',
  `fecha_actualizacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última interacción'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Estado conversacional del ChatBot de WhatsApp (Twilio)';

--
-- Dumping data for table `sesiones_chatbot`
--

INSERT INTO `sesiones_chatbot` (`id_sesion`, `telefono`, `id_cliente`, `paso`, `direccion_temp`, `barrio_temp`, `fecha_actualizacion`) VALUES
(2, '3204445566', NULL, 'esperando_confirmacion', 'Carrera 15 # 22-10', 'Los Alamos', '2026-09-23 11:40:30');

-- --------------------------------------------------------

--
-- Table structure for table `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int NOT NULL COMMENT 'Identificador único del usuario',
  `documento` varchar(15) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Documento de identidad',
  `nombre` varchar(60) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Nombres del usuario',
  `apellido` varchar(60) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Apellidos del usuario',
  `email` varchar(100) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Correo electrónico (usado para iniciar sesión)',
  `telefono` varchar(20) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Teléfono de contacto',
  `id_rol` tinyint NOT NULL COMMENT 'FK: rol asignado al usuario (tabla roles)',
  `contrasena_hash` varchar(255) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Contraseña encriptada (nunca en texto plano)',
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1=activo, 0=bloqueado',
  `fecha_registro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación de la cuenta'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Usuarios del sistema: administrador, cajero y domiciliario';

--
-- Dumping data for table `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `documento`, `nombre`, `apellido`, `email`, `telefono`, `id_rol`, `contrasena_hash`, `activo`, `fecha_registro`) VALUES
(1, '1000000001', 'Andres', 'Gomez', 'admin@controlstore.com', NULL, 1, 'pbkdf2_sha256$demo', 1, '2026-08-18 18:28:08'),
(2, '1000000002', 'Juan Carlos', 'Perez', 'juan.perez@controlstore.com', NULL, 2, 'pbkdf2_sha256$demo', 1, '2026-08-18 18:28:08'),
(3, '1000000003', 'Luis', 'Perez', 'luis.p@controlstore.com', NULL, 3, 'pbkdf2_sha256$demo', 1, '2026-08-18 18:28:08');

-- --------------------------------------------------------

--
-- Table structure for table `ventas`
--

CREATE TABLE `ventas` (
  `id_venta` int NOT NULL COMMENT 'Identificador único de la venta',
  `id_usuario` int NOT NULL COMMENT 'FK: cajero que registró la venta',
  `id_arqueo` int DEFAULT NULL COMMENT 'FK: turno de caja en el que se registro la venta (opcional)',
  `id_cliente` int DEFAULT NULL COMMENT 'FK: cliente (NULL = venta ocasional de mostrador)',
  `id_metodo_pago` int NOT NULL COMMENT 'FK: método con el que se pagó',
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la venta',
  `total` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT 'Valor total de la venta (COP)',
  `estado` enum('pagada','pendiente','anulada') COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'pagada' COMMENT 'Estado actual de la venta'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Cabecera de cada venta realizada';

--
-- Dumping data for table `ventas`
--

INSERT INTO `ventas` (`id_venta`, `id_usuario`, `id_arqueo`, `id_cliente`, `id_metodo_pago`, `fecha`, `total`, `estado`) VALUES
(2, 2, 2, NULL, 1, '2026-09-23 09:40:30', 8700.00, 'pagada'),
(3, 2, 2, 1, 2, '2026-09-23 10:10:30', 32300.00, 'pagada'),
(4, 2, 2, 2, 1, '2026-09-23 11:10:30', 21050.00, 'pagada');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `arqueo_caja`
--
ALTER TABLE `arqueo_caja`
  ADD PRIMARY KEY (`id_arqueo`),
  ADD KEY `fk_arqueo_usuario` (`id_usuario`);

--
-- Indexes for table `carrito_chatbot`
--
ALTER TABLE `carrito_chatbot`
  ADD PRIMARY KEY (`id_sesion`,`codigo_producto`),
  ADD KEY `fk_carrito_producto` (`codigo_producto`);

--
-- Indexes for table `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id_categoria`),
  ADD UNIQUE KEY `uq_categoria_nombre` (`nombre`);

--
-- Indexes for table `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id_cliente`),
  ADD UNIQUE KEY `uq_cliente_telefono` (`telefono`);

--
-- Indexes for table `detalle_venta`
--
ALTER TABLE `detalle_venta`
  ADD PRIMARY KEY (`id_detalle`),
  ADD KEY `fk_detalle_venta` (`id_venta`),
  ADD KEY `fk_detalle_producto` (`codigo_producto`);

--
-- Indexes for table `domicilios`
--
ALTER TABLE `domicilios`
  ADD PRIMARY KEY (`id_domicilio`),
  ADD UNIQUE KEY `uq_domicilio_venta` (`id_venta`),
  ADD KEY `fk_domicilio_usuario` (`id_domiciliario`);

--
-- Indexes for table `log_auditoria`
--
ALTER TABLE `log_auditoria`
  ADD PRIMARY KEY (`id_log`),
  ADD KEY `fk_log_usuario` (`id_usuario`);

--
-- Indexes for table `metodos_pago`
--
ALTER TABLE `metodos_pago`
  ADD PRIMARY KEY (`id_metodo_pago`),
  ADD UNIQUE KEY `uq_metodo_nombre` (`nombre`);

--
-- Indexes for table `movimientos_inventario`
--
ALTER TABLE `movimientos_inventario`
  ADD PRIMARY KEY (`id_movimiento`),
  ADD KEY `fk_mov_producto` (`codigo_producto`),
  ADD KEY `fk_mov_usuario` (`id_usuario`);

--
-- Indexes for table `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`codigo_producto`),
  ADD KEY `fk_producto_categoria` (`id_categoria`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id_rol`),
  ADD UNIQUE KEY `uq_roles_nombre` (`nombre`);

--
-- Indexes for table `sesiones_chatbot`
--
ALTER TABLE `sesiones_chatbot`
  ADD PRIMARY KEY (`id_sesion`),
  ADD UNIQUE KEY `uq_sesiones_chatbot_telefono` (`telefono`),
  ADD KEY `fk_sesiones_chatbot_cliente` (`id_cliente`);

--
-- Indexes for table `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `uq_usuario_documento` (`documento`),
  ADD UNIQUE KEY `uq_usuario_email` (`email`),
  ADD KEY `fk_usuario_rol` (`id_rol`);

--
-- Indexes for table `ventas`
--
ALTER TABLE `ventas`
  ADD PRIMARY KEY (`id_venta`),
  ADD KEY `fk_venta_usuario` (`id_usuario`),
  ADD KEY `fk_venta_cliente` (`id_cliente`),
  ADD KEY `fk_venta_metodo` (`id_metodo_pago`),
  ADD KEY `fk_venta_arqueo` (`id_arqueo`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `arqueo_caja`
--
ALTER TABLE `arqueo_caja`
  MODIFY `id_arqueo` int NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del arqueo', AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id_categoria` int NOT NULL AUTO_INCREMENT COMMENT 'Identificador único de la categoría', AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id_cliente` int NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del cliente', AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `detalle_venta`
--
ALTER TABLE `detalle_venta`
  MODIFY `id_detalle` int NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del renglón', AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `domicilios`
--
ALTER TABLE `domicilios`
  MODIFY `id_domicilio` int NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del domicilio', AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `log_auditoria`
--
ALTER TABLE `log_auditoria`
  MODIFY `id_log` int NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del evento', AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `metodos_pago`
--
ALTER TABLE `metodos_pago`
  MODIFY `id_metodo_pago` int NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del método de pago', AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `movimientos_inventario`
--
ALTER TABLE `movimientos_inventario`
  MODIFY `id_movimiento` int NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del movimiento', AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id_rol` tinyint NOT NULL AUTO_INCREMENT COMMENT 'Identificador unico del rol', AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `sesiones_chatbot`
--
ALTER TABLE `sesiones_chatbot`
  MODIFY `id_sesion` int NOT NULL AUTO_INCREMENT COMMENT 'Identificador de la sesión de chat', AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del usuario', AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `ventas`
--
ALTER TABLE `ventas`
  MODIFY `id_venta` int NOT NULL AUTO_INCREMENT COMMENT 'Identificador único de la venta', AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `arqueo_caja`
--
ALTER TABLE `arqueo_caja`
  ADD CONSTRAINT `fk_arqueo_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `carrito_chatbot`
--
ALTER TABLE `carrito_chatbot`
  ADD CONSTRAINT `fk_carrito_producto` FOREIGN KEY (`codigo_producto`) REFERENCES `productos` (`codigo_producto`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_carrito_sesion` FOREIGN KEY (`id_sesion`) REFERENCES `sesiones_chatbot` (`id_sesion`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `detalle_venta`
--
ALTER TABLE `detalle_venta`
  ADD CONSTRAINT `fk_detalle_producto` FOREIGN KEY (`codigo_producto`) REFERENCES `productos` (`codigo_producto`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_detalle_venta` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id_venta`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `domicilios`
--
ALTER TABLE `domicilios`
  ADD CONSTRAINT `fk_domicilio_usuario` FOREIGN KEY (`id_domiciliario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_domicilio_venta` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id_venta`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `log_auditoria`
--
ALTER TABLE `log_auditoria`
  ADD CONSTRAINT `fk_log_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `movimientos_inventario`
--
ALTER TABLE `movimientos_inventario`
  ADD CONSTRAINT `fk_mov_producto` FOREIGN KEY (`codigo_producto`) REFERENCES `productos` (`codigo_producto`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_mov_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `productos`
--
ALTER TABLE `productos`
  ADD CONSTRAINT `fk_producto_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `sesiones_chatbot`
--
ALTER TABLE `sesiones_chatbot`
  ADD CONSTRAINT `fk_sesiones_chatbot_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `fk_usuario_rol` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `ventas`
--
ALTER TABLE `ventas`
  ADD CONSTRAINT `fk_venta_arqueo` FOREIGN KEY (`id_arqueo`) REFERENCES `arqueo_caja` (`id_arqueo`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_venta_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_venta_metodo` FOREIGN KEY (`id_metodo_pago`) REFERENCES `metodos_pago` (`id_metodo_pago`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_venta_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
