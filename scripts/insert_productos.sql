-- Script SQL para insertar productos
-- IMPORTANTE: Ejecutar primero insert_categorias_producto.sql para tener las categorías

-- Obtener los IDs de las categorías (ajustar según tus IDs reales)
SET @categoria_gas_lp = (SELECT id FROM categorias_producto WHERE codigo = 'gas_lp' LIMIT 1);
SET @categoria_cilindros = (SELECT id FROM categorias_producto WHERE codigo = 'cilindros' LIMIT 1);
SET @categoria_tanques_nuevos = (SELECT id FROM categorias_producto WHERE codigo = 'tanques_nuevos' LIMIT 1);

-- Insertar productos
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
-- Producto GAS LP (el único permitido de esta categoría)
(
    'b9d63c0e-22b5-4022-a359-72657bc127a4', -- ID específico mencionado en el código
    'GASLP',
    @categoria_gas_lp,
    16.50, -- Precio por litro
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
    185.00, -- Precio calculado: 18.5 * 10
    'KG',
    'Cilindro de gas de 10 kilogramos',
    10.00, -- Cantidad de kilos
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
    370.00, -- Precio calculado: 18.5 * 20
    'KG',
    'Cilindro de gas de 20 kilogramos',
    20.00, -- Cantidad de kilos
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
    555.00, -- Precio calculado: 18.5 * 30
    'KG',
    'Cilindro de gas de 30 kilogramos',
    30.00, -- Cantidad de kilos
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

-- Verificar que se insertaron correctamente
SELECT 
    p.id,
    p.nombre,
    c.nombre AS categoria,
    p.precio,
    p.unidad,
    p.cantidad_kilos,
    p.activo
FROM productos p
INNER JOIN categorias_producto c ON p.categoria_id = c.id
ORDER BY c.nombre, p.nombre;



