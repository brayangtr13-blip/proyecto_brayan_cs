-- =====================================================================
-- Control Store - Autoservicio Ayuelal
-- GUION DE DEMOSTRACION PARA LA SUSTENTACION
-- Actualizado al modelo del 23/09/2026 (14 tablas, MySQL 8.4.9)
-- Datos: volcado del 23/09 + 03_datos_diez_por_tabla.sql (25/09/2026)
--
-- No se trata de afirmar que la base esta normalizada: se trata de
-- DEMOSTRARLO corriendo consultas delante del jurado.
--
-- La base YA TIENE datos: minimo 10 registros por tabla (10 turnos de
-- caja, 12 ventas con una anulada, 10 domicilios, 10 conversaciones del
-- ChatBot...). El turno #2 del cajero Juan Carlos Perez (3 ventas, 2 en
-- efectivo y 1 por Nequi) sigue siendo el ejemplo principal. Este guion
-- no inserta ninguna venta de prueba permanente.
--
-- Cada parte es un bloque independiente. Copiar y pegar en la pestaña
-- SQL de phpMyAdmin, de una parte a la vez, y explicar el resultado.
--
-- Orden sugerido: PARTE 0 (antes, en privado), luego 1 a 7.
-- La PARTE 4 es la mas importante. Las PARTES 6 y 7 son las
-- correcciones de la migracion 04, y son las que mas impresionan.
-- =====================================================================

USE controlstore_sena;


-- #####################################################################
-- PARTE 0 - COMPROBACION PREVIA  (ejecutar ANTES, en privado)
--
-- Si algun resultado no coincide con el esperado, NO sustentar con esa
-- base: restaurar primero el volcado controlstore_codigo.sql.
-- #####################################################################

-- 0.1 El modelo tiene 14 tablas
SELECT COUNT(*) AS total_tablas
  FROM information_schema.tables
 WHERE table_schema = 'controlstore_sena'
   AND table_type   = 'BASE TABLE';
-- Esperado: 14

-- 0.2 Los 3 disparadores que protegen ventas.total estan instalados
SELECT trigger_name, event_manipulation AS evento
  FROM information_schema.triggers
 WHERE trigger_schema = 'controlstore_sena';
-- Esperado: trg_detalle_after_insert, _update y _delete

-- 0.3 Los datos del turno estan cargados
SELECT (SELECT COUNT(*) FROM ventas)          AS ventas,
       (SELECT COUNT(*) FROM detalle_venta)   AS renglones,
       (SELECT COUNT(*) FROM arqueo_caja)     AS arqueos,
       (SELECT COUNT(*) FROM carrito_chatbot) AS items_carrito;
-- Esperado: 12 ventas, 20 renglones, 10 arqueos, 10 items en el carrito


-- #####################################################################
-- PARTE 1 - PRIMERA FORMA NORMAL: los datos son atomicos
--
-- QUE DECIR:
-- "El nombre del usuario esta partido en nombre y apellido. Por eso
--  puedo ordenar por apellido. Si guardaramos 'Juan Carlos Perez' en
--  una sola columna, esta consulta seria imposible: la base ordenaria
--  por el primer nombre."
-- #####################################################################

SELECT u.documento,
       u.apellido,
       u.nombre,
       r.nombre AS rol
  FROM usuarios u
  JOIN roles r ON r.id_rol = u.id_rol
 ORDER BY u.apellido, u.nombre;
-- Esperado: 10 usuarios ordenados por apellido: Cardenas, Castro,
--           Gomez, Lopez, Mora, Ortiz, Perez Juan Carlos, Perez Luis,
--           Rojas y Vargas (los dos Perez se ordenan por nombre)

-- Y esta es la otra mitad de 1FN: una venta con N productos no se
-- resuelve con columnas producto1, producto2, producto3, sino con
-- una fila por renglon.
SELECT d.id_venta,
       p.nombre AS producto,
       d.cantidad,
       d.precio_venta,
       d.subtotal
  FROM detalle_venta d
  JOIN productos p ON p.codigo_producto = d.codigo_producto
 ORDER BY d.id_venta, d.id_detalle;
-- Esperado: 20 renglones repartidos en las ventas 2 a 13


-- #####################################################################
-- PARTE 2 - SEGUNDA FORMA NORMAL: sin dependencias parciales
--
-- QUE DECIR:
-- "La llave natural del detalle es la pareja (venta, producto).
--  En el renglon solo quedan los datos que dependen de esa pareja
--  COMPLETA: cantidad y precio. El nombre del producto depende solo
--  del codigo, o sea de MEDIA llave: eso seria dependencia parcial.
--  Por eso el nombre vive una sola vez, en productos, y aqui llega
--  por JOIN."
--
-- Esta consulta lo prueba: el nombre del producto esta escrito UNA vez
-- en toda la base, sin importar cuantas veces se haya vendido.
-- #####################################################################

SELECT p.nombre                  AS 'Producto (escrito 1 sola vez)',
       COUNT(d.id_detalle)       AS 'Veces vendido',
       IFNULL(SUM(d.cantidad),0) AS 'Unidades totales'
  FROM productos p
  LEFT JOIN detalle_venta d ON d.codigo_producto = p.codigo_producto
 GROUP BY p.codigo_producto, p.nombre
 ORDER BY 3 DESC;
