-- Script SQL para insertar categorías de productos
-- Ejecutar este script PRIMERO antes de insertar productos

-- Insertar categorías de productos
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
-- Categoría GAS LP
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
-- Categoría CILINDROS
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
-- Categoría TANQUES NUEVOS
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

-- Verificar que se insertaron correctamente
SELECT * FROM categorias_producto;



