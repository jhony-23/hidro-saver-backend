const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();
const Usuario = require('../models/Usuario');
const Sector = require('../models/Sector');
const Pago = require('../models/Pago');
const { verificarToken, verificarAdmin } = require('../middleware/auth');
const { validarUsuario } = require('../middleware/validation');
const { logger } = require('../utils/logger');

// Función para generar código de barras único
function generateCodigoBarras() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'CB-';
    for (let i = 0; i < 8; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// Obtener todos los usuarios con filtros y paginación (requiere autenticación)
router.get('/', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const { 
            search = '', 
            sector = '', 
            page = 1, 
            limit = 50,
            activo = true 
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // Construir filtros
        let whereClause = {};
        
        if (search) {
            whereClause[Op.or] = [
                { nombre: { [Op.like]: `%${search}%` } },
                { apellido: { [Op.like]: `%${search}%` } },
                { dpi: { [Op.like]: `%${search}%` } },
                { CodigoBarras: { [Op.like]: `%${search}%` } }
            ];
        }

        if (sector) {
            whereClause.sectorId = sector;
        }

        const { count, rows: usuarios } = await Usuario.findAndCountAll({
            where: whereClause,
            include: [{
                model: Sector,
                attributes: ['id', 'NombreSector', 'Descripcion']
            }],
            order: [['nombre', 'ASC'], ['apellido', 'ASC']],
            limit: parseInt(limit),
            offset: offset
        });

        const totalPages = Math.ceil(count / parseInt(limit));

        res.json({
            success: true,
            usuarios: usuarios.map(usuario => ({
                id: usuario.id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                dpi: usuario.dpi,
                codigo_barras: usuario.CodigoBarras,         // Frontend espera este campo
                CodigoBarras: usuario.CodigoBarras,          // Mantener compatibilidad
                sector_id: usuario.sectorId,                 // Frontend espera este campo
                sector_nombre: usuario.Sector?.NombreSector || '', // Frontend espera este campo
                createdAt: usuario.createdAt,                // Frontend espera este campo
                Sector: usuario.Sector,                      // Mantener compatibilidad
                fechaRegistro: usuario.createdAt
            })),
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalItems: count,
                itemsPerPage: parseInt(limit),
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            }
        });

    } catch (error) {
        logger.error('Error al obtener usuarios:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'No se pudieron obtener los usuarios'
        });
    }
});

// Obtener usuario específico por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const usuario = await Usuario.findByPk(id, {
            include: [{
                model: Sector,
                attributes: ['id', 'NombreSector', 'Descripcion']
            }, {
                model: Pago,
                order: [['FechaPago', 'DESC']],
                limit: 10 // Últimos 10 pagos
            }]
        });

        if (!usuario) {
            return res.status(404).json({
                error: 'Usuario no encontrado',
                message: 'El usuario especificado no existe'
            });
        }

        res.json({
            success: true,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                dpi: usuario.dpi,
                CodigoBarras: usuario.CodigoBarras,
                sector: usuario.Sector,
                pagos: usuario.Pagos,
                fechaRegistro: usuario.createdAt,
                fechaActualizacion: usuario.updatedAt
            }
        });

    } catch (error) {
        logger.error('Error al obtener usuario:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'No se pudo obtener el usuario'
        });
    }
});

