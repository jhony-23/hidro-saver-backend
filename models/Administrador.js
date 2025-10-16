const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const connection = require('../config/database'); // Usar 'connection' para la instancia de Sequelize

// Definir el modelo Administrador compatible con la estructura existente
const Administrador = connection.define('Administrador', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'username' // Mapear al campo existente
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre es obligatorio' },
            len: [3, 50] // Asegura que el nombre tenga entre 3 y 50 caracteres
        }
    },
    apellido: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isEmail: { msg: 'Debe ser un email válido' }
        }
    },
    password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'password_hash', // Mapear al campo existente
        validate: {
            notEmpty: { msg: 'La contraseña es obligatoria' },
            len: [8, 255] // La contraseña debe tener al menos 8 caracteres
        }
    },
    telefono: {
        type: DataTypes.STRING,
        allowNull: true
    },
    role: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'admin'
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true
    },
    ultimo_login: {
        type: DataTypes.DATE,
        allowNull: true
    },
    last_login: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_login' // Campo existente
    },
    deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: true,
    createdAt: 'created_at', // Mapear a los campos existentes
    updatedAt: 'updated_at',
    tableName: 'administradores',
    hooks: {
        beforeCreate: async (admin) => {
            if (admin.password_hash && !admin.password_hash.startsWith('$2b$')) {
                admin.password_hash = await bcrypt.hash(admin.password_hash, 12);
            }
        },
        beforeUpdate: async (admin) => {
            if (admin.changed('password_hash') && admin.password_hash && !admin.password_hash.startsWith('$2b$')) {
                admin.password_hash = await bcrypt.hash(admin.password_hash, 12);
            }
        }
    }
});

// Método para verificar contraseña
Administrador.prototype.verificarContraseña = async function(contraseña) {
    return await bcrypt.compare(contraseña, this.password_hash);
};

// Método para actualizar último login
Administrador.prototype.actualizarUltimoLogin = async function() {
    this.ultimo_login = new Date();
    this.last_login = new Date();
    await this.save();
};

module.exports = Administrador;
