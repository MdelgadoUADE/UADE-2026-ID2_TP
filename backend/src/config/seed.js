const bcrypt = require('bcrypt')
const { pool } = require('./postgres')

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
    for (const u of seedUsers) {
      const existing = await pool.query(
        'SELECT user_id FROM users WHERE email = $1',
        [u.email]
      )

      if (existing.rows.length > 0) {
        console.log(`Seed: usuario '${u.username}' ya existe, saltando...`)
        continue
      }

      const passwd_hash = await bcrypt.hash(u.password, SALT_ROUNDS)

      await pool.query(
        `INSERT INTO users (username, surname, email, passwd_hash, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [u.username, u.surname, u.email, passwd_hash, u.role]
      )

      console.log(`Seed: usuario '${u.username}' creado`)
    }
  } catch (error) {
    console.error('Error en seed:', error)
  }
}

module.exports = { runSeed }