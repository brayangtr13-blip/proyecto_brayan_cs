-- |||=============================================================================================|||
-- |||                       CONTROL STORE · AUTOSERVICIO AYUELAL · SENA ADSO                       |||
-- |||           06.01 · PREGUNTAS DE SUSTENTACIÓN CON SU RESPUESTA EN SQL · MySQL 8.4              |||
-- |||=============================================================================================|||
-- |||                                                                                             |||
-- |||  96 preguntas que puede hacer el instructor, agrupadas según el script que las origina.    |||
-- |||  Cada una trae:                                                                            |||
-- |||    P  = la pregunta                                                                         |||
-- |||    R  = la respuesta corta, para decirla con tus palabras                                  |||
-- |||    y debajo el código que lo DEMUESTRA en la consola.                                       |||
-- |||                                                                                             |||
-- |||  CONTENIDO                                                                                  |||
-- |||    Bloque 1. Estructura ................... P01 a P08                                       |||
-- |||    Bloque 2. Datos de prueba .............. P09 a P16                                       |||
-- |||    Bloque 3. Triggers ..................... P17 a P26                                       |||
-- |||    Bloque 4. Vistas ....................... P27 a P35                                       |||
-- |||    Bloque 5. Procedimientos ............... P36 a P46                                       |||
-- |||    Bloque 6. DDL .......................... P47 a P59                                       |||
-- |||    Bloque 7. DML de una tabla ............. P60 a P72                                       |||
-- |||    Bloque 8. DML multitabla ............... P73 a P83                                       |||
-- |||    Bloque 9. Seguridad .................... P84 a P96                                       |||
-- |||                                                                                             |||
-- |||  NO CAMBIA NADA DE LA BASE:                                                                 |||
-- |||   · Lo que modifica datos va entre START TRANSACTION y ROLLBACK (se deshace).               |||
-- |||   · Lo de estructura se hace en una base aparte: controlstore_preguntas (se borra al final).|||
-- |||   · El usuario y el rol de MySQL de práctica se borran al final.                           |||
-- |||   · Las sentencias que DAN ERROR a propósito van comentadas con "-- ERR>". Para ver el      |||
-- |||     error, quita el "-- ERR>" y ejecuta solo esa línea.                                     |||
-- |||                                                                                             |||
-- |||  Requiere haber corrido antes los scripts 1 a 5 (estructura, datos, triggers, vistas y     |||
-- |||  procedimientos). Se ejecuta conectado como root.                                         |||
-- |||                                                                                             |||
-- |||  EN CONSOLA: mysql> SOURCE C:/Users/bryan/proyecto_grado_alexander/database/06_preguntas_sustentacion/01_preguntas_sustentacion.sql
-- |||=============================================================================================|||

USE controlstore_sena;

-- Base aparte para las preguntas de estructura (DDL). Se borra al final del archivo.
DROP DATABASE IF EXISTS controlstore_preguntas;
CREATE DATABASE controlstore_preguntas CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci;


-- ===================================================================================================
-- BLOQUE 1. ESTRUCTURA · 01_base_datos/01_db_estructura.sql
-- ===================================================================================================

-- P01. ¿Por qué la tabla productos no tiene id_producto?
-- R:   Porque su llave primaria es el CÓDIGO DE BARRAS (llave natural). Ya es único para cada
--      producto, y así el lector de la caja busca el producto directamente por su llave.
SHOW KEYS FROM productos WHERE Key_name = 'PRIMARY';
SELECT codigo_producto, nombre FROM productos WHERE codigo_producto = '7702001005';

-- P02. ¿Qué diferencia hay entre ON DELETE RESTRICT, CASCADE y SET NULL?
-- R:   RESTRICT no deja borrar al padre si tiene hijos. CASCADE borra los hijos junto con el
--      padre. SET NULL deja a los hijos, pero con la llave foránea en NULL.
--      · usuarios -> ventas ........ RESTRICT  (no se borra un cajero que tiene ventas)
--      · ventas -> detalle_venta ... CASCADE   (los renglones no tienen sentido sin su venta)
--      · clientes -> ventas ........ SET NULL  (la venta queda, pero sin cliente)
-- ERR> DELETE FROM usuarios WHERE id_usuario = 2;     -- ERROR 1451: tiene turnos de caja y ventas
START TRANSACTION;
  SELECT COUNT(*) AS renglones_venta_3_antes FROM detalle_venta WHERE id_venta = 3;
  DELETE FROM ventas WHERE id_venta = 3;                                  -- CASCADE
  SELECT COUNT(*) AS renglones_venta_3_despues FROM detalle_venta WHERE id_venta = 3;
  DELETE FROM clientes WHERE id_cliente = 2;                              -- SET NULL
  SELECT id_venta, id_cliente AS cliente_ahora_null FROM ventas WHERE id_venta = 4;
ROLLBACK;

-- P03. ¿Por qué el script empieza con SET FOREIGN_KEY_CHECKS = 0?
-- R:   Las tablas están ordenadas por MÓDULO, no por dependencia. Por ejemplo, ventas apunta a
--      clientes, que se crea después. Con las revisiones apagadas se pueden crear en ese orden, y
--      al final se vuelven a encender con SET FOREIGN_KEY_CHECKS = 1.
SELECT @@FOREIGN_KEY_CHECKS AS revision_de_llaves_activa;    -- 1 = encendida

-- P04. ¿Por qué utf8mb4 y utf8mb4_spanish_ci?
-- R:   utf8mb4 guarda bien tildes, la ñ y hasta emojis. spanish ordena como en español. ci =
--      "case insensitive": no distingue mayúsculas de minúsculas al comparar.
SHOW CREATE DATABASE controlstore_sena;
SELECT 'PAN' = 'pan' AS mayusculas_iguales, 'Café' AS con_tilde;

-- P05. ¿Para qué sirve ENGINE = InnoDB?
-- R:   Es el motor que soporta LLAVES FORÁNEAS y TRANSACCIONES (COMMIT / ROLLBACK). Sin InnoDB
--      no habría integridad referencial.
SELECT table_name, engine
  FROM information_schema.tables
 WHERE table_schema = 'controlstore_sena' AND table_type = 'BASE TABLE';

-- P06. ¿Qué es una columna VIRTUAL y cómo ayuda a la 3FN?
-- R:   Es una columna calculada que NO se guarda: el motor la calcula al leerla. subtotal =
--      cantidad * precio_venta. Como no se escribe a mano, nunca queda distinta a su fórmula.
-- ERR> UPDATE detalle_venta SET subtotal = 1 WHERE id_detalle = 3;   -- ERROR 3105: generated column
SELECT id_detalle, cantidad, precio_venta, subtotal FROM detalle_venta WHERE id_venta = 2;
SELECT column_name, generation_expression
  FROM information_schema.columns
 WHERE table_schema = 'controlstore_sena' AND extra LIKE '%GENERATED%';

