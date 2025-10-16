# 💧 Hidro Saver Backend v2.0

## 📋 Descripción

**Hidro Saver Backend v2.0** es la API REST avanzada del sistema de gestión de usuarios y pagos para el proyecto Hidro Saver. Esta versión mejorada incluye autenticación robusta, reportes avanzados, validaciones estrictas y funcionalidades empresariales para un sistema completo de gestión de agua potable.

## 🚀 Características Principales

### 🔐 **Autenticación y Seguridad**

- ✅ **Sistema de Login Avanzado** con JWT y Refresh Tokens
- ✅ **Registro de Primer Administrador** automático si no existen admins
- ✅ **Roles y Permisos** (Admin y SuperAdmin)
- ✅ **Rate Limiting** para prevenir ataques de fuerza bruta
- ✅ **Helmet** para headers de seguridad
- ✅ **Validaciones Joi** estrictas en todos los endpoints

### 👥 **Gestión de Usuarios Mejorada**

- ✅ **CRUD Completo** con validaciones avanzadas
- ✅ **Búsqueda y Filtrado** por nombre, DPI, sector, código de barras
- ✅ **Paginación** para manejo de grandes volúmenes
- ✅ **Generación Automática** de códigos de barras únicos
- ✅ **Validación de DPI** único por usuario
- ✅ **Historial de Pagos** por usuario

### 🏢 **Gestión de Sectores**

- ✅ **CRUD de Sectores** con permisos administrativos
- ✅ **Sectores por Defecto** (Centro, Gonzales, Buena Vista)
- ✅ **Estadísticas por Sector** (usuarios, pagos, recaudación)
- ✅ **Validación de Integridad** (no eliminar sectores con usuarios)

### 💰 **Sistema de Pagos Avanzado**

- ✅ **Idempotencia** - previene pagos duplicados por mes
- ✅ **Transacciones de Base de Datos** para integridad
- ✅ **Verificación Previa** de estado de pagos
- ✅ **Historial Completo** de pagos por usuario
- ✅ **Auditoría de Cambios** con logging detallado

### 📊 **Reportes y Consultas Avanzadas**

- ✅ **Reporte de Morosos** por período y sector
- ✅ **Reporte de Pagos** con filtros avanzados
- ✅ **Reporte General** con KPIs y tendencias
- ✅ **Dashboard Administrativo** con métricas en tiempo real
- ✅ **Estadísticas por Sector** detalladas
- ✅ **Comparación con Períodos Anteriores**

### 🔧 **Funcionalidades Técnicas**

- ✅ **Logging Estructurado** con Winston
- ✅ **Manejo de Errores** centralizado y detallado
- ✅ **Variables de Entorno** para configuración
- ✅ **Health Check** endpoint para monitoreo
- ✅ **Cierre Graceful** del servidor
- ✅ **Documentación de API** integrada

## 🛠️ Tecnologías Utilizadas

### **Core Backend**

- **Node.js v18+** - Entorno de ejecución moderno
- **Express.js** - Framework web minimalista
- **Sequelize** - ORM avanzado para base de datos
- **MySQL** - Sistema de gestión de base de datos

### **Seguridad**

- **JWT (jsonwebtoken)** - Autenticación stateless
- **bcrypt** - Hash seguro de contraseñas
- **Helmet** - Headers de seguridad HTTP
- **express-rate-limit** - Limitación de tasa de requests

### **Validación y Logging**

- **Joi** - Validación de esquemas de datos
- **Winston** - Sistema de logging estructurado
- **CORS** - Políticas de origen cruzado configurables

### **Utilidades**

- **dotenv** - Gestión de variables de entorno
- **nanoid** - Generación de IDs únicos

## 📁 Estructura del Proyecto Mejorada

