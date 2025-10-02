const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('Bds_Hidro', 'root', '', {
  host: 'localhost',
  dialect: 'mysql'
});

module.exports = sequelize;
