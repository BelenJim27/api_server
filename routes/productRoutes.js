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

router.post('/productos/:id/imagenes', 
  authMiddleware,
  adminOnly,
  upload.array('imagenes'),
  async (req, res) => {
    try {
      const producto = await Producto.findById(req.params.id);
      if (!producto) {
        return res.status(404).json({ success: false, message: 'Producto no encontrado' });
      }

      const nuevasImagenes = req.files.map(file => file.path);
      producto.imagenes = [...producto.imagenes, ...nuevasImagenes];
      await producto.save();

      res.status(200).json({ success: true, imagenes: producto.imagenes });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);
// Obtener productos
// Obtener productos con búsqueda opcional
router.get('/productos', async (req, res) => {
  try {
    const search = req.query.search || '';
    const regex = new RegExp(search, 'i'); // 'i' para insensible a mayúsculas/minúsculas

    const productos = await Producto.find({
      $or: [
        { nombre: { $regex: regex } },
        { descripcion: { $regex: regex } }
      ]
    });

    res.status(200).json({
      success: true,
      data: productos,
    });
  } catch (error) {
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
    const productos = await Producto.find({
      categoria: { $regex: new RegExp(`^${categoria}$`, 'i') } // Insensible a mayúsculas
    });
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
// Actualizar producto con imágenes (PUT)
router.put('/productos/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, existencia, categoria, material, color } = req.body;

    const productoActualizado = await Producto.findByIdAndUpdate(
      id,
      {
        nombre,
        descripcion,
        precio: parseFloat(precio),
        existencia: parseInt(existencia),
        categoria,
        material,
        color
      },
      { new: true }
    );

    if (!productoActualizado) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    res.status(200).json({ success: true, producto: productoActualizado });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// Endpoint adicional para eliminar imágenes específicas
router.put('/productos/:id/remove-image', 
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { imageUrl } = req.body;

      const productoActualizado = await Producto.findByIdAndUpdate(
        id,
        { $pull: { imagenes: imageUrl } },
        { new: true }
      );

      res.status(200).json({ 
        success: true, 
        producto: productoActualizado 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Error al eliminar la imagen.' 
      });
    }
  }
);
/** 
router.put('/productos/:id/remove-image', 
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { imageUrl } = req.body;

      const productoActualizado = await Producto.findByIdAndUpdate(
        id,
        { $pull: { imagenes: imageUrl } },
        { new: true }
      );

      res.status(200).json({ 
        success: true, 
        producto: productoActualizado 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Error al eliminar la imagen.' 
      });
    }
  }
);*/
 //para decreementar las existencias de un producto
// Ruta para decrementar existencias de un producto

  // Eliminar producto por ID (DELETE)
  router.delete('/productos/:id/imagenes', 
    authMiddleware,
    adminOnly,
    async (req, res) => {
      try {
        const { imagenUrl } = req.body;
        const producto = await Producto.findById(req.params.id);
        
        if (!producto) {
          return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
  
        producto.imagenes = producto.imagenes.filter(img => img !== imagenUrl);
        await producto.save();
  
        res.status(200).json({ success: true, imagenes: producto.imagenes });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    }
   
    
  );
module.exports = router;
