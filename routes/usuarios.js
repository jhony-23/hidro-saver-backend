const express = require('express');
const router = express.Router();  // Asegúrate de definir router
const Usuario = require('../models/Usuario');
const Sector = require('../models/Sector');

// Ruta para agregar un usuario
router.post('/agregar', async (req, res) => {
    const { nombre, apellido, dpi, sectorId } = req.body;
    try {
        const nuevoUsuario = await Usuario.create({ nombre, apellido, dpi, sectorId });
        res.status(201).json({ usuario: nuevoUsuario });
    } catch (error) {
        console.error('Error al agregar usuario:', error);
        res.status(500).json({ error: error.message });
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

module.exports = router;
