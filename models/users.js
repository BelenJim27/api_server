const bcrypt = require('bcryptjs');

let users = [];
let nextId = 1; // ID numérico incremental

// Función para crear un nuevo usuario
function createUser(name, email, password) {
  // Encriptar la contraseña antes de almacenarla
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = { id: nextId++, name, email, password: hashedPassword };
  
  users.push(newUser);
  return newUser; // Se retorna con la contraseña incluida
}

// Función para obtener todos los usuarios (incluyendo contraseñas)
function getUsers() {
  return users;
}

// Función para encontrar un usuario por su ID (incluyendo contraseña)
function findUserById(id) {
  return users.find(user => user.id === id);
}

// Función para comparar la contraseña de un usuario
function comparePassword(storedPassword, enteredPassword) {
  return bcrypt.compareSync(enteredPassword, storedPassword);
}

// Función para actualizar un usuario por ID
function updateUser(id, name, password) {
  const user = findUserById(id);
  if (!user) return null;

  if (name) user.name = name;
  if (password) user.password = bcrypt.hashSync(password, 10);

  return user;
}

// Función para eliminar un usuario por ID
function deleteUser(id) {
  const index = users.findIndex(user => user.id === id);
  if (index === -1) return false;

  users.splice(index, 1);
  return true;
}

module.exports = { createUser, getUsers, findUserById, comparePassword, updateUser, deleteUser };
