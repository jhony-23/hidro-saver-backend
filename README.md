# 💧 Hidro Saver Backend

## 📋 Descripción

**Hidro Saver Backend** es la API REST del sistema de gestión de usuarios y pagos para el proyecto Hidro Saver. Este backend proporciona servicios para la administración de usuarios por sectores, gestión de pagos y funcionalidades administrativas para un sistema de gestión de agua potable.

## 🚀 Características

- ✅ **Gestión de Usuarios**: CRUD completo para usuarios del sistema
- ✅ **Gestión de Sectores**: Organización de usuarios por sectores geográficos
- ✅ **Sistema de Pagos**: Registro y seguimiento de pagos de usuarios
- ✅ **Panel Administrativo**: Funcionalidades exclusivas para administradores
- ✅ **Autenticación JWT**: Sistema seguro de autenticación
- ✅ **Cifrado de Contraseñas**: Uso de bcrypt para seguridad
- ✅ **Base de Datos MySQL**: Persistencia de datos confiable
- ✅ **CORS configurado**: Comunicación segura con el frontend

## 🛠️ Tecnologías Utilizadas

- **Node.js** - Entorno de ejecución
- **Express.js** - Framework web
- **Sequelize** - ORM para base de datos
- **MySQL** - Sistema de gestión de base de datos
- **JWT** - Autenticación y autorización
- **bcrypt** - Cifrado de contraseñas
- **CORS** - Políticas de origen cruzado
- **dotenv** - Gestión de variables de entorno

## 📁 Estructura del Proyecto

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