-- Esperado: Leche Entera 1L vendida 3 veces (7 unidades) y Azucar 0.
-- La leche aparece en tres ventas distintas y su nombre sigue escrito
-- una sola vez.


-- #####################################################################
-- PARTE 3 - TERCERA FORMA NORMAL: sin dependencias transitivas
--
-- QUE DECIR:
-- "La descripcion 'Leches, quesos y derivados' NO depende del codigo de
--  barras del producto: depende de la categoria, que no es llave. Eso
--  es una dependencia transitiva. Por eso categorias es tabla aparte."
-- #####################################################################

-- Prueba 1: el texto de la categoria existe UNA sola vez, aunque lo
-- usen varios productos.
SELECT c.nombre           AS categoria,
       c.descripcion      AS 'Descripcion (guardada 1 sola vez)',
       COUNT(p.codigo_producto) AS 'Productos que la usan'
  FROM categorias c
  LEFT JOIN productos p ON p.id_categoria = c.id_categoria
 GROUP BY c.id_categoria, c.nombre, c.descripcion;
-- Esperado: 10 categorias; Abarrotes la usan 3 productos (arroz, azucar
-- y aceite) y Frutas, Snacks y Mascotas todavia no tienen productos

-- Prueba 2: LA ANOMALIA DE ACTUALIZACION, EVITADA.
-- Se corrige el nombre de la categoria tocando UNA fila...
UPDATE categorias
   SET nombre = 'Abarrotes y despensa'
 WHERE id_categoria = 2;

-- ...y el cambio aparece en todos sus productos al instante.
SELECT p.nombre AS producto, c.nombre AS categoria
  FROM productos p
  JOIN categorias c ON c.id_categoria = p.id_categoria
 WHERE c.id_categoria = 2;

-- Dejar como estaba
UPDATE categorias SET nombre = 'Abarrotes' WHERE id_categoria = 2;

-- Prueba 3: lo mismo con los clientes. El barrio de Maria vive en
-- clientes, no en sus ventas. La venta solo guarda id_cliente.
SELECT v.id_venta, c.nombre AS cliente, c.barrio, v.total
  FROM ventas v
  JOIN clientes c ON c.id_cliente = v.id_cliente;

-- Prueba 4: el mismo criterio produjo los otros dos catalogos.
-- `roles` es el mejor ejemplo: ANTES era un ENUM dentro de usuarios,
-- y se extrajo a tabla en la migracion 01.
SELECT 'roles' AS catalogo, COUNT(*) AS filas FROM roles
UNION ALL SELECT 'categorias', COUNT(*) FROM categorias
UNION ALL SELECT 'metodos_pago', COUNT(*) FROM metodos_pago;
-- Esperado: 10, 10 y 10


-- #####################################################################
-- PARTE 4 - LA PREGUNTA ESTRELLA  ***LA MAS IMPORTANTE***
--
-- "Si el precio ya esta en productos, por que lo repiten en el detalle?
--  Eso no es redundancia?"
--
-- RESPUESTA: no es redundancia, es un HECHO HISTORICO. El precio al que
-- se vendio es un atributo de LA VENTA, no del producto. Y se demuestra:
-- #####################################################################

-- (a) Las facturas HOY
SELECT d.id_venta          AS factura,
       p.nombre            AS producto,
       d.cantidad,
       d.precio_venta      AS 'Precio al que se vendio',
       p.precio_unitario   AS 'Precio de lista actual',
       d.subtotal
  FROM detalle_venta d
  JOIN productos p ON p.codigo_producto = d.codigo_producto
 ORDER BY d.id_detalle;

-- (b) Sube la inflacion: la leche pasa de $2.850 a $3.500
UPDATE productos
   SET precio_unitario = 3500.00
 WHERE codigo_producto = '7702001001';

-- (c) La MISMA consulta otra vez.
--     El precio de lista cambio. El precio de las facturas 2 y 4 NO.
--     Las ventas de ayer siguen diciendo la verdad de ayer.
SELECT d.id_venta          AS factura,
       p.nombre            AS producto,
       d.cantidad,
       d.precio_venta      AS 'Precio al que se vendio',
       p.precio_unitario   AS 'Precio de lista actual',
       d.subtotal
  FROM detalle_venta d
  JOIN productos p ON p.codigo_producto = d.codigo_producto
 ORDER BY d.id_detalle;

-- QUE DECIR AQUI:
-- "Si el detalle no guardara su propio precio y lo trajera por JOIN
--  desde productos, las facturas 2 y 4 acabarian de cambiar solas.
--  Una venta que ya ocurrio no puede mutar cuando cambia una lista de
--  precios. Por eso no es redundancia: son dos datos distintos que
--  por casualidad coinciden el dia de la venta."

-- Dejar como estaba
UPDATE productos SET precio_unitario = 2850.00 WHERE codigo_producto = '7702001001';


