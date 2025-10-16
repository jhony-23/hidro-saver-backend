const express = require('express');
const { Op } = require('sequelize');
const Usuario = require('../models/Usuario');
const Pago = require('../models/Pago');
const Sector = require('../models/Sector');
const { verificarToken, verificarAdmin } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

// Validar formato de período
const validarPeriodo = (periodo) => {
    const formatoValido = /^\d{4}-(0[1-9]|1[0-2])$/.test(periodo);
    if (!formatoValido) {
        throw new Error('El período debe tener el formato YYYY-MM (ej: 2025-03)');
    }
    return periodo;
};

// Obtener usuarios morosos
router.get('/morosos', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const { periodo, sector } = req.query;

        if (!periodo) {
            return res.status(400).json({
                error: 'Parámetro requerido',
                message: 'El parámetro "periodo" es obligatorio (formato: YYYY-MM)'
            });
        }

        validarPeriodo(periodo);

        // Construir filtros
        let whereUsuario = {};
        if (sector) {
            whereUsuario.sectorId = sector;
        }

        // Obtener todos los usuarios del sector (si se especifica)
        const todosUsuarios = await Usuario.findAll({
            where: whereUsuario,
            include: [{
                model: Sector,
                attributes: ['NombreSector', 'Descripcion']
            }, {
                model: Pago,
                required: false,
                where: {
                    MesCancelado: periodo
                }
            }]
        });

        // Filtrar usuarios que NO pagaron en el período
        const morosos = todosUsuarios.filter(usuario => 
            !usuario.Pagos || usuario.Pagos.length === 0
        );

        // Formatear respuesta
        const morososList = morosos.map(usuario => ({
            id: usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            dpi: usuario.dpi,
            CodigoBarras: usuario.CodigoBarras,
            sector: {
                id: usuario.Sector.id,
                nombre: usuario.Sector.NombreSector,
                descripcion: usuario.Sector.Descripcion
            },
            fechaRegistro: usuario.createdAt
        }));

        // Estadísticas
        const totalUsuarios = todosUsuarios.length;
        const totalMorosos = morososList.length;
        const porcentajeMorosos = totalUsuarios > 0 ? 
            ((totalMorosos / totalUsuarios) * 100).toFixed(2) : 0;

        logger.info(`Consulta de morosos - Período: ${periodo}, Sector: ${sector || 'Todos'}, Morosos: ${totalMorosos}/${totalUsuarios}`);

        res.json({
            success: true,
            periodo,
            estadisticas: {
                totalUsuarios,
                totalMorosos,
                porcentajeMorosos: parseFloat(porcentajeMorosos),
                usuariosAlDia: totalUsuarios - totalMorosos
            },
            morosos: morososList
        });

    } catch (error) {
        logger.error('Error al obtener morosos:', error);
        
        if (error.message.includes('formato')) {
            return res.status(400).json({
                error: 'Formato inválido',
                message: error.message
            });
        }

        res.status(500).json({
            error: 'Error del servidor',
            message: 'No se pudieron obtener los datos de morosos'
        });
    }
});

