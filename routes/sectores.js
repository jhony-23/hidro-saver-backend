const express = require('express');
const Sector = require('../models/Sector');
const Usuario = require('../models/Usuario');
const { verificarToken, verificarAdmin } = require('../middleware/auth');
const { validarSector } = require('../middleware/validation');
const { logger } = require('../utils/logger');

const router = express.Router();

// Obtener todos los sectores (público para llenar selects)
router.get('/', async (req, res) => {
    try {
        const sectores = await Sector.findAll({
            attributes: ['id', 'NombreSector', 'Descripcion'],
            order: [['NombreSector', 'ASC']]
        });

        res.json({
            success: true,
            sectores: sectores.map(sector => ({
                id: sector.id,
                nombre: sector.NombreSector,           // Frontend espera 'nombre'
                descripcion: sector.Descripcion,      // Frontend espera 'descripcion'
                NombreSector: sector.NombreSector,     // Mantener compatibilidad
                Descripcion: sector.Descripcion,      // Mantener compatibilidad
                createdAt: sector.createdAt
            })),
            total: sectores.length
        });

    } catch (error) {
        logger.error('Error al obtener sectores:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'No se pudieron obtener los sectores'
        });
    }
});

// Obtener sector específico con estadísticas
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const sector = await Sector.findByPk(id, {
            include: [{
                model: Usuario,
                attributes: ['id', 'nombre', 'apellido', 'CodigoBarras'],
                required: false
            }]
        });

        if (!sector) {
            return res.status(404).json({
                error: 'Sector no encontrado',
                message: 'El sector especificado no existe'
            });
        }

        // Calcular estadísticas
        const totalUsuarios = sector.Usuarios ? sector.Usuarios.length : 0;

        res.json({
            success: true,
            sector: {
                id: sector.id,
                NombreSector: sector.NombreSector,
                Descripcion: sector.Descripcion,
                totalUsuarios,
                usuarios: sector.Usuarios
            }
        });

    } catch (error) {
        logger.error('Error al obtener sector:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'No se pudo obtener el sector'
        });
    }
});

// Crear nuevo sector (solo admins)
router.post('/', verificarToken, verificarAdmin, validarSector, async (req, res) => {
    try {
        const { NombreSector, nombre, Descripcion, descripcion } = req.body;
        const nombreFinal = NombreSector || nombre;
        const descripcionFinal = Descripcion || descripcion;

        // Verificar si ya existe un sector con ese nombre
        const sectorExistente = await Sector.findOne({
            where: { NombreSector: nombreFinal }
        });

        if (sectorExistente) {
            return res.status(400).json({
                error: 'Sector ya existe',
                message: 'Ya existe un sector con ese nombre'
            });
        }

        const nuevoSector = await Sector.create({
            NombreSector: nombreFinal,
            Descripcion: descripcionFinal
        });

        logger.info(`Sector creado: ${NombreSector} por admin: ${req.admin.nombre}`);

        res.status(201).json({
            success: true,
            message: 'Sector creado exitosamente',
            sector: nuevoSector
        });

    } catch (error) {
        logger.error('Error al crear sector:', error);
        
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                error: 'Sector duplicado',
                message: 'Ya existe un sector con ese nombre'
            });
        }

        res.status(500).json({
            error: 'Error del servidor',
            message: 'No se pudo crear el sector'
        });
    }
});

// Actualizar sector (solo admins)
router.put('/:id', verificarToken, verificarAdmin, validarSector, async (req, res) => {
    try {
        const { id } = req.params;
        const { NombreSector, Descripcion } = req.body;

        const sector = await Sector.findByPk(id);
        if (!sector) {
            return res.status(404).json({
                error: 'Sector no encontrado',
                message: 'El sector especificado no existe'
            });
        }

        // Verificar si ya existe otro sector con ese nombre
        const sectorExistente = await Sector.findOne({
            where: { 
                NombreSector,
                id: { [require('sequelize').Op.ne]: id }
            }
        });

        if (sectorExistente) {
            return res.status(400).json({
                error: 'Nombre duplicado',
                message: 'Ya existe otro sector con ese nombre'
            });
        }

        await sector.update({
            NombreSector,
            Descripcion
        });

        logger.info(`Sector actualizado: ${NombreSector} por admin: ${req.admin.nombre}`);

        res.json({
            success: true,
            message: 'Sector actualizado exitosamente',
            sector
        });

    } catch (error) {
        logger.error('Error al actualizar sector:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'No se pudo actualizar el sector'
        });
    }
});

// Eliminar sector (solo admins) - solo si no tiene usuarios
router.delete('/:id', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const sector = await Sector.findByPk(id, {
            include: [Usuario]
        });

        if (!sector) {
            return res.status(404).json({
                error: 'Sector no encontrado',
                message: 'El sector especificado no existe'
            });
        }

        // Verificar si tiene usuarios asociados
        if (sector.Usuarios && sector.Usuarios.length > 0) {
            return res.status(400).json({
                error: 'Sector tiene usuarios',
                message: `No se puede eliminar el sector porque tiene ${sector.Usuarios.length} usuario(s) asociado(s)`
            });
        }

        await sector.destroy();

        logger.info(`Sector eliminado: ${sector.NombreSector} por admin: ${req.admin.nombre}`);

        res.json({
            success: true,
            message: 'Sector eliminado exitosamente'
        });

    } catch (error) {
        logger.error('Error al eliminar sector:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'No se pudo eliminar el sector'
        });
    }
});

// Inicializar sectores por defecto
router.post('/init-default', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const sectoresDefault = [
            { NombreSector: 'Sector Centro', Descripcion: 'Área central del municipio' },
            { NombreSector: 'Sector Gonzales', Descripcion: 'Zona residencial Gonzales' },
            { NombreSector: 'Sector Buena Vista', Descripcion: 'Área de Buena Vista' }
        ];

        const sectoresCreados = [];
        
        for (const sectorData of sectoresDefault) {
            // Verificar si ya existe
            const existe = await Sector.findOne({
                where: { NombreSector: sectorData.NombreSector }
            });

            if (!existe) {
                const nuevoSector = await Sector.create(sectorData);
                sectoresCreados.push(nuevoSector);
            }
        }

        logger.info(`Sectores inicializados: ${sectoresCreados.length} creados por admin: ${req.admin.nombre}`);

        res.json({
            success: true,
            message: `${sectoresCreados.length} sectores inicializados exitosamente`,
            sectoresCreados
        });

    } catch (error) {
        logger.error('Error al inicializar sectores:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'No se pudieron inicializar los sectores'
        });
    }
});

module.exports = router;