-- P07. ¿Qué es una llave primaria compuesta y cómo se resuelve un muchos a muchos?
-- R:   Un rol tiene muchos permisos y un permiso está en muchos roles. Se crea la tabla puente
--      rol_permiso, con llave primaria (id_rol, id_permiso): la PAREJA no se puede repetir.
-- ERR> INSERT INTO rol_permiso (id_rol, id_permiso) VALUES (1, 1);   -- ERROR 1062: Duplicate entry
SHOW KEYS FROM rol_permiso WHERE Key_name = 'PRIMARY';
SELECT r.nombre AS rol, p.codigo AS permiso
  FROM roles r
  JOIN rol_permiso rp ON rp.id_rol = r.id_rol
  JOIN permisos p     ON p.id_permiso = rp.id_permiso
 WHERE r.id_rol = 2;

-- P08. ¿Por qué se usa baja lógica (activo = 0) en vez de DELETE?
-- R:   Si se borra un usuario o un producto, sus ventas quedarían sin dueño (o la FK lo impide).
--      Con activo = 0 deja de aparecer, pero el historial queda completo.
-- ERR> DELETE FROM usuarios WHERE id_usuario = 4;   -- ERROR 1451: tiene turnos de caja y ventas
START TRANSACTION;
  UPDATE usuarios SET activo = 0 WHERE id_usuario = 4;
  SELECT id_usuario, nombre, activo FROM usuarios WHERE id_usuario = 4;
  SELECT COUNT(*) AS sus_ventas_siguen FROM ventas WHERE id_usuario = 4;
ROLLBACK;


-- ===================================================================================================
-- BLOQUE 2. DATOS DE PRUEBA · 03_sentencias_dml/01_db_dml_datos.sql
-- ===================================================================================================

-- P09. ¿Por qué todos los INSERT van dentro de una transacción?
-- R:   Para que sea TODO O NADA: si un INSERT falla, ROLLBACK deshace los anteriores y la base
--      no queda a medias. Si todo sale bien, COMMIT lo guarda.
START TRANSACTION;
  INSERT INTO categorias (nombre, descripcion) VALUES ('Categoría de prueba', 'Se deshace');
  SELECT COUNT(*) AS categorias_dentro_de_la_transaccion FROM categorias;
ROLLBACK;
SELECT COUNT(*) AS categorias_despues_del_rollback FROM categorias;

-- P10. ¿Por qué los INSERT van en ese orden (padres antes que hijos)?
-- R:   Por las llaves foráneas: no se puede crear una venta de un cliente que todavía no existe.
-- ERR> INSERT INTO ventas (id_usuario, id_cliente, id_metodo_pago, total) VALUES (2, 999, 1, 0);
--      -- ERROR 1452: Cannot add or update a child row (no existe el cliente 999)

-- P11. ¿Qué pasa si el script de datos se ejecuta dos veces?
-- R:   Falla con ERROR 1062 (llave duplicada), porque los ids ya existen. Por eso primero se
--      corre el script 1, que borra y crea la base limpia.
-- ERR> INSERT INTO roles (id_rol, nombre) VALUES (1, 'administrador');   -- ERROR 1062

-- P12. ¿Por qué los ids están escritos a mano si son AUTO_INCREMENT?
-- R:   Para poder citar "la venta #3" o "el arqueo 11" en los documentos y que siempre sean los
--      mismos. Después, AUTO_INCREMENT sigue desde el número más alto.
SELECT MAX(id_venta) AS ultimo_id_venta FROM ventas;
SHOW TABLE STATUS WHERE Name = 'ventas';     -- columna Auto_increment = el próximo id

-- P13. ¿Cómo demuestras que ventas.total cuadra con sus renglones?
-- R:   Sumando los subtotales de cada venta y comparando con su total. Si sale vacío, cuadra.
SELECT v.id_venta, v.total, SUM(d.subtotal) AS suma_renglones
  FROM ventas v JOIN detalle_venta d ON d.id_venta = v.id_venta
 GROUP BY v.id_venta, v.total
HAVING v.total <> SUM(d.subtotal);

-- P14. ¿Cómo demuestras que el stock cuadra con el kárdex?
-- R:   Las entradas suman y las salidas y ajustes (mermas) restan. El saldo de cada producto
--      debe ser igual a su stock_actual. Si sale vacío, cuadra.
SELECT p.codigo_producto, p.nombre, p.stock_actual,
       SUM(CASE m.tipo WHEN 'entrada' THEN m.cantidad ELSE -m.cantidad END) AS saldo_kardex
  FROM productos p JOIN movimientos_inventario m ON m.codigo_producto = p.codigo_producto
 GROUP BY p.codigo_producto, p.nombre, p.stock_actual
HAVING p.stock_actual <> saldo_kardex;

-- P15. ¿Por qué en los datos ventas.total va escrito, si hay un trigger que lo calcula?
-- R:   Porque los triggers se crean DESPUÉS (script 3). Cuando se cargan los datos, todavía no
--      existen, así que el total se escribe ya calculado.
SELECT trigger_name, action_timing, event_manipulation, event_object_table
  FROM information_schema.triggers
 WHERE trigger_schema = 'controlstore_sena' AND event_object_table = 'detalle_venta';

-- P16. ¿Cómo sabes qué puede hacer cada rol de la aplicación?
-- R:   Uniendo roles -> rol_permiso -> permisos.
SELECT r.nombre AS rol, COUNT(rp.id_permiso) AS cantidad_permisos
  FROM roles r LEFT JOIN rol_permiso rp ON rp.id_rol = r.id_rol
 GROUP BY r.id_rol, r.nombre
 ORDER BY cantidad_permisos DESC;


-- ===================================================================================================
-- BLOQUE 3. TRIGGERS · 04_programacion_db/01_triggers.sql
-- ===================================================================================================

-- P17. ¿Qué es un trigger y cuándo se ejecuta?
-- R:   Código que se ejecuta SOLO cuando pasa un INSERT, UPDATE o DELETE en una tabla. Nadie lo
--      llama: lo dispara el evento.
SHOW TRIGGERS FROM controlstore_sena;

-- P18. ¿Qué diferencia hay entre BEFORE y AFTER?
-- R:   BEFORE corre ANTES de guardar: puede cambiar NEW o rechazar la operación (bloqueo,
--      precio). AFTER corre cuando el dato YA está guardado: sirve para actualizar otras tablas
--      (total de la venta, auditoría).
SELECT trigger_name, action_timing AS momento, event_manipulation AS evento, event_object_table AS tabla
  FROM information_schema.triggers
 WHERE trigger_schema = 'controlstore_sena'
 ORDER BY action_timing, event_object_table;

-- P19. ¿Qué son NEW y OLD?
-- R:   NEW = la fila como va a quedar (existe en INSERT y UPDATE).
--      OLD = la fila como estaba antes (existe en UPDATE y DELETE).
--      El trigger de auditoría guarda los dos: precio OLD -> precio NEW.
SHOW CREATE TRIGGER trg_productos_precio_au;

-- P20. ¿Para qué sirve DELIMITER $$?
-- R:   El cuerpo del trigger lleva ';' adentro. Si el delimitador sigue siendo ';', la consola
--      corta la instrucción en el primer ';'. Se cambia a $$ y al final se devuelve a ';'.
--      (Se crea un trigger de ejemplo en la base de práctica)
CREATE TABLE controlstore_preguntas.notas (
  id_nota INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  texto   VARCHAR(50) NOT NULL
);
DELIMITER $$
CREATE TRIGGER controlstore_preguntas.trg_notas_mayusculas
BEFORE INSERT ON controlstore_preguntas.notas
FOR EACH ROW
BEGIN
  SET NEW.texto = UPPER(NEW.texto);   -- este ';' cortaría el CREATE si no se cambia el delimitador
