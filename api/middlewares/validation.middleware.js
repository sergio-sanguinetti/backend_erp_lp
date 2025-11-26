const { body } = require('express-validator');

exports.validateRegistration = [
    body('nombres')
        .trim()
        .notEmpty().withMessage('Los nombres son obligatorios.'),
    body('apellidoPaterno')
        .trim()
        .notEmpty().withMessage('El apellido paterno es obligatorio.'),
    body('apellidoMaterno')
        .trim()
        .notEmpty().withMessage('El apellido materno es obligatorio.'),
    body('email')
        .isEmail().withMessage('Debe ser un email válido.')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
    body('rol')
        .optional()
        .isIn(['superAdministrador', 'administrador', 'gestor', 'repartidor'])
        .withMessage('El rol no es válido.'),
    body('estado')
        .optional()
        .isIn(['activo', 'inactivo'])
        .withMessage('El estado debe ser activo o inactivo.'),
];

exports.validateProducto = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre del producto es obligatorio.')
        .isLength({ max: 255 }).withMessage('El nombre no puede exceder 255 caracteres.'),
    body('categoria')
        .isIn(['gas_lp', 'cilindros', 'tanques_nuevos', 'gas-lp', 'tanques-nuevos'])
        .withMessage('La categoría debe ser: gas_lp (o gas-lp), cilindros, o tanques_nuevos (o tanques-nuevos).')
        .custom((value) => {
            // Convertir guiones a guiones bajos para coincidir con Prisma
            const normalized = value.replace(/-/g, '_');
            if (!['gas_lp', 'cilindros', 'tanques_nuevos'].includes(normalized)) {
                throw new Error('Categoría inválida');
            }
            return true;
        }),
    body('precio')
        .custom((value) => {
            const numValue = typeof value === 'string' ? parseFloat(value) : value;
            if (isNaN(numValue) || numValue < 0) {
                throw new Error('El precio debe ser un número positivo.');
            }
            return true;
        })
        .customSanitizer((value) => {
            return typeof value === 'string' ? parseFloat(value) : value;
        }),
    body('unidad')
        .trim()
        .notEmpty().withMessage('La unidad es obligatoria.')
        .isLength({ max: 50 }).withMessage('La unidad no puede exceder 50 caracteres.'),
    body('descripcion')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres.'),
    body('activo')
        .optional()
        .custom((value) => {
            if (typeof value === 'string') {
                return value === 'true' || value === 'false';
            }
            return typeof value === 'boolean';
        })
        .withMessage('El campo activo debe ser un booleano.')
        .customSanitizer((value) => {
            if (typeof value === 'string') {
                return value === 'true';
            }
            return value;
        }),
    body('sedeId')
        .optional({ nullable: true, checkFalsy: true })
        .custom((value) => {
            // Los productos del catálogo no tienen sede asignada (son para todas las sedes)
            // Permitir null, undefined, o cadena vacía sin validar
            if (value === null || value === undefined || value === '') {
                return true; // Permitir valores vacíos - productos sin sede
            }
            // Si se proporciona un valor, debe ser un UUID válido
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(value)) {
                throw new Error('El ID de sede debe ser un UUID válido.');
            }
            return true;
        })
        .customSanitizer((value) => {
            // Convertir cadenas vacías a null para que no se valide como UUID
            if (value === '' || value === null || value === undefined) {
                return null;
            }
            return value;
        }),
];