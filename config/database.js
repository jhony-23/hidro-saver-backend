const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('Bds_Hidro', 'root', 'ixc221231', {
  host: 'localhost',
  port: 3307,           // 👈 muy importante, porque ya no es 3306
  dialect: 'mysql',
  logging: console.log, // puedes desactivarlo con false
});

module.exports = sequelize;
