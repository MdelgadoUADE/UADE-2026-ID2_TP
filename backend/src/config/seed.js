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