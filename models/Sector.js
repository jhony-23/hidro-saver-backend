const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Asegúrate de que la ruta sea correcta

class Sector extends Model {}

Sector.init({
  NombreSector: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'nombresector' // Mapear al campo existente
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'nombre' // Campo existente alternativo
  },
  Descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'descripcion' // Mapear al campo existente
  },
  codigo_sector: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ubicacion_geo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  responsable: {
    type: DataTypes.STRING,
    allowNull: true
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Sector',
  tableName: 'sectores',
  timestamps: true,
  createdAt: 'created_at', // Mapear a los campos existentes
  updatedAt: 'updated_at'
});

module.exports = Sector;