// Obtener pagos por período
router.get('/pagos', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const { periodo, sector, usuario } = req.query;

        if (!periodo) {
            return res.status(400).json({
                error: 'Parámetro requerido',
                message: 'El parámetro "periodo" es obligatorio (formato: YYYY-MM)'
            });
        }

        validarPeriodo(periodo);

        // Construir filtros
        let wherePago = {
            MesCancelado: periodo
        };

        let includeOptions = [{
            model: Usuario,
            include: [{
                model: Sector,
                attributes: ['id', 'NombreSector', 'Descripcion']
            }]
        }];

        // Filtrar por sector si se especifica
        if (sector) {
            includeOptions[0].where = { sectorId: sector };
        }

        // Filtrar por usuario específico si se especifica
        if (usuario) {
            wherePago.UsuarioId = usuario;
        }

        const pagos = await Pago.findAll({
            where: wherePago,
            include: includeOptions,
            order: [['FechaPago', 'DESC']]
        });

        // Formatear respuesta
        const pagosList = pagos.map(pago => ({
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
                sector: {
                    id: pago.Usuario.Sector.id,
                    nombre: pago.Usuario.Sector.NombreSector,
                    descripcion: pago.Usuario.Sector.Descripcion
                }
            }
        }));

        // Calcular estadísticas
        const totalPagos = pagosList.length;
        const montoTotal = pagosList.reduce((sum, pago) => sum + pago.monto, 0);
        const montoPromedio = totalPagos > 0 ? (montoTotal / totalPagos).toFixed(2) : 0;

        // Estadísticas por sector
        const pagosPorSector = {};
        pagosList.forEach(pago => {
            const sectorNombre = pago.usuario.sector.nombre;
            if (!pagosPorSector[sectorNombre]) {
                pagosPorSector[sectorNombre] = {
                    cantidad: 0,
                    monto: 0
                };
            }
            pagosPorSector[sectorNombre].cantidad++;
            pagosPorSector[sectorNombre].monto += pago.monto;
        });

        logger.info(`Consulta de pagos - Período: ${periodo}, Total: ${totalPagos}, Monto: Q${montoTotal}`);

        res.json({
            success: true,
            periodo,
            estadisticas: {
                totalPagos,
                montoTotal: parseFloat(montoTotal.toFixed(2)),
                montoPromedio: parseFloat(montoPromedio),
                pagosPorSector
            },
            pagos: pagosList
        });

    } catch (error) {
        logger.error('Error al obtener pagos:', error);
        
        if (error.message.includes('formato')) {
            return res.status(400).json({
                error: 'Formato inválido',
                message: error.message
            });
        }

        res.status(500).json({
            error: 'Error del servidor',
            message: 'No se pudieron obtener los datos de pagos'
        });
    }
});

// Reporte general por período
router.get('/general', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const { periodo } = req.query;

        if (!periodo) {
            return res.status(400).json({
                error: 'Parámetro requerido',
                message: 'El parámetro "periodo" es obligatorio (formato: YYYY-MM)'
            });
        }

        validarPeriodo(periodo);

        // Obtener todos los usuarios
        const totalUsuarios = await Usuario.count();

        // Obtener pagos del período
        const pagos = await Pago.findAll({
            where: { MesCancelado: periodo },
            include: [{
                model: Usuario,
                include: [Sector]
            }]
        });

        // Calcular estadísticas generales
        const totalPagos = pagos.length;
        const usuariosQuePagaron = new Set(pagos.map(p => p.UsuarioId)).size;
        const morosos = totalUsuarios - usuariosQuePagaron;
        const porcentajeMorosos = totalUsuarios > 0 ? 
            ((morosos / totalUsuarios) * 100).toFixed(2) : 0;
        const porcentajeCobranza = totalUsuarios > 0 ? 
            ((usuariosQuePagaron / totalUsuarios) * 100).toFixed(2) : 0;

        // Calcular montos
        const recaudacionTotal = pagos.reduce((sum, pago) => sum + parseFloat(pago.Monto), 0);
        const montoPromedio = totalPagos > 0 ? (recaudacionTotal / totalPagos).toFixed(2) : 0;

        // Estadísticas por sector
        const estadisticasPorSector = {};
        const sectores = await Sector.findAll({
            include: [{
                model: Usuario,
                required: false
            }]
        });

        for (const sector of sectores) {
            const usuariosSector = sector.Usuarios.length;
            const pagosSector = pagos.filter(p => p.Usuario.sectorId === sector.id);
            const usuariosQuePagaronSector = new Set(pagosSector.map(p => p.UsuarioId)).size;
            const montoSector = pagosSector.reduce((sum, pago) => sum + parseFloat(pago.Monto), 0);

            estadisticasPorSector[sector.NombreSector] = {
                totalUsuarios: usuariosSector,
                usuariosQuePagaron: usuariosQuePagaronSector,
                morosos: usuariosSector - usuariosQuePagaronSector,
                porcentajeCobranza: usuariosSector > 0 ? 
                    ((usuariosQuePagaronSector / usuariosSector) * 100).toFixed(2) : 0,
                recaudacion: parseFloat(montoSector.toFixed(2)),
                totalPagos: pagosSector.length
            };
        }

        // Tendencia (comparar con mes anterior si existe)
        const [año, mes] = periodo.split('-');
        const mesAnterior = mes === '01' ? '12' : String(parseInt(mes) - 1).padStart(2, '0');
        const añoAnterior = mes === '01' ? String(parseInt(año) - 1) : año;
        const periodoAnterior = `${añoAnterior}-${mesAnterior}`;

        const pagosAnterior = await Pago.count({
            where: { MesCancelado: periodoAnterior }
        });

        const recaudacionAnterior = await Pago.sum('Monto', {
            where: { MesCancelado: periodoAnterior }
        }) || 0;

        const tendencia = {
            periodoAnterior,
            pagosPrevios: pagosAnterior,
            recaudacionPrevia: parseFloat(recaudacionAnterior.toFixed(2)),
            crecimientoPagos: pagosAnterior > 0 ? 
                (((totalPagos - pagosAnterior) / pagosAnterior) * 100).toFixed(2) : null,
            crecimientoRecaudacion: recaudacionAnterior > 0 ? 
                (((recaudacionTotal - recaudacionAnterior) / recaudacionAnterior) * 100).toFixed(2) : null
        };

        logger.info(`Reporte general - Período: ${periodo}, Cobranza: ${porcentajeCobranza}%, Recaudación: Q${recaudacionTotal}`);

        res.json({
            success: true,
            periodo,
            resumen: {
                totalUsuarios,
                usuariosQuePagaron,
                morosos,
                porcentajeMorosos: parseFloat(porcentajeMorosos),
                porcentajeCobranza: parseFloat(porcentajeCobranza),
                totalPagos,
                recaudacionTotal: parseFloat(recaudacionTotal.toFixed(2)),
                montoPromedio: parseFloat(montoPromedio)
            },
            estadisticasPorSector,
            tendencia
        });

    } catch (error) {
        logger.error('Error al generar reporte general:', error);
        
        if (error.message.includes('formato')) {
            return res.status(400).json({
                error: 'Formato inválido',
                message: error.message
            });
        }

        res.status(500).json({
            error: 'Error del servidor',
            message: 'No se pudo generar el reporte general'
        });
    }
});