END$$
DELIMITER ;
INSERT INTO controlstore_preguntas.notas (texto) VALUES ('hola sena');
SELECT * FROM controlstore_preguntas.notas;     -- sale 'HOLA SENA'

-- P21. Si el total se puede calcular, ¿por qué se guarda en ventas.total? ¿No rompe la 3FN?
-- R:   Es una desnormalización CONTROLADA: lo mantienen los triggers, así que nunca queda
--      desactualizado, y los reportes no tienen que sumar renglones cada vez.
START TRANSACTION;
  SELECT total AS total_antes FROM ventas WHERE id_venta = 2;
  INSERT INTO detalle_venta (id_venta, codigo_producto, cantidad, precio_venta)
  VALUES (2, '7702001004', 1, 5800);
  SELECT total AS total_despues FROM ventas WHERE id_venta = 2;   -- subió 5.800 solo
ROLLBACK;

-- P22. ¿Por qué el trigger recalcula con SUM y no le suma NEW.subtotal al total?
-- R:   Porque con SUM el total SIEMPRE es la suma real de los renglones: no se descuadra aunque
--      se cambie la cantidad o se borre un renglón.
START TRANSACTION;
  UPDATE detalle_venta SET cantidad = 5 WHERE id_detalle = 3;
  SELECT total AS total_con_cantidad_cambiada FROM ventas WHERE id_venta = 2;
  DELETE FROM detalle_venta WHERE id_detalle = 4;
  SELECT total AS total_con_renglon_borrado FROM ventas WHERE id_venta = 2;
ROLLBACK;

-- P23. ¿Cómo rechaza un trigger una operación?
-- R:   Con SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '...'. Se cancela la sentencia y sale el
--      mensaje propio (ERROR 1644).
-- ERR> UPDATE productos SET precio_unitario = 1000 WHERE codigo_producto = '7702001005';
--      -- ERROR 1644: el precio de venta no puede ser menor al precio de compra

-- P24. ¿Cómo funciona el bloqueo después de 3 intentos fallidos?
-- R:   Un trigger BEFORE UPDATE revisa intentos_fallidos: si llega a 3, pone
--      bloqueado_hasta = NOW() + 15 minutos. Si vuelve a 0, lo deja en NULL.
START TRANSACTION;
  UPDATE usuarios SET intentos_fallidos = 3 WHERE id_usuario = 4;
  SELECT id_usuario, intentos_fallidos, bloqueado_hasta FROM usuarios WHERE id_usuario = 4;
ROLLBACK;

-- P25. ¿Cómo sabe el trigger de auditoría QUÉ usuario cambió el precio?
-- R:   La aplicación guarda el id en la variable de sesión @id_usuario_app antes del UPDATE, y
--      el trigger la lee.
START TRANSACTION;
  SET @id_usuario_app = 1;
  UPDATE productos SET precio_unitario = 3200 WHERE codigo_producto = '7702001005';
  SELECT * FROM log_auditoria ORDER BY id_log DESC LIMIT 1;
ROLLBACK;
SET @id_usuario_app = NULL;

-- P26. ¿Cómo se modifica o se borra un trigger?
-- R:   No existe ALTER TRIGGER. Se borra con DROP TRIGGER IF EXISTS y se vuelve a crear.
DROP TRIGGER IF EXISTS controlstore_preguntas.trg_notas_mayusculas;
SHOW TRIGGERS FROM controlstore_preguntas;     -- ya no aparece


-- ===================================================================================================
-- BLOQUE 4. VISTAS · 04_programacion_db/02_views.sql
-- ===================================================================================================

-- P27. ¿Qué es una vista y en qué se diferencia de una tabla?
-- R:   Es una CONSULTA GUARDADA con nombre. No guarda datos: cada vez que se consulta, lee las
--      tablas. Si cambia un dato, la vista lo muestra al instante.
SHOW FULL TABLES FROM controlstore_sena WHERE Table_type = 'VIEW';
START TRANSACTION;
  SELECT COUNT(*) AS productos_en_alerta_antes FROM vw_inventario_stock_bajo;
  UPDATE productos SET stock_actual = 1 WHERE codigo_producto = '7702001001';
  SELECT COUNT(*) AS productos_en_alerta_despues FROM vw_inventario_stock_bajo;
ROLLBACK;

-- P28. ¿Por qué CREATE OR REPLACE VIEW?
-- R:   Si la vista ya existe la reemplaza, así que el script se puede correr varias veces sin
--      error. También es la forma de MODIFICAR una vista.
CREATE OR REPLACE VIEW controlstore_preguntas.vw_prueba AS SELECT 1 AS version;
CREATE OR REPLACE VIEW controlstore_preguntas.vw_prueba AS SELECT 2 AS version;   -- no da error
SELECT * FROM controlstore_preguntas.vw_prueba;

-- P29. ¿Por qué las ventas anuladas no salen en los reportes?
-- R:   Las vistas filtran WHERE estado <> 'anulada': esa plata nunca entró a la caja.
SELECT SUM(total) AS con_anuladas,
       SUM(IF(estado <> 'anulada', total, 0)) AS sin_anuladas
  FROM ventas;
SELECT SUM(total_vendido) AS total_de_la_vista FROM vw_ventas_diarias;

-- P30. ¿Por qué vw_domicilios_detalle usa LEFT JOIN?
-- R:   Un domicilio pendiente todavía no tiene domiciliario (NULL). Con INNER JOIN desaparecería
--      del reporte. LEFT JOIN lo deja con el domiciliario vacío.
START TRANSACTION;
  UPDATE domicilios SET id_domiciliario = NULL, estado = 'pendiente' WHERE id_domicilio = 10;
  SELECT COUNT(*) AS con_inner_join
    FROM domicilios d INNER JOIN usuarios u ON u.id_usuario = d.id_domiciliario;
  SELECT COUNT(*) AS con_left_join
    FROM domicilios d LEFT JOIN usuarios u ON u.id_usuario = d.id_domiciliario;
ROLLBACK;

-- P31. ¿Cómo protege una vista los datos sensibles?
-- R:   vw_usuarios_roles muestra el personal SIN la columna contrasena_hash. Al rol de reportes
--      solo se le da permiso sobre la vista, nunca sobre la tabla usuarios (ver P85).
SELECT column_name AS columnas_de_la_vista
  FROM information_schema.columns
 WHERE table_schema = 'controlstore_sena' AND table_name = 'vw_usuarios_roles';

-- P32. ¿Se puede usar WHERE, ORDER BY o funciones sobre una vista?
-- R:   Sí, se consulta igual que una tabla.
SELECT metodo_pago, SUM(total_vendido) AS total
  FROM vw_ventas_diarias
 GROUP BY metodo_pago
 ORDER BY total DESC;

-- P33. ¿Qué hace el CASE de vw_arqueos_caja?
-- R:   Convierte el número de la diferencia en una palabra: abierta (sin cierre), cuadrada (0),
--      sobrante (> 0) o faltante (< 0).
SELECT * FROM vw_arqueos_caja;

