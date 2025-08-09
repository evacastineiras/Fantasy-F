// controllers/authController.js
const pool = require('../db');
const bcrypt = require('bcrypt');

const saltRounds = 10;

async function register (req, res)  {
  try {
    const { nombre, username, email, password } = req.body;
    if (!nombre || !username || !email || !password) {
      return res.status(400).json({ message: 'Faltan datos' });
    }

    // Comprobar si email o username ya existe
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Usuario o email ya existe' });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insertar nuevo usuario
    await pool.query(
      'INSERT INTO users (nombre, username, email, password) VALUES (?, ?, ?, ?)',
      [nombre, username, email, hashedPassword]
    );

    res.status(201).json({ message: 'Usuario creado correctamente' });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ message: 'Error interno' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Faltan datos' });
    }

    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const user = users[0];

    // Comparar contraseñas
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Login correcto
    res.json({ message: 'Login correcto', user: { id: user.id, email: user.email, username: user.username } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno' });
  }
};

module.exports = {
  register,
  login
};
