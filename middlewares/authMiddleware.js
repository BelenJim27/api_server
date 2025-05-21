const jwt = require('jsonwebtoken'); //Importa la librería jsonwebtoken que se usa para trabajar con JWT.

//Define la función middleware que toma los objetos req, res y next.
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization');//Intenta obtener el token del header 'Authorization' de la solicitud.

  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. No hay token.' });
  }//Si no hay token, responde con un error 401 (No autorizado).


//intenta verificar el token
  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);//Usa una clave secreta almacenada en variables de entorno
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido o expirado.' });
  }
};

module.exports = authMiddleware;
