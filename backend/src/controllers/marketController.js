const pool = require('../db');

async function getMarketPlayers(req, res) {
    try {
        const { id_usuario } = req.params;

        if (!id_usuario)
            return res.status(400).json({ message: 'No se encuentra el ID del usuario' });

        const [players] = await pool.query(`
    SELECT 
        j.id_jugadora, 
        j.apodo, 
        j.posicion, 
        j.imagen AS foto, 
        c.escudo_url AS club_escudo,
        j.valor_base,
        pj.valor, 
        pj.id_entry,
        u.nombre AS nombre_usuario,
        p.id_usuario AS id_propietario, -- Añadimos la ID para la lógica de comparación
        (SELECT MAX(montante) 
         FROM puja 
         WHERE id_entry = pj.id_entry 
         AND estado = 'pendiente') AS ultima_puja
    FROM plantilla_jugadora pj 
    JOIN jugadora j ON pj.id_jugadora = j.id_jugadora 
    JOIN club c ON j.id_club = c.id_club 
    LEFT JOIN plantilla p ON pj.id_plantilla = p.id_plantilla
    LEFT JOIN usuario u ON p.id_usuario = u.id_usuario
    WHERE pj.id_liga = (SELECT id_liga FROM usuario WHERE id_usuario = ?) 
    ORDER BY pj.valor DESC;
`, [id_usuario]);

        res.status(200).json(players);
    } catch (error) {
        console.error('Error al obtener mercado: ', error);
        res.status(500).json({ message: 'Error interno al obtener el mercado' });
    }
}

async function marketSell(req, res) {
    const { id_usuario, id_jugadora, id_liga } = req.body;

    if (!id_usuario || !id_jugadora || !id_liga)
        return res.status(400).json({ message: "No se encuentran todos los datos" });

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

     
        const [rows] = await connection.query(
            'SELECT id_plantilla, valor FROM plantilla_jugadora WHERE id_jugadora = ? AND id_liga = ?', 
            [id_jugadora, id_liga]
        );

        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Jugadora no encontrada en esta liga' });
        }

        const { id_plantilla, valor } = rows[0];

    
        const [[plantillaUser]] = await connection.query(
            'SELECT id_plantilla FROM plantilla WHERE id_usuario = ? AND id_liga = ?',
            [id_usuario, id_liga]
        );

        if (!plantillaUser || id_plantilla !== plantillaUser.id_plantilla) {
            await connection.rollback();
            return res.status(403).json({ message: 'No eres el propietario de esta jugadora' });
        }

        
        await connection.query(
            'UPDATE plantilla_jugadora SET id_plantilla = NULL, clausula = 0, es_titular_default = 0 WHERE id_jugadora = ? AND id_liga = ?',
            [id_jugadora, id_liga]
        );

        
        await connection.query(
            'UPDATE plantilla SET presupuesto = presupuesto + ? WHERE id_usuario = ? AND id_liga = ?',
            [valor, id_usuario, id_liga]
        );

        await connection.commit();
        res.status(200).json({ message: 'Jugadora vendida al mercado correctamente', nuevo_presupuesto_sumado: valor });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error en marketSell:", error);
        res.status(500).json({ message: 'Error en la transacción' });
    } finally {
        if (connection) connection.release();
    }
}


