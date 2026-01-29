-- AlterTable: newsletter_items.imageUrl de TEXT a LONGTEXT para guardar imágenes en base64
ALTER TABLE `newsletter_items` MODIFY COLUMN `imageUrl` LONGTEXT NULL;
