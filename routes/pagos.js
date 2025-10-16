const express = require('express');
const { Op } = require('sequelize');
const Pago = require('../models/Pago');
const Usuario = require('../models/Usuario');
const Sector = require('../models/Sector');
const { verificarToken, verificarAdmin } = require('../middleware/auth');
const { validarPago } = require('../middleware/validation');
const { logger } = require('../utils/logger');

const router = express.Router();

// Obtener todos los pagos con filtros y paginación
router.get('/', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const { 
            periodo = '', 
            sector = '', 
            usuario = '',
            page = 1, 
            limit = 50 
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // Construir filtros
        let wherePago = {};
        let whereUsuario = {};
        
        if (periodo) {
            wherePago.MesCancelado = periodo;
        }
        
        if (sector) {
            whereUsuario.sectorId = sector;
        }
        
        if (usuario) {
            wherePago.UsuarioId = usuario;
        }

        const { count, rows: pagos } = await Pago.findAndCountAll({
            where: wherePago,
            include: [{
                model: Usuario,
                where: Object.keys(whereUsuario).length > 0 ? whereUsuario : undefined,
                include: [{
                    model: Sector,
                    attributes: ['id', 'NombreSector', 'Descripcion']
                }]
            }],
            order: [['FechaPago', 'DESC']],
            limit: parseInt(limit),
            offset: offset
        });

        const totalPages = Math.ceil(count / parseInt(limit));

        res.json({
            success: true,
            pagos: pagos.map(pago => ({
                id: pago.id,
                monto: parseFloat(pago.Monto),
                fechaPago: pago.FechaPago,
                mesCancelado: pago.MesCancelado,
                usuario: {
                    id: pago.Usuario.id,
                    nombre: pago.Usuario.nombre,
                    apellido: pago.Usuario.apellido,
                    CodigoBarras: pago.Usuario.CodigoBarras,
                    sector: pago.Usuario.Sector
                }
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
        logger.error('Error al obtener pagos:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'No se pudieron obtener los pagos'
        });
    }
});

// Obtener pago específico por ID
router.get('/:id', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const pago = await Pago.findByPk(id, {
            include: [{
                model: Usuario,
                include: [{
                    model: Sector,
                    attributes: ['id', 'NombreSector', 'Descripcion']
                }]
            }]
        });

        if (!pago) {
            return res.status(404).json({
                error: 'Pago no encontrado',
                message: 'El pago especificado no existe'
            });
        }

        res.json({
            success: true,
            pago: {
                id: pago.id,
                monto: parseFloat(pago.Monto),
                fechaPago: pago.FechaPago,
                mesCancelado: pago.MesCancelado,
                usuario: {
                    id: pago.Usuario.id,
                    nombre: pago.Usuario.nombre,
                    apellido: pago.Usuario.apellido,
                    dpi: pago.Usuario.dpi,
                    CodigoBarras: pago.Usuario.CodigoBarras,
                    sector: pago.Usuario.Sector
                },
                fechaRegistro: pago.createdAt
            }
        });

    } catch (error) {
        logger.error('Error al obtener pago:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'No se pudo obtener el pago'
        });
    }
});

