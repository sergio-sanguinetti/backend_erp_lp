-- AlterTable: agregar descuento por línea en pedido_productos
ALTER TABLE `pedido_productos` ADD COLUMN `descuento` VARCHAR(100) NULL;
ALTER TABLE `pedido_productos` ADD COLUMN `descuento_monto` DOUBLE NULL;
