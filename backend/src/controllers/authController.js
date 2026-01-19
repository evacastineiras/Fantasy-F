// controllers/authController.js
const pool = require('../db');
const bcrypt = require('bcrypt');
const fs = require('fs').promises; 
const path = require('path');
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');
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

    res.status(201).json({ message: 'Usuario creado correctamente' ,  user: { id: result.insertId, email: email, username: username, nombre: nombre , profileImage: null}});
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
    res.json({ message: 'Login correcto', user: { id: user.id_usuario, email: user.email, username: user.nombre_usuario, nombre: user.nombre, profileImage: user.foto_perfil_url } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno' });
  }
};

const editProfile = async (req, res) => {
  try {
   

      const { nombre, username, email, id, profileImage} = req.body;

      let imgUrl = null;

    if (profileImage && profileImage.startsWith('data:')) //para mirar si tiene el string base64 porque empieza por data:
    { 
      const matches = profileImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

      if ( matches && matches.length === 3)
      {
        const imageType = matches[1];
        const base64Data = matches[2];
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const fileExtension = imageType.split('/')[1] || 'png';

        const fileName = `${id}-${Date.now()}.${fileExtension}`; //nombre del archivo con id y hora de creacion
        const uploadPath = path.join(UPLOADS_DIR, fileName);
        imgUrl = `/uploads/${fileName}`;

        await fs.mkdir(UPLOADS_DIR, {recursive: true});
        await fs.writeFile(uploadPath, imageBuffer);
      }
    }
  
    if (!nombre || !username || !email ) {
      return res.status(400).json({ message: 'Los campos no pueden estar vacíos' });
    }

     const [users] = await pool.query(
            'SELECT foto_perfil_url FROM usuario WHERE id_usuario = ?', 
            [id]
        );

   if (users.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const currentProfileUrl = users[0].foto_perfil_url;
    const finalImageUrl = imgUrl || currentProfileUrl;
    //si imgUrl tiene un valor (nueva foto), se usa. Si no se usa la URL que existía en la BD

    await pool.query('UPDATE usuario SET nombre = ? , nombre_usuario = ?, email = ?, foto_perfil_url = ? WHERE id_usuario = ?', [nombre, username, email, finalImageUrl, id]);

   res.json({ message: 'Perfil editado', user: { id: id, email: email, username: username, nombre: nombre, profileImage: finalImageUrl } });
}
catch (error) {
        console.error('Error al modificar perfil:', error);
        res.status(500).json({ message: 'Error interno' });
}
}

const changePassword = async (req, res) => 
{
  try{
    const { password, newPassword, id } = req.body;
  
       const [users] = await pool.query(
      'SELECT * FROM usuario WHERE id_usuario = ?',
      [id]
    );
    if (users.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const user = users[0];

    if (!password || !newPassword ) {
      return res.status(400).json({ message: 'Faltan datos' });
    }

     
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

 

    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    await pool.query('UPDATE usuario SET password_hash = ? WHERE id_usuario = ?', [password_hash, id]);

    res.json({ message: 'Perfil editado' });
  } catch (error) {
     console.error('Error al modificar perfil:', error);
        res.status(500).json({ message: 'Error interno' });
  }
  

}

async function getBudgetValue(req, res)
{
  try {
        const {id_usuario} = req.params;

    if (!id_usuario)
        return res.status(400).json({message: 'No se encuentra el ID del usuario'});

    const [presupuestoRows] = await pool.query(
      'SELECT id_plantilla, presupuesto FROM plantilla WHERE id_usuario = ?', 
      [id_usuario]
    );

    if (presupuestoRows.length === 0) {
      return res.status(404).json({ message: 'Plantilla no encontrada' });
    }

    const id_plantilla = presupuestoRows[0].id_plantilla;
    const presupuesto = presupuestoRows[0].presupuesto;

  
    const [valorRows] = await pool.query(
      'SELECT IFNULL(SUM(valor), 0) AS valor_total FROM plantilla_jugadora WHERE id_plantilla = ?',
      [id_plantilla]
    );

    const valor_total = valorRows[0].valor_total;

    
    res.status(200).json({
      presupuesto: presupuesto,
      valor_plantilla: valor_total
    });
    
  } catch (error)
  {
    console.error('Error al obtener datos de presupuesto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

module.exports = {
  register,
  login,
  editProfile,
  changePassword,
  getBudgetValue
};
