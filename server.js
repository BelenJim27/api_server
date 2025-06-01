require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartroutes');
const path = require('path');



const app = express();

const port = process.env.PORT || 5000;

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB conectado'))
  .catch(err => console.error('Error conectando a MongoDB:', err));

app.use(cors());
app.use(express.json());
app.use('/api', userRoutes);
app.use('/api', productRoutes); 
app.use('/api', cartRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.png')) {
      res.set('Content-Type', 'image/jpeg');
    }
  }
}));
app.listen(port, () => {
  console.log(`Servidor corriendo en http://192.168.80.109:${port}`);
});
