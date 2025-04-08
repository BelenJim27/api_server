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
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor.' });
  }
});

// Ruta para iniciar sesión
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Contraseña incorrecta.' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'Inicio de sesión exitoso.', token });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.' });
  }
});

// Obtener todos los usuarios
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.' });
  }
});

// Obtener usuario por ID numérico
router.get('/users/:id', authMiddleware, async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ message: 'ID inválido.' });

  try {
    const user = await User.findOne({ id: userId }).select('-password');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.' });
  }
});

// Actualizar usuario por ID numérico
router.put('/users/:id', authMiddleware, async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ message: 'ID inválido.' });

  const { name, email, password } = req.body;

  try {
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const updatedUser = await User.findOneAndUpdate(
      { id: userId },
      updateData,
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: 'Usuario no encontrado.' });

    res.status(200).json({ message: 'Usuario actualizado correctamente.', updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el usuario.' });
  }
});

// Eliminar usuario por ID numérico
router.delete('/users/:id', authMiddleware, async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ message: 'ID inválido.' });

  try {
    const deletedUser = await User.findOneAndDelete({ id: userId });
    if (!deletedUser) return res.status(404).json({ message: 'Usuario no encontrado.' });

    res.status(200).json({ message: 'Usuario eliminado correctamente.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el usuario.' });
  }
});

module.exports = router;
