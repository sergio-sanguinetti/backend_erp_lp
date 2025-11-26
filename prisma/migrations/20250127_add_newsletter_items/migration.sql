-- CreateTable
CREATE TABLE IF NOT EXISTS `newsletter_items` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('image', 'notification') NOT NULL,
    `title` VARCHAR(255) NULL,
    `content` TEXT NULL,
    `description` VARCHAR(500) NULL,
    `imageUrl` TEXT NULL,
    `fecha_vencimiento` DATETIME(3) NULL,
    `size` ENUM('small', 'medium', 'large') NULL DEFAULT 'medium',
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `usuario_creacion` VARCHAR(191) NULL,
    `usuario_modificacion` VARCHAR(191) NULL,
    `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fecha_modificacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

