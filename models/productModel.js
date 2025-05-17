const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    image: { type: String },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' } // Referencia a categoría
  });

productSchema.pre('save', async function (next) {
  if (this.isNew) {
    const lastProduct = await this.constructor.findOne().sort({ id: -1 });
    this.id = lastProduct ? lastProduct.id + 1 : 1;
  }
  next();
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
