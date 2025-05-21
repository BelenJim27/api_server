const express = require('express');
const router = express.Router(); // 👈 ESTA LÍNEA FALTABA
const Producto = require('../models/productModel');
const authMiddleware = require('../middlewares/authMiddleware');

// Crear un producto
router.post('/productos', authMiddleware, async (req, res) => {
  try {
    const nuevoProducto = new Producto(req.body);
    await nuevoProducto.save();
    res.status(201).json({ success: true, producto: nuevoProducto });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al crear el producto.' });
  }
});

// Obtener productos
router.get('/productos', async (req, res) => {
  try {
    const productos = await Producto.find();
    res.status(200).json({ success: true, productos });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener productos.' });
  }
});

//actualizar producto por ID (PUT)
router.put('/productos/:id', authMiddleware, async (req, res) => {
    try {
      const productoActualizado = await Producto.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true } // Devuelve el producto actualizado
      );
      if (!productoActualizado) {
        return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
      }
      res.status(200).json({ success: true, producto: productoActualizado });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al actualizar el producto.' });
    }
  });
  // Eliminar producto por ID (DELETE)
router.delete('/productos/:id', authMiddleware, async (req, res) => {
    try {
      const productoEliminado = await Producto.findByIdAndDelete(req.params.id);
      if (!productoEliminado) {
        return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
      }
      res.status(200).json({ success: true, message: 'Producto eliminado correctamente.' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al eliminar el producto.' });
    }
  });
  

module.exports = router;
