const jwt = require('jsonwebtoken');
const Administrador = require('../models/Administrador');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_secreto';

// Middleware para verificar token JWT
const verificarToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                error: 'Acceso denegado',
                message: 'Token no proporcionado' 
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const admin = await Administrador.findByPk(decoded.id);

        if (!admin || !admin.activo) {
            return res.status(401).json({ 
                error: 'Token inválido',
                message: 'Administrador no encontrado o inactivo' 
            });
        }

        req.admin = admin;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Token expirado',
                message: 'Por favor inicia sesión nuevamente' 
            });
        }
        
        return res.status(401).json({ 
            error: 'Token inválido',
            message: 'No se pudo verificar la autenticación' 
        });
    }
};

// Middleware para verificar roles específicos
const verificarRole = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({ 
                error: 'No autenticado',
                message: 'Debe iniciar sesión primero' 
            });
        }

        if (!rolesPermitidos.includes(req.admin.role)) {
            return res.status(403).json({ 
                error: 'Acceso denegado',
                message: 'No tiene permisos suficientes para esta acción' 
            });
        }

        next();
    };
};

// Middleware para verificar si es superadmin
const verificarSuperAdmin = verificarRole('superadmin');

// Middleware para verificar admin o superadmin
const verificarAdmin = verificarRole('admin', 'superadmin');

module.exports = {
    verificarToken,
    verificarRole,
    verificarSuperAdmin,
    verificarAdmin
};