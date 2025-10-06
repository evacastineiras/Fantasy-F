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
      'SELECT id_usuario FROM usuario WHERE email = ? OR nombre_usuario = ?',
      [email, username]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Usuario o email ya existe' });
    }

    // Hashear la contraseña
    const password_hash = await bcrypt.hash(password, saltRounds);
    // Insertar nuevo usuario
    const[result] = await pool.query(
      'INSERT INTO usuario (nombre, nombre_usuario, email, password_hash) VALUES (?, ?, ?, ?)',
      [nombre, username, email, password_hash]
    );

    res.status(201).json({ message: 'Usuario creado correctamente' ,  user: { id: result.insertId, email: email, username: username }});
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
      'SELECT * FROM usuario WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const user = users[0];

    // Comparar contraseñas
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Login correcto
    res.json({ message: 'Login correcto', user: { id: user.id_usuario, email: user.email, username: user.nombre_usuario } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno' });
  }
};

module.exports = {
  register,
  login
};
