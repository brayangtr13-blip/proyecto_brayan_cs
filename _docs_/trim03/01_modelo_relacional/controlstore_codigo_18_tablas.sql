-- MySQL dump 10.13  Distrib 8.4.9, for Win64 (x86_64)
--
-- Host: localhost    Database: controlstore_sena
-- ------------------------------------------------------
-- Server version	8.4.9

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `arqueo_caja`
--

DROP TABLE IF EXISTS `arqueo_caja`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `arqueo_caja` (
  `id_arqueo` int NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del arqueo',
  `id_usuario` int NOT NULL COMMENT 'FK: cajero que abre/cierra la caja',
  `fecha_apertura` datetime NOT NULL COMMENT 'Momento de apertura de la caja',
  `fecha_cierre` datetime DEFAULT NULL COMMENT 'Momento de cierre (NULL = caja abierta)',
  `monto_inicial` decimal(12,2) NOT NULL COMMENT 'Base con la que abre la caja',
  `monto_final` decimal(12,2) DEFAULT NULL COMMENT 'Efectivo contado al cierre',
  `total_ventas` decimal(12,2) DEFAULT NULL COMMENT 'Total vendido en el turno, todos los medios de pago (reportes)',
  `total_efectivo` decimal(12,2) DEFAULT NULL COMMENT 'Ventas pagadas en efectivo: lo unico que entra al cajon',
  `diferencia` decimal(12,2) GENERATED ALWAYS AS (((`monto_final` - `monto_inicial`) - `total_efectivo`)) STORED COMMENT 'Descuadre real: efectivo contado menos efectivo esperado',
  `observacion` varchar(255) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Notas del arqueo',
  PRIMARY KEY (`id_arqueo`),
  KEY `fk_arqueo_usuario` (`id_usuario`),
  CONSTRAINT `fk_arqueo_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_arqueo_monto_final` CHECK ((`monto_final` >= 0)),
  CONSTRAINT `chk_arqueo_monto_inicial` CHECK ((`monto_inicial` >= 0)),
  CONSTRAINT `chk_arqueo_total_efectivo` CHECK ((`total_efectivo` >= 0)),
  CONSTRAINT `chk_arqueo_total_ventas` CHECK ((`total_ventas` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Aperturas y cierres de caja por turno';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `arqueo_caja`
--

LOCK TABLES `arqueo_caja` WRITE;
/*!40000 ALTER TABLE `arqueo_caja` DISABLE KEYS */;
INSERT INTO `arqueo_caja` (`id_arqueo`, `id_usuario`, `fecha_apertura`, `fecha_cierre`, `monto_inicial`, `monto_final`, `total_ventas`, `total_efectivo`, `observacion`) VALUES (2,2,'2026-09-23 08:40:30','2026-09-23 11:40:30',20000.00,49750.00,62050.00,29750.00,'Turno de la tarde, sin novedades');
/*!40000 ALTER TABLE `arqueo_caja` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `barrios`
--

DROP TABLE IF EXISTS `barrios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `barrios` (
  `id_barrio` int NOT NULL AUTO_INCREMENT COMMENT 'Identificador del barrio',
  `nombre` varchar(50) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Nombre del barrio',
  `costo_domicilio` decimal(10,2) NOT NULL COMMENT 'Tarifa vigente del domicilio',
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1 = dentro de la cobertura',
  PRIMARY KEY (`id_barrio`),
  UNIQUE KEY `uq_barrio_nombre` (`nombre`),
  CONSTRAINT `chk_barrio_costo` CHECK ((`costo_domicilio` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Zona de cobertura y costo de domicilio por barrio';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `barrios`
--

LOCK TABLES `barrios` WRITE;
/*!40000 ALTER TABLE `barrios` DISABLE KEYS */;
INSERT INTO `barrios` VALUES (1,'Centro',2000.00,1),(2,'La Playa',3000.00,1),(3,'Los Alamos',3500.00,1);
/*!40000 ALTER TABLE `barrios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carrito_chatbot`
--

DROP TABLE IF EXISTS `carrito_chatbot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carrito_chatbot` (
  `id_sesion` int NOT NULL COMMENT 'FK: sesion de WhatsApp a la que pertenece',
  `codigo_producto` varchar(20) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'FK: producto elegido por el cliente',
  `cantidad` int NOT NULL DEFAULT '1' COMMENT 'Unidades elegidas',
  PRIMARY KEY (`id_sesion`,`codigo_producto`),
  KEY `fk_carrito_producto` (`codigo_producto`),
  CONSTRAINT `fk_carrito_producto` FOREIGN KEY (`codigo_producto`) REFERENCES `productos` (`codigo_producto`) ON UPDATE CASCADE,
  CONSTRAINT `fk_carrito_sesion` FOREIGN KEY (`id_sesion`) REFERENCES `sesiones_chatbot` (`id_sesion`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_carrito_cantidad` CHECK ((`cantidad` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Productos que el cliente va eligiendo en la conversacion del ChatBot';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carrito_chatbot`
--

LOCK TABLES `carrito_chatbot` WRITE;
/*!40000 ALTER TABLE `carrito_chatbot` DISABLE KEYS */;
INSERT INTO `carrito_chatbot` VALUES (2,'7702001003',1),(2,'7702001005',2);
/*!40000 ALTER TABLE `carrito_chatbot` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categorias`
--

DROP TABLE IF EXISTS `categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias` (
  `id_categoria` int NOT NULL AUTO_INCREMENT COMMENT 'Identificador único de la categoría',
  `nombre` varchar(50) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Nombre de la categoría (Lácteos, Abarrotes...)',
  `descripcion` varchar(255) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Descripción opcional de la categoría',
  PRIMARY KEY (`id_categoria`),
  UNIQUE KEY `uq_categoria_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Categorías que clasifican los productos';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES (1,'Lácteos','Leches, quesos y derivados'),(2,'Abarrotes','Granos, aceites y despensa'),(3,'Bebidas','Gaseosas, jugos y café'),(4,'Panadería','Pan y repostería'),(5,'Aseo','Aseo personal y del hogar');
/*!40000 ALTER TABLE `categorias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `id_cliente` int NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del cliente',
  `nombre` varchar(60) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Nombres del cliente',
  `apellido` varchar(60) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Apellidos del cliente',
  `telefono` varchar(20) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Teléfono (canal del ChatBot de WhatsApp)',
  `direccion` varchar(150) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Dirección registrada del cliente',
  `id_barrio` int DEFAULT NULL COMMENT 'FK: barrio del cliente (opcional)',
  PRIMARY KEY (`id_cliente`),
  UNIQUE KEY `uq_cliente_telefono` (`telefono`),
  KEY `fk_cliente_barrio` (`id_barrio`),
  CONSTRAINT `fk_cliente_barrio` FOREIGN KEY (`id_barrio`) REFERENCES `barrios` (`id_barrio`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Clientes que compran o piden a domicilio';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES (1,'Maria','Restrepo','3011234567','Calle 12 # 4-30',1),(2,'Carlos','Ruiz','3109876543','Carrera 7 # 15-02',2);
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_venta`
--

DROP TABLE IF EXISTS `detalle_venta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_venta` (
  `id_detalle` int NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del renglón',
  `id_venta` int NOT NULL COMMENT 'FK: venta a la que pertenece el renglón',
  `codigo_producto` varchar(20) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'FK: producto vendido',
  `cantidad` int NOT NULL COMMENT 'Unidades vendidas',
  `precio_venta` decimal(10,2) NOT NULL COMMENT 'Precio histórico al momento de la venta',
  `subtotal` decimal(12,2) GENERATED ALWAYS AS ((`cantidad` * `precio_venta`)) STORED COMMENT 'Calculado por el motor: cantidad x precio',
  PRIMARY KEY (`id_detalle`),
  UNIQUE KEY `uq_detalle_venta_producto` (`id_venta`,`codigo_producto`),
  KEY `fk_detalle_producto` (`codigo_producto`),
  CONSTRAINT `fk_detalle_producto` FOREIGN KEY (`codigo_producto`) REFERENCES `productos` (`codigo_producto`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_venta` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id_venta`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_detalle_cantidad` CHECK ((`cantidad` > 0)),
  CONSTRAINT `chk_detalle_precio` CHECK ((`precio_venta` > 0)),
  CONSTRAINT `chk_detalle_subtotal` CHECK ((`subtotal` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Renglones de cada venta (composición: sin venta no hay detalle)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_venta`
--

LOCK TABLES `detalle_venta` WRITE;
/*!40000 ALTER TABLE `detalle_venta` DISABLE KEYS */;
INSERT INTO `detalle_venta` (`id_detalle`, `id_venta`, `codigo_producto`, `cantidad`, `precio_venta`) VALUES (3,2,'7702001001',2,2850.00),(4,2,'7702001005',1,3000.00),(5,3,'7702001002',1,12500.00),(6,3,'7702001003',2,9900.00),(7,4,'7702001001',3,2850.00),(8,4,'7702001002',1,12500.00);
/*!40000 ALTER TABLE `detalle_venta` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_detalle_after_insert` AFTER INSERT ON `detalle_venta` FOR EACH ROW BEGIN
  UPDATE ventas
     SET total = (SELECT IFNULL(SUM(subtotal), 0)
                    FROM detalle_venta
                   WHERE id_venta = NEW.id_venta)
   WHERE id_venta = NEW.id_venta;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_detalle_after_update` AFTER UPDATE ON `detalle_venta` FOR EACH ROW BEGIN
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
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_detalle_after_delete` AFTER DELETE ON `detalle_venta` FOR EACH ROW BEGIN
  UPDATE ventas
     SET total = (SELECT IFNULL(SUM(subtotal), 0)
                    FROM detalle_venta
                   WHERE id_venta = OLD.id_venta)
   WHERE id_venta = OLD.id_venta;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `domicilios`
--

DROP TABLE IF EXISTS `domicilios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `domicilios` (
  `id_domicilio` int NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del domicilio',
  `id_venta` int NOT NULL COMMENT 'FK única: venta que se despacha',
  `id_domiciliario` int DEFAULT NULL COMMENT 'FK: usuario domiciliario asignado (NULL = sin asignar)',
  `id_barrio` int NOT NULL COMMENT 'FK: barrio de entrega (barrios)',
  `direccion_entrega` varchar(150) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Dirección exacta de entrega',
  `costo_envio` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'Copia del costo del barrio al momento del pedido',
  `telefono_contacto` varchar(20) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Teléfono de quien recibe',
  `estado` enum('pendiente','asignado','en_camino','entregado','cancelado') COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'pendiente' COMMENT 'Estado del recorrido (CU22.2: inicia Pendiente)',
  `fecha_asignacion` datetime DEFAULT NULL COMMENT 'Momento en que se asignó el domiciliario',
  `fecha_entrega` datetime DEFAULT NULL COMMENT 'Momento en que se entregó el pedido',
  `observacion` varchar(255) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Notas del cliente o del ChatBot',
  PRIMARY KEY (`id_domicilio`),
  UNIQUE KEY `uq_domicilio_venta` (`id_venta`),
  KEY `fk_domicilio_usuario` (`id_domiciliario`),
  KEY `fk_domicilio_barrio` (`id_barrio`),
  CONSTRAINT `fk_domicilio_barrio` FOREIGN KEY (`id_barrio`) REFERENCES `barrios` (`id_barrio`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_domicilio_usuario` FOREIGN KEY (`id_domiciliario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_domicilio_venta` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id_venta`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_domicilio_costo` CHECK ((`costo_envio` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Entregas a domicilio originadas por el ChatBot o el punto de venta';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `domicilios`
--

LOCK TABLES `domicilios` WRITE;
/*!40000 ALTER TABLE `domicilios` DISABLE KEYS */;
INSERT INTO `domicilios` VALUES (1,3,3,1,'Calle 12 # 4-30',2000.00,'3011234567','entregado','2026-09-23 10:20:30','2026-09-23 11:00:30','Entregado en porteria');
/*!40000 ALTER TABLE `domicilios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `log_auditoria`
--

DROP TABLE IF EXISTS `log_auditoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `log_auditoria` (
  `id_log` int NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del evento',
  `id_usuario` int DEFAULT NULL COMMENT 'FK: usuario que ejecutó la acción (NULL = intento anónimo)',
  `id_modulo` tinyint NOT NULL COMMENT 'FK: módulo afectado (modulos)',
  `accion` varchar(50) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Acción realizada: registrar, actualizar, eliminar, login...',
  `detalle` varchar(255) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Descripción del evento',
  `ip` varchar(45) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Dirección IP de origen',
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora del evento',
  PRIMARY KEY (`id_log`),
  KEY `fk_log_usuario` (`id_usuario`),
  KEY `fk_log_modulo` (`id_modulo`),
  CONSTRAINT `fk_log_modulo` FOREIGN KEY (`id_modulo`) REFERENCES `modulos` (`id_modulo`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_log_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Bitácora de auditoría de todas las acciones del sistema';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `log_auditoria`
--

LOCK TABLES `log_auditoria` WRITE;
/*!40000 ALTER TABLE `log_auditoria` DISABLE KEYS */;
INSERT INTO `log_auditoria` VALUES (1,2,1,'login','Inicio de sesion exitoso','192.168.1.15','2026-09-23 08:40:30'),(2,2,3,'registrar','Registro la venta #2 por $8.700','192.168.1.15','2026-09-23 09:40:30'),(3,2,3,'registrar','Registro la venta #3 por $32.300','192.168.1.15','2026-09-23 10:10:30'),(4,1,2,'actualizar','Ingreso de stock: Azucar Blanca 2kg, +30 unidades','192.168.1.10','2026-09-22 11:40:30'),(5,3,4,'actualizar','Marco el domicilio de la venta #3 como entregado','192.168.1.22','2026-09-23 11:00:30');
/*!40000 ALTER TABLE `log_auditoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `metodos_pago`
--

DROP TABLE IF EXISTS `metodos_pago`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `metodos_pago` (
  `id_metodo_pago` int NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del método de pago',
  `nombre` varchar(30) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Nombre: Efectivo, Nequi, Transferencia, Tarjeta',
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1=disponible para cobrar',
  PRIMARY KEY (`id_metodo_pago`),
  UNIQUE KEY `uq_metodo_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Métodos de pago aceptados por el autoservicio';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `metodos_pago`
--

LOCK TABLES `metodos_pago` WRITE;
/*!40000 ALTER TABLE `metodos_pago` DISABLE KEYS */;
INSERT INTO `metodos_pago` VALUES (1,'Efectivo',1),(2,'Nequi',1),(3,'Transferencia',1),(4,'Tarjeta',1);
/*!40000 ALTER TABLE `metodos_pago` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `modulos`
--

DROP TABLE IF EXISTS `modulos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `modulos` (
  `id_modulo` tinyint NOT NULL AUTO_INCREMENT COMMENT 'Identificador del módulo',
  `nombre` varchar(30) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Nombre del módulo funcional',
  `descripcion` varchar(150) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Descripción del módulo',
  PRIMARY KEY (`id_modulo`),
  UNIQUE KEY `uq_modulo_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Los cinco módulos funcionales del sistema';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `modulos`
--

LOCK TABLES `modulos` WRITE;
/*!40000 ALTER TABLE `modulos` DISABLE KEYS */;
INSERT INTO `modulos` VALUES (1,'Usuarios','Acceso, cuentas, roles y permisos'),(2,'Inventario','Productos, categorías y kárdex'),(3,'Ventas y caja','Punto de venta, anulaciones y cierre de caja'),(4,'Domicilios','Pedidos a domicilio, asignación y entrega'),(5,'Reportes','Reportes gráficos e impresos');
/*!40000 ALTER TABLE `modulos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos_inventario`
--

DROP TABLE IF EXISTS `movimientos_inventario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientos_inventario` (
  `id_movimiento` int NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del movimiento',
  `codigo_producto` varchar(20) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'FK: producto afectado por el movimiento',
  `id_usuario` int NOT NULL COMMENT 'FK: usuario responsable del movimiento',
  `tipo` enum('entrada','salida','ajuste') COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Naturaleza del movimiento de stock',
  `cantidad` int NOT NULL COMMENT 'Unidades del movimiento (positivas)',
  `observacion` varchar(255) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Motivo o nota del movimiento',
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora del movimiento',
  PRIMARY KEY (`id_movimiento`),
  KEY `fk_mov_producto` (`codigo_producto`),
  KEY `fk_mov_usuario` (`id_usuario`),
  CONSTRAINT `fk_mov_producto` FOREIGN KEY (`codigo_producto`) REFERENCES `productos` (`codigo_producto`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_mov_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_mov_cantidad` CHECK ((`cantidad` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Historial de entradas, salidas y ajustes de stock';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_inventario`
--

LOCK TABLES `movimientos_inventario` WRITE;
/*!40000 ALTER TABLE `movimientos_inventario` DISABLE KEYS */;
INSERT INTO `movimientos_inventario` VALUES (1,'7702001004',1,'entrada',30,'Reposicion de stock, proveedor Alqueria','2026-09-22 11:40:30'),(2,'7702001001',2,'salida',5,'Venta de mostrador, turno tarde','2026-09-23 11:10:30'),(3,'7702001005',2,'salida',1,'Venta de mostrador, turno tarde','2026-09-23 09:40:30'),(4,'7702001002',2,'salida',2,'Venta de mostrador, turno tarde','2026-09-23 11:10:30'),(5,'7702001003',2,'salida',2,'Venta de mostrador, turno tarde','2026-09-23 10:10:30');
/*!40000 ALTER TABLE `movimientos_inventario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permisos`
--

DROP TABLE IF EXISTS `permisos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permisos` (
  `id_permiso` int NOT NULL AUTO_INCREMENT COMMENT 'Identificador del permiso',
  `id_modulo` tinyint NOT NULL COMMENT 'FK: módulo al que pertenece',
  `codigo` varchar(50) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Formato modulo.accion, ej. ventas.anular',
  `descripcion` varchar(150) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Qué permite hacer',
  PRIMARY KEY (`id_permiso`),
  UNIQUE KEY `uq_permiso_codigo` (`codigo`),
  KEY `fk_permiso_modulo` (`id_modulo`),
  CONSTRAINT `fk_permiso_modulo` FOREIGN KEY (`id_modulo`) REFERENCES `modulos` (`id_modulo`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Acciones concretas que el sistema puede autorizar';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permisos`
--

LOCK TABLES `permisos` WRITE;
/*!40000 ALTER TABLE `permisos` DISABLE KEYS */;
INSERT INTO `permisos` VALUES (1,1,'usuarios.ver','Listar y consultar usuarios'),(2,1,'usuarios.registrar','Registrar usuarios (RF04)'),(3,1,'usuarios.editar','Editar usuarios (RF05)'),(4,1,'usuarios.cambiar_estado','Activar o inactivar usuarios (RF06)'),(5,2,'inventario.ver','Listar y consultar productos (RF09, RF10)'),(6,2,'inventario.registrar','Registrar productos (RF08)'),(7,2,'inventario.editar','Editar productos (RF11)'),(8,2,'inventario.eliminar','Dar de baja productos (RF12)'),(9,2,'inventario.ajustar','Registrar entradas y ajustes de stock'),(10,3,'ventas.registrar','Registrar ventas (RF14)'),(11,3,'ventas.ver','Listar y consultar ventas (RF15, RF16)'),(12,3,'ventas.anular','Anular ventas (RF17)'),(13,3,'ventas.cerrar_caja','Cierre de caja (RF18)'),(14,4,'domicilios.ver','Listar y consultar pedidos'),(15,4,'domicilios.registrar','Registrar pedidos (RF22)'),(16,4,'domicilios.asignar','Asignar domiciliario (RF23)'),(17,4,'domicilios.actualizar_estado','Actualizar el estado del pedido (RF24)'),(18,5,'reportes.ventas','Reportes de ventas (RF26, RF27)'),(19,5,'reportes.inventario','Reportes de inventario (RF28, RF29)'),(20,5,'reportes.domicilios','Reporte de domicilios (RF30)'),(21,5,'reportes.usuarios','Reportes de usuarios');
/*!40000 ALTER TABLE `permisos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productos`
--

DROP TABLE IF EXISTS `productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productos` (
  `codigo_producto` varchar(20) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Código de barras del producto (leído con la pistola)',
  `id_categoria` int NOT NULL COMMENT 'FK: categoría que clasifica el producto',
  `nombre` varchar(100) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Nombre comercial del producto',
  `descripcion` varchar(255) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Descripción opcional',
  `precio_compra` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'Costo al proveedor; permite calcular la ganancia',
  `precio_unitario` decimal(10,2) NOT NULL COMMENT 'Precio de venta vigente (COP)',
  `stock_actual` int NOT NULL DEFAULT '0' COMMENT 'Unidades disponibles en este momento',
  `stock_minimo` int NOT NULL DEFAULT '0' COMMENT 'Umbral que dispara la alerta de stock',
  `unidad_medida` varchar(20) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Unidad, kilogramo, litro, paquete...',
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1=en catálogo, 0=descontinuado',
  PRIMARY KEY (`codigo_producto`),
  KEY `fk_producto_categoria` (`id_categoria`),
  CONSTRAINT `fk_producto_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_producto_precio` CHECK ((`precio_unitario` > 0)),
  CONSTRAINT `chk_producto_precio_compra` CHECK ((`precio_compra` >= 0)),
  CONSTRAINT `chk_producto_stock` CHECK ((`stock_actual` >= 0)),
  CONSTRAINT `chk_producto_stock_minimo` CHECK ((`stock_minimo` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Catálogo de productos del autoservicio';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES ('7702001001',1,'Leche Entera 1L',NULL,2000.00,2850.00,57,20,'Litro',1),('7702001002',2,'Arroz Blanco 5kg',NULL,9000.00,12500.00,13,10,'Paquete',1),('7702001003',3,'Café Molido 250g',NULL,7000.00,9900.00,5,20,'Paquete',1),('7702001004',2,'Azúcar Blanca 2kg',NULL,4200.00,5800.00,30,15,'Paquete',1),('7702001005',4,'Pan Tajado',NULL,2100.00,3000.00,33,10,'Unidad',1);
/*!40000 ALTER TABLE `productos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rol_permiso`
--

DROP TABLE IF EXISTS `rol_permiso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rol_permiso` (
  `id_rol` tinyint NOT NULL COMMENT 'FK: rol',
  `id_permiso` int NOT NULL COMMENT 'FK: permiso concedido',
  PRIMARY KEY (`id_rol`,`id_permiso`),
  KEY `fk_rol_permiso_permiso` (`id_permiso`),
  CONSTRAINT `fk_rol_permiso_permiso` FOREIGN KEY (`id_permiso`) REFERENCES `permisos` (`id_permiso`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rol_permiso_rol` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Qué permisos tiene cada rol (relación N:M)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rol_permiso`
--

LOCK TABLES `rol_permiso` WRITE;
/*!40000 ALTER TABLE `rol_permiso` DISABLE KEYS */;
INSERT INTO `rol_permiso` VALUES (1,1),(1,2),(1,3),(1,4),(1,5),(2,5),(1,6),(2,6),(1,7),(1,8),(1,9),(1,10),(2,10),(1,11),(2,11),(1,12),(1,13),(1,14),(3,14),(1,15),(1,16),(1,17),(3,17),(1,18),(2,18),(1,19),(2,19),(1,20),(1,21);
/*!40000 ALTER TABLE `rol_permiso` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id_rol` tinyint NOT NULL AUTO_INCREMENT COMMENT 'Identificador unico del rol',
  `nombre` varchar(30) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Nombre del rol: administrador, cajero o domiciliario',
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `uq_roles_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Catalogo de roles que puede tener un usuario del sistema';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'administrador'),(2,'cajero'),(3,'domiciliario');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sesiones_chatbot`
--

DROP TABLE IF EXISTS `sesiones_chatbot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sesiones_chatbot` (
  `id_sesion` int NOT NULL AUTO_INCREMENT COMMENT 'Identificador de la sesión de chat',
  `telefono` varchar(20) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Número de WhatsApp del cliente (sin el prefijo whatsapp:)',
  `id_cliente` int DEFAULT NULL COMMENT 'FK: cliente ya identificado en esta conversación',
  `paso` varchar(30) COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'inicio' COMMENT 'Paso actual del flujo conversacional',
  `direccion_temp` varchar(150) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Dirección de entrega capturada en la conversación',
  `id_barrio_temp` int DEFAULT NULL COMMENT 'FK: barrio elegido en el chat',
  `fecha_actualizacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última interacción',
  PRIMARY KEY (`id_sesion`),
  UNIQUE KEY `uq_sesiones_chatbot_telefono` (`telefono`),
  KEY `fk_sesiones_chatbot_cliente` (`id_cliente`),
  KEY `fk_sesion_barrio` (`id_barrio_temp`),
  CONSTRAINT `fk_sesion_barrio` FOREIGN KEY (`id_barrio_temp`) REFERENCES `barrios` (`id_barrio`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_sesiones_chatbot_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Estado conversacional del ChatBot de WhatsApp (Twilio)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sesiones_chatbot`
--

LOCK TABLES `sesiones_chatbot` WRITE;
/*!40000 ALTER TABLE `sesiones_chatbot` DISABLE KEYS */;
INSERT INTO `sesiones_chatbot` VALUES (2,'3204445566',NULL,'esperando_confirmacion','Carrera 15 # 22-10',3,'2026-11-11 16:52:31');
/*!40000 ALTER TABLE `sesiones_chatbot` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id_usuario` int NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del usuario',
  `documento` varchar(15) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Documento de identidad',
  `nombre` varchar(60) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Nombres del usuario',
  `apellido` varchar(60) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Apellidos del usuario',
  `email` varchar(100) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Correo electrónico (usado para iniciar sesión)',
  `telefono` varchar(20) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Teléfono de contacto',
  `id_rol` tinyint NOT NULL COMMENT 'FK: rol asignado al usuario (tabla roles)',
  `contrasena_hash` varchar(255) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Contraseña encriptada (nunca en texto plano)',
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1=activo, 0=bloqueado',
  `intentos_fallidos` tinyint unsigned NOT NULL DEFAULT '0' COMMENT 'Intentos de inicio de sesión fallidos seguidos',
  `bloqueado_hasta` datetime DEFAULT NULL COMMENT 'Fecha hasta la que el acceso está bloqueado',
  `fecha_registro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación de la cuenta',
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `uq_usuario_documento` (`documento`),
  UNIQUE KEY `uq_usuario_email` (`email`),
  KEY `fk_usuario_rol` (`id_rol`),
  CONSTRAINT `fk_usuario_rol` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Usuarios del sistema: administrador, cajero y domiciliario';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'1000000001','Andres','Gomez','admin@controlstore.com',NULL,1,'pbkdf2_sha256$demo',1,0,NULL,'2026-08-18 18:28:08'),(2,'1000000002','Juan Carlos','Perez','juan.perez@controlstore.com',NULL,2,'pbkdf2_sha256$demo',1,0,NULL,'2026-08-18 18:28:08'),(3,'1000000003','Luis','Perez','luis.p@controlstore.com',NULL,3,'pbkdf2_sha256$demo',1,0,NULL,'2026-08-18 18:28:08');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ventas`
--

DROP TABLE IF EXISTS `ventas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ventas` (
  `id_venta` int NOT NULL AUTO_INCREMENT COMMENT 'Identificador único de la venta',
  `id_usuario` int NOT NULL COMMENT 'FK: cajero que registró la venta',
  `id_arqueo` int DEFAULT NULL COMMENT 'FK: turno de caja en el que se registro la venta (opcional)',
  `id_cliente` int DEFAULT NULL COMMENT 'FK: cliente (NULL = venta ocasional de mostrador)',
  `id_metodo_pago` int NOT NULL COMMENT 'FK: método con el que se pagó',
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la venta',
  `total` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT 'Valor total de la venta (COP)',
  `estado` enum('pagada','pendiente','anulada') COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'pagada' COMMENT 'Estado actual de la venta',
  PRIMARY KEY (`id_venta`),
  KEY `fk_venta_usuario` (`id_usuario`),
  KEY `fk_venta_cliente` (`id_cliente`),
  KEY `fk_venta_metodo` (`id_metodo_pago`),
  KEY `fk_venta_arqueo` (`id_arqueo`),
  CONSTRAINT `fk_venta_arqueo` FOREIGN KEY (`id_arqueo`) REFERENCES `arqueo_caja` (`id_arqueo`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_venta_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_venta_metodo` FOREIGN KEY (`id_metodo_pago`) REFERENCES `metodos_pago` (`id_metodo_pago`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_venta_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_venta_total` CHECK ((`total` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Cabecera de cada venta realizada';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ventas`
--

LOCK TABLES `ventas` WRITE;
/*!40000 ALTER TABLE `ventas` DISABLE KEYS */;
INSERT INTO `ventas` VALUES (2,2,2,NULL,1,'2026-09-23 09:40:30',8700.00,'pagada'),(3,2,2,1,2,'2026-09-23 10:10:30',32300.00,'pagada'),(4,2,2,2,1,'2026-09-23 11:10:30',21050.00,'pagada');
/*!40000 ALTER TABLE `ventas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'controlstore_sena'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-12  1:37:01
