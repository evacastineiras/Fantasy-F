const pool = require('../db');

async function createLeague(req, res) 
{
    let connection;
    try
    {
        const{id_liga, nombre, usuario} = req.body; 
        if(!id_liga || !nombre || !usuario)
        {
            return res.status(400).json({message: 'Faltan datos'});
        }

        connection = await pool.getConnection();
        await connection.beginTransaction(); 

        const[errorCode] = await connection.query('SELECT id_liga FROM liga WHERE id_liga = ?', [id_liga]);
        if(errorCode.length > 0)
        {
            await connection.rollback();
            return res.status(400).json({message: 'ERROR: El código de liga ya está en uso'});
        }   
        
        const[errorUser] = await connection.query('SELECT id_usuario FROM usuario WHERE id_liga IS NOT NULL AND id_usuario =  ?', [usuario])
        if(errorUser.length > 0)
        {
            await connection.rollback();
        
            return res.status(400).json({message: 'ERROR: El usuario ya pertenece a una liga'});
        }
            

        const fecha = new Date().toISOString().slice(0, 19).replace('T', ' ');

        await connection.query(
      'INSERT INTO liga (id_liga, nombre , creada_en) VALUES (?, ?, ?)',
      [id_liga, nombre, fecha]
    );

    await connection.query('UPDATE usuario SET id_liga = ? WHERE id_usuario = ?', [id_liga, usuario]) 

    const presupuestoInicial = 50000000;
    await connection.query('INSERT INTO plantilla (id_usuario, id_liga, presupuesto, valor_equipo, n_jugadoras) VALUES (?,?,?,0,0)', [usuario, id_liga, presupuestoInicial]);

    await connection.query('INSERT INTO plantilla_jugadora (id_liga, id_jugadora, valor, clausula, id_plantilla) SELECT ?, id_jugadora, valor_base, 0, NULL FROM jugadora', [id_liga]);

    await connection.commit();

    res.status(201).json({ message: 'Liga creada correctamente' });

  }catch (error) 
  {
     if(connection) await connection.rollback();
    console.error('Error en crear liga:', error);
    res.status(500).json({ message: 'Error interno' });
  }
  finally {
        if (connection) connection.release();
    }
}

