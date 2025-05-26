const express = require('express');
const router = express.Router(); // 👈 ESTA LÍNEA FALTABA
const Producto = require('../models/productModel');
const { authMiddleware, adminOnly } = require('../middlewares/authMiddleware'); // ✅
const upload = require('../config/multer');

// Crear un producto

router.post('/productos', 
  authMiddleware,
  adminOnly,
  upload.array('imagenes'), // 'imagenes' debe coincidir con el key en Postman
  async (req, res) => {
    try {
      const { nombre,descripcion, precio, existencia, categoria } = req.body;
      const imagenes = req.files.map(file => file.path); // Paths de las imágenes subidas

      const nuevoProducto = new Producto({
        nombre,
        descripcion,
        precio,
        existencia,
        categoria,
        imagenes
      });

      await nuevoProducto.save();
      res.status(201).json({ success: true, producto: nuevoProducto });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);


// Obtener productos
router.get('/productos', async (req, res) => {
  try {
    
    
    const productos = await Producto.find(); // Ordenar por fecha de creación descendente
    
    res.status(200).json({
      success: true,
      data: productos,
      
      
    });
  } catch (error) {
    // manejo de error
    console.error('Error en GET /productos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener productos.',
      error: error.message 
    });
  }
});
// Obtener productos por categoría
router.get('/productos/categoria/:categoria', async (req, res) => {
  try {
    const categoria = req.params.categoria;
    const productos = await Producto.find({ categoria });
    res.status(200).json({ success: true, data: productos });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos por categoría.',
      error: error.message,
    });
  }
});

// Obtener un producto por ID
router.get('/productos/:id', async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    res.status(200).json({ success: true, producto });
  } catch (error) {
    console.error('Error en GET /productos/:id:', error);
    res.status(500).json({ success: false, message: 'Error al obtener el producto', error: error.message });
  }
});

// Obtener categorías únicas
router.get('/categorias', async (req, res) => {
  try {
    const categorias = await Producto.distinct('categoria', { categoria: { $ne: null } });
    res.status(200).json({ success: true, data: categorias });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener categorías', error: error.message });
  }
});

//obtener la categoria directamente desde la base de datos


//actualizar producto por ID (PUT)
router.put('/productos/:id', authMiddleware,adminOnly,async (req, res) => {
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
router.delete('/productos/:id', authMiddleware,adminOnly, async (req, res) => {
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
