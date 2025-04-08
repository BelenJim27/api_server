const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  id: { type: Number, unique: true }, // ID numérico
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});


// Middleware para encriptar la contraseña antes de guardar
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // Solo asignar id si es nuevo
  if (this.isNew) {
    const lastUser = await this.constructor.findOne().sort({ id: -1 });
    this.id = lastUser ? lastUser.id + 1 : 1;
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});


// Método para comparar contraseñas
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
