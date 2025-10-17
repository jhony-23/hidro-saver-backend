const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Debug: Mostrar las variables de entorno
console.log('=== CONFIGURACIÓN DE BASE DE DATOS ===');
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('=====================================');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'Bds_Hidro',
  process.env.DB_USER || 'sa',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: process.env.DB_DIALECT || 'mssql',
    port: process.env.DB_PORT || 1433,
    dialectOptions: {
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
      }
    },
    logging: console.log // Para ver las consultas SQL (opcional)
  }
);

module.exports = sequelize;
