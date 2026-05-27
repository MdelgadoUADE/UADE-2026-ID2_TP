const { Pool } = require('pg');

const pool = new Pool({
  host: 'db',           // nombre del servicio en docker-compose
  port: 5432,
  user: 'user',
  password: 'pass',
  database: 'app_db',
});

async function connectPostgres() {
  try {
    // Crear la tabla si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id   SERIAL PRIMARY KEY,
        username  VARCHAR(50)  UNIQUE NOT NULL,
        surname   VARCHAR(100) NOT NULL,
        email     VARCHAR(150) UNIQUE NOT NULL,
        passwd_hash TEXT       NOT NULL,
        role      VARCHAR(20)  NOT NULL DEFAULT 'user'
      )
    `);
    console.log('PostgreSQL connected and users table ready');
  } catch (error) {
    console.error('PostgreSQL connection error:', error);
    process.exit(1);
  }
}

module.exports = { pool, connectPostgres };