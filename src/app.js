import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/user.routes.js";

dotenv.config();

const app = express();

// Configurar CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Middleware para parsear JSON
app.use(express.json());

// Middleware para parsear URL encoded
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use("/api/users", userRoutes);

// Ruta de health check
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// Ruta raíz
app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Bienvenido a la API de Gescol",
    endpoints: {
      auth: "/api/users",
      health: "/api/health"
    },
    version: "1.0.0",
  });
});

// Middleware para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    msg: "Route not found",
    path: req.path,
    method: req.method,
    availableEndpoints: {
      auth: "/api/users",
      health: "/api/health"
    }
  });
});

// Middleware de manejo de errores global
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