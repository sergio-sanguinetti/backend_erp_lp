-- Migración manual: Permitir múltiples descuentos por repartidor
-- Ejecutar este SQL directamente en la base de datos

-- 1. Eliminar la restricción unique de repartidor_id si existe
ALTER TABLE `descuentos_repartidor` 
DROP INDEX IF EXISTS `repartidor_id`;

-- 2. Agregar columnas nombre y descripcion si no existen
ALTER TABLE `descuentos_repartidor` 
ADD COLUMN IF NOT EXISTS `nombre` VARCHAR(255) NULL AFTER `repartidor_id`,
ADD COLUMN IF NOT EXISTS `descripcion` VARCHAR(500) NULL AFTER `nombre`;

-- Nota: Si las columnas ya existen, este comando no hará nada
-- Si necesitas verificar primero, puedes usar:
-- SHOW COLUMNS FROM `descuentos_repartidor` LIKE 'nombre';

