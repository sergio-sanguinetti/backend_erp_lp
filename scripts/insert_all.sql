-- Script SQL completo para insertar datos iniciales
-- Ejecutar en este orden:
-- 1. Categorías de productos
-- 2. Productos
-- 3. Usuarios

-- ============================================
-- 1. INSERTAR CATEGORÍAS DE PRODUCTOS
-- ============================================
INSERT INTO categorias_producto (
    id,
    nombre,
    codigo,
    descripcion,
    activa,
    fecha_creacion,
    fecha_modificacion,
    created_at,
    updated_at
) VALUES
(
    UUID(),
    'Gas LP',
    'gas_lp',
    'Productos relacionados con gas licuado de petróleo por litro',
    TRUE,
    NOW(),
    NOW(),
    NOW(),
    NOW()
),
(
    UUID(),
    'Cilindros',
    'cilindros',
    'Cilindros de gas en diferentes capacidades (10kg, 20kg, 30kg)',
    TRUE,
    NOW(),
    NOW(),
    NOW(),
    NOW()
),
(
    UUID(),
    'Tanques Nuevos',
    'tanques_nuevos',
    'Tanques nuevos de gas en diferentes capacidades',
    TRUE,
    NOW(),
    NOW(),
    NOW(),
    NOW()
);

-- ============================================
-- 2. INSERTAR PRODUCTOS
-- ============================================
-- Obtener los IDs de las categorías
SET @categoria_gas_lp = (SELECT id FROM categorias_producto WHERE codigo = 'gas_lp' LIMIT 1);
SET @categoria_cilindros = (SELECT id FROM categorias_producto WHERE codigo = 'cilindros' LIMIT 1);
SET @categoria_tanques_nuevos = (SELECT id FROM categorias_producto WHERE codigo = 'tanques_nuevos' LIMIT 1);

INSERT INTO productos (
    id,
    nombre,
    categoria_id,
    precio,
    unidad,
    descripcion,
    cantidad_kilos,
    activo,
    sede_id,
    fecha_creacion,
    fecha_modificacion,
    created_at,
    updated_at
) VALUES
-- Producto GAS LP
(
    'b9d63c0e-22b5-4022-a359-72657bc127a4',
    'GASLP',
    @categoria_gas_lp,
    16.50,
    'L',
    'Gas licuado de petróleo por litro',
    NULL,
    TRUE,
    NULL,
    NOW(),
    NOW(),
    NOW(),
    NOW()
),
-- Cilindros
(
    UUID(),
    'CIL 10 KG',
    @categoria_cilindros,
    185.00,
    'KG',
    'Cilindro de gas de 10 kilogramos',
    10.00,
    TRUE,
    NULL,
    NOW(),
    NOW(),
    NOW(),
    NOW()
),
(
    UUID(),
    'CIL 20 KG',
    @categoria_cilindros,
    370.00,
    'KG',
    'Cilindro de gas de 20 kilogramos',
    20.00,
    TRUE,
    NULL,
    NOW(),
    NOW(),
    NOW(),
    NOW()
),
(
    UUID(),
    'CIL 30 KG',
    @categoria_cilindros,
    555.00,
    'KG',
    'Cilindro de gas de 30 kilogramos',
    30.00,
    TRUE,
    NULL,
    NOW(),
    NOW(),
    NOW(),
    NOW()
),
-- Tanques Nuevos
(
    UUID(),
    'CIL 10 KG NUEVO',
    @categoria_tanques_nuevos,
    1500.00,
    'PZA',
    'Tanque nuevo de 10 kilogramos',
    NULL,
    TRUE,
    NULL,
    NOW(),
    NOW(),
    NOW(),
    NOW()
),
(
    UUID(),
    'CIL 20 KG NUEVO',
    @categoria_tanques_nuevos,
    1700.00,
    'PZA',
    'Tanque nuevo de 20 kilogramos',
    NULL,
    TRUE,
    NULL,
    NOW(),
    NOW(),
    NOW(),
    NOW()
),
(
    UUID(),
    'CIL 30 KG NUEVO',
    @categoria_tanques_nuevos,
    2200.00,
    'PZA',
    'Tanque nuevo de 30 kilogramos',
    NULL,
    TRUE,
    NULL,
    NOW(),
    NOW(),
    NOW(),
    NOW()
);