```
hidro-saver-backend/
├── config/
│   └── database.js         # Configuración de base de datos
├── models/
│   ├── Administrador.js     # Modelo de administrador
│   ├── Pago.js             # Modelo de pagos
│   ├── Sector.js           # Modelo de sectores
│   └── Usuario.js          # Modelo de usuarios
├── routes/
│   ├── adminRoutes.js      # Rutas administrativas
│   ├── pagos.js           # Rutas de pagos
│   └── usuarios.js        # Rutas de usuarios
├── .gitignore
├── index.js               # Archivo principal del servidor
├── package.json
├── package-lock.json
└── README.md
```

## ⚙️ Instalación y Configuración

### Prerrequisitos

- Node.js (v16 o superior)
- MySQL Server
- npm o yarn

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd hidro-saver-backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar la base de datos

1. Crear una base de datos MySQL llamada `Bds_Hidro`
2. Configurar las credenciales en `config/database.js`:

```javascript
const sequelize = new Sequelize("Bds_Hidro", "tu_usuario", "tu_contraseña", {
  host: "localhost",
  dialect: "mysql",
});
```

### 4. Configurar variables de entorno (opcional)

Crear un archivo `.env` en la raíz del proyecto:

```env
PORT=3000
DB_NAME=Bds_Hidro
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_HOST=localhost
JWT_SECRET=tu_clave_secreta
```

### 5. Iniciar el servidor

```bash
# Desarrollo
npm start

# O directamente con Node
node index.js
```

El servidor se ejecutará en `http://localhost:3000`

## 📊 Modelos de Base de Datos

### Usuario

- **id**: Identificador único
- **nombre**: Nombre del usuario
- **email**: Correo electrónico
- **password**: Contraseña cifrada
- **sectorId**: Referencia al sector

### Sector

- **id**: Identificador único
- **nombre**: Nombre del sector
- **descripcion**: Descripción del sector

### Pago

- **id**: Identificador único
- **monto**: Cantidad del pago
- **fecha**: Fecha del pago
- **estado**: Estado del pago
- **UsuarioId**: Referencia al usuario

### Administrador

- **id**: Identificador único
- **nombre**: Nombre del administrador
- **email**: Correo electrónico
- **password**: Contraseña cifrada

## 🛣️ Endpoints de la API

### Usuarios (`/usuarios`)

- `GET /usuarios` - Obtener todos los usuarios
- `POST /usuarios` - Crear un nuevo usuario
- `GET /usuarios/:id` - Obtener usuario por ID
- `PUT /usuarios/:id` - Actualizar usuario
- `DELETE /usuarios/:id` - Eliminar usuario

### Pagos (`/pagos`)

- `GET /pagos` - Obtener todos los pagos
- `POST /pagos` - Registrar un nuevo pago
- `GET /pagos/:id` - Obtener pago por ID
- `PUT /pagos/:id` - Actualizar pago
- `DELETE /pagos/:id` - Eliminar pago

### Administración (`/admin`)

- Endpoints específicos para funcionalidades administrativas

## 🔧 Scripts Disponibles

```bash
# Iniciar el servidor
npm start

# Ejecutar tests (por implementar)
npm test
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📝 Notas de Desarrollo

- La aplicación utiliza Sequelize para manejar las relaciones entre modelos
- CORS está configurado para permitir peticiones desde `http://localhost:5000`
- Las contraseñas se cifran automáticamente usando bcrypt
- La base de datos se sincroniza automáticamente al iniciar el servidor

## 🔒 Seguridad

- Contraseñas cifradas con bcrypt
- Autenticación JWT implementada
- Validación de datos de entrada
- CORS configurado para dominios específicos

## 📈 Próximas Mejoras

- [ ] Implementar tests unitarios
- [ ] Agregar validaciones más robustas
- [ ] Implementar logging avanzado
- [ ] Agregar documentación de API con Swagger
- [ ] Implementar cache con Redis
- [ ] Agregar más endpoints administrativos

## 📞 Contacto

**Proyecto Académico** - Licenciatura en Informática  
**Materia**: Ingeniería de Software  
**Año**: 3° Año

---

⭐ Si este proyecto te ha been útil, no olvides darle una estrella!
