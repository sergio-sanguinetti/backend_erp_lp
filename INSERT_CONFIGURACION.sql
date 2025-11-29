-- SQL para insertar la primera fila de configuración
-- Ejecutar este SQL en phpMyAdmin o tu cliente MySQL

-- Primero, eliminar la tabla si existe (opcional, solo si quieres empezar desde cero)
-- DROP TABLE IF EXISTS `configuraciones`;

-- Crear la tabla si no existe
CREATE TABLE IF NOT EXISTS `configuraciones` (
    `id` VARCHAR(191) NOT NULL,
    `precio_por_litro_gas_lp` DOUBLE NOT NULL DEFAULT 18.50,
    `precio_por_kg` DOUBLE NOT NULL DEFAULT 18.50,
    `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fecha_modificacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Insertar la única fila de configuración
-- Si ya existe una fila, primero elimínala con: DELETE FROM `configuraciones`;
INSERT INTO `configuraciones` (
    `id`, 
    `precio_por_litro_gas_lp`, 
    `precio_por_kg`, 
    `fecha_creacion`, 
    `fecha_modificacion`, 
    `created_at`, 
    `updated_at`
) VALUES (
    UUID(), 
    18.50, 
    18.50, 
    NOW(), 
    NOW(), 
    NOW(), 
    NOW()
);



