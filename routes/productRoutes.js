const express = require('express');
const Product = require('../models/productModel');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');
const router = express.Router();

// Obtener todos los productos (con filtros y paginación)
router.get('/', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
    const query = {};
    
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const products = await Product.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('category', 'name'); // Populate category data

    const count = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: products
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener productos.',
      error: error.message
    });
  }
});

// Crear un nuevo producto (con validación mejorada)
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, stock, category } = req.body;
    
    if (!name || !price || !stock || !category) {
      return res.status(400).json({ 
        message: 'Nombre, precio, stock y categoría son requeridos.' 
      });
    }

    const newProduct = new Product({ 
      name, 
      description, 
      price: Number(price), 
      stock: Number(stock), 
      category,
      image: req.file ? req.file.filename : null 
    });

    await newProduct.save();
    
    res.status(201).json({ 
      success: true,
      message: 'Producto creado exitosamente.', 
      product: newProduct 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error al crear producto.',
      error: error.message 
    });
  }
});

// Obtener producto por ID (usando MongoDB _id en lugar de ID numérico)
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name');
      
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Producto no encontrado.' 
      });
    }
    
    res.status(200).json({ 
      success: true,
      data: product 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener el producto.',
      error: error.message
    });
  }
});

// Actualizar producto (con opción para actualizar imagen)
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, stock, category } = req.body;
    const updateData = { 
      name, 
      description, 
      price: Number(price), 
      stock: Number(stock),
      category
    };

    if (req.file) {
      updateData.image = req.file.filename;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ 
        success: false,
        message: 'Producto no encontrado.' 
      });
    }

    res.status(200).json({ 
      success: true,
      message: 'Producto actualizado exitosamente.',
      data: updatedProduct 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar el producto.',
      error: error.message
    });
  }
});

// Eliminar producto (con manejo de imagen)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Producto no encontrado.' 
      });
    }

    // Aquí podrías agregar lógica para eliminar la imagen del servidor
    // fs.unlinkSync(`uploads/${product.image}`);

    res.status(200).json({ 
      success: true,
      message: 'Producto eliminado exitosamente.' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error al eliminar el producto.',
      error: error.message
    });
  }
});

// Búsqueda de productos por nombre o descripción
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);

    res.status(200).json({ 
      success: true,
      data: products 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error en la búsqueda.',
      error: error.message
    });
  }
});

module.exports = router;