-- P34. ¿Cómo se ve el código de una vista?
-- R:   Con SHOW CREATE VIEW.
SHOW CREATE VIEW vw_arqueos_caja;

-- P35. ¿Qué requisito cubre cada vista?
-- R:   vw_ventas_diarias = RF26 · vw_productos_mas_vendidos = RF27 · vw_inventario_stock_bajo =
--      RF28 · vw_arqueos_caja = RF29 · vw_domicilios_detalle = RF30 · vw_usuarios_roles = lista
--      del personal sin contraseña.
SELECT table_name AS vista FROM information_schema.views WHERE table_schema = 'controlstore_sena';


-- ===================================================================================================
-- BLOQUE 5. PROCEDIMIENTOS · 04_programacion_db/03_procedures.sql
-- ===================================================================================================

-- P36. ¿Qué diferencia hay entre procedimiento, trigger y vista?
-- R:   Procedimiento = se ejecuta cuando alguien lo llama con CALL, y puede recibir parámetros.
--      Trigger = se ejecuta SOLO ante un INSERT/UPDATE/DELETE. Vista = una consulta guardada.
CALL pa_listar_stock_bajo();

-- P37. ¿Qué son los parámetros IN y OUT?
-- R:   IN = un valor que ENTRA al procedimiento. OUT = un valor que el procedimiento DEVUELVE
--      en una variable que empieza con @.
CALL pa_tiene_permiso(1, 'ventas.anular', @puede);
SELECT @puede AS administrador_puede_anular;     -- 1
CALL pa_tiene_permiso(2, 'ventas.anular', @puede);
SELECT @puede AS cajero_puede_anular;            -- 0

-- P38. ¿Por qué hay una transacción dentro del procedimiento de venta?
-- R:   Agregar un producto hace 3 cosas: guarda el renglón, baja el stock y escribe el kárdex.
--      Deben pasar las 3 o ninguna. Si algo falla, ROLLBACK deja todo como estaba.
SELECT stock_actual AS stock_cafe FROM productos WHERE codigo_producto = '7702001003';
-- ERR> CALL pa_agregar_producto_venta(2, '7702001003', 500);
--      -- falla (la venta 2 ya está pagada) y el stock del café sigue igual

-- P39. ¿Qué hace DECLARE EXIT HANDLER FOR SQLEXCEPTION ... ROLLBACK; RESIGNAL?
-- R:   Si cualquier sentencia falla, salta al manejador: deshace la transacción (ROLLBACK) y
--      vuelve a lanzar el error original (RESIGNAL) para que la aplicación sepa qué pasó.
SHOW CREATE PROCEDURE pa_agregar_producto_venta;

-- P40. ¿Para qué sirve FOR UPDATE?
-- R:   Bloquea la fila del producto hasta el COMMIT. Si dos cajeros venden la ÚLTIMA unidad al
--      mismo tiempo, el segundo espera y luego ve el stock ya actualizado.
START TRANSACTION;
  SELECT codigo_producto, stock_actual FROM productos WHERE codigo_producto = '7702001003' FOR UPDATE;
COMMIT;

-- P41. ¿Cómo valida el stock?
-- R:   SELECT stock_actual INTO v_stock ...; IF v_stock < p_cantidad THEN SIGNAL ... 'Stock
--      insuficiente'. La venta no sigue.
SELECT codigo_producto, nombre, stock_actual,
       IF(stock_actual < 500, 'Stock insuficiente para 500', 'Alcanza') AS validacion
  FROM productos WHERE codigo_producto = '7702001003';

-- P42. ¿Por qué el precio lo toma el procedimiento y no lo envía la aplicación?
-- R:   Para que siempre se use el precio VIGENTE de la tabla productos. Así nadie puede vender
--      a otro precio cambiando lo que manda la aplicación.
SELECT codigo_producto, nombre, precio_unitario FROM productos WHERE codigo_producto = '7702001005';

-- P43. ¿Cómo se controla que solo el administrador anule ventas?
-- R:   pa_anular_venta llama a pa_tiene_permiso (un procedimiento llama a otro). Si devuelve 0,
--      hace SIGNAL y no anula.
-- ERR> CALL pa_anular_venta(2, 2);   -- 'El usuario no tiene permiso para anular ventas'
CALL pa_tiene_permiso(2, 'ventas.anular', @puede);
SELECT @puede AS cajero_puede_anular;

-- P44. ¿Qué hacen el UPDATE con JOIN y el INSERT ... SELECT en la anulación?
-- R:   UPDATE productos JOIN detalle_venta devuelve el stock de TODOS los renglones en una sola
--      sentencia. INSERT ... SELECT crea una 'entrada' en el kárdex por cada renglón.
--      Lo que devolvería si se anulara la venta 3:
SELECT d.codigo_producto, p.stock_actual AS stock_hoy, d.cantidad AS se_devuelve,
       p.stock_actual + d.cantidad AS stock_despues
  FROM detalle_venta d JOIN productos p ON p.codigo_producto = d.codigo_producto
 WHERE d.id_venta = 3;

-- P45. ¿Cómo calcula la diferencia el cierre de caja?
-- R:   Con subconsultas suma total_ventas y total_efectivo del turno. diferencia es VIRTUAL:
--      monto_final - monto_inicial - total_efectivo. Base 20.000 + efectivo 20.800 = 40.800.
--      (El procedimiento hace COMMIT, así que después se deja la caja 11 abierta otra vez)
CALL pa_cerrar_caja(11, 40800, @dif);
SELECT @dif AS diferencia_caja_11;     -- 0 = cuadrada
UPDATE arqueo_caja
   SET fecha_cierre = NULL, monto_final = NULL, total_ventas = NULL, total_efectivo = NULL
 WHERE id_arqueo = 11;

-- P46. ¿Cómo se ven y se borran los procedimientos?
-- R:   SHOW PROCEDURE STATUS los lista, SHOW CREATE PROCEDURE muestra el código y
--      DROP PROCEDURE IF EXISTS lo borra.
SHOW PROCEDURE STATUS WHERE Db = 'controlstore_sena';


-- ===================================================================================================
-- BLOQUE 6. DDL · 02_sentencias_ddl/01_db_ddl.sql   (todo en controlstore_preguntas)
-- ===================================================================================================
USE controlstore_preguntas;

-- P47. ¿Qué diferencia hay entre DDL y DML?
-- R:   DDL (CREATE, ALTER, DROP) cambia la ESTRUCTURA. DML (INSERT, UPDATE, DELETE, SELECT)
--      trabaja con los DATOS.
ALTER TABLE notas ADD COLUMN autor VARCHAR(30) NULL;     -- DDL: nueva columna
UPDATE notas SET autor = 'Bryan';                        -- DML: llena el dato
SELECT * FROM notas;

-- P48. ¿Por qué la práctica de DDL se hace en otra base?
-- R:   Para no dañar la base real. Se copia la tabla con CREATE TABLE ... LIKE y los datos con
--      INSERT ... SELECT.
CREATE TABLE p_productos  LIKE controlstore_sena.productos;
INSERT INTO  p_productos  SELECT * FROM controlstore_sena.productos;
CREATE TABLE p_categorias LIKE controlstore_sena.categorias;
INSERT INTO  p_categorias SELECT * FROM controlstore_sena.categorias;
SELECT COUNT(*) AS productos_copiados FROM p_productos;

