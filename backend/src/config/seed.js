const bcrypt = require('bcrypt')
const { pool } = require('./postgres')
const { runDemoSeed } = require('./seed-demo')
 
const SALT_ROUNDS = 10
 
const seedUsers = [
  {
    username: 'testUser',
    surname:  'User',
    email:    'testuser@reportit.com',
    password: 'test1234',
    role:     'user'
  },
  {
    username: 'testAdmin',
    surname:  'Admin',
    email:    'testadmin@reportit.com',
    password: 'admin1234',
    role:     'admin'
  },
  // Usuarios que coinciden con los nombres del seed-demo.js
  {
    username: 'Juan',
    surname:  'González',
    email:    'juan.gonzalez@example.com',
    password: 'demo1234',
    role:     'user'
  },
  {
    username: 'María',
    surname:  'Rodríguez',
    email:    'maria.rodriguez@example.com',
    password: 'demo1234',
    role:     'user'
  },
  {
    username: 'Carlos',
    surname:  'Fernández',
    email:    'carlos.fernandez@example.com',
    password: 'demo1234',
    role:     'user'
  },
  {
    username: 'Ana',
    surname:  'López',
    email:    'ana.lopez@example.com',
    password: 'demo1234',
    role:     'user'
  },
  {
    username: 'Luis',
    surname:  'Martínez',
    email:    'luis.martinez@example.com',
    password: 'demo1234',
    role:     'user'
  },
  {
    username: 'Laura',
    surname:  'García',
    email:    'laura.garcia@example.com',
    password: 'demo1234',
    role:     'user'
  },
  {
    username: 'Pedro',
    surname:  'Pérez',
    email:    'pedro.perez@example.com',
    password: 'demo1234',
    role:     'user'
  },
  {
    username: 'Sofia',
    surname:  'Sánchez',
    email:    'sofia.sanchez@example.com',
    password: 'demo1234',
    role:     'user'
  },
  {
    username: 'Diego',
    surname:  'González',
    email:    'diego.gonzalez@example.com',
    password: 'demo1234',
    role:     'user'
  },
  {
    username: 'Valentina',
    surname:  'Rodríguez',
    email:    'valentina.rodriguez@example.com',
    password: 'demo1234',
    role:     'user'
  }
]
 
async function runSeed() {
  try {
    // SEED DE USUARIOS (PostgreSQL)
    console.log('\n[SEED] Seeding usuarios...')
   
    for (const u of seedUsers) {
      const existing = await pool.query(
        'SELECT user_id FROM users WHERE email = $1',
        [u.email]
      )
 
      if (existing.rows.length > 0) {
        console.log(`[SEED] Usuario '${u.username}' ya existe, saltando...`)
        continue
      }
 
      const passwd_hash = await bcrypt.hash(u.password, SALT_ROUNDS)
 
      await pool.query(
        `INSERT INTO users (username, surname, email, passwd_hash, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [u.username, u.surname, u.email, passwd_hash, u.role]
      )
 
      console.log(`[SEED] Usuario '${u.username}' creado`)
    }
   
    // SEED DE REPORTES DEMO (MongoDB) - Opcional con variable de entorno
    if (process.env.SEED_DEMO === 'true') {
      await runDemoSeed()
    } else {
      console.log('\n[SEED] Tip: Para generar datos de demostracion, configura SEED_DEMO=true')
      console.log('[SEED] Ejemplo: Edita docker-compose.yml y agrega:')
      console.log('[SEED]   environment:')
      console.log('[SEED]     - SEED_DEMO=true')
      console.log('[SEED]     - SEED_REPORTS=5000')
    }
   
  } catch (error) {
    console.error('\n[SEED] Error en seed:', error)
  }
}
 
module.exports = { runSeed }