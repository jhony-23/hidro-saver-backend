const express = require('express');
const jwt = require('jsonwebtoken'); // Para generar tokens JWT
const Administrador = require('../models/Administrador');
require('dotenv').config(); // Cargar variables de entorno desde un archivo .env

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_secreto'; // Mejor utilizar una variable de entorno

// Ruta para login
router.post('/login', async (req, res) => {
    const { nombre, contraseña } = req.body;

    // Validación de entrada
    if (!nombre || !contraseña) {
        return res.status(400).json({ mensaje: 'Nombre y contraseña son obligatorios' });
    }

    try {
        // Buscar al administrador en la base de datos
        const admin = await Administrador.findOne({ where: { nombre, contraseña } }); // Comparación directa
        if (!admin) {
            return res.status(404).json({ mensaje: 'Administrador no encontrado o credenciales incorrectas' });
        }

        // Generar un token JWT
        const token = jwt.sign({ id: admin.id, nombre: admin.nombre }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ mensaje: 'Login exitoso', token });
    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
    }
});

// Ruta protegida de ejemplo
router.get('/perfil', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]; // Extrae el token del header

    if (!token) {
        return res.status(401).json({ mensaje: 'Acceso denegado: Token no proporcionado' });
    }

    try {
        // Verificar el token JWT
        const decoded = jwt.verify(token, JWT_SECRET);
        const admin = await Administrador.findByPk(decoded.id);

        if (!admin) {
            return res.status(404).json({ mensaje: 'Administrador no encontrado' });
        }

        res.json({ mensaje: 'Acceso autorizado', administrador: admin });
    } catch (error) {
        console.error('Error al verificar el token:', error);
        res.status(401).json({ mensaje: 'Token inválido', error: error.message });
    }
});

module.exports = router;
