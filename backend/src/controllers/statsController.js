const pool = require('../db');

const getMyTeamStats = async (req, res) => {
    const { id_usuario } = req.params;

    try {
        const query = `
            SELECT 
                j.id_jugadora, 
                j.posicion, 
                j.imagen AS foto_jugadora, 
                c.escudo_url AS foto_escudo,   
                j.apodo, 
                pj.valor AS valor_actual,
                j.valor_base,
                COUNT(rj.id_jornada) AS partidos_jugados,
                j.goles_total AS goles,
                j.asistencias_total AS asistencias,
                j.amarillas_total AS amarillas,
                j.rojas_total AS rojas,
                IFNULL(ROUND(AVG(rj.puntos), 2), 0) AS puntos_media,
                IFNULL(ROUND(AVG(rj.valoracion), 1), 0) AS valoracion_media
            FROM jugadora j
            JOIN club c ON j.id_club = c.id_club
            JOIN plantilla_jugadora pj ON j.id_jugadora = pj.id_jugadora
            JOIN plantilla p ON pj.id_plantilla = p.id_plantilla
            LEFT JOIN rendimiento_jornada rj ON j.id_jugadora = rj.id_jugadora
            WHERE p.id_usuario = ?
            GROUP BY 
                j.id_jugadora, j.posicion, j.imagen, c.escudo_url, 
                j.apodo, pj.valor, j.valor_base
            ORDER BY puntos_media DESC;
        `;
        const [rows] = await pool.query(query, [id_usuario]);
        res.json(rows);

    } catch (error) {
        console.error("ERROR SQL DETALLADO:", error);
        res.status(500).json({ 
            message: "Error al obtener estadísticas del equipo",
            error: error.message 
        });
    }
};