-- P49. ¿Qué copia CREATE TABLE ... LIKE y qué no?
-- R:   Copia columnas, tipos, llave primaria, índices y CHECK. NO copia las llaves foráneas ni
--      los datos.
SHOW CREATE TABLE p_productos;      -- no aparece FOREIGN KEY

-- P50. ¿Qué diferencia hay entre SHOW COLUMNS y DESCRIBE?
-- R:   Ninguna: muestran lo mismo.
DESCRIBE p_categorias;
SHOW COLUMNS FROM p_categorias;

-- P51. ¿Qué diferencia hay entre CHANGE y MODIFY?
-- R:   CHANGE puede RENOMBRAR la columna y cambiar su tipo (se escribe el nombre dos veces).
--      MODIFY solo cambia el tipo o el NULL.
ALTER TABLE p_categorias CHANGE descripcion detalle VARCHAR(255) NULL;
ALTER TABLE p_categorias MODIFY detalle VARCHAR(300) NULL;
DESCRIBE p_categorias;

-- P52. ¿Cómo se pone y se quita un valor por defecto?
-- R:   ALTER TABLE ... ALTER COLUMN ... SET DEFAULT / DROP DEFAULT.
ALTER TABLE p_productos ALTER COLUMN unidad_medida SET DEFAULT 'Unidad';
SHOW COLUMNS FROM p_productos LIKE 'unidad_medida';
ALTER TABLE p_productos ALTER COLUMN unidad_medida DROP DEFAULT;

-- P53. ¿Cómo se agrega y se quita un CHECK?
-- R:   ADD CONSTRAINT nombre CHECK (condición) / DROP CHECK nombre. Si un dato no cumple: 3819.
ALTER TABLE p_productos ADD CONSTRAINT chk_p_unidad CHECK (unidad_medida <> '');
-- ERR> UPDATE p_productos SET unidad_medida = '' WHERE codigo_producto = '7702001005';   -- ERROR 3819
ALTER TABLE p_productos DROP CHECK chk_p_unidad;

-- P54. ¿Qué es un índice y para qué sirve?
-- R:   Es como el índice de un libro: el motor encuentra la fila sin leer toda la tabla.
--      Con EXPLAIN se ve: type = ALL (lee todo) antes, type = ref (usa el índice) después.
EXPLAIN SELECT * FROM p_productos WHERE nombre = 'Pan Tajado';
CREATE INDEX ind_p_nombre ON p_productos (nombre);
EXPLAIN SELECT * FROM p_productos WHERE nombre = 'Pan Tajado';

-- P55. ¿Qué diferencia hay entre índice normal, multicampo y único?
-- R:   Normal = de una columna. Multicampo = de varias columnas juntas. Único = además NO deja
--      repetir el valor (ERROR 1062).
CREATE INDEX ind_p_cat_precio ON p_productos (id_categoria, precio_unitario);
CREATE UNIQUE INDEX uq_p_nombre_unidad ON p_productos (nombre, unidad_medida);
-- ERR> INSERT INTO p_productos (codigo_producto, id_categoria, nombre, precio_unitario, unidad_medida)
--      VALUES ('1', 1, 'Pan Tajado', 3000, 'Unidad');   -- ERROR 1062
SHOW INDEX FROM p_productos;

-- P56. ¿Por qué no deja quitar la PRIMARY KEY de una columna AUTO_INCREMENT?
-- R:   AUTO_INCREMENT exige que la columna sea llave (ERROR 1075). Primero se le quita el
--      AUTO_INCREMENT con MODIFY y después sí se borra la llave.
-- ERR> ALTER TABLE p_categorias DROP PRIMARY KEY;   -- ERROR 1075
ALTER TABLE p_categorias MODIFY id_categoria INT NOT NULL;
ALTER TABLE p_categorias DROP PRIMARY KEY;
ALTER TABLE p_categorias ADD PRIMARY KEY (id_categoria);
ALTER TABLE p_categorias MODIFY id_categoria INT NOT NULL AUTO_INCREMENT;

-- P57. ¿Cómo se agrega y se quita una llave foránea?
-- R:   ADD CONSTRAINT nombre FOREIGN KEY (col) REFERENCES tabla (col) / DROP FOREIGN KEY nombre.
ALTER TABLE p_productos ADD CONSTRAINT fk_p_producto_categoria
  FOREIGN KEY (id_categoria) REFERENCES p_categorias (id_categoria);
SELECT constraint_name, table_name, referenced_table_name
  FROM information_schema.referential_constraints
 WHERE constraint_schema = 'controlstore_preguntas';
ALTER TABLE p_productos DROP FOREIGN KEY fk_p_producto_categoria;

-- P58. ¿Qué diferencia hay entre DELETE, TRUNCATE y DROP?
-- R:   DELETE borra filas (puede llevar WHERE y se puede deshacer). TRUNCATE vacía TODA la tabla
--      y reinicia el AUTO_INCREMENT. DROP borra la tabla completa, con su estructura.
DELETE FROM notas WHERE id_nota = 1;
INSERT INTO notas (texto) VALUES ('segunda');
SELECT * FROM notas;                -- id 2: DELETE no reinicia el contador
TRUNCATE TABLE notas;
INSERT INTO notas (texto) VALUES ('tercera');
SELECT * FROM notas;                -- id 1: TRUNCATE sí lo reinicia
DROP TABLE notas;

-- P59. ¿Cómo se renombra una tabla?
-- R:   RENAME TABLE viejo TO nuevo (o ALTER TABLE viejo RENAME TO nuevo).
RENAME TABLE p_categorias TO p_categorias_renombrada;
SHOW TABLES;

USE controlstore_sena;


-- ===================================================================================================
-- BLOQUE 7. DML DE UNA TABLA · 03_sentencias_dml/02_db_dml_una_tabla.sql
-- ===================================================================================================

-- P60. ¿Qué errores da la base al insertar mal y qué significan?
-- R:   1062 = valor repetido en llave o índice único · 1452 = la FK apunta a algo que no existe
--      · 3819 = no cumple un CHECK · 1048 = NULL en columna NOT NULL · 1265 = valor que no está
--      en el ENUM.
-- ERR> INSERT INTO categorias (nombre) VALUES ('Lácteos');                                   -- 1062
-- ERR> INSERT INTO productos (codigo_producto, id_categoria, nombre, precio_unitario) VALUES ('1', 999, 'X', 10);  -- 1452
-- ERR> INSERT INTO productos (codigo_producto, id_categoria, nombre, precio_unitario, stock_actual) VALUES ('1', 1, 'X', 10, -1);  -- 3819
-- ERR> INSERT INTO categorias (nombre) VALUES (NULL);                                        -- 1048
-- ERR> UPDATE ventas SET estado = 'regalada' WHERE id_venta = 2;                             -- 1265
SELECT nombre AS categoria_que_ya_existe FROM categorias WHERE nombre = 'Lácteos';

