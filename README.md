# Backend ERP - Sistema de Usuarios

Backend para el sistema de gestión de usuarios con autenticación y autorización.

## Instalación

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno**
   Crear un archivo `.env` en la raíz del proyecto:
   ```env
   PORT=3001
   NODE_ENV=development
   DATABASE_URL="mysql://usuario:password@localhost:3306/backend_erp_lp"
   JWT_SECRET=tu_secreto_jwt_super_seguro
   JWT_EXPIRES_IN=24h
   APP_NAME=Backend ERP
   ```
   
   **Nota**: Reemplaza `usuario`, `password` y `backend_erp_lp` con tus credenciales y nombre de base de datos de MySQL.

3. **Configurar la base de datos**
   
   **Opción A: Usar `db push` (Recomendado si no tienes permisos para crear bases de datos)**
   ```bash
   # Generar el cliente de Prisma
   npx prisma generate
   
   # Sincronizar el schema con la base de datos (crea las tablas)
   npx prisma db push
   ```
   
   **Opción B: Usar migraciones (Requiere permisos para crear bases de datos)**
   ```bash
   # Generar el cliente de Prisma
   npx prisma generate
   
   # Ejecutar las migraciones para crear las tablas
   npx prisma migrate dev --name init
   ```
   
   **Nota**: Si obtienes un error sobre "shadow database", usa la Opción A (`db push`). Este comando sincroniza el schema directamente sin necesidad de crear bases de datos adicionales.

4. **Iniciar el servidor**
   ```bash
   npm start
   # o para desarrollo
   npm run dev
   ```

## Estructura del Proyecto

```
backend_erp_lp/
├── api/
│   ├── controllers/     # Controladores de la API
│   ├── middlewares/     # Middlewares de autenticación y validación
│   └── routes/          # Rutas de la API
├── config/              # Configuración de la aplicación
├── prisma/              # Schema y migraciones de Prisma
│   └── schema.prisma    # Schema de la base de datos
├── services/            # Lógica de negocio
├── utils/               # Utilidades y helpers
└── app.js               # Archivo principal de la aplicación
```

## API Endpoints

### Usuarios
- `POST /api/usuarios/register` - Registrar nuevo usuario
- `POST /api/usuarios/login` - Iniciar sesión
- `GET /api/usuarios/profile` - Obtener perfil del usuario
- `POST /api/usuarios/2fa/setup` - Configurar 2FA
- `POST /api/usuarios/2fa/enable` - Habilitar 2FA
- `POST /api/usuarios/2fa/disable` - Deshabilitar 2FA

### Administración de Usuarios (Solo Administradores)
- `GET /api/usuarios/admin/all` - Obtener todos los usuarios
- `GET /api/usuarios/admin/:id` - Obtener usuario por ID
- `PUT /api/usuarios/admin/:id` - Actualizar usuario
- `DELETE /api/usuarios/admin/:id` - Eliminar usuario
- `GET /api/usuarios/admin/stats/usuarios` - Estadísticas de usuarios

## Base de Datos

El sistema utiliza **MySQL** como base de datos con **Prisma** como ORM. Asegúrate de tener MySQL instalado y ejecutándose.

### Configuración de MySQL

1. Instala MySQL en tu sistema
2. Crea una base de datos:
   ```sql
   CREATE DATABASE backend_erp_lp;
   ```
3. Configura la URL de conexión en el archivo `.env`:
   ```
   DATABASE_URL="mysql://usuario:password@localhost:3306/backend_erp_lp"
   ```

### Prisma

Este proyecto usa Prisma como ORM. Los comandos más útiles son:

- `npx prisma generate` - Genera el cliente de Prisma (ejecutar después de cambios en schema.prisma)
- `npx prisma db push` - Sincroniza el schema con la base de datos sin migraciones (recomendado si no tienes permisos para crear bases de datos)
- `npx prisma migrate dev` - Crea y aplica migraciones (requiere permisos para crear shadow database)
- `npx prisma studio` - Abre Prisma Studio para visualizar y editar datos

**Nota importante**: Si estás usando un hosting compartido o un usuario de MySQL con permisos limitados, usa `prisma db push` en lugar de `prisma migrate dev`. El comando `db push` sincroniza el schema directamente sin necesidad de crear bases de datos adicionales.

### Modelos

#### Usuario
- `nombres`: String (requerido)
- `apellidoPaterno`: String (requerido)
- `apellidoMaterno`: String (requerido)
- `email`: String (requerido, único)
- `password`: String (requerido, mínimo 6 caracteres)
- `telefono`: String (opcional)
- `rol`: String (enum: proveedor, comprador, gestor, administrador, solicitante, cumplimiento, cuentas, auditor, seguridad, repartidor)
- `estado`: String (enum: activo, inactivo) - default: activo
- `sede`: String (opcional)
- `twoFactorSecret`: String (para 2FA)
- `isTwoFactorEnabled`: Boolean
- `fechaRegistro`: Date

## Seguridad

- **JWT**: Autenticación basada en tokens
- **bcrypt**: Hashing de contraseñas
- **Helmet**: Cabeceras de seguridad
- **CORS**: Configurado para permitir peticiones del frontend
- **Validación**: Validación de datos con express-validator

## Desarrollo

### Scripts Disponibles
- `npm start` - Iniciar servidor en producción
- `npm run dev` - Iniciar servidor en modo desarrollo con nodemon
- `npx prisma generate` - Generar el cliente de Prisma
- `npx prisma migrate dev` - Crear y aplicar migraciones
- `npx prisma studio` - Abrir Prisma Studio (interfaz visual para la BD)

### Variables de Entorno
- `PORT`: Puerto del servidor (default: 3001)
- `NODE_ENV`: Entorno de ejecución
- `DATABASE_URL`: URL de conexión a MySQL (formato: `mysql://usuario:password@host:puerto/database`)
- `JWT_SECRET`: Secreto para firmar JWT
- `JWT_EXPIRES_IN`: Tiempo de expiración del JWT
- `APP_NAME`: Nombre de la aplicación

## Notas Importantes

- El backend corre en el puerto 3001 por defecto
- CORS está habilitado para permitir peticiones del frontend
- Solo usuarios con rol de administrador pueden acceder a las rutas de administración
- Las contraseñas se hashean automáticamente antes de guardarse
- El sistema incluye autenticación de dos factores (2FA)
