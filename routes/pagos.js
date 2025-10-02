const express = require('express');
const Pago = require('../models/Pago');
const Usuario = require('../models/Usuario');
const router = express.Router();

router.post('/', async (req, res) => {
    const { CodigoBarras, mes, monto } = req.body;

    try {
        const usuario = await Usuario.findOne({
            where: { CodigoBarras },
            include: ['Sector'],
        });

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const nuevoPago = await Pago.create({
            UsuarioId: usuario.id,
            MesCancelado: mes,
            Monto: monto,
        });

        const resumen = {
            nombreUsuario: usuario.nombre + ' ' + usuario.apellido,
            sectorNombre: usuario.Sector.NombreSector,
            sectorDescripcion: usuario.Sector.Descripcion,
            monto,
            mesCancelado: mes,
        };

        res.json({ mensaje: 'Pago realizado con éxito', resumen });
    } catch (error) {
        console.error('Error al realizar el pago:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