-- P61. ¿Qué pasa si haces UPDATE o DELETE sin WHERE?
-- R:   Cambia o borra TODAS las filas. Con SQL_SAFE_UPDATES = 1 (como Workbench), MySQL lo
--      impide (ERROR 1175) si el WHERE no usa la llave.
SET @safe_antes = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 1;
-- ERR> UPDATE productos SET activo = 1;    -- ERROR 1175: safe update mode
SET SQL_SAFE_UPDATES = @safe_antes;

-- P62. ¿Qué diferencia hay entre AND, OR y NOT?
-- R:   AND = se cumplen las dos. OR = basta con una. NOT = lo contrario.
SELECT nombre, id_rol, activo FROM usuarios WHERE id_rol = 2 AND activo = 1;     -- cajeros activos
SELECT nombre, id_rol FROM usuarios WHERE id_rol = 1 OR id_rol = 3;               -- admin o domiciliario
SELECT id_venta, estado FROM ventas WHERE NOT estado = 'pagada';                  -- no pagadas

-- P63. ¿Por qué con NULL no sirve el = ?
-- R:   NULL significa "desconocido": NULL = NULL no es verdadero. Se usa IS NULL / IS NOT NULL.
SELECT COUNT(*) AS con_igual FROM arqueo_caja WHERE fecha_cierre = NULL;      -- 0
SELECT COUNT(*) AS con_is_null FROM arqueo_caja WHERE fecha_cierre IS NULL;   -- 1 (caja abierta)

-- P64. ¿Cómo funcionan los comodines de LIKE?
-- R:   % = cualquier texto (o nada). _ = exactamente un carácter.
SELECT email FROM usuarios WHERE email LIKE '%@controlstore.com';
SELECT nombre FROM productos WHERE nombre LIKE 'A%';
SELECT nombre FROM productos WHERE nombre LIKE '_an%';     -- segunda y tercera letra 'an'

-- P65. ¿BETWEEN incluye los extremos?
-- R:   Sí. Con fechas y horas hay que cuidar la hora final: hasta '23:59:59'.
SELECT id_venta, fecha FROM ventas
 WHERE fecha BETWEEN '2026-09-12 00:00:00' AND '2026-09-16 23:59:59';

-- P66. ¿Qué diferencia hay entre WHERE y HAVING?
-- R:   WHERE filtra FILAS antes de agrupar. HAVING filtra GRUPOS después del GROUP BY, y es el
--      único que puede usar COUNT, SUM, etc.
-- ERR> SELECT id_usuario FROM ventas WHERE COUNT(*) > 3 GROUP BY id_usuario;   -- ERROR 1111
SELECT id_usuario, COUNT(*) AS ventas
  FROM ventas
 WHERE estado = 'pagada'
 GROUP BY id_usuario
HAVING COUNT(*) > 3;

-- P67. ¿Qué hace DISTINCT?
-- R:   Quita las filas repetidas del resultado.
SELECT estado FROM domicilios;
SELECT DISTINCT estado FROM domicilios;

-- P68. ¿Cuáles son las funciones de agregado? ¿COUNT(*) y COUNT(columna) son iguales?
-- R:   COUNT, SUM, AVG, MAX, MIN. COUNT(*) cuenta filas; COUNT(columna) NO cuenta los NULL.
SELECT COUNT(*) AS usuarios, COUNT(telefono) AS con_telefono FROM usuarios;
SELECT SUM(total) AS suma, ROUND(AVG(total), 2) AS promedio, MAX(total) AS mayor, MIN(total) AS menor
  FROM ventas WHERE estado = 'pagada';

-- P69. ¿Cómo se calcula el IVA y el margen de ganancia?
-- R:   IVA = precio * 0.19. Margen = (precio - costo) / costo * 100.
SELECT nombre, precio_unitario,
       ROUND(precio_unitario * 0.19, 2) AS iva,
       ROUND((precio_unitario - precio_compra) / precio_compra * 100, 1) AS margen_porcentaje
  FROM productos;

-- P70. ¿Cómo se muestra la fecha en formato colombiano y se calculan tiempos?
-- R:   DATE_FORMAT(fecha, '%d/%m/%Y'). TIMESTAMPDIFF(MINUTE, inicio, fin) da los minutos entre
--      dos momentos. DATEDIFF da los días.
SELECT id_domicilio,
       DATE_FORMAT(fecha_asignacion, '%d/%m/%Y %H:%i') AS asignado,
       TIMESTAMPDIFF(MINUTE, fecha_asignacion, fecha_entrega) AS minutos_en_entregar
  FROM domicilios WHERE fecha_entrega IS NOT NULL;
SELECT nombre, DATEDIFF(CURDATE(), fecha_registro) AS dias_registrado FROM usuarios LIMIT 3;

-- P71. ¿Para qué sirve CASE en un SELECT?
-- R:   Para clasificar: según una condición, muestra un texto u otro.
SELECT nombre, stock_actual, stock_minimo,
       CASE WHEN stock_actual = 0            THEN 'Agotado'
            WHEN stock_actual < stock_minimo THEN 'Pedir ya'
            ELSE 'Suficiente' END AS alerta
  FROM productos;

-- P72. ¿Para qué sirve un alias (AS)?
-- R:   Le da un nombre legible a una columna calculada, y un nombre corto a las tablas en un JOIN.
SELECT p.nombre AS producto, c.nombre AS categoria
  FROM productos AS p JOIN categorias AS c ON c.id_categoria = p.id_categoria
 LIMIT 3;


-- ===================================================================================================
-- BLOQUE 8. DML MULTITABLA · 03_sentencias_dml/03_db_dml_multitabla.sql
-- ===================================================================================================

-- P73. ¿Qué diferencia hay entre CREATE TABLE ... AS SELECT e INSERT INTO ... SELECT?
-- R:   CREATE TABLE ... AS SELECT CREA la tabla y la llena. INSERT INTO ... SELECT llena una
--      tabla que YA existe.
CREATE TABLE controlstore_preguntas.bebidas AS
SELECT codigo_producto, nombre, precio_unitario FROM productos WHERE id_categoria = 3;
INSERT INTO controlstore_preguntas.bebidas
SELECT codigo_producto, nombre, precio_unitario FROM productos WHERE id_categoria = 1;
SELECT * FROM controlstore_preguntas.bebidas;

-- P74. ¿Qué diferencia hay entre UNION y UNION ALL?
-- R:   UNION junta los resultados y QUITA los repetidos. UNION ALL deja todo. Las dos consultas
--      deben tener la misma cantidad de columnas.
SELECT estado FROM ventas UNION     SELECT estado FROM domicilios;
SELECT estado FROM ventas UNION ALL SELECT estado FROM domicilios;

-- P75. ¿Qué diferencia hay entre INNER, LEFT y RIGHT JOIN?
-- R:   INNER = solo las filas que tienen pareja en las dos tablas. LEFT = todas las de la
--      izquierda, aunque no tengan pareja (salen NULL). RIGHT = lo mismo con la derecha.
SELECT b.nombre AS barrio, COUNT(d.id_domicilio) AS domicilios
  FROM barrios b LEFT JOIN domicilios d ON d.id_barrio = b.id_barrio
 GROUP BY b.id_barrio, b.nombre;                       -- salen barrios con 0
