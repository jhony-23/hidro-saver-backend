const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Sector = require('./Sector');

function generateCodigoBarras() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'CB-';
    for (let i = 0; i < 8; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

class Usuario extends Model {}

Usuario.init({
    nombre: { type: DataTypes.STRING, allowNull: false },
    apellido: { type: DataTypes.STRING, allowNull: false },
    dpi: { type: DataTypes.STRING, allowNull: false },
    CodigoBarras: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        defaultValue: generateCodigoBarras,
    },
    sectorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Sector, key: 'id' }
    }
}, {
    sequelize,
    modelName: 'Usuario',
    tableName: 'usuarios',
    timestamps: true,
});

Usuario.belongsTo(Sector, { foreignKey: 'sectorId' });

module.exports = Usuario;
