# Baseline de migraciones (base de datos no vacía)

Si obtienes **P3005: The database schema is not empty**, la base ya tiene tablas pero Prisma no tiene registro de qué migraciones se aplicaron. Hay que hacer "baseline" y luego aplicar la migración nueva.

## Opción A: Marcar migraciones anteriores como aplicadas y luego deploy

Ejecuta **en orden** (una vez cada una):

```powershell
npx prisma migrate resolve --applied "20250120_add_tipo_repartidor"
npx prisma migrate resolve --applied "20250126_add_productos"
npx prisma migrate resolve --applied "20250127_add_newsletter_items"
npx prisma migrate resolve --applied "20250128_add_configuraciones"
npx prisma migrate resolve --applied "20250128_newsletter_imageurl_longtext"
```

Después aplica la migración nueva (push_token):

```powershell
npx prisma migrate deploy
```

## Opción B: Solo añadir la columna push_token a mano

Si prefieres no tocar el historial de migraciones, ejecuta en MySQL:

```sql
ALTER TABLE `usuarios` ADD COLUMN `push_token` VARCHAR(500) NULL;
```

Luego marca esta migración como aplicada para que Prisma no intente ejecutarla después:

```powershell
npx prisma migrate resolve --applied "20250129_add_push_token"
```
