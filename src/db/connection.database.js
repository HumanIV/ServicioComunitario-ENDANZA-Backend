// db.config.js
import pkg from 'pg';
const { Pool } = pkg;

// Usar DATABASE_URL del .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Necesario para Neon
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // Aumenta un poco para Neon
});

// Función para probar la conexión
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Conexión a Neon PostgreSQL establecida correctamente');
    console.log('   📍 Host:', process.env.DB_HOST || 'Neon');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error al conectar a Neon PostgreSQL:', error.message);
    console.log('   Verifica que:');
    console.log('   1. La DATABASE_URL en .env sea correcta');
    console.log('   2. La IP de tu backend esté permitida en Neon');
    console.log('   3. La base de datos exista y tenga la estructura creada');
    return false;
  }
};

// Manejo de errores de conexión
pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de conexiones de Neon:', err.message);
});

// Exportar el pool para usar en los modelos
export const db = {
  query: (text, params) => pool.query(text, params),
  pool: pool,
};