const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Ruta para registrar un nuevo usuario
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Faltan datos requeridos.' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'El email ya está en uso.' });

    const newUser = new User({ name, email, password });
    await newUser.save();

    res.status(201).json({ message: 'Usuario registrado con éxito.' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.' });
  }
});

// Ruta para iniciar sesión y obtener token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Contraseña incorrecta.' });

    // Generar token JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'Inicio de sesión exitoso.', token });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.' });
  }
});

// Ruta protegida para obtener todos los usuarios (requiere token)
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.' });
  }
});

// Ruta protegida para obtener un usuario por ID
router.get('/users/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.' });
  }
});

// Ruta protegida para eliminar un usuario
router.delete('/users/:id', authMiddleware, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ message: 'Usuario no encontrado.' });

    res.status(200).json({ message: 'Usuario eliminado correctamente.' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.' });
  }
});

module.exports = router;
