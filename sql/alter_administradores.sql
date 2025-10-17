-- Alteraciones para la tabla administradores en SQL Server
USE Bds_Hidro;
GO

IF COL_LENGTH('administradores', 'apellido') IS NULL
BEGIN
  ALTER TABLE administradores ADD apellido NVARCHAR(255) NULL;
END
GO

IF COL_LENGTH('administradores', 'dpi') IS NULL
BEGIN
  ALTER TABLE administradores ADD dpi NVARCHAR(50) NULL;
  -- Asegurar unicidad si lo desean único
  CREATE UNIQUE INDEX IX_administradores_dpi ON administradores(dpi);
END
GO

IF COL_LENGTH('administradores', 'cargo') IS NULL
BEGIN
  ALTER TABLE administradores ADD cargo NVARCHAR(255) NULL;
END
GO

IF COL_LENGTH('administradores', 'telefono') IS NULL
BEGIN
  ALTER TABLE administradores ADD telefono NVARCHAR(30) NULL;
END
GO

IF COL_LENGTH('administradores', 'rol') IS NULL
BEGIN
  ALTER TABLE administradores ADD rol NVARCHAR(20) NOT NULL DEFAULT 'ADMIN';
END
GO

IF COL_LENGTH('administradores', 'estado') IS NULL
BEGIN
  ALTER TABLE administradores ADD estado BIT NOT NULL DEFAULT 1;
END
GO

IF COL_LENGTH('administradores', 'lastLoginAt') IS NULL
BEGIN
  ALTER TABLE administradores ADD lastLoginAt DATETIME2 NULL;
END
GO

-- Opcional: campos para auditoría o reseteos más avanzados
-- ALTER TABLE administradores ADD createdByAdminId INT NULL, updatedByAdminId INT NULL;
-- ALTER TABLE administradores ADD resetCode NVARCHAR(10) NULL, resetCodeExpires DATETIME2 NULL;