// Ruta para agregar un usuario (mejorada)
router.post('/agregar', verificarToken, verificarAdmin, validarUsuario, async (req, res) => {
    try {
        let { nombre, apellido, dpi, sectorId, CodigoBarras } = req.body;

        // Normalizar datos
        nombre = nombre.trim().toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
        apellido = apellido.trim().toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
        dpi = dpi.trim();

        // Verificar que el sector existe
        const sectorExiste = await Sector.findByPk(sectorId);
        if (!sectorExiste) {
            return res.status(400).json({ 
                error: 'Sector inválido',
                message: 'El sector especificado no existe' 
            });
        }

        // Verificar que el DPI no esté duplicado
        const dpiExiste = await Usuario.findOne({ where: { dpi } });
        if (dpiExiste) {
            return res.status(400).json({
                error: 'DPI duplicado',
                message: 'Ya existe un usuario registrado con ese DPI'
            });
        }

        // Generar código de barras si no se proporciona
        if (!CodigoBarras) {
            let codigoUnico = false;
            while (!codigoUnico) {
                CodigoBarras = generateCodigoBarras();
                const codigoExiste = await Usuario.findOne({ where: { CodigoBarras } });
                if (!codigoExiste) {
                    codigoUnico = true;
                }
            }
        } else {
            // Verificar que el código de barras no esté duplicado
            const codigoExiste = await Usuario.findOne({ where: { CodigoBarras } });
            if (codigoExiste) {
                return res.status(400).json({
                    error: 'Código de barras duplicado',
                    message: 'Ya existe un usuario con ese código de barras'
                });
            }
        }

        const nuevoUsuario = await Usuario.create({ 
            nombre, 
            apellido, 
            dpi, 
            sectorId, 
            CodigoBarras 
        });

        // Obtener el usuario completo con sector
        const usuarioCompleto = await Usuario.findByPk(nuevoUsuario.id, {
            include: [Sector]
        });

        logger.info(`Usuario creado: ${nombre} ${apellido} (${CodigoBarras}) por admin: ${req.admin.nombre}`);

        res.status(201).json({ 
            success: true,
            message: 'Usuario creado exitosamente',
            usuario: {
                id: usuarioCompleto.id,
                nombre: usuarioCompleto.nombre,
                apellido: usuarioCompleto.apellido,
                dpi: usuarioCompleto.dpi,
                CodigoBarras: usuarioCompleto.CodigoBarras,
                sector: usuarioCompleto.Sector,
                fechaRegistro: usuarioCompleto.createdAt
            }
        });

    } catch (error) {
        logger.error('Error al agregar usuario:', error);
        
        // Manejo específico de errores
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ 
                error: 'Sector inválido',
                message: 'El sector especificado no existe'
            });
        }
        
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error.errors[0].path;
            return res.status(400).json({ 
                error: 'Datos duplicados',
                message: field === 'dpi' ? 'Ya existe un usuario con ese DPI' : 
                        field === 'CodigoBarras' ? 'Ya existe un usuario con ese código de barras' :
                        'Ya existe un usuario con esos datos'
            });
        }
        
        res.status(500).json({ 
            error: 'Error interno del servidor',
            message: 'No se pudo crear el usuario'
        });
    }
});

// Ruta para buscar un usuario por su código de barras (mejorada)
router.get('/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        
        const usuario = await Usuario.findOne({
            where: { CodigoBarras: codigo },
            include: [{
                model: Sector,
                attributes: ['id', 'NombreSector', 'Descripcion']
            }, {
                model: Pago,
                order: [['FechaPago', 'DESC']],
                limit: 5 // Últimos 5 pagos
            }]
        });

        if (!usuario) {
            return res.status(404).json({ 
                error: 'Usuario no encontrado',
                message: 'No existe un usuario con ese código de barras' 
            });
        }

        res.json({
            success: true,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                dpi: usuario.dpi,
                codigo_barras: usuario.CodigoBarras,    // Frontend usa este nombre
                CodigoBarras: usuario.CodigoBarras,     // Mantener compatibilidad
                sector_id: usuario.sectorId,            // Frontend espera este campo
                sector_nombre: usuario.Sector?.NombreSector || '', // Frontend espera este campo
                createdAt: usuario.createdAt,
                Sector: usuario.Sector,                 // Mantener para compatibilidad
                ultimosPagos: usuario.Pagos,
                fechaRegistro: usuario.createdAt
            }
        });

    } catch (error) {
        logger.error('Error al buscar usuario por código:', error);
        res.status(500).json({ 
            error: 'Error del servidor',
            message: 'No se pudo buscar el usuario'
        });
    }
});

