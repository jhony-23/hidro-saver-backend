const sequelize = require('../config/database');
const { logger } = require('../utils/logger');

// Script para migrar la base de datos existente a la nueva estructura
async function migrateDatabase() {
    try {
        console.log('🚀 Iniciando migración de base de datos...');
        
        // Verificar conexión
        await sequelize.authenticate();
        console.log('✅ Conexión a base de datos establecida');

        // Migrar tabla administradores
        await migrateAdministradoresTable();
        
        // Migrar tabla sectores (si es necesario)
        await migrateSectoresTable();
        
        console.log('✅ Migración completada exitosamente');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        process.exit(1);
    }
}

// Migrar tabla administradores
async function migrateAdministradoresTable() {
    try {
        console.log('📋 Migrando tabla administradores...');
        
        // Verificar qué columnas existen
        const [columns] = await sequelize.query(
            "SHOW COLUMNS FROM administradores"
        );
        
        const existingColumns = columns.map(col => col.Field.toLowerCase());
        console.log('Columnas existentes:', existingColumns);
        
        // Agregar columnas faltantes una por una
        const columnsToAdd = [
            {
                name: 'email',
                sql: 'ADD COLUMN email VARCHAR(255) NULL UNIQUE'
            },
            {
                name: 'role',
                sql: 'ADD COLUMN role VARCHAR(20) DEFAULT "admin"'
            },
            {
                name: 'activo',
                sql: 'ADD COLUMN activo BOOLEAN DEFAULT 1'
            },
            {
                name: 'ultimo_login',
                sql: 'ADD COLUMN ultimo_login DATETIME NULL'
            },
            {
                name: 'createdat',
                sql: 'ADD COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP'
            },
            {
                name: 'updatedat',
                sql: 'ADD COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
            }
        ];
        
        for (const column of columnsToAdd) {
            if (!existingColumns.includes(column.name)) {
                try {
                    await sequelize.query(
                        `ALTER TABLE administradores ${column.sql}`
                    );
                    console.log(`✅ Columna '${column.name}' agregada`);
                } catch (error) {
                    if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
                        console.log(`⚠️ Columna '${column.name}' ya existe`);
                    } else {
                        console.log(`⚠️ Error al agregar columna '${column.name}':`, error.message);
                    }
                }
            } else {
                console.log(`✅ Columna '${column.name}' ya existe`);
            }
        }
        
        console.log('✅ Migración de tabla administradores completada');
        
    } catch (error) {
        console.error('❌ Error al migrar tabla administradores:', error);
        throw error;
    }
}

// Migrar tabla sectores
async function migrateSectoresTable() {
    try {
        console.log('📋 Verificando tabla sectores...');
        
        // Verificar qué columnas existen
        const [columns] = await sequelize.query(
            "SHOW COLUMNS FROM sectores"
        );
        
        const existingColumns = columns.map(col => col.Field.toLowerCase());
        console.log('Columnas existentes en sectores:', existingColumns);
        
        // Agregar timestamps si no existen
        const timestampColumns = [
            {
                name: 'createdat',
                sql: 'ADD COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP'
            },
            {
                name: 'updatedat',
                sql: 'ADD COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
            }
        ];
        
        for (const column of timestampColumns) {
            if (!existingColumns.includes(column.name)) {
                try {
                    await sequelize.query(
                        `ALTER TABLE sectores ${column.sql}`
                    );
                    console.log(`✅ Columna '${column.name}' agregada a sectores`);
                } catch (error) {
                    if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
                        console.log(`⚠️ Columna '${column.name}' ya existe en sectores`);
                    } else {
                        console.log(`⚠️ Error al agregar columna '${column.name}' a sectores:`, error.message);
                    }
                }
            }
        }
        
        console.log('✅ Verificación de tabla sectores completada');
        
    } catch (error) {
        console.error('❌ Error al verificar tabla sectores:', error);
        throw error;
    }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
    migrateDatabase();
}

module.exports = { migrateDatabase };