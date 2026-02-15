// src/middlewares/role.middleware.js

// Mapeo de Id_rol a nombres de roles
export const roleMap = {
  1: 'admin',
  2: 'docente', 
  3: 'estudiante',
  4: 'representante'
};

// Configuración de permisos por ruta
const routePermissions = {
  // Rutas de administración (solo admin)
  '/api/users/list': ['admin'],
  '/api/users/activate/:id': ['admin'],
  '/api/users/deactivate/:id': ['admin'],
  '/api/users/:id': ['admin'],
  
  // ============================================
  // 🟢 RUTAS DE TEACHERS
  // ============================================
  '/api/teachers/list': ['admin', 'docente', 'representante', 'estudiante'],
  '/api/teachers/catalog/specialties': ['admin', 'docente', 'representante', 'estudiante'],
  '/api/teachers/catalog/grades': ['admin', 'docente', 'representante', 'estudiante'],
  '/api/teachers/:id': ['admin', 'docente', 'representante', 'estudiante'],
  '/api/teachers/:id/specialty': ['admin'],
  '/api/teachers/:id/grades': ['admin'],
  '/api/teachers/:id/my-schedule': ['admin', 'docente'],
  '/api/teachers/:id/my-students': ['docente'],
  
  // ============================================
  // 🟢 RUTAS DE SECTIONS/HORARIOS - AGREGADAS 🟢
  // ============================================
  '/api/sections': ['admin', 'docente'],
  '/api/sections/*': ['admin', 'docente'],
  '/api/sections/:id': ['admin', 'docente'],
  '/api/schedules': ['admin', 'docente'],
  '/api/schedules/*': ['admin', 'docente'],
  '/api/classrooms': ['admin', 'docente'],
  '/api/days': ['admin', 'docente'],
  '/api/blocks': ['admin', 'docente'],
  '/api/schedules/check-availability': ['admin', 'docente'],
  
  // ============================================
  // 🟢 RUTAS EXISTENTES
  // ============================================
  '/api/students': ['admin'],
  '/api/students/*': ['admin'],
  '/api/inscripcion': ['admin'],
  '/api/inscripcion/*': ['admin'],
  '/api/aulas': ['admin'],
  '/api/aulas/*': ['admin'],
  
  '/api/notas': ['admin', 'docente'],
  '/api/notas/*': ['admin', 'docente'],
  '/api/boletin': ['admin', 'docente'],
  '/api/boletin/*': ['admin', 'docente'],
  '/api/horario': ['admin', 'docente'],
  '/api/horario/*': ['admin', 'docente'],
  
  '/api/docente/inicio': ['docente'],
  '/api/docente/horario': ['docente'],
  '/api/docente/estudiantes': ['docente'],
  
  '/api/representante/inicio': ['representante'],
  '/api/representante/estudiantes': ['representante'],
  '/api/representante/boletin': ['representante'],
  '/api/representante/horario': ['representante'],
};

/**
 * Middleware para verificación automática de roles
 * Se usa en rutas específicas después de verifyToken
 */
