require('dotenv').config(); // 👉 esto debe ir al inicio
const mongoose = require('mongoose');
const User = require('./models/userModel');
const bcrypt = require('bcryptjs');
const express = require('express');
const cors = require('cors');
const app = express();

async function userAdmin() {
  try {
    const adminEmail = 'admin@example.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Admin ya existe');
      return;
    }

const hashedPassword = 123456789;
console.log("Hash generado:", hashedPassword); // Debería empezar con $2a$10$...
    const adminUser = new User({
      name: 'Administrador Principal',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
    });

    await adminUser.save();
    console.log('Admin inicial creado');
  } catch (error) {
    console.error('Error creando admin inicial:', error);
  }
}

// Conecta con la base de datos y ejecuta esto al iniciar el servidor
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Mongo conectado');
    userAdmin();
  })
  .catch(err => console.error(err));
