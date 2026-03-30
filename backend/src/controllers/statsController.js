const pool = require('../db');
const fs   = require('fs');
const path = require('path');

const pathFecha = path.join(__dirname, '../data/config_liga.json');

const getVirtualDate = () => {
    if (!fs.existsSync(pathFecha)) return new Date('2024-09-15');
    const data = JSON.parse(fs.readFileSync(pathFecha));
    return new Date(data.fecha);
};

// ─── getMyTeamStats ───────────────────────────────────────────────────────────
// Solo cuenta jornadas cuya f_fin ya pasó Y cuyos puntos ya fueron calculados
const getMyTeamStats = async (req, res) => {
    const { id_usuario } = req.params;
    const fechaVirtual = getVirtualDate().toISOString().split('T')[0];

    try {
        const query = `
            SELECT 
                j.id_jugadora, 
                j.posicion, 
                j.imagen       AS foto_jugadora, 
                c.escudo_url   AS foto_escudo,   
                j.apodo, 
                pj.valor       AS valor_actual,
                j.valor_base,
                -- Solo partidos ya jugados con puntos calculados
                COUNT(rj.id_jornada)               AS partidos_jugados,
                j.goles_total                      AS goles,
                j.asistencias_total                AS asistencias,
                j.amarillas_total                  AS amarillas,
                j.rojas_total                      AS rojas,
                IFNULL(ROUND(AVG(rj.puntos), 2), 0) AS puntos_media,
                IFNULL(ROUND(AVG(rj.valoracion), 1), 0) AS valoracion_media
            FROM jugadora j
            JOIN club c ON j.id_club = c.id_club
            JOIN plantilla_jugadora pj ON j.id_jugadora = pj.id_jugadora
            JOIN plantilla p ON pj.id_plantilla = p.id_plantilla
            LEFT JOIN rendimiento_jornada rj ON j.id_jugadora = rj.id_jugadora
                -- Solo jornadas ya jugadas con puntos calculados
                AND rj.puntos IS NOT NULL
                AND EXISTS (
                    SELECT 1 FROM jornada jor
                    WHERE jor.id_jornada = rj.id_jornada
                      AND jor.f_fin <= ?
                )
            WHERE p.id_usuario = ?
            GROUP BY 
                j.id_jugadora, j.posicion, j.imagen, c.escudo_url, 
                j.apodo, pj.valor, j.valor_base
            ORDER BY puntos_media DESC;
        `;
        const [rows] = await pool.query(query, [fechaVirtual, id_usuario]);
        res.json(rows);

    } catch (error) {
        console.error("ERROR SQL DETALLADO:", error);
        res.status(500).json({ 
            message: "Error al obtener estadísticas del equipo",
            error: error.message 
        });
    }
};