-- #####################################################################
-- PARTE 5 - INTEGRIDAD DEL DATO DERIVADO ventas.total
--
-- QUE DECIR:
-- "`subtotal` y `diferencia` son columnas GENERATED STORED: las calcula
--  el motor y es imposible desincronizarlas. `ventas.total` no puede
--  ser generada porque depende de OTRA tabla, asi que la protegimos con
--  tres triggers. Esta consulta lo comprueba: si devuelve 0 filas, no
--  hay una sola venta descuadrada en toda la base."
-- #####################################################################

SELECT v.id_venta,
       v.total                              AS total_cabecera,
       IFNULL(SUM(d.subtotal), 0)           AS suma_renglones,
       v.total - IFNULL(SUM(d.subtotal), 0) AS descuadre
  FROM ventas v
  LEFT JOIN detalle_venta d ON d.id_venta = v.id_venta
 GROUP BY v.id_venta, v.total
HAVING descuadre <> 0;
-- Resultado esperado: "MySQL ha devuelto un conjunto vacio (0 filas)".
-- Ese mensaje vacio ES la demostracion.

-- DEMOSTRACION EN VIVO del trigger (opcional, muy convincente):
-- (a) Total actual de la venta 4
SELECT id_venta, total FROM ventas WHERE id_venta = 4;
-- Esperado: 21050.00

-- (b) Se agrega un pan a la venta 4. NO se toca ventas.total.
INSERT INTO detalle_venta (id_venta, codigo_producto, cantidad, precio_venta)
VALUES (4, '7702001005', 1, 3000.00);

-- (c) El total subio solo
SELECT id_venta, total FROM ventas WHERE id_venta = 4;
-- Esperado: 24050.00  (el trigger sumo los $3.000)

-- (d) Se quita el pan y el total vuelve solo
DELETE FROM detalle_venta
 WHERE id_venta = 4 AND codigo_producto = '7702001005';

SELECT id_venta, total FROM ventas WHERE id_venta = 4;
-- Esperado: 21050.00 otra vez


-- #####################################################################
-- PARTE 6 - EL ARQUEO DE CAJA  (correccion A de la migracion 04)
--
-- QUE DECIR:
-- "La formula original restaba del efectivo contado el total de TODAS
--  las ventas, incluida la de Nequi. Esa plata nunca entra al cajon.
--  Miren el turno real: con la formula vieja la caja daria un faltante
--  de 32.300 pesos, que es exactamente la venta de Nequi. Con la
--  formula corregida da cero: la caja esta cuadrada."
-- #####################################################################

SELECT id_arqueo,
       monto_inicial,
       total_ventas,
       total_efectivo,
       monto_final,
       diferencia                                   AS 'Formula corregida (la del motor)',
       monto_final - monto_inicial - total_ventas   AS 'Formula anterior (erronea)'
  FROM arqueo_caja;
-- Esperado (turno 2): diferencia = 0.00  |  formula anterior = -32300.00
-- Los demas turnos lo confirman: la formula vieja da un faltante falso
-- en todo turno con pagos digitales (turnos 4, 6, 7, 9 y 10), y la
-- corregida solo marca los descuadres reales: +500 en el 4 y -700 en
-- el 8. El turno 11 esta abierto (sin cierre, todo NULL).

-- De donde sale el -32.300: la unica venta que no fue en efectivo
SELECT v.id_venta, m.nombre AS metodo_pago, v.total
  FROM ventas v
  JOIN metodos_pago m ON m.id_metodo_pago = v.id_metodo_pago
 WHERE v.id_arqueo = 2
 ORDER BY m.nombre;
-- Esperado: Efectivo 8.700 y 21.050 (= 29.750)  |  Nequi 32.300


-- #####################################################################
-- PARTE 7 - EL CARRITO DEL CHATBOT  (correccion B de la migracion 04)
--
-- QUE DECIR:
-- "Antes el carrito era un JSON dentro de sesiones_chatbot: violaba la
--  1FN y copiaba el nombre y el precio del producto. Ahora es una tabla
--  con una fila por producto, y el nombre y el precio llegan por JOIN
--  desde productos, la unica fuente de verdad."
-- #####################################################################

-- (a) El carrito de la conversacion activa
SELECT s.telefono,
       s.paso,
       p.nombre                         AS producto,
       c.cantidad,
       p.precio_unitario,
       c.cantidad * p.precio_unitario   AS subtotal
  FROM carrito_chatbot c
  JOIN sesiones_chatbot s ON s.id_sesion       = c.id_sesion
  JOIN productos        p ON p.codigo_producto = c.codigo_producto;
-- Esperado: 10 filas en 6 conversaciones. La de 3204445566 tiene
-- 1 Cafe Molido ($9.900) y 2 Pan Tajado ($6.000)

-- (b) La llave foranea en accion: un producto que NO existe.
--     ESTA CONSULTA DEBE FALLAR. El error ES la demostracion:
--     el JSON aceptaba cualquier codigo; la tabla no.
INSERT INTO carrito_chatbot (id_sesion, codigo_producto, cantidad)
VALUES (2, '0000000000', 1);
-- Esperado: #1452 - Cannot add or update a child row:
--           a foreign key constraint fails (fk_carrito_producto)