-- ============================================
-- 3. INSERTAR USUARIOS
-- ============================================
-- NOTA: Las contraseñas deben estar hasheadas con bcryptjs
-- Contraseña por defecto sugerida: "password123"
-- Para generar hash real, ejecutar: node scripts/generate_password_hash.js
-- O usar: const bcrypt = require('bcryptjs'); const salt = await bcrypt.genSalt(10); const hash = await bcrypt.hash('password123', salt);

INSERT INTO usuarios (
    id,
    nombres,
    apellido_paterno,
    apellido_materno,
    email,
    password,
    telefono,
    rol,
    tipo_repartidor,
    estado,
    sede,
    two_factor_secret,
    is_two_factor_enabled,
    fecha_registro,
    created_at,
    updated_at
) VALUES
-- Super Administrador
(
    UUID(),
    'Admin',
    'Sistema',
    '',
    'admin@gaslp.com',
    '$2a$10$UM8ZRMWozTqVaDAxI1r0qeMv1VbCIzFTI2nMdObG8oW9RSxx/3RK2', -- Hash para "password123" - ⚠️ CAMBIAR si usas otra contraseña
    '5551234567',
    'superAdministrador',
    NULL,
    'activo',
    NULL,
    NULL,
    FALSE,
    NOW(),
    NOW(),
    NOW()
),
-- Administrador
(
    UUID(),
    'Juan',
    'Pérez',
    'García',
    'juan.perez@gaslp.com',
    '$2a$10$UM8ZRMWozTqVaDAxI1r0qeMv1VbCIzFTI2nMdObG8oW9RSxx/3RK2', -- Hash para "password123" - ⚠️ CAMBIAR si usas otra contraseña
    '5552345678',
    'administrador',
    NULL,
    'activo',
    NULL,
    NULL,
    FALSE,
    NOW(),
    NOW(),
    NOW()
),
-- Gestor
(
    UUID(),
    'María',
    'González',
    'López',
    'maria.gonzalez@gaslp.com',
    '$2a$10$UM8ZRMWozTqVaDAxI1r0qeMv1VbCIzFTI2nMdObG8oW9RSxx/3RK2', -- Hash para "password123" - ⚠️ CAMBIAR si usas otra contraseña
    '5553456789',
    'gestor',
    NULL,
    'activo',
    NULL,
    NULL,
    FALSE,
    NOW(),
    NOW(),
    NOW()
),
-- Repartidor de Pipas
(
    UUID(),
    'Carlos',
    'Rodríguez',
    'Martínez',
    'carlos.rodriguez@gaslp.com',
    '$2a$10$UM8ZRMWozTqVaDAxI1r0qeMv1VbCIzFTI2nMdObG8oW9RSxx/3RK2', -- Hash para "password123" - ⚠️ CAMBIAR si usas otra contraseña
    '5554567890',
    'repartidor',
    'pipas',
    'activo',
    NULL,
    NULL,
    FALSE,
    NOW(),
    NOW(),
    NOW()
),
-- Repartidor de Cilindros
(
    UUID(),
    'Ana',
    'Sánchez',
    'Hernández',
    'ana.sanchez@gaslp.com',
    '$2a$10$UM8ZRMWozTqVaDAxI1r0qeMv1VbCIzFTI2nMdObG8oW9RSxx/3RK2', -- Hash para "password123" - ⚠️ CAMBIAR si usas otra contraseña
    '5555678901',
    'repartidor',
    'cilindros',
    'activo',
    NULL,
    NULL,
    FALSE,
    NOW(),
    NOW(),
    NOW()
),
-- Repartidor de Cilindros (usuario prueba)
(
    UUID(),
    'usuario',
    'prueba',
    '',
    'usuario.prueba@gaslp.com',
    '$2a$10$UM8ZRMWozTqVaDAxI1r0qeMv1VbCIzFTI2nMdObG8oW9RSxx/3RK2', -- Hash para "password123" - ⚠️ CAMBIAR si usas otra contraseña
    '5556789012',
    'repartidor',
    'cilindros',
    'activo',
    NULL,
    NULL,
    FALSE,
    NOW(),
    NOW(),
    NOW()
),
-- Repartidor de Cilindros (MARTIN SAN)
(
    UUID(),
    'MARTIN',
    'SAN',
    '',
    'martin.san@gaslp.com',
    '$2a$10$UM8ZRMWozTqVaDAxI1r0qeMv1VbCIzFTI2nMdObG8oW9RSxx/3RK2', -- Hash para "password123" - ⚠️ CAMBIAR si usas otra contraseña
    '5557890123',
    'repartidor',
    'cilindros',
    'activo',
    NULL,
    NULL,
    FALSE,
    NOW(),
    NOW(),
    NOW()
),
-- Repartidor de Pipas (Sergio Sanguinetti)
(
    UUID(),
    'Sergio',
    'Sanguinetti',
    '',
    'sergio.sanguinetti@gaslp.com',
    '$2a$10$UM8ZRMWozTqVaDAxI1r0qeMv1VbCIzFTI2nMdObG8oW9RSxx/3RK2', -- Hash para "password123" - ⚠️ CAMBIAR si usas otra contraseña
    '5558901234',
    'repartidor',
    'pipas',
    'activo',
    NULL,
    NULL,
    FALSE,
    NOW(),
    NOW(),
    NOW()
);

