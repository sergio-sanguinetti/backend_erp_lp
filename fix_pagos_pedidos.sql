-- Script para limpiar metodo_id inválidos en pagos_pedidos antes de agregar la foreign key

-- Primero, establecer a NULL todos los metodo_id que no existen en formas_pago
UPDATE pagos_pedidos pp
LEFT JOIN formas_pago fp ON pp.metodo_id = fp.id
SET pp.metodo_id = NULL
WHERE pp.metodo_id IS NOT NULL AND fp.id IS NULL;

-- Verificar que no queden metodo_id inválidos
SELECT COUNT(*) as registros_invalidos
FROM pagos_pedidos pp
LEFT JOIN formas_pago fp ON pp.metodo_id = fp.id
WHERE pp.metodo_id IS NOT NULL AND fp.id IS NULL;