// ─── getTopStats ──────────────────────────────────────────────────────────────
// Las estadísticas acumuladas (goles_total etc.) son históricas y no dependen
// de la fecha virtual — reflejan lo que la jugadora real ha hecho.
// No cambia nada aquí.
const getTopStats = async (req, res) => {
    const { criterio } = req.params; 
    
    let posiciones   = "'DEF', 'MED', 'DEL'";
    let columnaStats = `j.${criterio}`;

    if (criterio === 'porteria_total') {
        posiciones   = "'POR'"; 
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
                j.goles_encajados_total, j.porterias_cero,
                j.amarillas_total AS amarillas, j.rojas_total AS rojas
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

// ─── getPlayerInfo ────────────────────────────────────────────────────────────
// puntos_ultima_jornada: solo de jornadas ya jugadas con puntos calculados
// medias: ídem
const getPlayerInfo = async (req, res) => {
    const { id_jugadora, id_usuario } = req.body;
    const fechaVirtual = getVirtualDate().toISOString().split('T')[0];

    try {
        if (!id_usuario || !id_jugadora)
            return res.status(400).json({ message: 'Faltan datos' });

        const [users] = await pool.query(
            `SELECT id_usuario FROM usuario WHERE id_usuario = ?`, [id_usuario]
        );
        if (users.length === 0)
            return res.status(404).json({ message: 'Usuario no encontrado' });

        const [rows] = await pool.query(
            `SELECT 
                j.id_jugadora, j.nombre, j.apellidos, j.fnacimiento, j.altura,
                j.pierna_buena, j.posicion, j.apodo,
                j.goles_total, j.asistencias_total, j.amarillas_total, j.rojas_total,
                j.imagen_carta, j.imagen AS foto,
                j.goles_encajados_total, j.porterias_cero,
                pj.clausula, pj.valor, pj.id_entry,
                (SELECT p.id_usuario FROM plantilla p
                 WHERE p.id_plantilla = pj.id_plantilla) AS id_propietario,

                -- Pujas
                (SELECT MAX(montante) FROM puja
                 WHERE id_entry = pj.id_entry AND estado = 'pendiente') AS ultima_puja,
                (SELECT id_comprador FROM puja
                 WHERE id_entry = pj.id_entry AND estado = 'pendiente'
                 ORDER BY montante DESC LIMIT 1) AS id_ultimo_pujador,

                -- Puntos de la última jornada YA jugada y con puntos calculados
                (SELECT rj2.puntos
                 FROM rendimiento_jornada rj2
                 JOIN jornada jor2 ON jor2.id_jornada = rj2.id_jornada
                 WHERE rj2.id_jugadora = j.id_jugadora
                   AND rj2.puntos IS NOT NULL
                   AND jor2.f_fin <= ?
                 ORDER BY jor2.f_fin DESC
                 LIMIT 1) AS puntos_ultima_jornada,

                -- Medias solo de jornadas ya jugadas con puntos calculados
                ROUND(AVG(CASE WHEN rend.puntos IS NOT NULL
                               AND jor.f_fin <= ? THEN rend.puntos END), 2)
                    AS media_puntos,
                ROUND(AVG(CASE WHEN rend.puntos IS NOT NULL
                               AND jor.f_fin <= ? THEN rend.goles END), 2)
                    AS media_goles,
                ROUND(AVG(CASE WHEN rend.puntos IS NOT NULL
                               AND jor.f_fin <= ? THEN rend.asistencias END), 2)
                    AS media_asistencias,
                ROUND(AVG(CASE WHEN rend.puntos IS NOT NULL
                               AND jor.f_fin <= ? THEN rend.goles_encajados END), 2)
                    AS media_goles_encajados,
                ROUND(AVG(CASE WHEN rend.puntos IS NOT NULL
                               AND jor.f_fin <= ? THEN rend.porterias_cero END), 2)
                    AS media_porterias_cero
            FROM jugadora j
            INNER JOIN plantilla_jugadora pj ON j.id_jugadora = pj.id_jugadora
            INNER JOIN plantilla p_consulta ON pj.id_liga = p_consulta.id_liga
            LEFT JOIN rendimiento_jornada rend ON j.id_jugadora = rend.id_jugadora
            LEFT JOIN jornada jor ON jor.id_jornada = rend.id_jornada
            WHERE j.id_jugadora = ? AND p_consulta.id_usuario = ?
            GROUP BY j.id_jugadora, pj.clausula, pj.id_entry, pj.valor, pj.id_plantilla`,
            [
                fechaVirtual,           // puntos_ultima_jornada
                fechaVirtual,           // media_puntos
                fechaVirtual,           // media_goles
                fechaVirtual,           // media_asistencias
                fechaVirtual,           // media_goles_encajados
                fechaVirtual,           // media_porterias_cero
                id_jugadora, id_usuario
            ]
        );

        if (rows.length === 0)
            return res.status(404).json({ message: 'Jugadora no encontrada' });

        res.json({ message: 'Detalles cargados con éxito', player: rows[0] });

    } catch (error) {
        console.error('Error al obtener info de jugadora:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// ─── getPlayerValueHistory ────────────────────────────────────────────────────
// Solo incluye jornadas cuya f_fin ya pasó Y con puntos calculados.
// Esto hace que el chart solo muestre el valor hasta donde realmente se conoce.
const getPlayerValueHistory = async (req, res) => {
    const { id_jugadora, id_usuario } = req.body;
    const FACTOR = 0.08;
    const fechaVirtual = getVirtualDate().toISOString().split('T')[0];

    try {
        if (!id_jugadora || !id_usuario)
            return res.status(400).json({ message: 'Faltan datos' });

        // Media global solo de puntos ya calculados
        const [[mediaRes]] = await pool.query(
            `SELECT COALESCE(ROUND(AVG(puntos), 2), 7) AS media_global
             FROM rendimiento_jornada
             WHERE puntos IS NOT NULL`
        );
        const REFERENCIA = mediaRes.media_global;

        const [[jugadora]] = await pool.query(
            `SELECT j.valor_base, pj.valor AS valor_actual
             FROM jugadora j
             JOIN plantilla_jugadora pj ON pj.id_jugadora = j.id_jugadora
             JOIN usuario u ON u.id_liga = pj.id_liga
             WHERE j.id_jugadora = ? AND u.id_usuario = ?`,
            [id_jugadora, id_usuario]
        );
        if (!jugadora)
            return res.status(404).json({ message: 'Jugadora no encontrada' });

        // Solo jornadas ya jugadas con puntos calculados
        const [todasJornadas] = await pool.query(
            `SELECT numero, id_jornada FROM jornada
             WHERE f_fin <= ?
             ORDER BY numero ASC`,
            [fechaVirtual]
        );

        const [rendimientos] = await pool.query(
            `SELECT rj.id_jornada, rj.puntos
             FROM rendimiento_jornada rj
             WHERE rj.id_jugadora = ? AND rj.puntos IS NOT NULL`,
            [id_jugadora]
        );
        const rendimientoMap = new Map(rendimientos.map(r => [r.id_jornada, r.puntos]));

        const historial = [{ jornada: 0, valor: jugadora.valor_base }];
        let valorAcumulado = jugadora.valor_base;
        const suelo = Math.round(jugadora.valor_base * 0.5);

        for (const jornada of todasJornadas) {
            const puntos = rendimientoMap.get(jornada.id_jornada) ?? 0;
            const multiplicador = 1 + FACTOR * (puntos - REFERENCIA) / REFERENCIA;
            valorAcumulado = Math.max(suelo, Math.round(valorAcumulado * multiplicador));
            historial.push({ jornada: jornada.numero, valor: valorAcumulado });
        }

        res.json({ historial, valorActual: valorAcumulado });

    } catch (error) {
        console.error('Error al obtener historial de valor:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// ─── Sin cambios ──────────────────────────────────────────────────────────────

const getFeed = async (req, res) => {
    const { id } = req.params; 
    try {
        if (!id) return res.status(400).json({ message: 'Faltan datos' });
        const [toret] = await pool.query(`
            SELECT * FROM notificacion 
            WHERE id_usuario = ? 
              AND tipo IN ('clausulazo', 'venta', 'nuevo_en_liga', 'abandono_liga',
                           'resultado', 'sistema', 'inicio_traspasos', 'fin_traspasos')
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
              AND tipo IN ('puja_superada', 'clausulazo_priv', 'oferta_aceptada',
                           'oferta_rechazada', 'nueva_oferta', 'oferta_expirada')
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
            `UPDATE notificacion SET leida = 1
             WHERE id_usuario = ? AND leida = 0 AND tipo != 'nueva_oferta'`,
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
            `SELECT COUNT(*) AS total FROM notificacion 
             WHERE id_usuario = ? AND leida = 0 
               AND tipo IN ('puja_superada', 'clausulazo_priv', 'oferta_aceptada',
                            'oferta_rechazada', 'nueva_oferta', 'oferta_expirada')`,
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
    getUnreadCount,
    getMyTeamStats,
    getPlayerValueHistory
};