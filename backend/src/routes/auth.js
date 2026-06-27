const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { pool } = require("../config/postgres");

const SALT_ROUNDS = 10;

// POST /auth/register
router.post("/register", async (req, res) => {
  const { username, surname, email, password, role = "user" } = req.body;

  if (!username || !surname || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Faltan campos obligatorios" });
  }

  try {
    const passwd_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO users (username, surname, email, passwd_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, username, surname, email, role`,
      [username, surname, email, passwd_hash, role],
    );

    res.status(201).json({ success: true, user: result.rows[0] });
  } catch (error) {
    // Código 23505 = unique constraint violation (username o email duplicado)
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ success: false, message: "El username o email ya existe" });
    }
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error al registrar usuario" });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Faltan campos obligatorios" });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    const user = result.rows[0];

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Credenciales inválidas" });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwd_hash);

    if (!passwordMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Credenciales inválidas" });
    }

    // No devolver el hash nunca
    const { passwd_hash, ...safeUser } = user;

    res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error al iniciar sesión" });
  }
});

module.exports = router;
