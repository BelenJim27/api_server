const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: String,
  categoria: String,
  precio: Number,
  existencia: Number,
  material: String,
  color: String,
  imagenes: [String], 
  valoracion: {
    promedio: Number,
    comentarios: [
      {
        usuario: String,
        comentario: String,
        fecha: Date
      }
    ]
  }
}, { timestamps: true });

const Producto = mongoose.model('Producto', productoSchema);
module.exports = Producto;