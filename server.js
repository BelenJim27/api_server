const express = require('express');
const bcrypt = require('bcryptjs');
const { createUser, getUsers, findUserById, comparePassword, updateUser, deleteUser } = require('./models/users');

const app = express();
const port = 5000;

app.use(express.json()); 

app.post('/users', (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Faltan datos requeridos.' });
  }

  // Crear un nuevo usuario
  const newUser = createUser(name, email, password);
  res.status(201).json(newUser);
});

app.get('/users', (req, res) => {
  const users = getUsers();
  res.status(200).json(users);
});

// Ruta para obtener un usuario por ID (incluyendo contraseña)
app.get('/users/:id', (req, res) => {
  const { id } = req.params;
  const user = findUserById(parseInt(id, 10));
  
  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado.' });
  }

  res.status(200).json(user);
});

// Ruta para actualizar un usuario por ID
app.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, password } = req.body;

  const updatedUser = updateUser(parseInt(id, 10), name, password);
  if (!updatedUser) {
    return res.status(404).json({ message: 'Usuario no encontrado.' });
  }

  res.status(200).json(updatedUser);
});

// Ruta para eliminar un usuario por ID
app.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  const deleted = deleteUser(parseInt(id, 10));

  if (!deleted) {
    return res.status(404).json({ message: 'Usuario no encontrado.' });
  }

  res.status(200).json({ message: 'Usuario eliminado correctamente.' });
});

// Ruta para iniciar sesión
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const user = getUsers().find(user => user.email === email);
  
  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado.' });
  }

  // Comparar la contraseña
  const isPasswordValid = comparePassword(user.password, password);
  
  if (!isPasswordValid) {
    return res.status(400).json({ message: 'Contraseña incorrecta.' });
  }

  res.status(200).json({ message: 'Inicio de sesión exitoso.' });
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://10.168.123.29:${port}`);
});
