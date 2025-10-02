const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sequelize = require('./config/database'); // Conexión a la base de datos
const pagoRoutes = require('./routes/pagos'); // Rutas para pagos
const usuarioRoutes = require('./routes/usuarios'); // Rutas para usuarios
const adminRoutes = require('./routes/adminRoutes'); // Rutas para administradores
const Usuario = require('./models/Usuario'); 
const Sector = require('./models/Sector');
const Pago = require('./models/Pago');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: 'http://localhost:5000' })); // Permitir solicitudes desde el frontend
app.use(bodyParser.json());

// Sincronizar la base de datos
sequelize.sync()
    .then(() => console.log('Base de datos conectada'))
    .catch(err => console.error('No se pudo conectar a la base de datos:', err));

// Definir las relaciones
Usuario.belongsTo(Sector, { foreignKey: 'sectorId', targetKey: 'id' });
Sector.hasMany(Usuario, { foreignKey: 'sectorId', sourceKey: 'id' });
Usuario.hasMany(Pago, { foreignKey: 'UsuarioId', sourceKey: 'id' }); // Relación Usuario-Pago
Pago.belongsTo(Usuario, { foreignKey: 'UsuarioId', targetKey: 'id' });

// Rutas
app.use('/usuarios', usuarioRoutes); // Usar las rutas de usuarios
app.use('/pagos', pagoRoutes); // Usar las rutas de pagos
app.use('/admin', adminRoutes); // Usar las rutas de administradores

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
