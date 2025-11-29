-- Script SQL para insertar usuarios
-- NOTA: Las contraseñas deben estar hasheadas con bcryptjs. Este script usa contraseñas de ejemplo.
-- IMPORTANTE: Cambiar las contraseñas después de la inserción por seguridad.

-- Contraseña por defecto: "password123" (debe estar hasheada con bcryptjs)
-- Para generar hash real, ejecutar: node scripts/generate_password_hash.js
-- Hash de ejemplo para "password123": $2a$10$UM8ZRMWozTqVaDAxI1r0qeMv1VbCIzFTI2nMdObG8oW9RSxx/3RK2 (usar hash generado)

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
    '$2a$10$UM8ZRMWozTqVaDAxI1r0qeMv1VbCIzFTI2nMdObG8oW9RSxx/3RK2', -- Hash para "password123" - Cambiar por hash real si usas otra contraseña
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
    '$2b$10$rOzJqZqZqZqZqZqZqZqZqO', -- Cambiar por hash real de la contraseña
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
    '$2b$10$rOzJqZqZqZqZqZqZqZqZqO', -- Cambiar por hash real de la contraseña
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
    '$2b$10$rOzJqZqZqZqZqZqZqZqZqO', -- Cambiar por hash real de la contraseña
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
    '$2b$10$rOzJqZqZqZqZqZqZqZqZqO', -- Cambiar por hash real de la contraseña
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
-- Repartidor de Cilindros (usuario prueba mencionado en el código)
(
    UUID(),
    'usuario',
    'prueba',
    '',
    'usuario.prueba@gaslp.com',
    '$2b$10$rOzJqZqZqZqZqZqZqZqZqO', -- Cambiar por hash real de la contraseña
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
-- Repartidor de Pipas (MARTIN SAN mencionado en el código)
(
    UUID(),
    'MARTIN',
    'SAN',
    '',
    'martin.san@gaslp.com',
    '$2b$10$rOzJqZqZqZqZqZqZqZqZqO', -- Cambiar por hash real de la contraseña
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
-- Repartidor de Pipas (Sergio Sanguinetti mencionado en el código)
(
    UUID(),
    'Sergio',
    'Sanguinetti',
    '',
    'sergio.sanguinetti@gaslp.com',
    '$2b$10$rOzJqZqZqZqZqZqZqZqZqO', -- Cambiar por hash real de la contraseña
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

-- Verificar que se insertaron correctamente
SELECT 
    id,
    nombres,
    apellido_paterno,
    apellido_materno,
    email,
    rol,
    tipo_repartidor,
    estado
FROM usuarios
ORDER BY rol, nombres;

-- NOTA IMPORTANTE SOBRE CONTRASEÑAS:
-- Las contraseñas en este script usan el hash de "password123" como ejemplo.
-- Para generar hashes reales, ejecuta: node scripts/generate_password_hash.js
-- O usa Node.js directamente:
-- const bcrypt = require('bcryptjs');
-- const salt = await bcrypt.genSalt(10);
-- const hash = await bcrypt.hash('password123', salt);
-- console.log(hash);
--
-- Contraseña por defecto en este script: "password123"
-- Hash incluido: $2a$10$UM8ZRMWozTqVaDAxI1r0qeMv1VbCIzFTI2nMdObG8oW9RSxx/3RK2


