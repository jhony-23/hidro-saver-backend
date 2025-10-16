const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const Administrador = require('../models/Administrador');
const { validarLoginAdmin, validarRegistroAdmin } = require('../middleware/validation');
const { verificarToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');
require('dotenv').config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_secreto';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'tu_refresh_token_secreto';

// Rate limiting para login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 intentos por IP
    message: {
        error: 'Demasiados intentos de login',
        message: 'Has excedido el límite de intentos. Intenta de nuevo en 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting para registro
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // máximo 3 registros por IP por hora
    message: {
        error: 'Demasiados intentos de registro',
        message: 'Has excedido el límite de registros. Intenta de nuevo en 1 hora.'
    }
});

// Verificar si existen administradores - PARA EL FRONTEND
router.get('/check-admin', async (req, res) => {
    try {
        const adminCount = await Administrador.count();
        const hayAdmins = adminCount > 0;
        
        res.json({ 
            existenAdmins: hayAdmins,
            tipoLogin: hayAdmins ? 'normal' : 'setup',
            mensaje: hayAdmins ? 'Sistema configurado - Mostrar login normal' : 'Sistema sin configurar - Mostrar setup inicial',
            accion: hayAdmins ? 'Usa POST /auth/login' : 'Usa POST /auth/setup-admin'
        });
    } catch (error) {
        logger.error('Error al verificar administradores:', error);
        res.status(500).json({ 
            error: 'Error del servidor',
            message: 'No se pudo verificar el estado de administradores'
        });
    }
});

// ==================== CONFIGURACIÓN INICIAL ====================
// Configurar primer administrador (SOLO si no existe ninguno)
router.post('/setup-admin', registerLimiter, validarRegistroAdmin, async (req, res) => {
    try {
        // Verificar si ya existen administradores
        const adminCount = await Administrador.count();
        if (adminCount > 0) {
            return res.status(403).json({
                error: 'Sistema ya configurado',
                message: 'Ya existe al menos un administrador. Use la opción "Iniciar Sesión" en lugar de "Crear Primer Administrador".',
                accion: 'Cambiar a login normal'
            });
        }

        const { nombre, email, contraseña } = req.body;

        // Crear el primer administrador (siempre superadmin)
        const nuevoAdmin = await Administrador.create({
            nombre,
            username: nombre,
            email,
            password_hash: contraseña, // Se hasheará automáticamente en el hook
            role: 'superadmin', // Forzar superadmin para el primer admin
            activo: true
        });

        // Generar token inmediatamente
        const token = jwt.sign(
            { 
                id: nuevoAdmin.id, 
                nombre: nuevoAdmin.nombre, 
                role: nuevoAdmin.role 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        logger.info(`✅ Primer administrador configurado: ${nombre}`);

        res.status(201).json({
            success: true,
            message: 'Sistema configurado exitosamente. Primer administrador creado.',
            token,
            accessToken: token, // Para compatibilidad con frontend
            user: {
                id: nuevoAdmin.id,
                nombre: nuevoAdmin.nombre,
                email: nuevoAdmin.email,
                role: nuevoAdmin.role
            }
        });

    } catch (error) {
        logger.error('Error al configurar primer administrador:', error);
        
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                error: 'Datos duplicados',
                message: 'Ya existe un administrador con esos datos'
            });
        }

        res.status(500).json({
            error: 'Error del servidor',
            message: 'No se pudo configurar el sistema'
        });
    }
});

// Mantener la ruta antigua para compatibilidad (redirige a setup-admin)
router.post('/register-admin', (req, res) => {
    logger.warn('⚠️ Uso de ruta obsoleta /register-admin, redirigiendo a /setup-admin');
    // Redirigir internamente
    req.url = '/setup-admin';
    router.handle(req, res);
});

