import "dotenv/config";
import app from "./app.js";
import { testConnection } from "./db/connection.database.js";

const PORT = process.env.PORT || 3001;

// Conectar a la base de datos y luego iniciar servidor
const startServer = async () => {
  try {
    console.log("🔍 Iniciando servidor...");

    // Probar conexión a la base de datos
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error("❌ No se pudo conectar a la base de datos. Verifica la configuración.");
      console.log("   ⏳ El servidor se intentará iniciar, pero las rutas de usuarios fallarán.");
    } else {
      console.log("✅ PostgreSQL conectado correctamente");
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`\n🚀 Servidor iniciado en: http://localhost:${PORT}`);
      console.log("\n📋 Rutas principales:");
      console.log("🔗 POST   /api/users/register");
      console.log("🔗 POST   /api/users/login");
      console.log("🔗 POST   /api/users/refresh-token");
      console.log("🔗 GET    /api/users/profile       (requiere token)");
      console.log("🔗 GET    /api/health");
      console.log("\n🌍 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}");
      console.log(`📁 Entorno: ${process.env.NODE_ENV || 'development'}`);

      if (!dbConnected) {
        console.warn("\n⚠️  ADVERTENCIA: El servidor está corriendo sin conexión a la base de datos.");
        console.warn("   Las rutas de usuarios no funcionarán correctamente.");
      }
    });

  } catch (error) {
    console.error("❌ Error crítico al iniciar el servidor:", error);
    process.exit(1);
  }
};

// Manejar cierre elegante del servidor
process.on('SIGINT', () => {
  console.log('\n👋 Recibida señal SIGINT. Cerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Recibida señal SIGTERM. Cerrando servidor...');
  process.exit(0);
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
});

// Iniciar el servidor
startServer().catch(err => console.error("Fatal Error:", err));
// Server Restart Triggered by AI fix