// Dashboard con KPIs del mes actual
router.get('/dashboard', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const ahora = new Date();
        const periodoActual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;

        // Reutilizar la lógica del reporte general
        req.query.periodo = periodoActual;
        
        // Obtener datos del mes actual
        const totalUsuarios = await Usuario.count();
        const pagosEsteMes = await Pago.count({
            where: { MesCancelado: periodoActual }
        });
        const recaudacionEsteMes = await Pago.sum('Monto', {
            where: { MesCancelado: periodoActual }
        }) || 0;

        // Últimos 5 pagos
        const ultimosPagos = await Pago.findAll({
            limit: 5,
            order: [['FechaPago', 'DESC']],
            include: [{
                model: Usuario,
                attributes: ['nombre', 'apellido', 'CodigoBarras'],
                include: [{
                    model: Sector,
                    attributes: ['NombreSector']
                }]
            }]
        });

        const dashboard = {
            periodo: periodoActual,
            kpis: {
                totalUsuarios,
                pagosEsteMes,
                recaudacionEsteMes: parseFloat(recaudacionEsteMes.toFixed(2)),
                promedioCobranza: totalUsuarios > 0 ? 
                    ((pagosEsteMes / totalUsuarios) * 100).toFixed(2) : 0
            },
            ultimosPagos: ultimosPagos.map(pago => ({
                id: pago.id,
                monto: parseFloat(pago.Monto),
                fecha: pago.FechaPago,
                usuario: `${pago.Usuario.nombre} ${pago.Usuario.apellido}`,
                codigoBarras: pago.Usuario.CodigoBarras,
                sector: pago.Usuario.Sector.NombreSector
            }))
        };

        res.json({
            success: true,
            dashboard
        });

    } catch (error) {
        logger.error('Error al obtener dashboard:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'No se pudo obtener el dashboard'
        });
    }
});

module.exports = router;