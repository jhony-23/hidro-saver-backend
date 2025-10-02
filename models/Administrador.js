const { DataTypes } = require('sequelize');
const connection = require('../config/database'); // Usar 'connection' para la instancia de Sequelize

// Definir el modelo Administrador
const Administrador = connection.define('Administrador', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre es obligatorio' },
            len: [3, 100] // Asegura que el nombre tenga entre 3 y 100 caracteres
        }
    },
    contraseña: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La contraseña es obligatoria' },
            len: [8, 100] // La contraseña debe tener al menos 8 caracteres
        }
    }
}, {
    timestamps: true, // Incluye createdAt y updatedAt
    tableName: 'administradores' // Asegura que Sequelize utilice la tabla en minúsculas 'administradores'
});

module.exports = Administrador;