SELECT b.nombre AS barrio, COUNT(d.id_domicilio) AS domicilios
  FROM barrios b INNER JOIN domicilios d ON d.id_barrio = b.id_barrio
 GROUP BY b.id_barrio, b.nombre;                       -- solo los que tienen domicilios
SELECT b.nombre AS barrio, d.id_domicilio
  FROM domicilios d RIGHT JOIN barrios b ON b.id_barrio = d.id_barrio;

-- P76. ¿Cómo se encuentran registros SIN relación (por ejemplo, productos nunca vendidos)?
-- R:   LEFT JOIN y luego WHERE la columna de la otra tabla IS NULL.
SELECT p.codigo_producto, p.nombre
  FROM productos p LEFT JOIN detalle_venta d ON d.codigo_producto = p.codigo_producto
 WHERE d.id_detalle IS NULL;
SELECT id_venta, total FROM ventas WHERE id_cliente IS NULL;   -- ventas sin cliente

-- P77. ¿Cómo se consulta una relación muchos a muchos?
-- R:   Pasando por la tabla puente: roles -> rol_permiso -> permisos -> modulos.
SELECT r.nombre AS rol, m.nombre AS modulo, p.codigo AS permiso
  FROM roles r
  JOIN rol_permiso rp ON rp.id_rol = r.id_rol
  JOIN permisos p     ON p.id_permiso = rp.id_permiso
  JOIN modulos m      ON m.id_modulo = p.id_modulo
 WHERE r.id_rol = 1
 ORDER BY m.nombre;

-- P78. ¿Qué es una subconsulta escalonada, de lista y correlacionada?
-- R:   Escalonada = devuelve UN valor. De lista = devuelve VARIOS (se usa con IN).
--      Correlacionada = usa un dato de la consulta de afuera, se repite por cada fila.
SELECT nombre, precio_unitario FROM productos
 WHERE precio_unitario > (SELECT AVG(precio_unitario) FROM productos);           -- escalonada
SELECT nombre FROM clientes
 WHERE id_cliente IN (SELECT id_cliente FROM ventas WHERE id_metodo_pago = 1);    -- de lista
SELECT p.nombre,
       (SELECT SUM(d.cantidad) FROM detalle_venta d
         WHERE d.codigo_producto = p.codigo_producto) AS unidades_vendidas        -- correlacionada
  FROM productos p;

-- P79. ¿Qué diferencia hay entre IN y EXISTS?
-- R:   IN compara contra una LISTA de valores. EXISTS solo pregunta si hay AL MENOS UNA fila.
SELECT nombre FROM clientes c
 WHERE EXISTS (SELECT 1 FROM ventas v WHERE v.id_cliente = c.id_cliente);

-- P80. ¿Qué cuidado hay con NOT IN y NULL?
-- R:   Si la subconsulta trae algún NULL, NOT IN devuelve VACÍO. NOT EXISTS no tiene ese problema.
--      ventas.id_cliente tiene NULL (ventas sin cliente):
SELECT COUNT(*) AS con_not_in FROM clientes
 WHERE id_cliente NOT IN (SELECT id_cliente FROM ventas);                          -- 0, engaña
SELECT COUNT(*) AS con_not_exists FROM clientes c
 WHERE NOT EXISTS (SELECT 1 FROM ventas v WHERE v.id_cliente = c.id_cliente);       -- el real

-- P81. ¿Cómo se hace un UPDATE o un DELETE usando otra tabla?
-- R:   UPDATE tabla JOIN otra ON ... SET ... / DELETE tabla FROM tabla JOIN otra ON ...
START TRANSACTION;
  UPDATE productos p JOIN categorias c ON c.id_categoria = p.id_categoria
     SET p.precio_unitario = p.precio_unitario + 100
   WHERE c.id_categoria = 3;
  SELECT nombre, precio_unitario FROM productos WHERE id_categoria = 3;
ROLLBACK;
DELETE b FROM controlstore_preguntas.bebidas b
  JOIN productos p ON p.codigo_producto = b.codigo_producto
 WHERE p.id_categoria = 1;
SELECT * FROM controlstore_preguntas.bebidas;     -- ya no está la leche

-- P82. ¿Qué pasa al borrar un registro que tiene hijos?
-- R:   Depende del ON DELETE de cada llave foránea (ver P02). Aquí se ve la regla de las 24 FK.
SELECT table_name AS hija, referenced_table_name AS padre, delete_rule AS al_borrar
  FROM information_schema.referential_constraints
 WHERE constraint_schema = 'controlstore_sena'
 ORDER BY delete_rule, table_name;

-- P83. En un JOIN con GROUP BY, ¿por qué se agrupa por el id y no solo por el nombre?
-- R:   Porque dos personas pueden llamarse igual. El id las separa; el nombre es para mostrar.
SELECT u.id_usuario, u.nombre, COUNT(v.id_venta) AS ventas
  FROM usuarios u JOIN ventas v ON v.id_usuario = u.id_usuario
 GROUP BY u.id_usuario, u.nombre;


-- ===================================================================================================
-- BLOQUE 9. SEGURIDAD · 05_seguridad_db/01_usuarios_privilegios.sql
-- (Se crea un rol y un usuario de práctica, distintos a los del script 9, y se borran al final)
-- ===================================================================================================
DROP USER IF EXISTS 'cs_pregunta'@'localhost';
DROP ROLE IF EXISTS 'rol_cs_pregunta';

-- P84. ¿Qué diferencia hay entre un usuario de la aplicación y uno de MySQL?
-- R:   El de la aplicación es una FILA de la tabla usuarios (Andrés, Juan Carlos...). El de
--      MySQL es una CUENTA que se conecta al servidor (root, cs_cajero...).
SELECT id_usuario, email, id_rol FROM usuarios LIMIT 3;     -- aplicación
SELECT user, host FROM mysql.user ORDER BY user;            -- MySQL

-- P85. ¿Qué es el principio de mínimo privilegio?
-- R:   Cada cuenta tiene SOLO los permisos que necesita. Si roban la clave del cajero, no puede
--      borrar ventas ni ver contraseñas.
CREATE ROLE 'rol_cs_pregunta';
GRANT SELECT ON controlstore_sena.productos TO 'rol_cs_pregunta';
GRANT SELECT, INSERT ON controlstore_sena.ventas TO 'rol_cs_pregunta';
GRANT SELECT ON controlstore_sena.vw_usuarios_roles TO 'rol_cs_pregunta';
SHOW GRANTS FOR 'rol_cs_pregunta';      -- nada sobre usuarios, ni DELETE

-- P86. ¿Qué es un rol de MySQL y por qué se usa?
-- R:   Un PAQUETE de permisos. Se dan los permisos al rol y el rol a las personas. Si hay que
--      cambiar algo, se cambia una vez en el rol y les llega a todos.
-- P87. ¿Qué significa 'usuario'@'localhost'?
-- R:   Que esa cuenta SOLO se puede conectar desde el mismo computador. Con '%' podría entrar
--      desde cualquier equipo.
CREATE USER 'cs_pregunta'@'localhost'
  IDENTIFIED BY 'Pregunta*Practica2026'
  FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1;
