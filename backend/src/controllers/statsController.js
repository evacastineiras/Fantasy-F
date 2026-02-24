const pool = require('../db');

const getTopStats = async (req, res) => {
    const { criterio } = req.params; 
    
   
    let posiciones = "'DEF', 'MED', 'DEL'";
    let columnaStats = `j.${criterio}`;

    if (criterio === 'porterias_cero') {
        posiciones = "'POR'"; 
    }

    const validCriteria = ['goles_total', 'asistencias_total', 'amarillas_total', 'porterias_cero'];

    if (!validCriteria.includes(criterio)) {
        return res.status(400).json({ message: "Criterio no válido" });
    }

    try {
        const query = `
            SELECT 
                j.id_jugadora, j.posicion, j.imagen AS foto_jugadora, c.escudo_url AS foto_escudo,   
                j.apodo, pj.valor AS valor_actual, j.valor_base,
                ((pj.valor - j.valor_base) / j.valor_base * 100) AS tendencia,
                u.nombre_usuario AS propietario, 
                ${columnaStats} AS valor_estadistico
            FROM jugadora j
            JOIN club c ON j.id_club = c.id_club
            JOIN plantilla_jugadora pj ON j.id_jugadora = pj.id_jugadora
            LEFT JOIN plantilla p ON pj.id_plantilla = p.id_plantilla
            LEFT JOIN usuario u ON p.id_usuario = u.id_usuario
            WHERE j.posicion IN (${posiciones})
            ORDER BY ${columnaStats} DESC
            LIMIT 10;
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPlayerInfo = async (req, res) => {
    const { id_jugadora, id_usuario } = req.body;

    try {
        if (!id_usuario || !id_jugadora)
            return res.status(400).json({ message: 'Faltan datos' });

        const [users] = await pool.query(`SELECT id_usuario FROM usuario WHERE id_usuario = ?`, [id_usuario]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const [rows] = await pool.query(
            `SELECT 
        j.nombre, j.apellidos, j.fnacimiento, j.altura, j.pierna_buena, j.posicion, j.apodo,
        j.goles_total, j.asistencias_total, j.amarillas_total, j.rojas_total, j.imagen_carta,
        
        -- Datos específicos de la jugadora en esta liga (Cláusula y Valor Actual)
        pj.clausula, 
        pj.valor,
        pj.id_entry,

        -- Propietario en la liga del usuario consultante
        (SELECT p.id_usuario 
         FROM plantilla p 
         WHERE p.id_plantilla = pj.id_plantilla
        ) AS id_propietario,

        -- Puntos última jornada
        (SELECT rj.puntos 
         FROM rendimiento_jornada rj 
         WHERE rj.id_jugadora = j.id_jugadora 
         ORDER BY rj.id_jornada DESC LIMIT 1
        ) AS puntos_ultima_jornada,

        -- Medias calculadas
        ROUND(AVG(rend.puntos), 2) AS media_puntos,
        ROUND(AVG(rend.goles), 2) AS media_goles,
        ROUND(AVG(rend.asistencias), 2) AS media_asistencias

    FROM jugadora j
    -- Unimos con plantilla_jugadora filtrando por la liga del usuario
    INNER JOIN plantilla_jugadora pj ON j.id_jugadora = pj.id_jugadora
    INNER JOIN plantilla p_consulta ON pj.id_liga = p_consulta.id_liga
    LEFT JOIN rendimiento_jornada rend ON j.id_jugadora = rend.id_jugadora
    
    WHERE j.id_jugadora = ? 
      AND p_consulta.id_usuario = ?
    GROUP BY j.id_jugadora, pj.clausula, pj.id_entry, pj.valor, pj.id_plantilla`,
    [id_jugadora, id_usuario]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Jugadora no encontrada' });
        }

        const playerDetails = rows[0];

        res.json({ 
            message: 'Detalles cargados con éxito', 
            player: playerDetails 
        });

    } catch (error) {
        console.error('Error al obtener info de jugadora:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
}


const getFeed = async (req, res) => {
    const { id } = req.params; 
    try {
        if (!id) return res.status(400).json({ message: 'Faltan datos' });
        const [toret] = await pool.query(`
            SELECT * FROM notificacion 
            WHERE id_usuario = ? 
              AND tipo IN ('clausulazo', 'venta', 'nuevo_en_liga', 'abandono_liga', 'resultado', 'sistema', 'inicio_traspasos', 'fin_traspasos')
            ORDER BY creada_en DESC
        `, [id]);

        res.json(toret);

    } catch (error) {
        console.error('Error al obtener notificaciones:', error);
        res.status(500).json({ message: 'Error interno' });
    }
};

const getPersonalFeed = async (req, res) => {
   
    const { id_usuario } = req.params; 

    try {
        if (!id_usuario) {
            return res.status(400).json({ message: 'Faltan datos' });
        }

        const query = `
            SELECT * FROM notificacion 
            WHERE id_usuario = ? 
            AND tipo IN (
                'puja_superada', 
                'clausulazo_priv', 
                'oferta_aceptada', 
                'oferta_rechazada', 
                'nueva_oferta', 
                'oferta_expirada'
            )
            ORDER BY creada_en DESC
        `;

        const [notificaciones] = await pool.query(query, [id_usuario]);

        const rows = notificaciones.map(n => ({
            ...n,
            payload: typeof n.payload === 'string' ? JSON.parse(n.payload) : n.payload
        }));

        res.json(rows);
    } catch (error) {
        console.error('Error al obtener notificaciones:', error);
        res.status(500).json({ message: 'Error interno' });
    }
};

const markAsRead = async (req, res) => {
    const { id_usuario } = req.body; 

    try {
        await pool.query(
            'UPDATE notificacion SET leida = 1 WHERE id_usuario = ? AND leida = 0',
            [id_usuario]
        );
        res.json({ message: 'Notificaciones marcadas como leídas' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar notificaciones' });
    }
};

const getUnreadCount = async (req, res) => {
    const { id_usuario } = req.params;
    try {
        const [rows] = await pool.query(
            'SELECT COUNT(*) as total FROM notificacion WHERE id_usuario = ? AND leida = 0 AND tipo IN ("puja_superada", "clausulazo_priv", "oferta_aceptada", "oferta_rechazada", "nueva_oferta", "oferta_expirada")',
            [id_usuario]
        );
        res.json({ unreadCount: rows[0].total });
    } catch (error) {
        res.status(500).json({ message: 'Error al contar' });
    }
};

module.exports = {
    getTopStats,
    getPlayerInfo,
    getPersonalFeed,
    markAsRead,
    getFeed,
    getUnreadCount
};