const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');

// Middleware de configuración de express-fileupload
const upload = fileUpload({
  useTempFiles: false,
  createParentPath: true,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10
  }
});

// Middleware opcional para nombres únicos y guardado físico
const generateUniqueNames = async (req, res, next) => {
  if (!req.files) return next();

  const keys = Object.keys(req.files);

  for (let key of keys) {
    const fileList = Array.isArray(req.files[key]) ? req.files[key] : [req.files[key]];

    for (let file of fileList) {
      const uploadPath = path.join(__dirname, '..', 'uploads');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      const uniqueName = `${Date.now()}-${file.name}`;
      const fullPath = path.join(uploadPath, uniqueName);
      await file.mv(fullPath); // Mover físicamente el archivo

      // Reemplazar el archivo con su nueva ruta (para acceder desde `req.files`)
      file.path = `uploads/${uniqueName}`; // para guardar en la base de datos
      file.name = uniqueName;
    }
  }

  next();
};

module.exports = {
  upload,
  generateUniqueNames
};
