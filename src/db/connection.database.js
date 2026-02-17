import pkg from 'pg';
const { Pool } = pkg;

// Configuración de la base de datos
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'endanz',
  password: process.env.DB_PASSWORD || 'Yoll0209',
  port: process.env.DB_PORT || 5434,
  max: 20, // número máximo de clientes en el pool
  idleTimeoutMillis: 30000, // tiempo de inactividad antes de cerrar un cliente
  connectionTimeoutMillis: 2000, // tiempo máximo para obtener una conexión
});

// Función para probar la conexión
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Conexión a PostgreSQL establecida correctamente');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error al conectar a PostgreSQL:', error.message);
    console.log('   Verifica que:');
    console.log('   1. PostgreSQL esté corriendo');
    console.log('   2. Las credenciales en .env sean correctas');
    console.log('   3. La base de datos exista');
    return false;
  }
};

// Manejo de errores de conexión
pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de conexiones:', err.message);
});

// Exportar el pool para usar en los modelos
export const db = {
  query: (text, params) => pool.query(text, params),
  pool: pool,
};