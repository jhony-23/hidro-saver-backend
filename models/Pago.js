// models/Pago.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pago = sequelize.define('Pago', {
  UsuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  FechaPago: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, // Valor por defecto al crear un nuevo pago
  },
  MesCancelado: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  Monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 50.00, // Valor por defecto opcional
  }
}, {
  timestamps: true // Agregar timestamps para createdAt y updatedAt
});

module.exports = Pago;
