# 🔗 HIDRO SAVER - API ENDPOINTS PARA FRONTEND

## 📡 **CONFIGURACIÓN BASE**

```javascript
const BASE_URL = "http://localhost:3000";
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
};
```

## 🔐 **AUTENTICACIÓN**

### 1. Verificar Admin Existente

```javascript
GET / auth / check - admin;
// Response: { existenAdmins: boolean, mensaje: string }
```

### 2. Crear Primer Admin

```javascript
POST / auth / register - admin;
// Body: { nombre: string, contraseña: string, email?: string }
// Response: { success: boolean, message: string, admin: object }
```

### 3. Login

```javascript
POST / auth / login;
// Body: { nombre: string, contraseña: string }
// Response: {
//   success: boolean,
//   message: string,
//   token: string,        // ⭐ Campo para frontend
//   accessToken: string,  // Compatibilidad
//   admin: object
// }
```

## 👥 **USUARIOS**

### 1. Listar Usuarios (Requiere Auth)

```javascript
GET /usuarios?search=string&sector=number&page=number&limit=number
// Headers: Authorization required
// Response: {
//   success: boolean,
//   usuarios: [{
//     id: number,
//     nombre: string,
//     apellido: string,
//     dpi: string,
//     codigo_barras: string,    // ⭐ Campo para frontend
//     sector_id: number,        // ⭐ Campo para frontend
//     sector_nombre: string,    // ⭐ Campo para frontend
//     createdAt: date,          // ⭐ Campo para frontend
//     Sector: object            // Compatibilidad
//   }],
//   pagination: object
// }
```

### 2. Buscar Usuario por Código

```javascript
GET /usuarios/:codigo
// Response: {
//   success: boolean,
//   usuario: {
//     // Misma estructura que arriba
//   }
// }
```

### 3. Crear Usuario (Requiere Auth)

```javascript
POST / usuarios / agregar;
// Headers: Authorization required
// Body: { nombre: string, apellido: string, dpi: string, sectorId: number }
// Response: { success: boolean, message: string, usuario: object }
```

### 4. Actualizar Usuario (Requiere Auth)

```javascript
PUT /usuarios/:id
// Headers: Authorization required
// Body: { nombre: string, apellido: string, dpi: string, sectorId: number }
```

### 5. Eliminar Usuario (Requiere Auth)

```javascript
DELETE /usuarios/:id
// Headers: Authorization required
```

## 🏢 **SECTORES**

### 1. Listar Sectores (Público)

```javascript
GET / sectores;
// Response: {
//   success: boolean,
//   sectores: [{
//     id: number,
//     nombre: string,           // ⭐ Campo para frontend
//     descripcion: string,      // ⭐ Campo para frontend
//     NombreSector: string,     // Compatibilidad
//     Descripcion: string,      // Compatibilidad
//     createdAt: date
//   }]
// }
```

### 2. Crear Sector (Requiere Auth)

```javascript
POST / sectores;
// Headers: Authorization required
// Body: {
//   nombre: string,           // ⭐ Frontend puede usar este campo
//   descripcion: string       // ⭐ Frontend puede usar este campo
// }
// O: { NombreSector: string, Descripcion: string } // Compatibilidad
```

### 3. Eliminar Sector (Requiere Auth)

```javascript
DELETE /sectores/:id
// Headers: Authorization required
```

## 💰 **PAGOS**

### 1. Procesar Pago (Requiere Auth)

```javascript
POST / pagos;
// Headers: Authorization required
// Body: {
//   codigoBarras: string,     // ⭐ Frontend puede usar este campo
//   mes: string,              // Formato "YYYY-MM"
//   monto: number
// }
// O: { CodigoBarras: string, mes: string, monto: number } // Compatibilidad
// Response: {
//   success: boolean,
//   message: string,          // ⭐ Campo para frontend
//   resumen: {                // ⭐ Campo para frontend
//     nombreUsuario: string,
//     sectorNombre: string,
//     sectorDescripcion: string,
//     monto: number,
//     mesCancelado: string
//   }
// }
```

### 2. Listar Pagos (Requiere Auth)

```javascript
GET /pagos?periodo=string&sector=number&page=number&limit=number
// Headers: Authorization required
```

### 3. Verificar Pago

```javascript
GET /pagos/verificar/:codigoBarras/:mes
// Response: { yaPago: boolean, usuario: object, pago?: object }
```

## 📊 **REPORTES** (Todos requieren Auth)

### 1. Reporte de Morosos

```javascript
GET /reportes/morosos?periodo=YYYY-MM&sector=number
// Headers: Authorization required
// Response: {
//   success: boolean,
//   periodo: string,
//   morosos: [{
//     nombre: string,
//     apellido: string,
//     dpi: string,
//     codigo_barras: string,
//     sector: object
//   }],
//   estadisticas: object
// }
```

### 2. Reporte General

```javascript
GET /reportes/general?periodo=YYYY-MM
// Headers: Authorization required
// Response: {
//   success: boolean,
//   periodo: string,
//   resumen: {
//     totalUsuarios: number,
//     usuariosQuePagaron: number,
//     morosos: number,
//     porcentajeMorosos: number,
//     recaudacionTotal: number
//   }
// }
```

### 3. Dashboard

```javascript
GET / reportes / dashboard;
// Headers: Authorization required
// Response: {
//   success: boolean,
//   dashboard: {
//     kpis: object,
//     ultimosPagos: array
//   }
// }
```

## ⚠️ **MANEJO DE ERRORES**

### Estructura de Error Estándar:

```javascript
{
  error: string,
  message: string,
  status?: number
}
```

### Códigos de Estado:

- `200`: Success
- `201`: Created
- `400`: Bad Request (validación)
- `401`: Unauthorized (sin token o token inválido)
- `404`: Not Found
- `409`: Conflict (duplicados)
- `500`: Internal Server Error

## 🔧 **CONFIGURACIÓN CORS**

El backend está configurado para aceptar requests desde:

- `http://localhost:5000` (puerto del frontend)

## 💾 **LOCALSTORAGE**

```javascript
// Guardar token
localStorage.setItem("adminToken", response.token);

// Obtener token
const token = localStorage.getItem("adminToken");

// Limpiar al logout
localStorage.removeItem("adminToken");
```

## 🎯 **CAMPOS CLAVE PARA FRONTEND**

### ✅ **USUARIOS:**

- `codigo_barras` (en lugar de `CodigoBarras`)
- `sector_id` (campo directo)
- `sector_nombre` (campo directo)
- `createdAt` (para ordenamiento)

### ✅ **SECTORES:**

- `nombre` (en lugar de `NombreSector`)
- `descripcion` (en lugar de `Descripcion`)

### ✅ **PAGOS:**

- `codigoBarras` (acepta este campo)
- `message` (respuesta estándar)
- `resumen` (objeto con datos del pago)

### ✅ **AUTH:**

- `token` (campo principal para frontend)
- `message` (respuesta estándar)
