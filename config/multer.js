const fileUpload = require('express-fileupload');

// Configuración básica (similar a multer.diskStorage)
const upload = fileUpload({
  useTempFiles: true,          // Usa archivos temporales (opcional)
  tempFileDir: './uploads/',   // Carpeta temporal (equivalente a 'destination')
  createParentPath: true,      // Crea la carpeta si no existe
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB (opcional)
});

// Middleware para manejar nombres de archivo únicos (como filename en multer)
upload.use((req, res, next) => {
  if (req.files) {
    Object.keys(req.files).forEach(key => {
      const file = req.files[key];
      file.name = `${Date.now()}-${file.name}`; // Nombre único
    });
  }
  next();
});

module.exports = upload;