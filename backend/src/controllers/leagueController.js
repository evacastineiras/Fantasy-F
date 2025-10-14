const pool = require('../db');

async function createLeague(req, res) 
{
    try
    {
        const{id_liga, nombre, usuario} = req.body; //falta timestamp, el id_liga es el codigo randomizado que se calcula en el front y el usuario(id) es para meterlo directamente en la liga que acaba de crear
        if(!id_liga || !nombre || !usuario)
        {
            return res.status(400).json({message: 'Faltan datos'});
        }

        const[errorCode] = await pool.query('SELECT id_liga FROM liga WHERE id_liga = ?', [id_liga]);
        if(errorCode.length > 0)
            return res.status(400).json({message: 'ERROR: Utiliza un nuevo código'});
        //Aunque es sumamente improvable, podría generarse un código ya utilizado.
        
        const[errorUser] = await pool.query('SELECT id_usuario FROM usuario WHERE id_liga IS NOT NULL AND id_usuario =  ?', [usuario])
        if(errorUser.length > 0)
            return res.status(400).json({message: 'ERROR: El usuario ya pertenece a una liga'});

        const fecha = new Date().toISOString().slice(0, 19).replace('T', ' ');

        await pool.query(
      'INSERT INTO liga (id_liga, nombre , creada_en) VALUES (?, ?, ?)',
      [id_liga, nombre, fecha]
    );

    await pool.query('UPDATE usuario SET id_liga = ? WHERE id_usuario = ?', [id_liga, usuario]) //Unimos al usuario creador a su propia liga

    res.status(201).json({ message: 'Liga creada correctamente' });

  }catch (error) 
  {
    console.error('Error en crear liga:', error);
    res.status(500).json({ message: 'Error interno' });
  }
}

async function joinPrivateLeague(req, res) 
{
    try
    {
        const {id_liga, usuario} = req.body;

    if(!id_liga || !usuario)
        {
            return res.status(400).json({message: 'Faltan datos'});
        }

        const[errorCode] = await pool.query('SELECT id_liga FROM liga WHERE id_liga = ?', [id_liga]);
        if(errorCode.length == 0)
            return res.status(400).json({message: 'ERROR: El código no corresponde a una liga'});
        
        const[errorUser] = await pool.query('SELECT id_usuario FROM usuario WHERE id_liga IS NOT NULL AND id_usuario =  ?', [usuario])
        if(errorUser.length > 0)
            return res.status(400).json({message: 'ERROR: El usuario ya pertenece a una liga'});

        const[result] = await pool.query('SELECT COUNT(*) AS total FROM usuario WHERE id_liga =  ?', [id_liga])
        if(result[0].total >= 10)
            return res.status(400).json({message: 'ERROR: La liga está completa'});

        
    await pool.query('UPDATE usuario SET id_liga = ? WHERE id_usuario = ?', [id_liga, usuario]) 

    res.status(201).json({ message: 'Unido a liga correctamente' });

    }catch (error){
        console.error('Error al unirse a liga:', error);
        res.status(500).json({ message: 'Error interno' });
    }
    
}

async function joinRandomLeague(req, res) {
    try {
        const { usuario } = req.body;

        if (!usuario) {
            return res.status(400).json({ message: 'Faltan datos' });
        }

        const [errorUser] = await pool.query(
            'SELECT id_usuario FROM usuario WHERE id_liga IS NOT NULL AND id_usuario = ?',
            [usuario]
        );
        if (errorUser.length > 0) {
            return res.status(400).json({ message: 'ERROR: El usuario ya pertenece a una liga' });
        }

        const [ligas] = await pool.query(`
            SELECT l.id_liga, l.nombre, COUNT(u.id_usuario) AS total
            FROM liga l
            LEFT JOIN usuario u ON l.id_liga = u.id_liga
            WHERE l.nombre LIKE 'Liga publica #%'
            GROUP BY l.id_liga, l.nombre
            HAVING total < 10
        `);

        if (ligas.length > 0) {
            await pool.query(
                'UPDATE usuario SET id_liga = ? WHERE id_usuario = ?',
                [ligas[0].id_liga, usuario]
            );
        } else {
            //Crear una nueva liga pública si no hay ninguna disponible
            const nombre = "Liga publica #" + id_liga;
            const fecha = new Date().toISOString().slice(0, 19).replace('T', ' ');

            await pool.query(
                'INSERT INTO liga (id_liga, nombre, creada_en) VALUES (?, ?, ?)',
                [id_liga, nombre, fecha]
            );
            await pool.query(
                'UPDATE usuario SET id_liga = ? WHERE id_usuario = ?',
                [id_liga, usuario]
            );
        }

        res.status(201).json({ message: 'Unido a liga correctamente' });
    } catch (error) {
        console.error('Error al unirse a liga:', error);
        res.status(500).json({ message: 'Error interno' });
    }
}

module.exports = {
  createLeague,
  joinPrivateLeague,
  joinRandomLeague
};