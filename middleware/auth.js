const jwt = require('jsonwebtoken');
const path = require('path');
// Asegurar la carga del .env del backend
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_secreto';

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ mensaje: 'Token no proporcionado' });
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ mensaje: 'Formato de autorización inválido. Use: Bearer <token>' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // id, nombre
    next();
  } catch (error) {
    return res.status(401).json({ mensaje: 'Token inválido o expirado', error: error.message });
  }
}

module.exports = authMiddleware;
