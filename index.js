const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar configuración y modelos
const sequelize = require('./config/database');
const { logger, loggerMiddleware } = require('./utils/logger');

// Importar modelos
const Usuario = require('./models/Usuario'); 
const Sector = require('./models/Sector');
const Pago = require('./models/Pago');
const Administrador = require('./models/Administrador');

// Importar rutas
const authRoutes = require('./routes/auth');
const usuarioRoutes = require('./routes/usuarios');
const pagoRoutes = require('./routes/pagos');
const sectorRoutes = require('./routes/sectores');
const reporteRoutes = require('./routes/reportes');
const adminRoutes = require('./routes/adminRoutes'); // Mantener compatibilidad

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
}));

// Rate limiting global
const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutos por defecto
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 100), // 100 requests por IP por ventana
    message: {
        error: 'Demasiadas solicitudes',
        message: 'Has excedido el límite de solicitudes. Intenta de nuevo más tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(generalLimiter);

// CORS configurado desde variables de entorno
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));

// Middleware de parsing
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware de logging
app.use(loggerMiddleware);

// Definir las relaciones de la base de datos
Usuario.belongsTo(Sector, { foreignKey: 'sectorId', targetKey: 'id' });
Sector.hasMany(Usuario, { foreignKey: 'sectorId', sourceKey: 'id' });
Usuario.hasMany(Pago, { foreignKey: 'UsuarioId', sourceKey: 'id' });
Pago.belongsTo(Usuario, { foreignKey: 'UsuarioId', targetKey: 'id' });

// Ruta de health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Rutas principales
app.use('/auth', authRoutes);           // Autenticación mejorada
app.use('/usuarios', usuarioRoutes);    // Gestión de usuarios
app.use('/pagos', pagoRoutes);         // Gestión de pagos
app.use('/sectores', sectorRoutes);    // Gestión de sectores
app.use('/reportes', reporteRoutes);   // Reportes y consultas avanzadas
app.use('/admin', adminRoutes);        // Mantener compatibilidad con rutas antiguas

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        message: '💧 Hidro Saver Backend API',
        version: '2.0.0',
        documentation: '/api/docs',
        health: '/health',
        endpoints: {
            auth: '/auth',
            usuarios: '/usuarios',
            pagos: '/pagos',
            sectores: '/sectores',
            reportes: '/reportes'
        }
    });
});

// Middleware de manejo de errores 404
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint no encontrado',
        message: `La ruta ${req.method} ${req.originalUrl} no existe`,
        availableEndpoints: ['/auth', '/usuarios', '/pagos', '/sectores', '/reportes']
    });
});

// Middleware de manejo de errores global
app.use((error, req, res, next) => {
    logger.error('Error no manejado:', error);
    
    res.status(error.status || 500).json({
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Algo salió mal',
        timestamp: new Date().toISOString()
    });
});

// Función para inicializar la base de datos
async function initializeDatabase() {
    try {
        // Verificar conexión a la base de datos
        await sequelize.authenticate();
        logger.info('✅ Base de datos conectada correctamente');

        // Intentar crear sectores por defecto solo si no existen
        try {
            const sectorCount = await Sector.count();
            if (sectorCount === 0) {
                const sectoresDefault = [
                    { NombreSector: 'Sector Centro', Descripcion: 'Área central del municipio' },
                    { NombreSector: 'Sector Gonzales', Descripcion: 'Zona residencial Gonzales' },
                    { NombreSector: 'Sector Buena Vista', Descripcion: 'Área de Buena Vista' }
                ];

                // Crear sectores uno por uno para evitar errores de timestamps
                for (const sectorData of sectoresDefault) {
                    try {
                        const existe = await Sector.findOne({
                            where: { NombreSector: sectorData.NombreSector }
                        });
                        if (!existe) {
                            await Sector.create(sectorData);
                        }
                    } catch (sectorError) {
                        logger.warn(`Advertencia al crear sector ${sectorData.NombreSector}:`, sectorError.message);
                    }
                }
                logger.info('✅ Verificación de sectores completada');
            }
        } catch (sectorError) {
            logger.warn('⚠️ Advertencia con sectores:', sectorError.message);
        }

        logger.info('🚀 Base de datos inicializada correctamente');
        
    } catch (error) {
        logger.error('❌ Error al conectar con la base de datos:', error);
        process.exit(1);
    }
}

// Función para iniciar el servidor
async function startServer() {
    try {
        await initializeDatabase();
        
        const server = app.listen(PORT, () => {
            logger.info(`🚀 Servidor Hidro Saver corriendo en http://localhost:${PORT}`);
            logger.info(`📝 Entorno: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`🔒 CORS habilitado para: ${corsOptions.origin}`);
            
            // Mostrar rutas disponibles en desarrollo
            if (process.env.NODE_ENV !== 'production') {
                logger.info('📋 Rutas de autenticación:');
                logger.info('   � GET /auth/check-admin - Verificar si hay administradores');
                logger.info('   � POST /auth/setup-admin - Configurar primer administrador');
                logger.info('   � POST /auth/login - Login de administradores existentes');
                logger.info('   ➕ POST /auth/register - Crear nuevo admin (requiere superadmin)');
                logger.info('📋 Rutas principales:');
                logger.info('   � GET /usuarios - Listar usuarios (requiere auth)');
                logger.info('   💰 GET /pagos - Listar pagos (requiere auth)');
                logger.info('   🏢 GET /sectores - Listar sectores');
                logger.info('   📊 GET /reportes/* - Reportes y estadísticas (requiere auth)');
            }
        });

        // Manejo de cierre graceful
        process.on('SIGTERM', () => {
            logger.info('SIGTERM recibido, cerrando servidor...');
            server.close(() => {
                logger.info('Servidor cerrado correctamente');
                sequelize.close();
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            logger.info('SIGINT recibido, cerrando servidor...');
            server.close(() => {
                logger.info('Servidor cerrado correctamente');
                sequelize.close();
                process.exit(0);
            });
        });

    } catch (error) {
        logger.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
}

// Iniciar la aplicación
startServer();
