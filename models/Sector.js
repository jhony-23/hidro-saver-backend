const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Asegúrate de que la ruta sea correcta

class Sector extends Model {}

Sector.init({
  NombreSector: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  Descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'Sector',
  tableName: 'sectores', // Asegura que Sequelize use 'sectores' como el nombre de la tabla
  timestamps: true, // Esto habilita las columnas createdAt y updatedAt
});

module.exports = Sector;
