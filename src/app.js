// app.js - AGREGAR ESTAS LÍNEAS

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/user.routes.js";
// ✅ IMPORTAR LAS RUTAS DE DOCENTES
import teacherRoutes from "./routes/teacher.routes.js";  // <-- AGREGAR ESTA LÍNEA
import configRoutes from "./routes/config.routes.js"; // <-- AGREGAR ESTA LÍNEA
import sectionRoutes from "./routes/section.routes.js";
import studentRoutes from "./routes/student.routes.js";
import notaRoutes from "./routes/nota.routes.js";
import boletinRoutes from "./routes/boletin.routes.js";

// IMPORTAR MIDDLEWARES DE PROTECCIÓN
import { routeGuard } from "./middlewares/routeGuard.middleware.js";

dotenv.config();

const app = express();

// ============================================
// CONFIGURACIÓN DE CORS
// ============================================
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// ============================================
// MIDDLEWARES BÁSICOS
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// LOGGING DE PETICIONES
// ============================================
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// ============================================
// RUTAS PÚBLICAS (NO REQUIEREN AUTENTICACIÓN)
// ============================================
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    security: {
      jwtProtection: "Activo",
      roleProtection: "Activo",
      routeGuard: "Activo"
    }
  });
});

app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Bienvenido a la API de Gescol",
    endpoints: {
      auth: "/api/users",
      teachers: "/api/teachers",  // ✅ AGREGAR ESTO
      health: "/api/health",
      verify: "/api/verify-permission"
    },
    version: "1.0.0",
  });
});

// Ruta de utilidad para el frontend
app.get("/api/verify-permission", (req, res) => {
  res.json({
    ok: true,
    message: "Sistema de protección de rutas activo",
    features: {
      jwtAuthentication: true,
      roleBasedAuthorization: true,
      routeGuardMiddleware: true,
      autoRoleVerification: true
    },
    timestamp: new Date().toISOString()
  });
});

// ============================================
// MIDDLEWARE DE PROTECCIÓN GLOBAL DE RUTAS
// ============================================
app.use(routeGuard());

// ============================================
// RUTAS PROTEGIDAS (REQUIEREN AUTENTICACIÓN)
// ============================================
app.use("/api/users", userRoutes);
// ✅ REGISTRAR LAS RUTAS DE DOCENTES
app.use("/api/teachers", teacherRoutes);  // <-- AGREGAR ESTA LÍNEA
app.use("/api/config", configRoutes); // <-- AGREGAR ESTA 
app.use("/api/sections", sectionRoutes); // 👈 NUEVO
app.use("/api/students", studentRoutes); // <-- NUEVA RUTA

// Y donde están las otras rutas:
app.use("/api/notas", notaRoutes);
app.use("/api/boletines", boletinRoutes);

// Aquí agregarás otras rutas protegidas en el futuro:
// app.use("/api/students", studentRoutes);
// app.use("/api/notas", notasRoutes);
// etc.

// ============================================
// MIDDLEWARE PARA RUTAS NO ENCONTRADAS
// ============================================
app.use((req, res) => {
  console.warn(`⚠️ Ruta no encontrada: ${req.method} ${req.path}`);
  
  res.status(404).json({
    ok: false,
    msg: "Route not found",
    path: req.path,
    method: req.method,
    availableEndpoints: {
      auth: "/api/users",
      teachers: "/api/teachers",  // ✅ AGREGAR ESTO
      health: "/api/health",
      verify: "/api/verify-permission"
    },
    suggestion: "Verifica que la ruta sea correcta o que tengas permisos para acceder"
  });
});

// ============================================
// MIDDLEWARE DE MANEJO DE ERRORES GLOBAL
// ============================================
app.use((error, req, res, next) => {
  console.error("🔥 Error global:", error.message);
  
  const statusCode = error.status || 500;
  const message = error.message || "Internal server error";
  
  res.status(statusCode).json({
    ok: false,
    msg: message,
    error: process.env.NODE_ENV === "development" ? {
      message: error.message,
      stack: error.stack
    } : undefined,
  });
});

export default app;