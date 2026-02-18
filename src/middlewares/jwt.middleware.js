import jwt from "jsonwebtoken";
import { UserModel } from "../models/user.model.js";

// Claves por defecto para desarrollo
const JWT_SECRET = process.env.JWT_SECRET || "danza-jwt-secret-key-2024-development";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "danza-refresh-secret-key-2024-development";

// Función helper para verificar estado - EXPORTADA
export const isUserActive = (user) => {
  if (!user || !user.is_active) return false;

  // Normalizar el estado: convertir a minúsculas, quitar espacios
  const normalizedStatus = String(user.is_active || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '');

  // Aceptar varias formas de "activo"
  const activeStatuses = ['activo', 'active', 'activado', 'enabled', 'true', '1', 'yes', 'sí'];
  return activeStatuses.includes(normalizedStatus);
};

export const verifyToken = async (req, res, next) => {
  try {
    console.log("🔍 MIDDLEWARE - Iniciando verificación de token");

    const authHeader = req.headers.authorization;
    console.log("🔍 MIDDLEWARE - Authorization header:", authHeader ? "EXISTE" : "NO EXISTE");

    if (!authHeader) {
      console.log("❌ MIDDLEWARE - No hay header de autorización");
      return res.status(401).json({
        ok: false,
        msg: "No token provided",
      });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      console.log("❌ MIDDLEWARE - Formato de token inválido");
      return res.status(401).json({
        ok: false,
        msg: "Invalid token format",
      });
    }

    const token = parts[1];
    console.log("🔍 MIDDLEWARE - Token extraído, longitud:", token.length);

    try {
      console.log("🔍 MIDDLEWARE - Verificando token con JWT...");
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log("✅ MIDDLEWARE - Token decodificado exitosamente:", {
        userId: decoded.userId,
        username: decoded.username,
        Id_rol: decoded.Id_rol, // CORREGIDO: Usar Id_rol, no permiso_id
        exp: new Date(decoded.exp * 1000).toISOString(),
      });

      // Verificar que el usuario existe y está activo
      console.log("🔍 MIDDLEWARE - Buscando usuario en BD...");
      const user = await UserModel.findOneById(decoded.id || decoded.userId);

      if (!user) {
        console.log("❌ MIDDLEWARE - Usuario no encontrado en BD");
        return res.status(401).json({
          ok: false,
          msg: "User not found",
        });
      }

      console.log("✅ MIDDLEWARE - Usuario encontrado:", {
        id: user.id,
        username: user.username,
        is_active: user.is_active,
        Id_rol: user.Id_rol,
      });

      // Usar la función isUserActive
      if (!isUserActive(user)) {
        console.log("❌ MIDDLEWARE - Usuario inactivo. Estado:", user.is_active);
        return res.status(403).json({
          ok: false,
          msg: "Account is inactive",
        });
      }

      // Agregar información del usuario al request - CORREGIDO
      req.user = {
        userId: decoded.userId || decoded.id || user.id,
        username: decoded.username,
        Id_rol: decoded.Id_rol, // CORREGIDO: Usar Id_rol
        nombre: decoded.nombre || user.nombre,
        apellido: decoded.apellido || user.apellido,
        email: decoded.email || user.email,
        cedula: decoded.cedula || user.cedula,
      };

      console.log("✅ MIDDLEWARE - Verificación completada exitosamente");
      next();
    } catch (jwtError) {
      console.log("❌ MIDDLEWARE - Error JWT:", {
        name: jwtError.name,
        message: jwtError.message,
      });

      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          ok: false,
          msg: "Token expired",
        });
      }

      if (jwtError.name === "JsonWebTokenError") {
        return res.status(401).json({
          ok: false,
          msg: "Invalid token",
        });
      }

      return res.status(401).json({
        ok: false,
        msg: "Token verification failed",
        error: jwtError.message,
      });
    }
  } catch (error) {
    console.error("❌ MIDDLEWARE - Error general:", error);
    return res.status(500).json({
      ok: false,
      msg: "Server error in token verification",
      error: error.message,
    });
  }
};

export const verifyAdmin = async (req, res, next) => {
  try {
    const user = await UserModel.findOneById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        ok: false,
        msg: "User not found",
      });
    }

    // Verificar si tiene permisos de administrador (Id_rol = 1 es "Administrador")
    // Ajusta este valor según tu base de datos
    if (user.Id_rol !== 1) { // CORREGIDO: Usar Id_rol, no permiso_id
      return res.status(403).json({
        ok: false,
        msg: "Admin access required",
      });
    }

    next();
  } catch (error) {
    console.error("Error in verifyAdmin:", error);
    return res.status(500).json({
      ok: false,
      msg: "Server error",
    });
  }
};

export const verifyAdminOrReadOnly = async (req, res, next) => {
  try {
    const user = await UserModel.findOneById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        ok: false,
        msg: "User not found",
      });
    }

    // Permitir acceso a administradores y otros roles
    // Ajusta estos valores según tu base de datos
    const allowedRoles = [1, 2, 3, 4]; // CORREGIDO: Usar Id_rol

    if (!allowedRoles.includes(user.Id_rol)) { // CORREGIDO: Usar Id_rol
      return res.status(403).json({
        ok: false,
        msg: "Insufficient permissions",
      });
    }

    next();
  } catch (error) {
    console.error("Error in verifyAdminOrReadOnly:", error);
    return res.status(500).json({
      ok: false,
      msg: "Server error",
    });
  }
};

export { JWT_SECRET, JWT_REFRESH_SECRET };