export const autoVerifyRole = async (req, res, next) => {
  try {
    const path = req.path;
    const method = req.method;
    
    console.log(`\n🔍 AUTO VERIFY ROLE - ${method} ${path}`);
    console.log(`👤 Usuario en req.user:`, req.user ? '✅ Sí' : '❌ No');
    
    if (req.user) {
      console.log(`📋 Datos del usuario:`, {
        userId: req.user.userId,
        Id_rol: req.user.Id_rol,
        username: req.user.username,
        email: req.user.email
      });
    }

    // Si no hay usuario autenticado, dejar que verifyToken maneje el error
    if (!req.user || !req.user.userId) {
      console.log(`⚠️ No hay usuario autenticado, continuando para que verifyToken maneje el error...`);
      console.log('📦 req.body después de autoVerifyRole:', req.body);
      return next();
    }

    // Buscar coincidencias en las rutas protegidas
    let requiredRoles = [];
    let matchedPattern = '';
    
    for (const [routePattern, roles] of Object.entries(routePermissions)) {
      // Convertir patrón a regex
      const regexPattern = routePattern
        .replace(/\*/g, '.*')
        .replace(/:\w+/g, '\\w+');
      
      const regex = new RegExp(`^${regexPattern}$`);
      
      if (regex.test(path)) {
        requiredRoles = roles;
        matchedPattern = routePattern;
        console.log(`🎯 Patrón encontrado: "${routePattern}" → Roles requeridos: [${roles.join(', ')}]`);
        break;
      }
    }

    // Si la ruta no tiene restricciones de rol, permitir acceso
    if (requiredRoles.length === 0) {
      console.log(`✅ Ruta "${path}" no tiene restricciones de rol, permitiendo acceso`);
      return next();
    }

    // Obtener rol del usuario desde el token
    const userRoleId = req.user.Id_rol;
    const userRole = roleMap[userRoleId] || 'estudiante';
    
    console.log(`👤 Rol del usuario: "${userRole}" (Id_rol: ${userRoleId})`);

    // Verificar si el usuario tiene el rol requerido
    if (!requiredRoles.includes(userRole)) {
      console.warn(`\n🚨 ACCESO DENEGADO - Ruta: ${path}`);
      console.warn(`   Usuario ID: ${req.user.userId}`);
      console.warn(`   Usuario rol: ${userRole}`);
      console.warn(`   Roles requeridos: ${requiredRoles.join(', ')}`);
      console.warn(`   Patrón coincidente: ${matchedPattern}`);
      
      return res.status(403).json({
        ok: false,
        msg: "Acceso denegado. No tienes permisos suficientes.",
        details: {
          userRole,
          requiredRoles,
          path,
          userId: req.user.userId,
          username: req.user.username
        }
      });
    }

    console.log(`\n✅ ACCESO PERMITIDO - Ruta: ${path} para ${userRole}`);
    console.log(`   Usuario: ${req.user.username} (ID: ${req.user.userId})`);
    
    // Agregar información del rol al request para uso posterior
    req.user.role = userRole;
    req.user.roleName = userRole;
    
    next();
  } catch (error) {
    console.error("\n❌ AUTO VERIFY ROLE - Error:", error);
    console.error("Stack:", error.stack);
    
    return res.status(500).json({
      ok: false,
      msg: "Error verificando permisos",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Middleware para verificar roles específicos explícitamente
 * Ejemplo: verifyRole(['admin', 'docente'])
 */
export const verifyRole = (requiredRoles = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          ok: false,
          msg: "Usuario no autenticado",
        });
      }

      const userRoleId = req.user.Id_rol;
      const userRole = roleMap[userRoleId] || 'estudiante';
      
      console.log(`\n🔍 VERIFY ROLE EXPLÍCITO - Usuario: ${req.user.userId}, Rol: ${userRole}`);
      console.log(`   Roles requeridos: [${requiredRoles.join(', ')}]`);

      if (requiredRoles.length === 0) {
        console.log(`✅ Sin roles requeridos, permitiendo acceso`);
        return next();
      }

      if (!requiredRoles.includes(userRole)) {
        console.warn(`\n🚨 ACCESO DENEGADO - verifyRole explícito`);
        console.warn(`   Usuario rol: ${userRole}`);
        console.warn(`   Roles requeridos: ${requiredRoles.join(', ')}`);
        
        return res.status(403).json({
          ok: false,
          msg: "Acceso denegado. Permisos insuficientes.",
          userRole,
          requiredRoles
        });
      }

      console.log(`✅ ACCESO PERMITIDO - Rol ${userRole} tiene permisos`);
      req.user.role = userRole;
      next();
    } catch (error) {
      console.error("\n❌ VERIFY ROLE - Error:", error);
      return res.status(500).json({
        ok: false,
        msg: "Error verificando permisos específicos",
      });
    }
  };
};

// Función helper para verificar si un usuario tiene un rol específico
export const hasRole = (userId, requiredRole) => {
  // Esta función es útil para lógica de negocio dentro de controladores
  // Nota: En la práctica, necesitarías acceder a la base de datos
  console.log(`🔍 hasRole - Verificando rol ${requiredRole} para usuario ${userId}`);
  return true; // Implementación básica
};

// Exportar routePermissions para debugging o uso en otros lugares
export const getRoutePermissions = () => {
  return routePermissions;
};

// Exportar para uso en routeGuard.middleware.js
export default {
  autoVerifyRole,
  verifyRole,
  roleMap,
  getRoutePermissions,
  hasRole
};