async function joinPrivateLeague(req, res) 
{
    let connection;
    try
    {
        const {id_liga, usuario} = req.body;

    if(!id_liga || !usuario)
        {
            return res.status(400).json({message: 'Faltan datos'});
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const[errorCode] = await connection.query('SELECT id_liga FROM liga WHERE id_liga = ?', [id_liga]);
        if(errorCode.length == 0){
            await connection.rollback();
            return res.status(400).json({message: 'ERROR: El código no corresponde a una liga'});
        }
            
        
        const[errorUser] = await connection.query('SELECT id_usuario FROM usuario WHERE id_liga IS NOT NULL AND id_usuario =  ?', [usuario])
        if(errorUser.length > 0)
        {
            await connection.rollback();
            return res.status(400).json({message: 'ERROR: El usuario ya pertenece a una liga'});
        }
            

        const[result] = await connection.query('SELECT COUNT(*) AS total FROM usuario WHERE id_liga =  ?', [id_liga])
        if(result[0].total >= 10)
        {
            await connection.rollback();
            return res.status(400).json({message: 'ERROR: La liga está completa'});
        }
            

        
    await connection.query('UPDATE usuario SET id_liga = ? WHERE id_usuario = ?', [id_liga, usuario]);

    const PRESUPUESTOINICIAL = 50000000;
    await connection.query('INSERT INTO plantilla (id_usuario, id_liga, presupuesto, valor_equipo, n_jugadoras) VALUES (?,?,?, 0, 0)', [usuario, id_liga, PRESUPUESTOINICIAL]);

    await connection.commit();

    res.status(201).json({ message: 'Unido a liga correctamente' });

    }catch (error){
        if(connection) await connection.rollback();
        console.error('Error al unirse a liga:', error);
        res.status(500).json({ message: 'Error interno' });
    } finally {
        if (connection) connection.release();
    }
    
}

async function joinRandomLeague(req, res) {
    let connection;
    const PRESUPUESTO_INICIAL = 50000000;

    try {
        const { usuario } = req.body; 

        if (!usuario) {
            return res.status(400).json({ message: 'Faltan datos' });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [errorUser] = await connection.query(
            'SELECT id_usuario FROM usuario WHERE id_liga IS NOT NULL AND id_usuario = ?',
            [usuario]
        );
        if (errorUser.length > 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'ERROR: El usuario ya pertenece a una liga' });
        }

        const [ligas] = await connection.query(`
            SELECT l.id_liga, l.nombre, COUNT(u.id_usuario) AS total
            FROM liga l
            LEFT JOIN usuario u ON l.id_liga = u.id_liga
            WHERE l.nombre LIKE 'Liga publica #%'
            GROUP BY l.id_liga, l.nombre
            HAVING total < 10
            LIMIT 1
        `);

        let idLigaDestino;

        if (ligas.length > 0) {
            idLigaDestino = ligas[0].id_liga;
        } else {
            idLigaDestino = Math.floor(100000 + Math.random() * 900000);
            const nombreLiga = "Liga publica #" + idLigaDestino;

            await connection.query(
                'INSERT INTO liga (id_liga, nombre) VALUES (?, ?)',
                [idLigaDestino, nombreLiga]
            );

            await connection.query(`
                INSERT INTO plantilla_jugadora (id_liga, id_jugadora, valor, clausula, id_plantilla)
                SELECT ?, id_jugadora, valor_base, 0, NULL FROM jugadora
            `, [idLigaDestino]);
        }

        await connection.query(
            'UPDATE usuario SET id_liga = ? WHERE id_usuario = ?',
            [idLigaDestino, usuario]
        );

        await connection.query(
            'INSERT INTO plantilla (id_usuario, id_liga, presupuesto, valor_equipo, n_jugadoras) VALUES (?, ?, ?, 0, 0)',
            [usuario, idLigaDestino, PRESUPUESTO_INICIAL]
        );

        await connection.commit();
        res.status(201).json({ 
            message: 'Unido a liga correctamente', 
            id_liga: idLigaDestino 
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al unirse a liga aleatoria:', error);
        res.status(500).json({ message: 'Error interno' });
    } finally {
        if (connection) connection.release();
    }
}

async function changeLeague(req, res) {

    let connection;
 try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ message: 'Faltan datos' });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction(); 

        const [userData] = await connection.query(
            `SELECT p.id_plantilla, u.id_liga 
             FROM usuario u
             LEFT JOIN plantilla p ON u.id_usuario = p.id_usuario AND u.id_liga = p.id_liga
             WHERE u.id_usuario = ?`,
            [id]
        );

        if (userData.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const { id_plantilla, id_liga } = userData[0];

        if (!id_liga) {
            await connection.rollback();
            return res.status(400).json({ message: 'El usuario ya no pertenece a ninguna liga' });
        }

        if (id_plantilla) {
            await connection.query(
                'UPDATE plantilla_jugadora SET id_plantilla = NULL WHERE id_plantilla = ?',
                [id_plantilla]
            );

            await connection.query(
                'DELETE FROM plantilla WHERE id_plantilla = ?',
                [id_plantilla]
            );
        }

        await connection.query(
            'UPDATE usuario SET id_liga = NULL WHERE id_usuario = ?',
            [id]
        );

        const [remainingUsers] = await connection.query(
            'SELECT COUNT(*) as total FROM usuario WHERE id_liga = ?',
            [id_liga]
        );

        if (remainingUsers[0].total === 0) {
            await connection.query('DELETE FROM plantilla_jugadora WHERE id_liga = ?', [id_liga]);
            await connection.query('DELETE FROM liga WHERE id_liga = ?', [id_liga]);
            console.log(`Liga ${id_liga} eliminada por estar vacía.`);
        }

        await connection.commit();
        res.status(200).json({ 
            message: remainingUsers[0].total === 0 
                ? 'Has abandonado la liga y esta ha sido eliminada por quedar vacía.' 
                : 'Has abandonado la liga correctamente.' 
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al abandonar liga:', error);
        res.status(500).json({ message: 'Error interno al procesar la salida de la liga' });
    } finally {
        if (connection) connection.release();
    }
}

async function getClasificacion(req, res) {
    console.log("Petición de clasificación para usuario:", req.params.id_usuario);
    
    // Usamos el pool que ya tienes definido arriba
    const query = `
        SELECT 
            l.nombre AS liga_nombre,
            l.id_liga AS liga_id,
            u.id_usuario,
            u.nombre_usuario,
            u.foto_perfil_url,
            CAST(COALESCE(SUM(rj.puntos), 0) AS SIGNED) AS puntos_totales
        FROM liga l
        JOIN usuario u ON l.id_liga = u.id_liga
        LEFT JOIN plantilla p ON u.id_usuario = p.id_usuario
        LEFT JOIN alineacion al ON p.id_plantilla = al.id_plantilla
        LEFT JOIN alineacion_item ai ON al.id_alineacion = ai.id_alineacion
        LEFT JOIN plantilla_jugadora pj ON ai.id_entry = pj.id_entry
        LEFT JOIN rendimiento_jornada rj ON pj.id_jugadora = rj.id_jugadora 
            AND rj.id_jornada = al.id_jornada
        WHERE u.id_liga = (SELECT id_liga FROM usuario WHERE id_usuario = ?)
        GROUP BY u.id_usuario, u.nombre_usuario, u.foto_perfil_url, l.nombre, l.id_liga
        ORDER BY puntos_totales DESC;
    `;

    try {
        // CAMBIO CLAVE: Usar pool.query en lugar de db.execute
        const [rows] = await pool.query(query, [req.params.id_usuario]);
        
        if (rows.length === 0) {
            return res.json({
                nombre: "Sin Liga",
                id_publico: "0",
                ranking: []
            });
        }

        const respuesta = {
            nombre: rows[0].liga_nombre,
            id_publico: rows[0].liga_id,
            ranking: rows.map((r, index) => ({
                posicion: index + 1,
                username: r.nombre_usuario,
                foto: r.foto_perfil_url,
                puntos: r.puntos_totales
            }))
        };
        
        res.json(respuesta);
    } catch (error) {
        console.error("Error real en getClasificacion:", error);
        res.status(500).json({ message: "Error al obtener clasificación", details: error.message });
    }
}

async function updateLeagueName(req, res) {
    const { id_liga, nuevoNombre } = req.body;

    if (!id_liga || !nuevoNombre) {
        return res.status(400).json({ message: 'Faltan datos' });
    }

    try {
        await pool.query('UPDATE liga SET nombre = ? WHERE id_liga = ?', [nuevoNombre, id_liga]);
        res.status(200).json({ message: 'Nombre de la liga actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar nombre de liga:', error);
        res.status(500).json({ message: 'Error interno al actualizar' });
    }
}

module.exports = {
  createLeague,
  joinPrivateLeague,
  joinRandomLeague,
  changeLeague,
  getClasificacion, 
  updateLeagueName
};