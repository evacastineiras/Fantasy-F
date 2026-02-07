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
                j.posicion, j.imagen AS foto_jugadora, c.escudo_url AS foto_escudo,   
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

module.exports = {
    getTopStats
};