const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../middlewares/authMiddleware'); // ✅
const Producto = require('../models/productModel');
const Cart = require('../models/cartModel');

// Add item to cart
router.post('/cart', authMiddleware, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    const product = await Producto.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    let cart = await Cart.findOne({ user: req.user.userId });
    
    if (!cart) {
      cart = new Cart({ user: req.user.userId, items: [] });
    }

    const existingItem = cart.items.find(item => item.product.toString() === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error al agregar al carrito' });
  }
});

// Get cart items
router.get('/cart', authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.userId }).populate('items.product');
    res.status(200).json(cart || { items: [] });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el carrito' });
  }
});

// Update cart item quantity
router.put('/cart/:itemId', authMiddleware, async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user.userId });
    
    if (!cart) {
      return res.status(404).json({ message: 'Carrito no encontrado' });
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Ítem no encontrado' });
    }

    item.quantity = quantity;
    await cart.save();
    
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el carrito' });
  }
});

// Remove item from cart
router.delete('/cart/:itemId', authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.userId });
    
    if (!cart) {
      return res.status(404).json({ message: 'Carrito no encontrado' });
    }

    cart.items.pull(req.params.itemId);
    await cart.save();
    
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar del carrito' });
  }
});

// Checkout
router.post('/cart/checkout', authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.userId }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Carrito vacío' });
    }

    // Check stock availability
    for (const item of cart.items) {
      if (item.product.existencia < item.quantity) {
        return res.status(400).json({ 
          message: `No hay suficiente stock para ${item.product.nombre}`
        });
      }
    }

    // Update product stock
    for (const item of cart.items) {
      await Producto.findByIdAndUpdate(item.product._id, {
        $inc: { existencia: -item.quantity }
      });
    }

    // Create order (you would need an Order model)
    // const order = new Order({ ... });
    // await order.save();

    // Clear cart
    cart.items = [];
    await cart.save();

    res.status(200).json({ message: 'Compra realizada con éxito' });
  } catch (error) {
    res.status(500).json({ message: 'Error al procesar la compra' });
  }
});

module.exports = router;