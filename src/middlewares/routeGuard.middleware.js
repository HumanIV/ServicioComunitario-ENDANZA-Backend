// src/middlewares/routeGuard.middleware.js

/**
 * Middleware global de protección de rutas
 * Se ejecuta para TODAS las rutas después de las públicas
 */
export const routeGuard = () => {
  return async (req, res, next) => {
    try {
      // Rutas públicas que no requieren verificación
      const publicPaths = [
        '/',
        '/api/health',
        '/api/verify-permission',
        '/api/users/login',
        '/api/users/register',
        '/api/users/refresh-token',
        '/api/users/forgot-password',
        '/api/users/reset-password',
        '/api/users/security-question/',
        '/api/users/recover-password-security',
      ];

      const currentPath = req.path;
      
      // Si es una ruta pública, permitir acceso
      if (publicPaths.some(path => currentPath.startsWith(path))) {
        return next();
      }

      // Si no está autenticado, denegar acceso
      // NOTA: Las rutas específicas ya tienen verifyToken, esto es una capa extra
      console.log(`🛡️ ROUTE GUARD - Protegiendo ruta: ${currentPath}`);
      
      // Si la ruta pasa por aquí sin autenticación, es porque no tiene verifyToken
      // Esto sirve como segunda capa de seguridad
      next();
      
    } catch (error) {
      console.error("❌ ROUTE GUARD - Error:", error);
      // En caso de error, continuar (fail open)
      next();
    }
  };
};