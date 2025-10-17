// Cargar variables de entorno PRIMERO desde el .env del backend
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const sequelize = require('./config/database'); // Conexión a la base de datos
const pagoRoutes = require('./routes/pagos'); // Rutas para pagos
const usuarioRoutes = require('./routes/usuarios'); // Rutas para usuarios
const adminRoutes = require('./routes/adminRoutes'); // Rutas para administradores
const Usuario = require('./models/Usuario'); 
const Sector = require('./models/Sector');
const Pago = require('./models/Pago');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware CORS (permitir header Authorization)
app.use(cors({
    origin: 'http://localhost:5000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet());
app.use(bodyParser.json());
const auth = require('./middleware/auth');

// Sincronizar la base de datos
sequelize.sync()
    .then(() => console.log('Base de datos conectada'))
    .catch(err => console.error('No se pudo conectar a la base de datos:', err));

// Definir las relaciones
Usuario.belongsTo(Sector, { foreignKey: 'sectorId', targetKey: 'id' });
Sector.hasMany(Usuario, { foreignKey: 'sectorId', sourceKey: 'id' });
Usuario.hasMany(Pago, { foreignKey: 'UsuarioId', sourceKey: 'id' }); // Relación Usuario-Pago
Pago.belongsTo(Usuario, { foreignKey: 'UsuarioId', targetKey: 'id' });

// Rutas públicas
app.use('/admin', adminRoutes); // login y perfil (perfil validará token internamente)

// Rutas protegidas por JWT
app.use('/usuarios', auth, usuarioRoutes);
app.use('/pagos', auth, pagoRoutes);

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
