-- Script para crear la base de datos HidroSaver en SQL Server
-- Ejecutar este script en SQL Server Management Studio o Azure Data Studio

-- 1. Crear la base de datos
USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'Bds_Hidro')
BEGIN
    CREATE DATABASE Bds_Hidro;
END
GO

-- 2. Usar la base de datos
USE Bds_Hidro;
GO

-- 3. Crear tabla Sectores
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='sectores' AND xtype='U')
BEGIN
    CREATE TABLE sectores (
        id INT IDENTITY(1,1) PRIMARY KEY,
        NombreSector NVARCHAR(255) NOT NULL,
        Descripcion NTEXT NULL,
        createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        updatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
GO

-- 4. Crear tabla Usuarios
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='usuarios' AND xtype='U')
BEGIN
    CREATE TABLE usuarios (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nombre NVARCHAR(255) NOT NULL,
        apellido NVARCHAR(255) NOT NULL,
        dpi NVARCHAR(255) NOT NULL,
        CodigoBarras NVARCHAR(255) NOT NULL UNIQUE,
        sectorId INT NOT NULL,
        createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (sectorId) REFERENCES sectores(id)
    );
END
GO

-- 5. Crear tabla Administradores
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='administradores' AND xtype='U')
BEGIN
    CREATE TABLE administradores (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nombre NVARCHAR(255) NOT NULL,
        contraseña NVARCHAR(255) NOT NULL,
        createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        updatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
GO

-- 6. Crear tabla Pagos
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Pagos' AND xtype='U')
BEGIN
    CREATE TABLE Pagos (
        id INT IDENTITY(1,1) PRIMARY KEY,
        UsuarioId INT NOT NULL,
        FechaPago DATETIME2 NOT NULL DEFAULT GETDATE(),
        MesCancelado NVARCHAR(255) NOT NULL,
        Monto DECIMAL(10,2) NOT NULL DEFAULT 50.00,
        createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (UsuarioId) REFERENCES usuarios(id)
    );
END
GO

-- 7. Insertar datos de ejemplo en Sectores
IF NOT EXISTS (SELECT * FROM sectores)
BEGIN
    INSERT INTO sectores (NombreSector, Descripcion) VALUES 
    ('Sector 1', 'x1'),
    ('Sector 2', 'x2'),
    ('Sector 3', 'x3'),
    ('Sector 4', 'x4'),

END
GO

-- 8. Insertar administrador por defecto
IF NOT EXISTS (SELECT * FROM administradores WHERE nombre = 'admin')
BEGIN
    INSERT INTO administradores (nombre, contraseña) VALUES 
    ('admin', 'admin123'); -- Cambiar por una contraseña segura
END
GO

-- 9. Crear índices para mejor rendimiento
CREATE NONCLUSTERED INDEX IX_usuarios_CodigoBarras ON usuarios(CodigoBarras);
CREATE NONCLUSTERED INDEX IX_usuarios_sectorId ON usuarios(sectorId);
CREATE NONCLUSTERED INDEX IX_Pagos_UsuarioId ON Pagos(UsuarioId);
CREATE NONCLUSTERED INDEX IX_Pagos_FechaPago ON Pagos(FechaPago);
GO

PRINT 'Base de datos Bds_Hidro creada exitosamente con todas las tablas y datos iniciales.';