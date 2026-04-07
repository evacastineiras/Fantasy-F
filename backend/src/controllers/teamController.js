const pool = require('../db');
const fs = require('fs');
const path = require('path');

const pathFecha = path.join(__dirname, '../data/config_liga.json');

const getVirtualDate = () => {
    if (!fs.existsSync(pathFecha)) return new Date('2024-09-15');
    const data = JSON.parse(fs.readFileSync(pathFecha));
    return new Date(data.fecha);
};

const calcularMercadoAbierto = async () => {
       const fechaVirtual = getVirtualDate();
    const hoy = fechaVirtual.toISOString().split('T')[0];

    const [partidosHoy] = await pool.query(
        `SELECT COUNT(*) as total FROM partido WHERE DATE(fecha) = ?`, [hoy]
    );
    if (partidosHoy[0].total > 0) return false;

    const [noHuboPartidos] = await pool.query(`SELECT COUNT(*) as total FROM partido WHERE DATE(fecha) < ?`, [hoy]);
    if(noHuboPartidos[0].total < 1) return true;

    const [[ultimoPartido]] = await pool.query(
        `SELECT MAX(DATE(fecha)) as ultima_fecha FROM partido WHERE DATE(fecha) <= ?`, [hoy]
    );
    if (!ultimoPartido?.ultima_fecha) return true;

    const apertura = new Date(ultimoPartido.ultima_fecha);
    apertura.setDate(apertura.getDate() + 1);
    const cierre = new Date(apertura);
    cierre.setDate(cierre.getDate() + 3);
    console.log("llegue al final: "+ new Date(hoy) >= apertura && new Date(hoy) < cierre);

    return new Date(hoy) >= apertura && new Date(hoy) < cierre;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/team/myTeam/:id_usuario
//
// Devuelve:
//  - Todas las jugadoras de la plantilla del usuario
//  - Sus puntos en la última jornada con rendimiento registrado
//  - La alineación guardada para la próxima jornada (si existe)
//  - Si el mercado está abierto (para bloquear edición en el front)
//  - El id de la próxima jornada (para guardar la alineación)
// ─────────────────────────────────────────────────────────────────────────────
async function getMyTeam(req, res) {
    const { id_usuario } = req.params;
    const fechaVirtual = getVirtualDate()

    try {
        // 1. Plantilla del usuario
        const [[plantilla]] = await pool.query(
            `SELECT id_plantilla, id_liga FROM plantilla WHERE id_usuario = ?`,
            [id_usuario]
        );

        if (!plantilla)
            return res.status(404).json({ message: 'El usuario no tiene plantilla' });

        const { id_plantilla, id_liga } = plantilla;

        // 2. Última jornada YA JUGADA (f_fin <= fecha virtual) con rendimiento registrado
        //    Solo mostramos puntos de jornadas que realmente se han disputado
        const [[ultimaJornada]] = await pool.query(
            `SELECT j.id_jornada, j.numero
             FROM jornada j
             WHERE j.f_fin <= ?
               AND EXISTS (
                   SELECT 1 FROM rendimiento_jornada rj WHERE rj.id_jornada = j.id_jornada
               )
             ORDER BY j.numero DESC
             LIMIT 1`,
            [fechaVirtual]
        );

        // 3. Jornada para la que alinear:
        //    - Si hoy está dentro del rango de una jornada (f_inicio <= hoy <= f_fin) → esa
        //    - Si no, la primera con f_inicio > hoy
        let proximaJornada = null;
        const [[jornadaActiva]] = await pool.query(
            `SELECT id_jornada, numero FROM jornada
             WHERE f_inicio <= ? AND f_fin >= ?
             ORDER BY f_inicio ASC LIMIT 1`,
            [fechaVirtual, fechaVirtual]
        );
        if (jornadaActiva) {
            proximaJornada = jornadaActiva;
        } else {
            const [[jornadaFutura]] = await pool.query(
                `SELECT id_jornada, numero FROM jornada
                 WHERE f_inicio > ?
                 ORDER BY f_inicio ASC LIMIT 1`,
                [fechaVirtual]
            );
            proximaJornada = jornadaFutura ?? null;
        }

        // 4. Jugadoras de la plantilla con puntos de la última jornada
        const [jugadoras] = await pool.query(
            `SELECT
                pj.id_entry,
                pj.valor,
                pj.clausula,
                j.id_jugadora,
                j.apodo,
                j.posicion,
                j.imagen_carta AS foto_carta,
                j.imagen AS foto,
                c.escudo_url AS club_escudo,
                COALESCE(rj.puntos, 0) AS puntos_ultima_jornada,
                COALESCE(rj.goles, 0) AS goles_ultima_jornada,
                COALESCE(rj.asistencias, 0) AS asistencias_ultima_jornada,
                COALESCE(rj.valoracion, 0) AS valoracion_ultima_jornada
             FROM plantilla_jugadora pj
             JOIN jugadora j ON pj.id_jugadora = j.id_jugadora
             JOIN club c ON j.id_club = c.id_club
             LEFT JOIN rendimiento_jornada rj
                ON rj.id_jugadora = j.id_jugadora
                AND rj.id_jornada = ?
             WHERE pj.id_plantilla = ?
             ORDER BY
                FIELD(j.posicion, 'POR', 'DEF', 'MED', 'DEL'),
                pj.valor DESC`,
            [ultimaJornada?.id_jornada ?? 0, id_plantilla]
        );

        // 5. Alineación a mostrar:
        //    - Si hay proximaJornada: la alineación guardada para esa jornada (editable)
        //    - Si mercado cerrado y no hay proximaJornada: la última alineación congelada
        let alineacionGuardada = null;
        let jornadaAlineacion = proximaJornada;

        // Con mercado cerrado y sin jornada futura, buscamos la última alineación guardada
        if (!jornadaAlineacion) {
            const [[ultimaAlineacion]] = await pool.query(
                `SELECT a.id_jornada FROM alineacion a
                 WHERE a.id_plantilla = ?
                 ORDER BY a.id_jornada DESC LIMIT 1`,
                [id_plantilla]
            );
            if (ultimaAlineacion) {
                const [[jornada]] = await pool.query(
                    `SELECT id_jornada, numero FROM jornada WHERE id_jornada = ?`,
                    [ultimaAlineacion.id_jornada]
                );
                jornadaAlineacion = jornada ?? null;
            }
        }

        if (jornadaAlineacion) {
            const [[alineacion]] = await pool.query(
                `SELECT id_alineacion FROM alineacion
                 WHERE id_plantilla = ? AND id_jornada = ?`,
                [id_plantilla, jornadaAlineacion.id_jornada]
            );

            if (alineacion) {
                const [items] = await pool.query(
                    `SELECT ai.id_entry, ai.posicion, ai.es_titular
                     FROM alineacion_item ai
                     WHERE ai.id_alineacion = ?`,
                    [alineacion.id_alineacion]
                );
                alineacionGuardada = {
                    id_alineacion: alineacion.id_alineacion,
                    items
                };
            }
        }

        // 6. Estado del mercado
        const mercadoAbierto = await calcularMercadoAbierto();

        res.json({
            id_plantilla,
            id_liga,
            mercadoAbierto,
            ultimaJornada:   ultimaJornada  ?? null,
            proximaJornada:  proximaJornada ?? null,
            jugadoras,
            alineacionGuardada
        });

    } catch (error) {
        console.error('Error en getMyTeam:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/team/saveAlineacion
//
// Guarda o actualiza la alineación de un usuario para la próxima jornada.
// Solo permitido con mercado abierto.
//
// Body: {
//   id_plantilla,
//   id_jornada,
//   titulares: [{ id_entry, posicion }],   // max 11, deben tener posicion válida
//   suplentes: [{ id_entry }]              // el resto de la plantilla
// }
// ─────────────────────────────────────────────────────────────────────────────
async function saveAlineacion(req, res) {
    const { id_plantilla, id_jornada, titulares, suplentes } = req.body;

    if (!id_plantilla || !id_jornada || !Array.isArray(titulares))
        return res.status(400).json({ message: 'Faltan datos obligatorios' });

    if (titulares.length > 11)
        return res.status(400).json({ message: 'No puedes tener más de 11 titulares' });

    const mercadoAbierto = await calcularMercadoAbierto();
    if (!mercadoAbierto)
        return res.status(403).json({ message: 'Solo puedes modificar la alineación con el mercado abierto' });

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Upsert de alineacion
        let id_alineacion;
        const [[alineacionExistente]] = await connection.query(
            `SELECT id_alineacion FROM alineacion
             WHERE id_plantilla = ? AND id_jornada = ?`,
            [id_plantilla, id_jornada]
        );

        if (alineacionExistente) {
            id_alineacion = alineacionExistente.id_alineacion;
            // Borramos los items anteriores para reescribir desde cero
            await connection.query(
                `DELETE FROM alineacion_item WHERE id_alineacion = ?`,
                [id_alineacion]
            );
        } else {
            const [result] = await connection.query(
                `INSERT INTO alineacion (id_plantilla, id_jornada) VALUES (?, ?)`,
                [id_plantilla, id_jornada]
            );
            id_alineacion = result.insertId;
        }

        // Insertar titulares (es_titular = 1) y actualizar es_titular_default
        for (const titular of titulares) {
            await connection.query(
                `INSERT INTO alineacion_item (id_alineacion, id_entry, posicion, es_titular)
                 VALUES (?, ?, ?, 1)`,
                [id_alineacion, titular.id_entry, titular.posicion]
            );
            // Crítico: actualizar es_titular_default para que congelarAlineaciones
            // copie correctamente el estado al congelar al cierre del mercado
            await connection.query(
                `UPDATE plantilla_jugadora SET es_titular_default = 1 WHERE id_entry = ?`,
                [titular.id_entry]
            );
        }

        // Insertar suplentes (es_titular = 0) y resetear es_titular_default
        if (Array.isArray(suplentes)) {
            for (const suplente of suplentes) {
                await connection.query(
                    `INSERT INTO alineacion_item (id_alineacion, id_entry, posicion, es_titular)
                     VALUES (?, ?, (
                         SELECT posicion FROM jugadora j
                         JOIN plantilla_jugadora pj ON pj.id_jugadora = j.id_jugadora
                         WHERE pj.id_entry = ?
                     ), 0)`,
                    [id_alineacion, suplente.id_entry, suplente.id_entry]
                );
                await connection.query(
                    `UPDATE plantilla_jugadora SET es_titular_default = 0 WHERE id_entry = ?`,
                    [suplente.id_entry]
                );
            }
        }

        await connection.commit();
        res.status(200).json({ message: 'Alineación guardada correctamente', id_alineacion });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error en saveAlineacion:', error);
        res.status(500).json({ message: 'Error interno al guardar la alineación' });
    } finally {
        if (connection) connection.release();
    }
}

module.exports = {
    getMyTeam,
    saveAlineacion
};