// Login de administrador
router.post('/login', loginLimiter, validarLoginAdmin, async (req, res) => {
    try {
        const { nombre, contraseña } = req.body;

        // Buscar administrador
        const admin = await Administrador.findOne({ 
            where: { 
                [require('sequelize').Op.or]: [
                    { nombre },
                    { username: nombre }
                ],
                [require('sequelize').Op.or]: [
                    { activo: true },
                    { activo: null } // Por si el campo no tiene valor
                ]
            }
        });

        if (!admin) {
            logger.warn(`Intento de login fallido para usuario: ${nombre}`);
            return res.status(401).json({
                error: 'Credenciales inválidas',
                message: 'Usuario o contraseña incorrectos'
            });
        }

        // Verificar contraseña
        const contraseñaValida = await admin.verificarContraseña(contraseña);
        if (!contraseñaValida) {
            logger.warn(`Contraseña incorrecta para usuario: ${nombre}`);
            return res.status(401).json({
                error: 'Credenciales inválidas',
                message: 'Usuario o contraseña incorrectos'
            });
        }

        // Actualizar último login
        await admin.actualizarUltimoLogin();

        // Generar tokens
        const accessToken = jwt.sign(
            { 
                id: admin.id, 
                nombre: admin.nombre, 
                role: admin.role 
            },
            JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );

        const refreshToken = jwt.sign(
            { id: admin.id },
            JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        logger.info(`Login exitoso para administrador: ${nombre}`);

        res.json({
            success: true,
            message: 'Login exitoso',
            token: accessToken,        // Frontend espera 'token'
            accessToken,               // Mantener para compatibilidad
            refreshToken,
            admin: {
                id: admin.id,
                nombre: admin.nombre,
                email: admin.email,
                role: admin.role,
                ultimo_login: admin.ultimo_login
            }
        });

    } catch (error) {
        logger.error('Error en login:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'No se pudo procesar el login'
        });
    }
});

// Refresh token
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                error: 'Token requerido',
                message: 'Refresh token no proporcionado'
            });
        }

        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        const admin = await Administrador.findByPk(decoded.id);

        if (!admin || !admin.activo) {
            return res.status(401).json({
                error: 'Token inválido',
                message: 'Administrador no encontrado o inactivo'
            });
        }

        // Generar nuevo access token
        const accessToken = jwt.sign(
            { 
                id: admin.id, 
                nombre: admin.nombre, 
                role: admin.role 
            },
            JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );

        res.json({
            success: true,
            accessToken,
            admin: {
                id: admin.id,
                nombre: admin.nombre,
                role: admin.role
            }
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Refresh token expirado',
                message: 'Por favor inicia sesión nuevamente'
            });
        }

        logger.error('Error en refresh token:', error);
        res.status(401).json({
            error: 'Token inválido',
            message: 'No se pudo renovar el token'
        });
    }
});

// ==================== GESTIÓN DE ADMINISTRADORES ====================
// Registrar nuevos administradores (SOLO para superadmins autenticados)

router.post('/register', verificarToken, registerLimiter, validarRegistroAdmin, async (req, res) => {
    try {
        // Verificar que el usuario autenticado sea superadmin
        if (req.admin.role !== 'superadmin') {
            return res.status(403).json({
                error: 'Acceso denegado',
                message: 'Solo los superadministradores pueden crear nuevos administradores'
            });
        }

        const { nombre, email, contraseña, role = 'admin' } = req.body;

        // Verificar si el nombre ya existe
        const adminExistente = await Administrador.findOne({ 
            where: { 
                [require('sequelize').Op.or]: [
                    { nombre },
                    { username: nombre },
                    { email }
                ]
            } 
        });

        if (adminExistente) {
            return res.status(400).json({
                error: 'Usuario ya existe',
                message: 'Ya existe un administrador con ese nombre o email'
            });
        }

        // Crear el nuevo administrador
        const nuevoAdmin = await Administrador.create({
            nombre,
            username: nombre,
            email,
            password_hash: contraseña, // Se hasheará automáticamente en el hook
            role: role === 'superadmin' ? 'superadmin' : 'admin', // Solo superadmin puede crear otro superadmin
            activo: true
        });

        logger.info(`✅ Nuevo administrador creado por ${req.admin.nombre}: ${nombre} (${role})`);

        res.status(201).json({
            success: true,
            message: 'Administrador creado exitosamente',
            admin: {
                id: nuevoAdmin.id,
                nombre: nuevoAdmin.nombre,
                email: nuevoAdmin.email,
                role: nuevoAdmin.role
            }
        });

    } catch (error) {
        logger.error('Error al crear administrador:', error);
        
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                error: 'Datos duplicados',
                message: 'Ya existe un administrador con esos datos'
            });
        }

        res.status(500).json({
            error: 'Error del servidor',
            message: 'No se pudo crear el administrador'
        });
    }
});

// Logout (invalidar token en el cliente)
router.post('/logout', (req, res) => {
    // En una implementación real, aquí podrías invalidar el token en una blacklist
    logger.info('Usuario cerró sesión');
    res.json({
        success: true,
        message: 'Sesión cerrada exitosamente'
    });
});

module.exports = router;