const express = require('express');
const jwt = require('jsonwebtoken'); // Para generar tokens JWT
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); // Cargar .env del backend
const Administrador = require('../models/Administrador');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_secreto'; // Mejor utilizar una variable de entorno

// Rate limit específico para /login (5 intentos cada 10 minutos)
const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { mensaje: 'Demasiados intentos. Intenta de nuevo más tarde.' }
});

// Ruta para login
router.post('/login', loginLimiter, async (req, res) => {
    const { nombre, contraseña } = req.body;

    // Validación de entrada
    if (!nombre || !contraseña) {
        return res.status(400).json({ mensaje: 'Nombre y contraseña son obligatorios' });
    }

    try {
        // Buscar admin por nombre
        const admin = await Administrador.findOne({ where: { nombre } });
        if (!admin) {
            return res.status(404).json({ mensaje: 'Administrador no encontrado o credenciales incorrectas' });
        }

        // Comparar contraseña con bcrypt
        const ok = await bcrypt.compare(contraseña, admin.contraseña);
        if (!ok) {
            return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
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

// Recuperación de contraseña (flujo simple): nombre + apellido + dpi + nuevaContraseña
const resetLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: { mensaje: 'Demasiados intentos de recuperación. Intenta más tarde.' }
});

router.post('/reset-password', resetLimiter, async (req, res) => {
    const { nombre, apellido, dpi, nuevaContraseña } = req.body;
    if (!nombre || !apellido || !dpi || !nuevaContraseña) {
        return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
    }
    try {
        const admin = await Administrador.findOne({ where: { nombre, apellido, dpi } });
        // Para no filtrar existencia, retornar mensaje genérico aunque no exista
        if (!admin) {
            return res.status(200).json({ ok: true });
        }
        const hashed = await bcrypt.hash(nuevaContraseña, 10);
        admin.contraseña = hashed;
        await admin.save();
        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('Error en reset-password:', error);
        return res.status(500).json({ mensaje: 'Error del servidor' });
    }
});

module.exports = router;
