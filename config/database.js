const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('Bds_Hidro', 'root', '123456789', {
  host: 'localhost',
  dialect: 'mysql'
});

module.exports = sequelize;
