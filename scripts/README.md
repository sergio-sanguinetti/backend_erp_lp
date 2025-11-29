# Scripts SQL para Insertar Datos Iniciales

Este directorio contiene scripts SQL para insertar datos iniciales en la base de datos.

## Archivos

1. **insert_categorias_producto.sql** - Inserta las categorías de productos (GAS LP, Cilindros, Tanques Nuevos)
2. **insert_productos.sql** - Inserta productos de ejemplo (requiere que las categorías existan)
3. **insert_usuarios.sql** - Inserta usuarios de ejemplo con diferentes roles
4. **insert_all.sql** - Script completo que ejecuta todo en orden
5. **generate_password_hash.js** - Script Node.js para generar hashes de contraseñas

## Orden de Ejecución

### Opción 1: Ejecutar todo de una vez
```bash
mysql -u tu_usuario -p tu_base_de_datos < scripts/insert_all.sql
```

### Opción 2: Ejecutar por separado
```bash
# 1. Primero las categorías
mysql -u tu_usuario -p tu_base_de_datos < scripts/insert_categorias_producto.sql

# 2. Luego los productos
mysql -u tu_usuario -p tu_base_de_datos < scripts/insert_productos.sql

# 3. Finalmente los usuarios
mysql -u tu_usuario -p tu_base_de_datos < scripts/insert_usuarios.sql
```

## Generar Hashes de Contraseñas

**IMPORTANTE**: Las contraseñas en los scripts SQL son placeholders. Debes generar hashes reales antes de insertar usuarios.

### Opción 1: Usar el script Node.js (RECOMENDADO)
```bash
cd backend_erp_lp
node scripts/generate_password_hash.js
```

Este script generará un hash usando `bcryptjs` (que es lo que usa el backend). Copia el hash generado y reemplázalo en los scripts SQL.

### Opción 2: Usar Node.js directamente
```javascript
const bcrypt = require('bcryptjs');
const salt = await bcrypt.genSalt(10);
const hash = await bcrypt.hash('tu_contraseña', salt);
console.log(hash);
```

### Opción 3: Usar el script createTestUser.js
```bash
npm run seed:user
```

Este script crea un usuario de prueba directamente en la base de datos.

### Opción 4: Usar la API del backend
Puedes crear usuarios a través de la API del backend que automáticamente hasheará las contraseñas usando el endpoint `/api/usuarios/register`.

## Datos que se Insertan

### Categorías de Productos
- Gas LP (código: `gas_lp`)
- Cilindros (código: `cilindros`)
- Tanques Nuevos (código: `tanques_nuevos`)

### Productos
- **GAS LP**: GASLP (ID específico: `b9d63c0e-22b5-4022-a359-72657bc127a4`)
- **Cilindros**: CIL 10 KG, CIL 20 KG, CIL 30 KG
- **Tanques Nuevos**: CIL 10 KG NUEVO, CIL 20 KG NUEVO, CIL 30 KG NUEVO

### Usuarios
- 1 Super Administrador
- 1 Administrador
- 1 Gestor
- 5 Repartidores (incluyendo los mencionados en el código: usuario prueba, MARTIN SAN, Sergio Sanguinetti)

## Notas Importantes

1. **Contraseñas**: Todos los usuarios tienen contraseñas placeholder. Debes generar hashes reales antes de usar.
2. **IDs**: El producto GASLP tiene un ID específico que se usa en el código. No cambiar.
3. **Categorías**: Los productos dependen de las categorías, por lo que deben insertarse primero.
4. **UUIDs**: La mayoría de IDs se generan automáticamente con UUID() excepto el producto GASLP.

## Verificar Inserciones

Después de ejecutar los scripts, puedes verificar con:

```sql
-- Ver categorías
SELECT * FROM categorias_producto;

-- Ver productos con categorías
SELECT 
    p.nombre,
    c.nombre AS categoria,
    p.precio,
    p.unidad
FROM productos p
INNER JOIN categorias_producto c ON p.categoria_id = c.id;

-- Ver usuarios
SELECT 
    nombres,
    apellido_paterno,
    email,
    rol,
    tipo_repartidor
FROM usuarios;
```


