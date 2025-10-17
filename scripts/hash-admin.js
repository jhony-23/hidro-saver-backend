const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const bcrypt = require('bcrypt');
const Administrador = require('../models/Administrador');

(async () => {
  try {
    const admin = await Administrador.findOne({ where: { nombre: 'admin' } });
    if (!admin) {
      console.log('No existe admin con nombre "admin"');
      process.exit(0);
    }

    // Detectar si ya está hasheada (bcrypt hashes empiezan con $2a/$2b)
    if (typeof admin.contraseña === 'string' && admin.contraseña.startsWith('$2')) {
      console.log('La contraseña ya está hasheada. Nada que hacer.');
      process.exit(0);
    }

    const saltRounds = 10;
    const hashed = await bcrypt.hash(admin.contraseña, saltRounds);
    admin.contraseña = hashed;
    await admin.save();
    console.log('Contraseña del admin hasheada correctamente.');
    process.exit(0);
  } catch (err) {
    console.error('Error hasheando la contraseña:', err);
    process.exit(1);
  }
})();
