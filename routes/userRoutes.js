const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { authMiddleware, adminOnly } = require('../middlewares/authMiddleware');
const router = express.Router();

// Configuración de tokens
const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

// Registrar nuevo usuario (público)
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  // Validación mejorada
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Nombre es requerido.' });
  }
  
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Email inválido.' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ 
      success: false, 
      message: 'La contraseña debe tener al menos 6 caracteres.' 
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: 'El email ya está registrado.' 
      });
    }

    const newUser = new User({ 
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      role: 'client' // Rol por defecto
    });

    await newUser.save();

    // Generar tokens
    const tokens = generateTokens(newUser);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado con éxito.',
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: getUserResponse(newUser)
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error en el servidor.' 
    });
  }
});

// Iniciar sesión
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      success: false,
      message: 'Email y contraseña son requeridos.' 
    });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ 
        success: false,
        message: 'Credenciales inválidas.' 
      });
    }

    const tokens = generateTokens(user);

    res.status(200).json({ 
      success: true,
      message: 'Inicio de sesión exitoso.',
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: getUserResponse(user)
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error en el servidor.' 
    });
  }
});

// Refrescar token
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ 
      success: false,
      message: 'Refresh token es requerido.' 
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuario no encontrado.' 
      });
    }

    const newTokens = generateTokens(user);

    res.status(200).json({
      success: true,
      data: {
        token: newTokens.accessToken,
        refreshToken: newTokens.refreshToken
      }
    });
  } catch (error) {
    console.error('Error refrescando token:', error);
    res.status(401).json({ 
      success: false,
      message: 'Token inválido o expirado.' 
    });
  }
});

// Obtener perfil del usuario actual
router.get('users/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuario no encontrado.' 
      });
    }
    res.status(200).json({ 
      success: true,
      data: getUserResponse(user) 
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error en el servidor.' 
    });
  }
});

// Crear usuario (solo admin)
router.post('/users', authMiddleware, adminOnly, async (req, res) => {
  const { name, email, password, role } = req.body;

  // Validación mejorada
  const errors = [];
  if (!name || !name.trim()) errors.push('Nombre es requerido');
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.push('Email inválido');
  if (!password || password.length < 6) errors.push('La contraseña debe tener al menos 6 caracteres');
  if (!role || !['admin', 'client'].includes(role)) errors.push('Rol inválido');

  if (errors.length > 0) {
    return res.status(400).json({ 
      success: false,
      message: 'Errores de validación',
      errors 
    });
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: 'El email ya está registrado.' 
      });
    }

    const newUser = new User({ 
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      role 
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: `Usuario creado como ${role}.`,
      data: getUserResponse(newUser)
    });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error en el servidor.' 
    });
  }
});

// Obtener todos los usuarios (solo admin)
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password -refreshToken');
    res.status(200).json({ 
      success: true,
      data: users 
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error en el servidor.' 
    });
  }
});

// Funciones auxiliares
function generateTokens(user) {
  const accessToken = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );

  // Guardar refresh token en la base de datos
  user.refreshToken = refreshToken;
  user.save();

  return { accessToken, refreshToken };
}


function getUserResponse(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  };
}

/// Actualizar usuario por ID de MongoDB
router.put('/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verifica contraseña actual si se quiere cambiar
    if (newPassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Contraseña actual incorrecta' });
      }
      user.password = newPassword;
    }

    user.name = name || user.name;
    user.email = email || user.email;

    await user.save();

    res.status(200).json({ 
      message: 'Perfil actualizado',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el perfil' });
  }
});

// Eliminar usuario por ID de MongoDB
router.delete('/users/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID inválido.' });
  }

  try {
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    res.status(200).json({ message: 'Usuario eliminado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el usuario.' });
  }
});

module.exports = router;
