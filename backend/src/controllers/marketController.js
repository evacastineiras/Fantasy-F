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
        u.nombre AS nombre_usuario, -- Cambiado de u.username a u.nombre
        (SELECT MAX(montante) 
         FROM puja 
         WHERE id_entry = pj.id_entry 
         AND estado = 'pendiente') AS ultima_puja
    FROM plantilla_jugadora pj 
    JOIN jugadora j ON pj.id_jugadora = j.id_jugadora 
    JOIN club c ON j.id_club = c.id_club 
    LEFT JOIN plantilla p ON pj.id_plantilla = p.id_plantilla
    LEFT JOIN usuario u ON p.id_usuario = u.id_usuario -- Asegúrate que el campo sea id_usuario
    WHERE pj.id_liga = (SELECT id_liga FROM usuario WHERE id_usuario = ?) 
    ORDER BY pj.valor DESC;
`, [id_usuario]);

        res.status(200).json(players);
    } catch (error) {
        console.error('Error al obtener mercado: ', error);
        res.status(500).json({ message: 'Error interno al obtener el mercado' });
    }
}

module.exports = {
    getMarketPlayers
};