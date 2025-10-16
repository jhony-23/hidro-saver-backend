# 🔐 Guía de Autenticación - Hidro Saver Backend

## 📋 Flujo de Autenticación Mejorado

### 🚀 Primera Vez (Configuración del Sistema)

**1. Verificar estado del sistema**

```http
GET /auth/check-admin
```

**Respuesta si NO hay administradores:**

```json
{
  "existenAdmins": false,
  "mensaje": "No hay administradores registrados"
}
```

**2. Configurar primer administrador**

```http
POST /auth/setup-admin
Content-Type: application/json

{
  "nombre": "Admin",
  "email": "admin@hidrosaver.com",
  "contraseña": "TuContraseñaSegura123!"
}
```

**Respuesta exitosa:**

```json
{
  "success": true,
  "message": "Sistema configurado exitosamente. Primer administrador creado.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nombre": "Admin",
    "email": "admin@hidrosaver.com",
    "role": "superadmin"
  }
}
```

### 🔑 Login Normal (Sistema Ya Configurado)

**1. Verificar que hay administradores**

```http
GET /auth/check-admin
```

**Respuesta si YA hay administradores:**

```json
{
  "existenAdmins": true,
  "mensaje": "Ya existen administradores"
}
```

**2. Hacer login**

```http
POST /auth/login
Content-Type: application/json

{
  "nombre": "Admin",
  "contraseña": "TuContraseñaSegura123!"
}
```

**Respuesta exitosa:**

```json
{
  "success": true,
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": 1,
    "nombre": "Admin",
    "email": "admin@hidrosaver.com",
    "role": "superadmin",
    "ultimo_login": "2025-10-03T21:30:00.000Z"
  }
}
```

### ➕ Crear Administradores Adicionales (Solo Superadmins)

**Requiere autenticación con token de superadmin**

```http
POST /auth/register
Authorization: Bearer tu_token_aqui
Content-Type: application/json

{
  "nombre": "NuevoAdmin",
  "email": "nuevo@hidrosaver.com",
  "contraseña": "ContraseñaSegura456!",
  "role": "admin"
}
```

### 🛡️ Usando las Rutas Protegidas

Todas las rutas que requieren autenticación necesitan el header:

```http
Authorization: Bearer tu_token_aqui
```

**Ejemplos:**

```http
GET /usuarios
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

POST /sectores
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
{
  "nombre": "Nuevo Sector",
  "descripcion": "Descripción del sector"
}
```

## 🔄 Flujo Recomendado para el Frontend

### Al Cargar la Aplicación:

1. Verificar si hay token guardado
2. Si NO hay token → verificar `/auth/check-admin`
   - Si no hay admins → mostrar formulario "Configurar Sistema" → `/auth/setup-admin`
   - Si hay admins → mostrar formulario "Iniciar Sesión" → `/auth/login`
3. Si HAY token → validar que funciona con una petición autenticada

### Estados de la Aplicación:

- **🔧 Setup Mode**: No hay administradores, mostrar configuración inicial
- **🔐 Login Mode**: Hay administradores, mostrar login normal
- **✅ Authenticated**: Usuario logueado, mostrar dashboard

## ⚠️ Manejo de Errores

### Error 403 en /auth/setup-admin:

```json
{
  "error": "Configuración no permitida",
  "message": "El sistema ya tiene administradores configurados. Use /auth/login para ingresar."
}
```

**Acción:** Redirigir al login normal

### Error 401 en rutas protegidas:

```json
{
  "error": "Token requerido",
  "message": "No se proporcionó token de autenticación"
}
```

**Acción:** Redirigir al login

### Error 403 en /auth/register:

```json
{
  "error": "Acceso denegado",
  "message": "Solo los superadministradores pueden crear nuevos administradores"
}
```

**Acción:** Mostrar mensaje de permisos insuficientes

## 🚀 Rutas Disponibles

### Públicas:

- `GET /` - Información de la API
- `GET /health` - Estado del servidor
- `GET /auth/check-admin` - Verificar administradores

### Configuración Inicial:

- `POST /auth/setup-admin` - Solo si no hay administradores

### Autenticación:

- `POST /auth/login` - Login normal
- `POST /auth/refresh` - Renovar token
- `POST /auth/logout` - Cerrar sesión

### Protegidas (requieren autenticación):

- `POST /auth/register` - Crear admin (solo superadmin)
- `GET /usuarios` - Listar usuarios
- `POST /usuarios` - Crear usuario
- `GET /pagos` - Listar pagos
- `POST /pagos` - Crear pago
- `GET /sectores` - Listar sectores
- `POST /sectores` - Crear sector
- `GET /reportes/*` - Reportes y estadísticas