async function modifyClause(req, res)
{
    //necesito id del usuario, id de la jugadora.

    const {id_usuario, id_jugadora, nueva_clausula} = req.body;
    
        if (!id_usuario)
            return res.status(400).json({ message: 'No se encuentra el ID del usuario' });
        
        if (!id_jugadora)
            return res.status(400).json({ message: 'No se encuentra el ID de la jugadora' });

         if (!nueva_clausula)
            return res.status(400).json({ message: 'No se encuentra la nueva clausula' });

        const [users] = await pool.query('SELECT id_usuario FROM usuario WHERE id_usuario = ? ', [id_usuario]);

        if(users.length < 1)
            return res.status(400).json({message: 'El usuario no existe en la BD'});

        const [players] = await pool.query('SELECT id_jugadora FROM jugadora WHERE id_jugadora = ? ', [id_jugadora]);

        if(players.length < 1)
            return res.status(400).json({message: 'La jugadora no existe en la BD'});

        try {
        
        const [rows] = await pool.query(`
            SELECT  pj.valor 
            FROM plantilla_jugadora pj
            JOIN plantilla p ON pj.id_plantilla = p.id_plantilla
            WHERE pj.id_jugadora = ? AND p.id_usuario = ?
        `, [id_jugadora, id_usuario]);

        if (rows.length === 0) {
            return res.status(403).json({ message: 'No eres el propietario de esta jugadora' });
        }

        const  valor  = rows[0];

       //tope del 40% sobre el valor
        const limiteMaximo = valor * 1.40;

        if (nueva_clausula > limiteMaximo) {
            return res.status(400).json({ 
                message: `La nueva cláusula no puede superar el 40% del valor de mercado (${limiteMaximo}€)` 
            });
        }

       
        await pool.query(`
            UPDATE plantilla_jugadora pj
            JOIN plantilla p ON pj.id_plantilla = p.id_plantilla
            SET pj.clausula = ?
            WHERE pj.id_jugadora = ? AND p.id_usuario = ?
        `, [nueva_clausula, id_jugadora, id_usuario]);

        return res.status(200).json({
            message: 'Cláusula actualizada correctamente',
            nueva_clausula,
            nueva_clausula: nueva_clausula,
            limite_permitido: limiteMaximo
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al procesar el cambio de cláusula' });
    }
}

async function payClause(req, res) {
    const { id_usuario, id_jugadora, id_clausula, id_propietario, id_entry } = req.body;

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        
        const [pjData] = await connection.query('SELECT id_liga, valor FROM plantilla_jugadora WHERE id_entry = ?', [id_entry]);
        const { id_liga, valor: valorActual } = pjData[0];
        const [[pComprador]] = await connection.query('SELECT id_plantilla, presupuesto FROM plantilla WHERE id_usuario = ?', [id_usuario]);
        const [[pVendedor]] = await connection.query('SELECT id_plantilla, presupuesto FROM plantilla WHERE id_usuario = ?', [id_propietario]);

        if (pComprador.presupuesto < id_clausula) {
            await connection.rollback();
            return res.status(400).json({ message: 'Presupuesto insuficiente' });
        }

       
        await connection.query('UPDATE plantilla SET presupuesto = presupuesto - ? WHERE id_plantilla = ?', [id_clausula, pComprador.id_plantilla]);
        await connection.query('UPDATE plantilla SET presupuesto = presupuesto + ? WHERE id_plantilla = ?', [id_clausula, pVendedor.id_plantilla]);
        await connection.query(
            'UPDATE plantilla_jugadora SET id_plantilla = ?, clausula = ?, es_titular_default = 0 WHERE id_entry = ?',
            [pComprador.id_plantilla, valorActual, id_entry]
        );

        // 3. Obtener info de nombres y fotos
        const [[uComp]] = await connection.query('SELECT nombre_usuario, foto_perfil_url FROM usuario WHERE id_usuario = ?', [id_usuario]);
        const [[uVend]] = await connection.query('SELECT nombre_usuario, foto_perfil_url FROM usuario WHERE id_usuario = ?', [id_propietario]);
        const [[jugadora]] = await connection.query('SELECT apodo, imagen FROM jugadora WHERE id_jugadora = ?', [id_jugadora]);

        //notificacion global
        const [usuariosLiga] = await connection.query('SELECT id_usuario FROM usuario WHERE id_liga = ?', [id_liga]);
        
        const payloadGlobal = JSON.stringify({
            vendedor: uVend.nombre_usuario,
            avatarVendedor: uVend.foto_perfil_url,
            comprador: uComp.nombre_usuario,
            avatarComprador: uComp.foto_perfil_url,
            jugadora: jugadora.apodo,
            fotoJugadora: jugadora.imagen,
            valor: id_clausula,
            mensaje: `${uComp.nombre_usuario} ha pagado la cláusula de ${jugadora.apodo} por ${id_clausula.toLocaleString()}€`
        });

        const queriesGlobales = usuariosLiga.map(u => {
            return connection.query(
                'INSERT INTO notificacion (id_usuario, tipo, payload) VALUES (?, "clausulazo", ?)',
                [u.id_usuario, payloadGlobal]
            );
        });

        // notificacion vendedor
        const payloadVendedor = JSON.stringify({
            titulo: '¡Has perdido una jugadora!',
            mensaje: `${uComp.nombre_usuario} ha pagado la cláusula de ${jugadora.apodo}. Has recibido ${id_clausula.toLocaleString()}€.`,
            id_jugadora: id_jugadora
        });

        // notificacion comprador
        const payloadComprador = JSON.stringify({
            titulo: '¡Fichaje completado!',
            mensaje: `Has pagado la cláusula de ${jugadora.apodo} por ${id_clausula.toLocaleString()}€.`,
            id_jugadora: id_jugadora
        });

        const queriesPersonales = [
            connection.query('INSERT INTO notificacion (id_usuario, tipo, payload) VALUES (?, "clausulazo_priv", ?)', [id_propietario, payloadVendedor]),
            connection.query('INSERT INTO notificacion (id_usuario, tipo, payload) VALUES (?, "clausulazo_priv", ?)', [id_usuario, payloadComprador])
        ];

        // Ejecutamos todas las inserciones
        await Promise.all([...queriesGlobales, ...queriesPersonales]);

        await connection.commit();
        res.status(200).json({ message: 'Operación completada' });

    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ message: 'Error en la transacción' });
    } finally {
        if (connection) connection.release();
    }
}



module.exports = {
    getMarketPlayers,
    modifyClause,
    marketSell, 
    payClause
};