-- ============================================
-- VERIFICACIÓN
-- ============================================
SELECT 'Categorías insertadas:' AS tipo, COUNT(*) AS cantidad FROM categorias_producto
UNION ALL
SELECT 'Productos insertados:', COUNT(*) FROM productos
UNION ALL
SELECT 'Usuarios insertados:', COUNT(*) FROM usuarios;

-- Ver productos con sus categorías
SELECT 
    p.nombre AS producto,
    c.nombre AS categoria,
    p.precio,
    p.unidad,
    p.cantidad_kilos,
    p.activo
FROM productos p
INNER JOIN categorias_producto c ON p.categoria_id = c.id
ORDER BY c.nombre, p.nombre;

-- Ver usuarios
SELECT 
    nombres,
    apellido_paterno,
    email,
    rol,
    tipo_repartidor,
    estado
FROM usuarios
ORDER BY rol, nombres;

-- ============================================
-- INSERTAR TIPOS DE FORMAS DE PAGO
-- ============================================
INSERT INTO tipos_forma_pago (
    id,
    codigo,
    nombre,
    descripcion,
    activo,
    icono,
    color,
    orden,
    fecha_creacion,
    fecha_modificacion,
    created_at,
    updated_at
) VALUES
(
    UUID(),
    'efectivo',
    'Efectivo',
    'Pago en efectivo',
    TRUE,
    'AttachMoney',
    'success',
    1,
    NOW(),
    NOW(),
    NOW(),
    NOW()
),
(
    UUID(),
    'terminal',
    'Terminal de Pago',
    'Pago con terminal punto de venta',
    TRUE,
    'CreditCard',
    'primary',
    2,
    NOW(),
    NOW(),
    NOW(),
    NOW()
),
(
    UUID(),
    'transferencia',
    'Transferencia Bancaria',
    'Pago mediante transferencia bancaria',
    TRUE,
    'AccountBalance',
    'info',
    3,
    NOW(),
    NOW(),
    NOW(),
    NOW()
),
(
    UUID(),
    'cheque',
    'Cheque',
    'Pago mediante cheque',
    TRUE,
    'Receipt',
    'warning',
    4,
    NOW(),
    NOW(),
    NOW(),
    NOW()
),
(
    UUID(),
    'deposito',
    'Depósito Bancario',
    'Pago mediante depósito bancario',
    TRUE,
    'AccountBalance',
    'secondary',
    5,
    NOW(),
    NOW(),
    NOW(),
    NOW()
),
(
    UUID(),
    'credito',
    'Crédito',
    'Pago a crédito',
    TRUE,
    'Payment',
    'error',
    6,
    NOW(),
    NOW(),
    NOW(),
    NOW()
);


