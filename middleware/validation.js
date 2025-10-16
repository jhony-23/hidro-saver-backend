const Joi = require('joi');

// Validación para registro de usuario
const validarUsuario = (req, res, next) => {
    const schema = Joi.object({
        nombre: Joi.string()
            .min(2)
            .max(50)
            .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
            .required()
            .messages({
                'string.empty': 'El nombre es obligatorio',
                'string.min': 'El nombre debe tener al menos 2 caracteres',
                'string.max': 'El nombre no puede exceder 50 caracteres',
                'string.pattern.base': 'El nombre solo puede contener letras y espacios'
            }),
        apellido: Joi.string()
            .min(2)
            .max(50)
            .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
            .required()
            .messages({
                'string.empty': 'El apellido es obligatorio',
                'string.min': 'El apellido debe tener al menos 2 caracteres',
                'string.max': 'El apellido no puede exceder 50 caracteres',
                'string.pattern.base': 'El apellido solo puede contener letras y espacios'
            }),
        dpi: Joi.string()
            .pattern(/^\d{13}$/)
            .required()
            .messages({
                'string.empty': 'El DPI es obligatorio',
                'string.pattern.base': 'El DPI debe tener exactamente 13 dígitos'
            }),
        sectorId: Joi.number()
            .integer()
            .positive()
            .required()
            .messages({
                'number.base': 'El sector debe ser un número',
                'number.integer': 'El sector debe ser un número entero',
                'number.positive': 'El sector debe ser un número positivo',
                'any.required': 'El sector es obligatorio'
            }),
        CodigoBarras: Joi.string()
            .pattern(/^CB-[A-Z0-9]{8}$/)
            .optional()
            .messages({
                'string.pattern.base': 'El código de barras debe tener el formato CB-XXXXXXXX'
            })
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Datos de entrada inválidos',
            message: error.details[0].message,
            details: error.details
        });
    }
    next();
};

// Validación para login de administrador
const validarLoginAdmin = (req, res, next) => {
    const schema = Joi.object({
        nombre: Joi.string()
            .min(3)
            .max(50)
            .required()
            .messages({
                'string.empty': 'El nombre de usuario es obligatorio',
                'string.min': 'El nombre debe tener al menos 3 caracteres'
            }),
        contraseña: Joi.string()
            .min(8)
            .required()
            .messages({
                'string.empty': 'La contraseña es obligatoria',
                'string.min': 'La contraseña debe tener al menos 8 caracteres'
            })
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Datos de entrada inválidos',
            message: error.details[0].message
        });
    }
    next();
};

// Validación para registro de administrador
const validarRegistroAdmin = (req, res, next) => {
    const schema = Joi.object({
        nombre: Joi.string()
            .min(3)
            .max(50)
            .alphanum()
            .required()
            .messages({
                'string.empty': 'El nombre de usuario es obligatorio',
                'string.min': 'El nombre debe tener al menos 3 caracteres',
                'string.max': 'El nombre no puede exceder 50 caracteres',
                'string.alphanum': 'El nombre solo puede contener letras y números'
            }),
        email: Joi.string()
            .email()
            .optional()
            .messages({
                'string.email': 'Debe ser un email válido'
            }),
        contraseña: Joi.string()
            .min(8)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .required()
            .messages({
                'string.empty': 'La contraseña es obligatoria',
                'string.min': 'La contraseña debe tener al menos 8 caracteres',
                'string.pattern.base': 'La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial'
            }),
        role: Joi.string()
            .valid('admin', 'superadmin')
            .optional()
            .default('admin')
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Datos de entrada inválidos',
            message: error.details[0].message
        });
    }
    next();
};

// Validación para pagos
const validarPago = (req, res, next) => {
    const schema = Joi.object({
        CodigoBarras: Joi.string()
            .pattern(/^CB-[A-Z0-9]{8}$/)
            .optional()
            .messages({
                'string.pattern.base': 'El código de barras debe tener el formato CB-XXXXXXXX'
            }),
        codigoBarras: Joi.string()
            .pattern(/^CB-[A-Z0-9]{8}$/)
            .optional()
            .messages({
                'string.pattern.base': 'El código de barras debe tener el formato CB-XXXXXXXX'
            }),
        mes: Joi.string()
            .pattern(/^\d{4}-(0[1-9]|1[0-2])$/)
            .required()
            .messages({
                'string.empty': 'El mes es obligatorio',
                'string.pattern.base': 'El mes debe tener el formato YYYY-MM'
            }),
        monto: Joi.number()
            .positive()
            .precision(2)
            .min(1)
            .max(10000)
            .required()
            .messages({
                'number.base': 'El monto debe ser un número',
                'number.positive': 'El monto debe ser positivo',
                'number.min': 'El monto mínimo es Q1.00',
                'number.max': 'El monto máximo es Q10,000.00',
                'any.required': 'El monto es obligatorio'
            })
    });

    // Validar que al menos uno de los códigos de barras esté presente
    const { CodigoBarras, codigoBarras } = req.body;
    if (!CodigoBarras && !codigoBarras) {
        return res.status(400).json({
            error: 'Datos de entrada inválidos',
            message: 'El código de barras es obligatorio'
        });
    }

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Datos de entrada inválidos',
            message: error.details[0].message
        });
    }
    next();
};

// Validación para sector
const validarSector = (req, res, next) => {
    const schema = Joi.object({
        NombreSector: Joi.string()
            .min(3)
            .max(100)
            .optional()
            .messages({
                'string.min': 'El nombre debe tener al menos 3 caracteres',
                'string.max': 'El nombre no puede exceder 100 caracteres'
            }),
        nombre: Joi.string()
            .min(3)
            .max(100)
            .optional()
            .messages({
                'string.min': 'El nombre debe tener al menos 3 caracteres',
                'string.max': 'El nombre no puede exceder 100 caracteres'
            }),
        Descripcion: Joi.string()
            .max(500)
            .optional()
            .messages({
                'string.max': 'La descripción no puede exceder 500 caracteres'
            }),
        descripcion: Joi.string()
            .max(500)
            .optional()
            .messages({
                'string.max': 'La descripción no puede exceder 500 caracteres'
            })
    });

    // Validar que al menos un nombre esté presente
    const { NombreSector, nombre } = req.body;
    if (!NombreSector && !nombre) {
        return res.status(400).json({
            error: 'Datos de entrada inválidos',
            message: 'El nombre del sector es obligatorio'
        });
    }

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Datos de entrada inválidos',
            message: error.details[0].message
        });
    }
    next();
};

module.exports = {
    validarUsuario,
    validarLoginAdmin,
    validarRegistroAdmin,
    validarPago,
    validarSector
};