-- CreateTable
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

-- Insertar la fila inicial de configuración
INSERT INTO `configuraciones` (`id`, `precio_por_litro_gas_lp`, `precio_por_kg`, `fecha_creacion`, `fecha_modificacion`, `created_at`, `updated_at`)
VALUES (UUID(), 18.50, 18.50, NOW(), NOW(), NOW(), NOW());

