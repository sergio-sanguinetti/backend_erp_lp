-- CreateTable
CREATE TABLE IF NOT EXISTS `productos` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(255) NOT NULL,
    `categoria` ENUM('gas_lp', 'cilindros', 'tanques_nuevos') NOT NULL,
    `precio` DOUBLE NOT NULL,
    `unidad` VARCHAR(50) NOT NULL,
    `descripcion` VARCHAR(500) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `sede_id` VARCHAR(191) NULL,
    `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fecha_modificacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `productos_sede_id_idx`(`sede_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `productos` ADD CONSTRAINT `productos_sede_id_fkey` FOREIGN KEY (`sede_id`) REFERENCES `sedes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