GRANT 'rol_cs_pregunta' TO 'cs_pregunta'@'localhost';
SELECT user, host FROM mysql.user WHERE user = 'cs_pregunta';

-- P88. ¿Para qué sirve SET DEFAULT ROLE?
-- R:   Tener un rol no es tenerlo ACTIVO. Sin SET DEFAULT ROLE, el usuario entra y no puede
--      hacer nada. CURRENT_ROLE() muestra el rol activo de la sesión.
SET DEFAULT ROLE 'rol_cs_pregunta' TO 'cs_pregunta'@'localhost';
SHOW GRANTS FOR 'cs_pregunta'@'localhost' USING 'rol_cs_pregunta';
SELECT CURRENT_ROLE() AS rol_activo_de_root;     -- NONE: root no usa roles

-- P89. ¿Cómo se quitan permisos?
-- R:   Con REVOKE ... FROM (lo contrario de GRANT ... TO).
REVOKE INSERT ON controlstore_sena.ventas FROM 'rol_cs_pregunta';
SHOW GRANTS FOR 'rol_cs_pregunta';      -- en ventas ya solo queda SELECT

-- P90. ¿Cómo se bloquea una cuenta de MySQL?
-- R:   Automático: FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 (3 fallos = 1 día bloqueada).
--      Manual: ALTER USER ... ACCOUNT LOCK, por ejemplo cuando el empleado se retira.
ALTER USER 'cs_pregunta'@'localhost' ACCOUNT LOCK;
SELECT user, account_locked FROM mysql.user WHERE user = 'cs_pregunta';     -- Y
ALTER USER 'cs_pregunta'@'localhost' ACCOUNT UNLOCK;
SELECT user, account_locked FROM mysql.user WHERE user = 'cs_pregunta';     -- N

-- P91. ¿Cómo demuestras que el cajero no puede borrar ventas?
-- R:   Conectándose como cs_cajero (creado en el script 9) e intentando borrar. Esto va en CMD:
--        mysql -u cs_cajero -p controlstore_sena
--        mysql> SELECT nombre FROM productos;   -> funciona
--        mysql> DELETE FROM ventas;              -> ERROR 1142: DELETE command denied
--      Desde root se ve que el cajero no tiene DELETE (sale vacío si no has corrido el script 9):
SELECT grantee, table_name, privilege_type
  FROM information_schema.table_privileges
 WHERE table_schema = 'controlstore_sena' AND grantee LIKE '%rol_cs_cajero%';

-- P92. ¿Qué diferencia hay entre hash y cifrado?
-- R:   Hash (SHA2, bcrypt) es de UNA vía: no se puede devolver al original; sirve para
--      contraseñas. Cifrado (AES) es de DOS vías: con la llave se recupera el dato; sirve para
--      datos que hay que volver a leer.
SELECT SHA2('Cajero123', 256) AS hash_no_se_puede_devolver;
SET @llave   = SHA2('llave-secreta-de-practica', 256);
SET @cifrado = AES_ENCRYPT('3001234567', @llave);
SELECT HEX(@cifrado)                                  AS cifrado,
       CAST(AES_DECRYPT(@cifrado, @llave) AS CHAR)    AS descifrado_con_llave,
       AES_DECRYPT(@cifrado, SHA2('otra llave', 256)) AS con_llave_equivocada;   -- NULL

-- P93. Si el hash no se puede descifrar, ¿cómo se verifica una contraseña?
-- R:   Se le saca el hash a lo que la persona escribe y se COMPARA con el hash guardado.
SET @guardado = SHA2('Cajero123', 256);
SELECT SHA2('Cajero123', 256) = @guardado AS clave_correcta,     -- 1
       SHA2('Cajero124', 256) = @guardado AS clave_incorrecta;   -- 0

-- P94. ¿Qué es la sal y por qué bcrypt es mejor que SHA2?
-- R:   Sal = un texto distinto por usuario que se agrega antes del hash, para que la misma clave
--      no dé el mismo hash. bcrypt trae la sal incluida y es LENTO a propósito, así el atacante
--      no puede probar millones de claves por segundo.
SELECT SHA2('Cajero123', 256) = SHA2('Cajero123', 256) AS sin_sal_son_iguales;   -- 1
SELECT id_usuario, SHA2(CONCAT(documento, 'Cajero123'), 256) AS misma_clave_con_sal
  FROM usuarios WHERE id_usuario IN (2, 4);                                       -- distintos

-- P95. ¿Cómo se saca y se restaura una copia de seguridad?
-- R:   Con mysqldump desde CMD (no dentro de mysql>). --routines y --triggers incluyen
--      procedimientos y triggers; --single-transaction copia sin bloquear la tienda.
--        cd "C:\Program Files\MySQL\MySQL Server 8.4\bin"
--        mysqldump -u root -p --routines --triggers --single-transaction controlstore_sena > C:\respaldos\controlstore_sena.sql
--        mysql -u root -p -e "CREATE DATABASE controlstore_sena_restaurada"
--        mysql -u root -p controlstore_sena_restaurada < C:\respaldos\controlstore_sena.sql
SELECT COUNT(*) AS rutinas_que_se_perderian_sin_routines
  FROM information_schema.routines WHERE routine_schema = 'controlstore_sena';

-- P96. ¿Cómo se garantiza en la base que el sistema no se quede sin administrador?
-- R:   Con tres triggers sobre usuarios: BEFORE INSERT no deja crear un segundo administrador,
--      BEFORE UPDATE no deja inactivarlo, quitarle el rol ni dárselo a otro, y BEFORE DELETE no
--      deja borrarlo. Es la misma regla del prototipo (usuarios_servicio.js) y del diagrama de
--      clases (Autoservicio 1 ◆── 1 RolAdministrador). Un cajero sí se puede inactivar.
-- ERR> UPDATE usuarios SET activo = 0 WHERE id_usuario = 1;   -- ERROR 1644: no se puede inactivar al administrador
-- ERR> DELETE FROM usuarios WHERE id_usuario = 1;             -- ERROR 1644: no se puede eliminar al administrador
SELECT trigger_name, action_timing, event_manipulation
  FROM information_schema.triggers
 WHERE trigger_schema = 'controlstore_sena' AND trigger_name LIKE 'trg_usuarios_admin%';
START TRANSACTION;
  UPDATE usuarios SET activo = 0 WHERE id_usuario = 4;     -- cajero: sí se puede
  SELECT id_usuario, activo AS cajero_inactivo FROM usuarios WHERE id_usuario = 4;
ROLLBACK;


-- ===================================================================================================
-- LIMPIEZA: dejar todo como estaba
-- ===================================================================================================
DROP USER IF EXISTS 'cs_pregunta'@'localhost';
DROP ROLE IF EXISTS 'rol_cs_pregunta';
DROP DATABASE IF EXISTS controlstore_preguntas;
-- Los ROLLBACK deshacen los datos, pero no devuelven los números de AUTO_INCREMENT que se
-- usaron. Con = 1, cada contador vuelve a seguir al último id real.
ALTER TABLE categorias    AUTO_INCREMENT = 1;
ALTER TABLE detalle_venta AUTO_INCREMENT = 1;
ALTER TABLE log_auditoria AUTO_INCREMENT = 1;
