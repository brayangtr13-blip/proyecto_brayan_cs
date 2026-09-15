-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 14-09-2026 a las 17:58:05
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `controlstore_sena`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `arqueo_caja`
--

CREATE TABLE `arqueo_caja` (
  `id_arqueo` int(11) NOT NULL COMMENT 'Identificador único del arqueo',
  `id_usuario` int(11) NOT NULL COMMENT 'FK: cajero que abre/cierra la caja',
  `fecha_apertura` datetime NOT NULL COMMENT 'Momento de apertura de la caja',
  `fecha_cierre` datetime DEFAULT NULL COMMENT 'Momento de cierre (NULL = caja abierta)',
  `monto_inicial` decimal(12,2) NOT NULL COMMENT 'Base con la que abre la caja',
  `monto_final` decimal(12,2) DEFAULT NULL COMMENT 'Efectivo contado al cierre',
  `total_ventas` decimal(12,2) DEFAULT NULL COMMENT 'Total vendido en el turno',
  `diferencia` decimal(12,2) GENERATED ALWAYS AS (`monto_final` - `monto_inicial` - `total_ventas`) STORED COMMENT 'Calculado: descuadre de la caja',
  `observacion` varchar(255) DEFAULT NULL COMMENT 'Notas del arqueo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Aperturas y cierres de caja por turno';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias`
--

CREATE TABLE `categorias` (
  `id_categoria` int(11) NOT NULL COMMENT 'Identificador único de la categoría',
  `nombre` varchar(50) NOT NULL COMMENT 'Nombre de la categoría (Lácteos, Abarrotes...)',
  `descripcion` varchar(255) DEFAULT NULL COMMENT 'Descripción opcional de la categoría'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Categorías que clasifican los productos';

--
-- Volcado de datos para la tabla `categorias`
--

INSERT INTO `categorias` (`id_categoria`, `nombre`, `descripcion`) VALUES
(1, 'Lácteos', 'Leches, quesos y derivados'),
(2, 'Abarrotes', 'Granos, aceites y despensa'),
(3, 'Bebidas', 'Gaseosas, jugos y café'),
(4, 'Panadería', 'Pan y repostería'),
(5, 'Aseo', 'Aseo personal y del hogar');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `id_cliente` int(11) NOT NULL COMMENT 'Identificador único del cliente',
  `nombre` varchar(100) NOT NULL COMMENT 'Nombre del cliente',
  `telefono` varchar(20) NOT NULL COMMENT 'Teléfono (canal del ChatBot de WhatsApp)',
  `direccion` varchar(150) DEFAULT NULL COMMENT 'Dirección registrada del cliente',
  `barrio` varchar(50) DEFAULT NULL COMMENT 'Barrio o sector'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Clientes que compran o piden a domicilio';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_venta`
--

CREATE TABLE `detalle_venta` (
  `id_detalle` int(11) NOT NULL COMMENT 'Identificador único del renglón',
  `id_venta` int(11) NOT NULL COMMENT 'FK: venta a la que pertenece el renglón',
  `codigo_producto` varchar(20) NOT NULL COMMENT 'FK: producto vendido',
  `cantidad` int(11) NOT NULL COMMENT 'Unidades vendidas',
  `precio_venta` decimal(10,2) NOT NULL COMMENT 'Precio histórico al momento de la venta',
  `subtotal` decimal(12,2) GENERATED ALWAYS AS (`cantidad` * `precio_venta`) STORED COMMENT 'Calculado por el motor: cantidad x precio'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Renglones de cada venta (composición: sin venta no hay detalle)';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `domicilios`
--

CREATE TABLE `domicilios` (
  `id_domicilio` int(11) NOT NULL COMMENT 'Identificador único del domicilio',
  `id_venta` int(11) NOT NULL COMMENT 'FK única: venta que se despacha',
  `id_domiciliario` int(11) DEFAULT NULL COMMENT 'FK: usuario domiciliario asignado (NULL = sin asignar)',
  `direccion_entrega` varchar(150) NOT NULL COMMENT 'Dirección exacta de entrega',
  `barrio` varchar(50) DEFAULT NULL COMMENT 'Barrio o sector de entrega',
  `telefono_contacto` varchar(20) NOT NULL COMMENT 'Teléfono de quien recibe',
  `estado` enum('pendiente','asignado','en_camino','entregado','cancelado') NOT NULL DEFAULT 'pendiente' COMMENT 'Estado del recorrido (CU22.2: inicia Pendiente)',
  `fecha_asignacion` datetime DEFAULT NULL COMMENT 'Momento en que se asignó el domiciliario',
  `fecha_entrega` datetime DEFAULT NULL COMMENT 'Momento en que se entregó el pedido',
  `observacion` varchar(255) DEFAULT NULL COMMENT 'Notas del cliente o del ChatBot'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Entregas a domicilio originadas por el ChatBot o el punto de venta';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `log_auditoria`
--

CREATE TABLE `log_auditoria` (
  `id_log` int(11) NOT NULL COMMENT 'Identificador único del evento',
  `id_usuario` int(11) DEFAULT NULL COMMENT 'FK: usuario que ejecutó la acción (NULL = intento anónimo)',
  `accion` varchar(50) NOT NULL COMMENT 'Acción realizada: registrar, actualizar, eliminar, login...',
  `modulo` varchar(30) NOT NULL COMMENT 'Módulo afectado: inventario, ventas, usuarios...',
  `detalle` varchar(255) DEFAULT NULL COMMENT 'Descripción del evento',
  `ip` varchar(45) DEFAULT NULL COMMENT 'Dirección IP de origen',
  `fecha` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Fecha y hora del evento'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Bitácora de auditoría de todas las acciones del sistema';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `metodos_pago`
--

CREATE TABLE `metodos_pago` (
  `id_metodo_pago` int(11) NOT NULL COMMENT 'Identificador único del método de pago',
  `nombre` varchar(30) NOT NULL COMMENT 'Nombre: Efectivo, Nequi, Transferencia, Tarjeta',
  `activo` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1=disponible para cobrar'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Métodos de pago aceptados por el autoservicio';

--
-- Volcado de datos para la tabla `metodos_pago`
--

INSERT INTO `metodos_pago` (`id_metodo_pago`, `nombre`, `activo`) VALUES
(1, 'Efectivo', 1),
(2, 'Nequi', 1),
(3, 'Transferencia', 1),
(4, 'Tarjeta', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `movimientos_inventario`
--

CREATE TABLE `movimientos_inventario` (
  `id_movimiento` int(11) NOT NULL COMMENT 'Identificador único del movimiento',
  `codigo_producto` varchar(20) NOT NULL COMMENT 'FK: producto afectado por el movimiento',
  `id_usuario` int(11) NOT NULL COMMENT 'FK: usuario responsable del movimiento',
  `tipo` enum('entrada','salida','ajuste') NOT NULL COMMENT 'Naturaleza del movimiento de stock',
  `cantidad` int(11) NOT NULL COMMENT 'Unidades del movimiento (positivas)',
  `observacion` varchar(255) DEFAULT NULL COMMENT 'Motivo o nota del movimiento',
  `fecha` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Fecha y hora del movimiento'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Historial de entradas, salidas y ajustes de stock';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `codigo_producto` varchar(20) NOT NULL COMMENT 'Código de barras del producto (leído con la pistola)',
  `id_categoria` int(11) NOT NULL COMMENT 'FK: categoría que clasifica el producto',
  `nombre` varchar(100) NOT NULL COMMENT 'Nombre comercial del producto',
  `descripcion` varchar(255) DEFAULT NULL COMMENT 'Descripción opcional',
  `precio_unitario` decimal(10,2) NOT NULL COMMENT 'Precio de venta vigente (COP)',
  `stock_actual` int(11) NOT NULL DEFAULT 0 COMMENT 'Unidades disponibles en este momento',
  `stock_minimo` int(11) NOT NULL DEFAULT 5 COMMENT 'Umbral que dispara la alerta de stock',
  `unidad_medida` varchar(20) DEFAULT NULL COMMENT 'Unidad, kilogramo, litro, paquete...',
  `activo` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1=en catálogo, 0=descontinuado'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Catálogo de productos del autoservicio';

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`codigo_producto`, `id_categoria`, `nombre`, `descripcion`, `precio_unitario`, `stock_actual`, `stock_minimo`, `unidad_medida`, `activo`) VALUES
('7702001001', 1, 'Leche Entera 1L', NULL, 2850.00, 62, 20, 'Litro', 1),
('7702001002', 2, 'Arroz Blanco 5kg', NULL, 12500.00, 15, 10, 'Paquete', 1),
('7702001003', 3, 'Café Molido 250g', NULL, 9900.00, 7, 20, 'Paquete', 1),
('7702001004', 2, 'Azúcar Blanca 2kg', NULL, 5800.00, 0, 15, 'Paquete', 1),
('7702001005', 4, 'Pan Tajado', NULL, 3000.00, 34, 10, 'Unidad', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id_rol` tinyint(4) NOT NULL COMMENT 'Identificador unico del rol',
  `nombre` varchar(30) NOT NULL COMMENT 'Nombre del rol: administrador, cajero o domiciliario'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Catalogo de roles que puede tener un usuario del sistema';

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id_rol`, `nombre`) VALUES
(1, 'administrador'),
(2, 'cajero'),
(3, 'domiciliario');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sesiones_chatbot`
--

CREATE TABLE `sesiones_chatbot` (
  `id_sesion` int(11) NOT NULL COMMENT 'Identificador de la sesión de chat',
  `telefono` varchar(20) NOT NULL COMMENT 'Número de WhatsApp del cliente (sin el prefijo whatsapp:)',
  `id_cliente` int(11) DEFAULT NULL COMMENT 'FK: cliente ya identificado en esta conversación',
  `paso` varchar(30) NOT NULL DEFAULT 'inicio' COMMENT 'Paso actual del flujo conversacional',
  `carrito` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Productos elegidos: [{"codigo","nombre","cantidad","precio"}]' CHECK (json_valid(`carrito`)),
  `direccion_temp` varchar(150) DEFAULT NULL COMMENT 'Dirección de entrega capturada en la conversación',
  `barrio_temp` varchar(50) DEFAULT NULL COMMENT 'Barrio capturado en la conversación',
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Última interacción'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Estado conversacional del ChatBot de WhatsApp (Twilio)';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL COMMENT 'Identificador único del usuario',
  `documento` varchar(15) NOT NULL COMMENT 'Documento de identidad',
  `nombre` varchar(60) NOT NULL COMMENT 'Nombres del usuario',
  `apellido` varchar(60) NOT NULL COMMENT 'Apellidos del usuario',
  `email` varchar(100) NOT NULL COMMENT 'Correo electrónico (usado para iniciar sesión)',
  `telefono` varchar(20) DEFAULT NULL COMMENT 'Teléfono de contacto',
  `id_rol` tinyint(4) NOT NULL COMMENT 'FK: rol asignado al usuario (tabla roles)',
  `contrasena_hash` varchar(255) NOT NULL COMMENT 'Contraseña encriptada (nunca en texto plano)',
  `activo` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1=activo, 0=bloqueado',
  `fecha_registro` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Fecha de creación de la cuenta'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Usuarios del sistema: administrador, cajero y domiciliario';

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `documento`, `nombre`, `apellido`, `email`, `telefono`, `id_rol`, `contrasena_hash`, `activo`, `fecha_registro`) VALUES
(1, '1000000001', 'Andres', 'Gomez', 'admin@controlstore.com', NULL, 1, 'pbkdf2_sha256$demo', 1, '2026-08-18 18:28:08'),
(2, '1000000002', 'Juan Carlos', 'Perez', 'juan.perez@controlstore.com', NULL, 2, 'pbkdf2_sha256$demo', 1, '2026-08-18 18:28:08'),
(3, '1000000003', 'Luis', 'Perez', 'luis.p@controlstore.com', NULL, 3, 'pbkdf2_sha256$demo', 1, '2026-08-18 18:28:08');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas`
--

CREATE TABLE `ventas` (
  `id_venta` int(11) NOT NULL COMMENT 'Identificador único de la venta',
  `id_usuario` int(11) NOT NULL COMMENT 'FK: cajero que registró la venta',
  `id_arqueo` int(11) DEFAULT NULL COMMENT 'FK: turno de caja en el que se registro la venta (opcional)',
  `id_cliente` int(11) DEFAULT NULL COMMENT 'FK: cliente (NULL = venta ocasional de mostrador)',
  `id_metodo_pago` int(11) NOT NULL COMMENT 'FK: método con el que se pagó',
  `fecha` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Fecha y hora de la venta',
  `total` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Valor total de la venta (COP)',
  `estado` enum('pagada','pendiente','anulada') NOT NULL DEFAULT 'pagada' COMMENT 'Estado actual de la venta'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Cabecera de cada venta realizada';

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `arqueo_caja`
--
ALTER TABLE `arqueo_caja`
  ADD PRIMARY KEY (`id_arqueo`),
  ADD KEY `fk_arqueo_usuario` (`id_usuario`);

--
-- Indices de la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id_categoria`),
  ADD UNIQUE KEY `uq_categoria_nombre` (`nombre`);

--
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id_cliente`),
  ADD UNIQUE KEY `uq_cliente_telefono` (`telefono`);

--
-- Indices de la tabla `detalle_venta`
--
ALTER TABLE `detalle_venta`
  ADD PRIMARY KEY (`id_detalle`),
  ADD KEY `fk_detalle_venta` (`id_venta`),
  ADD KEY `fk_detalle_producto` (`codigo_producto`);

--
-- Indices de la tabla `domicilios`
--
ALTER TABLE `domicilios`
  ADD PRIMARY KEY (`id_domicilio`),
  ADD UNIQUE KEY `uq_domicilio_venta` (`id_venta`),
  ADD KEY `fk_domicilio_usuario` (`id_domiciliario`);

--
-- Indices de la tabla `log_auditoria`
--
ALTER TABLE `log_auditoria`
  ADD PRIMARY KEY (`id_log`),
  ADD KEY `fk_log_usuario` (`id_usuario`);

--
-- Indices de la tabla `metodos_pago`
--
ALTER TABLE `metodos_pago`
  ADD PRIMARY KEY (`id_metodo_pago`),
  ADD UNIQUE KEY `uq_metodo_nombre` (`nombre`);

--
-- Indices de la tabla `movimientos_inventario`
--
ALTER TABLE `movimientos_inventario`
  ADD PRIMARY KEY (`id_movimiento`),
  ADD KEY `fk_mov_producto` (`codigo_producto`),
  ADD KEY `fk_mov_usuario` (`id_usuario`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`codigo_producto`),
  ADD KEY `fk_producto_categoria` (`id_categoria`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id_rol`),
  ADD UNIQUE KEY `uq_roles_nombre` (`nombre`);

--
-- Indices de la tabla `sesiones_chatbot`
--
ALTER TABLE `sesiones_chatbot`
  ADD PRIMARY KEY (`id_sesion`),
  ADD UNIQUE KEY `uq_sesiones_chatbot_telefono` (`telefono`),
  ADD KEY `fk_sesiones_chatbot_cliente` (`id_cliente`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `uq_usuario_documento` (`documento`),
  ADD UNIQUE KEY `uq_usuario_email` (`email`),
  ADD KEY `fk_usuario_rol` (`id_rol`);

--
-- Indices de la tabla `ventas`
--
ALTER TABLE `ventas`
  ADD PRIMARY KEY (`id_venta`),
  ADD KEY `fk_venta_usuario` (`id_usuario`),
  ADD KEY `fk_venta_cliente` (`id_cliente`),
  ADD KEY `fk_venta_metodo` (`id_metodo_pago`),
  ADD KEY `fk_venta_arqueo` (`id_arqueo`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `arqueo_caja`
--
ALTER TABLE `arqueo_caja`
  MODIFY `id_arqueo` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del arqueo';

--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id_categoria` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador único de la categoría', AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id_cliente` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del cliente';

--
-- AUTO_INCREMENT de la tabla `detalle_venta`
--
ALTER TABLE `detalle_venta`
  MODIFY `id_detalle` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del renglón';

--
-- AUTO_INCREMENT de la tabla `domicilios`
--
ALTER TABLE `domicilios`
  MODIFY `id_domicilio` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del domicilio';

--
-- AUTO_INCREMENT de la tabla `log_auditoria`
--
ALTER TABLE `log_auditoria`
  MODIFY `id_log` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del evento';

--
-- AUTO_INCREMENT de la tabla `metodos_pago`
--
ALTER TABLE `metodos_pago`
  MODIFY `id_metodo_pago` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del método de pago', AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `movimientos_inventario`
--
ALTER TABLE `movimientos_inventario`
  MODIFY `id_movimiento` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del movimiento';

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id_rol` tinyint(4) NOT NULL AUTO_INCREMENT COMMENT 'Identificador unico del rol', AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `sesiones_chatbot`
--
ALTER TABLE `sesiones_chatbot`
  MODIFY `id_sesion` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador de la sesión de chat';

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del usuario', AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `ventas`
--
ALTER TABLE `ventas`
  MODIFY `id_venta` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador único de la venta';

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `arqueo_caja`
--
ALTER TABLE `arqueo_caja`
  ADD CONSTRAINT `fk_arqueo_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `detalle_venta`
--
ALTER TABLE `detalle_venta`
  ADD CONSTRAINT `fk_detalle_producto` FOREIGN KEY (`codigo_producto`) REFERENCES `productos` (`codigo_producto`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_detalle_venta` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id_venta`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `domicilios`
--
ALTER TABLE `domicilios`
  ADD CONSTRAINT `fk_domicilio_usuario` FOREIGN KEY (`id_domiciliario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_domicilio_venta` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id_venta`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `log_auditoria`
--
ALTER TABLE `log_auditoria`
  ADD CONSTRAINT `fk_log_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `movimientos_inventario`
--
ALTER TABLE `movimientos_inventario`
  ADD CONSTRAINT `fk_mov_producto` FOREIGN KEY (`codigo_producto`) REFERENCES `productos` (`codigo_producto`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_mov_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `productos`
--
ALTER TABLE `productos`
  ADD CONSTRAINT `fk_producto_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id_categoria`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `sesiones_chatbot`
--
ALTER TABLE `sesiones_chatbot`
  ADD CONSTRAINT `fk_sesiones_chatbot_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `fk_usuario_rol` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `ventas`
--
ALTER TABLE `ventas`
  ADD CONSTRAINT `fk_venta_arqueo` FOREIGN KEY (`id_arqueo`) REFERENCES `arqueo_caja` (`id_arqueo`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_venta_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_venta_metodo` FOREIGN KEY (`id_metodo_pago`) REFERENCES `metodos_pago` (`id_metodo_pago`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_venta_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
