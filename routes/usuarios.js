const express = require('express');
const router = express.Router();  // Asegúrate de definir router
const Usuario = require('../models/Usuario');
const Sector = require('../models/Sector');

// Ruta para agregar un usuario
router.post('/agregar', async (req, res) => {
    const { nombre, apellido, dpi, sectorId } = req.body;
    try {
        // Verificar que el sector existe antes de crear el usuario
        const sectorExiste = await Sector.findByPk(sectorId);
        if (!sectorExiste) {
            return res.status(400).json({ 
                error: 'El sector especificado no existe',
                message: 'Por favor selecciona un sector válido' 
            });
        }

        const nuevoUsuario = await Usuario.create({ nombre, apellido, dpi, sectorId });
        res.status(201).json({ 
            success: true,
            message: 'Usuario creado exitosamente',
            usuario: nuevoUsuario 
        });
    } catch (error) {
        console.error('Error al agregar usuario:', error);
        
        // Manejo específico de errores
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ 
                error: 'El sector especificado no existe',
                message: 'Por favor selecciona un sector válido'
            });
        }
        
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ 
                error: 'El código de barras ya existe',
                message: 'Este usuario ya está registrado'
            });
        }
        
        res.status(500).json({ 
            error: 'Error interno del servidor',
            message: error.message 
        });
    }
});

// Ruta para buscar un usuario por su código de barras
router.get('/:codigoBarras', async (req, res) => {
    try {
        const { codigoBarras } = req.params;
        const usuario = await Usuario.findOne({
            where: { CodigoBarras: codigoBarras },
            include: [{ model: Sector, as: 'Sector' }]
        });

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json(usuario);
    } catch (error) {
        console.error('Error en la consulta del usuario:', error);
        res.status(500).json({ error: error.message });
    }
});

// Ruta para actualizar un usuario por su código de barras
router.put('/:codigoBarras', async (req, res) => {
    const { codigoBarras } = req.params;
    const { nombre, apellido, dpi, sectorId } = req.body;

    try {
        const usuario = await Usuario.findOne({ where: { CodigoBarras: codigoBarras } });
        
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        await usuario.update({ nombre, apellido, dpi, sectorId });
        res.json({ message: 'Usuario actualizado correctamente', usuario });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ error: 'Ocurrió un error al intentar actualizar el usuario.' });
    }
});

// Ruta para eliminar un usuario por su código de barras
router.delete('/:codigoBarras', async (req, res) => {
    const { codigoBarras } = req.params;

    try {
        const usuario = await Usuario.findOne({ where: { CodigoBarras: codigoBarras } });

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        await usuario.destroy();
        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ error: 'Ocurrió un error al intentar eliminar el usuario.' });
    }
});

// Ruta para obtener todos los sectores disponibles
router.get('/sectores/lista', async (req, res) => {
    try {
        const sectores = await Sector.findAll({
            attributes: ['id', 'NombreSector', 'Descripcion']
        });
        res.json({ 
            success: true,
            sectores: sectores 
        });
    } catch (error) {
        console.error('Error al obtener sectores:', error);
        res.status(500).json({ 
            error: 'Error al obtener sectores',
            message: error.message 
        });
    }
});

module.exports = router;