// Ruta para actualizar un usuario (mejorada)
router.put('/:id', verificarToken, verificarAdmin, validarUsuario, async (req, res) => {
    try {
        const { id } = req.params;
        let { nombre, apellido, dpi, sectorId } = req.body;

        const usuario = await Usuario.findByPk(id);
        if (!usuario) {
            return res.status(404).json({ 
                error: 'Usuario no encontrado',
                message: 'El usuario especificado no existe' 
            });
        }

        // Normalizar datos
        nombre = nombre.trim().toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
        apellido = apellido.trim().toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
        dpi = dpi.trim();

        // Verificar que el sector existe
        const sectorExiste = await Sector.findByPk(sectorId);
        if (!sectorExiste) {
            return res.status(400).json({ 
                error: 'Sector inválido',
                message: 'El sector especificado no existe' 
            });
        }

        // Verificar que el DPI no esté duplicado (excepto el usuario actual)
        const dpiExiste = await Usuario.findOne({ 
            where: { 
                dpi,
                id: { [Op.ne]: id }
            } 
        });
        if (dpiExiste) {
            return res.status(400).json({
                error: 'DPI duplicado',
                message: 'Ya existe otro usuario registrado con ese DPI'
            });
        }

        await usuario.update({ nombre, apellido, dpi, sectorId });

        // Obtener el usuario actualizado con sector
        const usuarioActualizado = await Usuario.findByPk(id, {
            include: [Sector]
        });

        logger.info(`Usuario actualizado: ${nombre} ${apellido} por admin: ${req.admin.nombre}`);

        res.json({ 
            success: true,
            message: 'Usuario actualizado correctamente', 
            usuario: {
                id: usuarioActualizado.id,
                nombre: usuarioActualizado.nombre,
                apellido: usuarioActualizado.apellido,
                dpi: usuarioActualizado.dpi,
                CodigoBarras: usuarioActualizado.CodigoBarras,
                sector: usuarioActualizado.Sector,
                fechaActualizacion: usuarioActualizado.updatedAt
            }
        });

    } catch (error) {
        logger.error('Error al actualizar usuario:', error);
        
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ 
                error: 'Sector inválido',
                message: 'El sector especificado no existe'
            });
        }
        
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ 
                error: 'DPI duplicado',
                message: 'Ya existe otro usuario con ese DPI'
            });
        }

        res.status(500).json({ 
            error: 'Error del servidor',
            message: 'No se pudo actualizar el usuario'
        });
    }
});

// Ruta para eliminar un usuario (solo si no tiene pagos)
router.delete('/:id', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const usuario = await Usuario.findByPk(id, {
            include: [Pago]
        });

        if (!usuario) {
            return res.status(404).json({ 
                error: 'Usuario no encontrado',
                message: 'El usuario especificado no existe' 
            });
        }

        // Verificar si tiene pagos asociados
        if (usuario.Pagos && usuario.Pagos.length > 0) {
            return res.status(400).json({
                error: 'Usuario tiene pagos',
                message: `No se puede eliminar el usuario porque tiene ${usuario.Pagos.length} pago(s) registrado(s)`
            });
        }

        await usuario.destroy();

        logger.info(`Usuario eliminado: ${usuario.nombre} ${usuario.apellido} (${usuario.CodigoBarras}) por admin: ${req.admin.nombre}`);

        res.json({ 
            success: true,
            message: 'Usuario eliminado correctamente' 
        });

    } catch (error) {
        logger.error('Error al eliminar usuario:', error);
        res.status(500).json({ 
            error: 'Error del servidor',
            message: 'No se pudo eliminar el usuario'
        });
    }
});

// Ruta para obtener estadísticas de usuarios
router.get('/stats/general', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const totalUsuarios = await Usuario.count();
        const usuariosPorSector = await Usuario.findAll({
            attributes: ['sectorId', [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'cantidad']],
            include: [{
                model: Sector,
                attributes: ['NombreSector']
            }],
            group: ['sectorId', 'Sector.id']
        });

        const stats = {
            totalUsuarios,
            usuariosPorSector: usuariosPorSector.map(item => ({
                sector: item.Sector.NombreSector,
                cantidad: parseInt(item.dataValues.cantidad)
            }))
        };

        res.json({
            success: true,
            estadisticas: stats
        });

    } catch (error) {
        logger.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'No se pudieron obtener las estadísticas'
        });
    }
});

module.exports = router;