// Crear nuevo pago (mejorado con validaciones)
router.post('/', verificarToken, verificarAdmin, validarPago, async (req, res) => {
    try {
        const { CodigoBarras, codigoBarras, mes, monto } = req.body;
        const codigo = CodigoBarras || codigoBarras; // Aceptar ambos formatos

        // Buscar usuario por código de barras
        const usuario = await Usuario.findOne({
            where: { CodigoBarras: codigo },
            include: [{
                model: Sector,
                attributes: ['id', 'NombreSector', 'Descripcion']
            }]
        });

        if (!usuario) {
            return res.status(404).json({ 
                error: 'Usuario no encontrado',
                message: 'No existe un usuario con ese código de barras' 
            });
        }

        // Verificar si ya existe un pago para ese usuario en ese mes (idempotencia)
        const pagoExistente = await Pago.findOne({
            where: {
                UsuarioId: usuario.id,
                MesCancelado: mes
            }
        });

        if (pagoExistente) {
            return res.status(409).json({
                error: 'Pago duplicado',
                message: `El usuario ya realizó el pago para el mes ${mes}`,
                pagoExistente: {
                    id: pagoExistente.id,
                    monto: parseFloat(pagoExistente.Monto),
                    fechaPago: pagoExistente.FechaPago
                }
            });
        }

        // Crear el pago usando transacción para garantizar integridad
        const sequelize = require('../config/database');
        const transaction = await sequelize.transaction();

        try {
            const nuevoPago = await Pago.create({
                UsuarioId: usuario.id,
                MesCancelado: mes,
                Monto: monto,
            }, { transaction });

            await transaction.commit();

            const resumen = {
                pagoId: nuevoPago.id,
                nombreUsuario: `${usuario.nombre} ${usuario.apellido}`,
                sectorNombre: usuario.Sector.NombreSector,
                sectorDescripcion: usuario.Sector.Descripcion,
                monto: parseFloat(monto),
                mesCancelado: mes,
                fechaPago: nuevoPago.FechaPago,
                codigoBarras: codigo
            };

            logger.info(`Pago registrado: ${CodigoBarras} - ${mes} - Q${monto} por admin: ${req.admin.nombre}`);

            res.status(201).json({ 
                success: true,
                message: 'Pago realizado con éxito',    // Frontend espera 'message'
                mensaje: 'Pago realizado con éxito',    // Mantener compatibilidad
                resumen: resumen,                       // Frontend espera 'resumen'
                pago: resumen                           // Mantener compatibilidad
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        logger.error('Error al realizar el pago:', error);
        
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({
                error: 'Usuario inválido',
                message: 'El usuario especificado no existe'
            });
        }

        res.status(500).json({ 
            error: 'Error del servidor',
            message: 'No se pudo procesar el pago'
        });
    }
});

// Actualizar pago (solo montos y notas administrativas)
router.put('/:id', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { monto, notas } = req.body;

        if (!monto || monto <= 0) {
            return res.status(400).json({
                error: 'Monto inválido',
                message: 'El monto debe ser mayor a 0'
            });
        }

        const pago = await Pago.findByPk(id, {
            include: [{
                model: Usuario,
                include: [Sector]
            }]
        });

        if (!pago) {
            return res.status(404).json({
                error: 'Pago no encontrado',
                message: 'El pago especificado no existe'
            });
        }

        const montoAnterior = parseFloat(pago.Monto);
        await pago.update({ 
            Monto: monto,
            notas: notas || null
        });

        logger.info(`Pago actualizado: ID ${id} - Monto: Q${montoAnterior} → Q${monto} por admin: ${req.admin.nombre}`);

        res.json({
            success: true,
            message: 'Pago actualizado correctamente',
            pago: {
                id: pago.id,
                montoAnterior,
                montoNuevo: parseFloat(monto),
                fechaActualizacion: new Date()
            }
        });

    } catch (error) {
        logger.error('Error al actualizar pago:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'No se pudo actualizar el pago'
        });
    }
});

// Eliminar pago (solo en casos excepcionales)
router.delete('/:id', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;

        if (!motivo || motivo.trim().length < 10) {
            return res.status(400).json({
                error: 'Motivo requerido',
                message: 'Debe proporcionar un motivo de al menos 10 caracteres para eliminar el pago'
            });
        }

        const pago = await Pago.findByPk(id, {
            include: [{
                model: Usuario,
                include: [Sector]
            }]
        });

        if (!pago) {
            return res.status(404).json({
                error: 'Pago no encontrado',
                message: 'El pago especificado no existe'
            });
        }

        const pagoInfo = {
            id: pago.id,
            usuario: `${pago.Usuario.nombre} ${pago.Usuario.apellido}`,
            codigoBarras: pago.Usuario.CodigoBarras,
            monto: parseFloat(pago.Monto),
            mes: pago.MesCancelado,
            fechaPago: pago.FechaPago
        };

        await pago.destroy();

        logger.warn(`Pago eliminado: ${JSON.stringify(pagoInfo)} - Motivo: ${motivo} - Admin: ${req.admin.nombre}`);

        res.json({
            success: true,
            message: 'Pago eliminado correctamente',
            pagoEliminado: pagoInfo,
            motivo
        });

    } catch (error) {
        logger.error('Error al eliminar pago:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'No se pudo eliminar el pago'
        });
    }
});

// Verificar si un usuario ya pagó en un mes específico
router.get('/verificar/:codigoBarras/:mes', async (req, res) => {
    try {
        const { codigoBarras, mes } = req.params;

        // Buscar usuario
        const usuario = await Usuario.findOne({
            where: { CodigoBarras: codigoBarras },
            include: [Sector]
        });

        if (!usuario) {
            return res.status(404).json({
                error: 'Usuario no encontrado',
                message: 'No existe un usuario con ese código de barras'
            });
        }

        // Verificar pago existente
        const pagoExistente = await Pago.findOne({
            where: {
                UsuarioId: usuario.id,
                MesCancelado: mes
            }
        });

        res.json({
            success: true,
            usuario: {
                nombre: `${usuario.nombre} ${usuario.apellido}`,
                sector: usuario.Sector.NombreSector,
                codigoBarras: usuario.CodigoBarras
            },
            yaPago: !!pagoExistente,
            pago: pagoExistente ? {
                id: pagoExistente.id,
                monto: parseFloat(pagoExistente.Monto),
                fechaPago: pagoExistente.FechaPago
            } : null
        });

    } catch (error) {
        logger.error('Error al verificar pago:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'No se pudo verificar el estado del pago'
        });
    }
});

module.exports = router;