const getTopStats = async (req, res) => {
    const { criterio } = req.params; 
    
    let posiciones = "'DEF', 'MED', 'DEL'";
    let columnaStats = `j.${criterio}`;

    if (criterio === 'porteria_total') {
        posiciones = "'POR'"; 
        columnaStats = "j.porterias_cero"; 
    } else if (criterio === 'tarjetas_total') {
        columnaStats = "j.amarillas_total";
    }

    const validCriteria = ['goles_total', 'asistencias_total', 'tarjetas_total', 'porteria_total'];
    if (!validCriteria.includes(criterio)) {
        return res.status(400).json({ message: "Criterio no válido" });
    }

    try {
        const query = `
            SELECT 
                j.id_jugadora, j.posicion, j.imagen AS foto_jugadora, c.escudo_url AS foto_escudo,   
                j.apodo, pj.valor AS valor_actual, j.valor_base,
                u.nombre_usuario AS propietario, 
                ${columnaStats} AS valor_estadistico,
                j.goles_encajados_total, j.porterias_cero, j.amarillas_total as amarillas, j.rojas_total as rojas
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
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};


const getPlayerInfo = async (req, res) => {
    const { id_jugadora, id_usuario } = req.body;

    try {
        if (!id_usuario || !id_jugadora)
            return res.status(400).json({ message: 'Faltan datos' });

        const [users] = await pool.query(`SELECT id_usuario FROM usuario WHERE id_usuario = ?`, [id_usuario]);
        if (users.length === 0)
            return res.status(404).json({ message: 'Usuario no encontrado' });

        const [rows] = await pool.query(
            `SELECT 
                j.nombre, j.apellidos, j.fnacimiento, j.altura, j.pierna_buena, j.posicion, j.apodo,
                j.goles_total, j.asistencias_total, j.amarillas_total, j.rojas_total, j.imagen_carta,
                j.goles_encajados_total, j.porterias_cero,
                pj.clausula, pj.valor, pj.id_entry,
                (SELECT p.id_usuario FROM plantilla p WHERE p.id_plantilla = pj.id_plantilla) AS id_propietario,
                (SELECT rj.puntos FROM rendimiento_jornada rj WHERE rj.id_jugadora = j.id_jugadora ORDER BY rj.id_jornada DESC LIMIT 1) AS puntos_ultima_jornada,
                ROUND(AVG(rend.puntos), 2)           AS media_puntos,
                ROUND(AVG(rend.goles), 2)            AS media_goles,
                ROUND(AVG(rend.asistencias), 2)      AS media_asistencias,
                ROUND(AVG(rend.goles_encajados), 2)  AS media_goles_encajados,
                ROUND(AVG(rend.porterias_cero), 2)   AS media_porterias_cero
            FROM jugadora j
            INNER JOIN plantilla_jugadora pj ON j.id_jugadora = pj.id_jugadora
            INNER JOIN plantilla p_consulta ON pj.id_liga = p_consulta.id_liga
            LEFT JOIN rendimiento_jornada rend ON j.id_jugadora = rend.id_jugadora
            WHERE j.id_jugadora = ? AND p_consulta.id_usuario = ?
            GROUP BY j.id_jugadora, pj.clausula, pj.id_entry, pj.valor, pj.id_plantilla`,
            [id_jugadora, id_usuario]
        );

        if (rows.length === 0)
            return res.status(404).json({ message: 'Jugadora no encontrada' });

        res.json({ message: 'Detalles cargados con éxito', player: rows[0] });

    } catch (error) {
        console.error('Error al obtener info de jugadora:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};


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
        if (!id_usuario)
            return res.status(400).json({ message: 'Faltan datos' });

        const [notificaciones] = await pool.query(`
            SELECT * FROM notificacion 
            WHERE id_usuario = ? 
            AND tipo IN ('puja_superada', 'clausulazo_priv', 'oferta_aceptada', 'oferta_rechazada', 'nueva_oferta', 'oferta_expirada')
            ORDER BY creada_en DESC
        `, [id_usuario]);

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
            `UPDATE notificacion SET leida = 1 WHERE id_usuario = ? AND leida = 0 AND tipo!='nueva_oferta'`,
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
            `SELECT COUNT(*) as total FROM notificacion 
             WHERE id_usuario = ? AND leida = 0 
             AND tipo IN ('puja_superada', 'clausulazo_priv', 'oferta_aceptada', 'oferta_rechazada', 'nueva_oferta', 'oferta_expirada')`,
            [id_usuario]
        );
        res.json({ unreadCount: rows[0].total });
    } catch (error) {
        res.status(500).json({ message: 'Error al contar' });
    }
};


const getPlayerValueHistory = async (req, res) => {
    const { id_jugadora, id_usuario } = req.body;
    const FACTOR = 0.08;

    try {
        if (!id_jugadora || !id_usuario)
            return res.status(400).json({ message: 'Faltan datos' });

        const [[mediaRes]] = await pool.query(
            `SELECT COALESCE(ROUND(AVG(puntos), 2), 7) AS media_global FROM rendimiento_jornada`
        );
        const REFERENCIA = mediaRes.media_global;

        const [[jugadora]] = await pool.query(
            `SELECT j.valor_base, pj.valor as valor_actual
             FROM jugadora j
             JOIN plantilla_jugadora pj ON pj.id_jugadora = j.id_jugadora
             JOIN usuario u ON u.id_liga = pj.id_liga
             WHERE j.id_jugadora = ? AND u.id_usuario = ?`,
            [id_jugadora, id_usuario]
        );

        if (!jugadora)
            return res.status(404).json({ message: 'Jugadora no encontrada' });

        const [todasJornadas] = await pool.query(
            `SELECT numero, id_jornada FROM jornada ORDER BY numero ASC`
        );

        const [rendimientos] = await pool.query(
            `SELECT rj.id_jornada, rj.puntos FROM rendimiento_jornada rj WHERE rj.id_jugadora = ?`,
            [id_jugadora]
        );

        const rendimientoMap = new Map(rendimientos.map(r => [r.id_jornada, r.puntos]));

        const historial = [{ jornada: 0, valor: jugadora.valor_base }];
        let valorAcumulado = jugadora.valor_base;
        const suelo = Math.round(jugadora.valor_base * 0.5);

        for (const jornada of todasJornadas) {
            const puntos = rendimientoMap.has(jornada.id_jornada)
                ? rendimientoMap.get(jornada.id_jornada)
                : 0;
            const multiplicador = 1 + FACTOR * (puntos - REFERENCIA) / REFERENCIA;
            valorAcumulado = Math.max(suelo, Math.round(valorAcumulado * multiplicador));
            historial.push({ jornada: jornada.numero, valor: valorAcumulado });
        }

        const valorActual = historial[historial.length - 1].valor;
        res.json({ historial, valorActual });

    } catch (error) {
        console.error('Error al obtener historial de valor:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};


module.exports = {
    getTopStats,
    getPlayerInfo,
    getPersonalFeed,
    markAsRead,
    getFeed,
    getUnreadCount,
    getMyTeamStats,
    getPlayerValueHistory
};