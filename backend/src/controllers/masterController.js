const pool = require('../db');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { calcularPuntos } = require('./calcularPuntos');

const pathFecha = path.join(__dirname, '../data/config_liga.json');
const upload = multer({ storage: multer.memoryStorage() });

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getVirtualDate = () => {
    if (!fs.existsSync(pathFecha)) {
        const inicial = { fecha: '2024-09-15' };
        fs.writeFileSync(pathFecha, JSON.stringify(inicial));
        return new Date(inicial.fecha);
    }
    const data = JSON.parse(fs.readFileSync(pathFecha));
    return new Date(data.fecha);
};

const saveVirtualDate = (nuevaFecha) => {
    const data = { fecha: nuevaFecha.toISOString().split('T')[0] };
    fs.writeFileSync(pathFecha, JSON.stringify(data));
};

const getFechaVirtualConHoraReal = () => {
    const virtual = getVirtualDate();
    const ahora = new Date();
    virtual.setHours(ahora.getHours(), ahora.getMinutes(), ahora.getSeconds());
    return virtual.toISOString().slice(0, 19).replace('T', ' ');
};

async function upsertJornada(connection, numero, fInicio, fFin) {
    const [rows] = await connection.query(
        'SELECT id_jornada FROM jornada WHERE numero = ?', [numero]
    );
    if (rows.length > 0) return rows[0].id_jornada;
    const [res] = await connection.query(
        'INSERT INTO jornada (numero, f_inicio, f_fin) VALUES (?, ?, ?)',
        [numero, fInicio, fFin]
    );
    return res.insertId;
}

async function idClubPorNombre(connection, nombre) {
    const [rows] = await connection.query(
        'SELECT id_club FROM club WHERE nombre = ?', [nombre]
    );
    if (rows.length === 0)
        throw new Error(`Club "${nombre}" no encontrado en la base de datos.`);
    return rows[0].id_club;
}

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

/**
 * Jornada activa o próxima para alinear:
 * - Si hoy está dentro del rango f_inicio..f_fin de una jornada → esa jornada
 * - Si no, la primera jornada con f_inicio > hoy
 */
async function getJornadaParaAlinear(fechaStr) {
    // Jornada activa
    const [[activa]] = await pool.query(
        `SELECT id_jornada, numero FROM jornada
         WHERE f_inicio <= ? AND f_fin >= ?
         ORDER BY f_inicio ASC LIMIT 1`,
        [fechaStr, fechaStr]
    );
    if (activa) return activa;

    // Próxima jornada futura
    const [[proxima]] = await pool.query(
        `SELECT id_jornada, numero FROM jornada
         WHERE f_inicio > ?
         ORDER BY f_inicio ASC LIMIT 1`,
        [fechaStr]
    );
    return proxima ?? null;
}

// ─── getInitialData ───────────────────────────────────────────────────────────

const getInitialData = async (req, res) => {
    const id_usuario = parseInt(req.params.id_usuario);
    try {
        if (id_usuario !== 1)
            return res.status(403).json({ message: "La petición está bloqueada para usuarios comunes" });

        const [ligasRes]    = await pool.query('SELECT COUNT(*) as total FROM liga');
        const [usuariosRes] = await pool.query('SELECT COUNT(*) as total FROM usuario');
        const [jornadaRes]  = await pool.query('SELECT MAX(numero) as actual FROM jornada');
        const mercadoAbierto = await calcularMercadoAbierto();

        res.json({
            totalLigas:          ligasRes[0].total,
            totalUsuarios:       usuariosRes[0].total,
            jornadaActualNumero: jornadaRes[0].actual || 0,
            fechaVirtual:        getVirtualDate(),
            mercadoAbierto
        });
    } catch (error) {
        console.error("Error en getInitialData Admin:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

// ─── nextDay ─────────────────────────────────────────────────────────────────

const nextDay = async (req, res) => {
    try {
        const estadoAntes = await calcularMercadoAbierto();

        let fechaActual = getVirtualDate();
        fechaActual.setDate(fechaActual.getDate() + 1);
        saveVirtualDate(fechaActual);

        const estadoDespues = await calcularMercadoAbierto();
        const nuevaFechaStr = fechaActual.toISOString().split('T')[0];
        const fechaNotif    = getFechaVirtualConHoraReal();

        // Fecha de ayer (la nueva fecha menos un día) — es cuando se jugaron los partidos
        const ayer = new Date(fechaActual);
        ayer.setDate(ayer.getDate() - 1);
        const ayerStr = ayer.toISOString().split('T')[0];

        // ── 1. Calcular puntos de los partidos jugados ayer ──────────────────
        const [partidosAyer] = await pool.query(
            `SELECT DISTINCT p.id_jornada
             FROM partido p
             WHERE DATE(p.fecha) = ?
               AND p.goles_local IS NOT NULL`,
            [ayerStr]
        );

        for (const { id_jornada } of partidosAyer) {
            // Jugadoras con rendimiento en esta jornada pero sin puntos calculados aún
            const [rendimientos] = await pool.query(
                `SELECT rj.id_jugadora, rj.goles, rj.asistencias, rj.porterias_cero,
                        rj.amarillas, rj.rojas, rj.minutos_jugados, rj.goles_encajados,
                        rj.valoracion, j.posicion
                 FROM rendimiento_jornada rj
                 JOIN jugadora j ON j.id_jugadora = rj.id_jugadora
                 WHERE rj.id_jornada = ?`,
                [id_jornada]
            );

            for (const rj of rendimientos) {
                const jugStats = {
                    posicion:               rj.posicion,
                    minutos:                rj.minutos_jugados,
                    goles:                  rj.goles,
                    asistencias:            rj.asistencias,
                    amarillas:              rj.amarillas,
                    rojas_directas:         rj.rojas,
                    penalti_fallado:        0,
                    penalti_provocado:      0,
                    penalti_cometido:       0,
                    rating:                 rj.valoracion ?? 0,
                    recuperaciones:         0,
                    perdidas_posesion:      0,
                    regates_completados:    0,
                    disparos_a_puerta:      0,
                    pases_clave:            0,
                    despejes:               0,
                    goles_propia:           0,
                    paradas:                0,
                    goles_encajados_equipo: rj.porterias_cero === 1 ? 0 : 1,
                };

                await pool.query(
                    `UPDATE rendimiento_jornada SET puntos = ?
                     WHERE id_jugadora = ? AND id_jornada = ?`,
                    [calcularPuntos(jugStats), rj.id_jugadora, id_jornada]
                );
            }

            // Actualizar valores de mercado tras calcular puntos
            const mercadoCerrado = !(await calcularMercadoAbierto());
            if (mercadoCerrado) {
                await actualizarValoresJugadoras();
            }
        }

        // ── 2. Cambio de estado del mercado ──────────────────────────────────
        if (estadoAntes !== estadoDespues) {
            const tipo    = estadoDespues ? 'inicio_traspasos' : 'fin_traspasos';
            const mensaje = estadoDespues
                ? '¡El mercado de fichajes está abierto! Tienes 3 días para realizar traspasos.'
                : 'El mercado de fichajes ha cerrado. ¡Suerte en la próxima jornada!';

            const [usuarios] = await pool.query(
                `SELECT id_usuario FROM usuario WHERE id_liga IS NOT NULL`
            );
            await Promise.all(usuarios.map(u =>
                pool.query(
                    'INSERT INTO notificacion (id_usuario, tipo, payload, creada_en) VALUES (?, ?, ?, ?)',
                    [u.id_usuario, tipo, JSON.stringify({ mensaje }), fechaNotif]
                )
            ));

            // ── 3. Al cerrar el mercado: resolver pujas y congelar alineaciones ──
            if (!estadoDespues) {
                await resolverPujasLibres(fechaNotif, nuevaFechaStr);
                await congelarAlineaciones(nuevaFechaStr);
            }
        }

        // ── 4. Expirar pujas entre jornadas ──────────────────────────────────
        const [pujasPendientes] = await pool.query(
            `SELECT p.id_puja, p.id_comprador, p.id_vendedor,
                    p.id_entry, p.id_liga, j.apodo
             FROM puja p
             JOIN plantilla_jugadora pj ON p.id_entry = pj.id_entry
             JOIN jugadora j ON pj.id_jugadora = j.id_jugadora
             WHERE p.estado = 'pendiente'
               AND EXISTS (
                   SELECT 1 FROM jornada jor
                   WHERE jor.f_fin >= p.creada_en
                     AND jor.f_fin < ?
                   LIMIT 1
               )`,
            [nuevaFechaStr]
        );

        for (const puja of pujasPendientes) {
            await pool.query(
                `UPDATE puja SET estado = 'expirada', resuelta_en = ? WHERE id_puja = ?`,
                [fechaNotif, puja.id_puja]
            );
            await pool.query(
                `DELETE FROM notificacion WHERE id_usuario = ? AND tipo = 'nueva_oferta'
                 AND JSON_UNQUOTE(JSON_EXTRACT(payload, '$.id_puja')) = ?`,
                [puja.id_vendedor, String(puja.id_puja)]
            );
            await pool.query(
                `INSERT INTO notificacion (id_usuario, tipo, payload, creada_en)
                 VALUES (?, 'oferta_expirada', ?, ?)`,
                [puja.id_comprador, JSON.stringify({
                    titulo: 'Oferta expirada',
                    mensaje: `Tu oferta por ${puja.apodo} ha expirado al comenzar una nueva jornada.`
                }), fechaNotif]
            );
            if (puja.id_vendedor) {
                await pool.query(
                    `INSERT INTO notificacion (id_usuario, tipo, payload, creada_en)
                     VALUES (?, 'oferta_expirada', ?, ?)`,
                    [puja.id_vendedor, JSON.stringify({
                        titulo: 'Oferta expirada',
                        mensaje: `La oferta por ${puja.apodo} ha expirado.`
                    }), fechaNotif]
                );
            }
        }

        res.json({ message: "Tiempo avanzado", nuevaFecha: nuevaFechaStr, mercadoAbierto: estadoDespues });

        // ── 5. Notificaciones de resultados de partidos de ayer ───────────────
        const [partidosNotif] = await pool.query(
            `SELECT p.id_partido, p.goles_local, p.goles_visitante,
                    cl.nombre AS nombre_local,    cl.escudo_url AS logo_local,
                    cv.nombre AS nombre_visitante, cv.escudo_url AS logo_visitante
             FROM partido p
             JOIN club cl ON p.id_local    = cl.id_club
             JOIN club cv ON p.id_visitante = cv.id_club
             WHERE DATE(p.fecha) = ?
               AND p.goles_local IS NOT NULL`,
            [ayerStr]
        );

        if (partidosNotif.length > 0) {
            const [usuariosLiga] = await pool.query(
                `SELECT id_usuario FROM usuario WHERE id_liga IS NOT NULL`
            );
            for (const partido of partidosNotif) {
                await Promise.all(usuariosLiga.map(u =>
                    pool.query(
                        `INSERT INTO notificacion (id_usuario, tipo, payload, creada_en)
                         VALUES (?, 'resultado', ?, ?)`,
                        [u.id_usuario, JSON.stringify({
                            nombreLocal:     partido.nombre_local,
                            logoLocal:       partido.logo_local,
                            golesLocal:      partido.goles_local,
                            nombreVisitante: partido.nombre_visitante,
                            logoVisitante:   partido.logo_visitante,
                            golesVisitante:  partido.goles_visitante,
                            mensaje: `${partido.nombre_local} ${partido.goles_local} - ${partido.goles_visitante} ${partido.nombre_visitante}`
                        }), fechaNotif]
                    )
                ));
            }
        }

    } catch (error) {
        console.error('Error en nextDay:', error);
        res.status(500).json({ error: "No se pudo avanzar el tiempo" });
    }
};

// ─── Helpers de nextDay ───────────────────────────────────────────────────────

async function actualizarValoresJugadoras() {
    const FACTOR = 0.08;
    const [[mediaRes]] = await pool.query(
        `SELECT COALESCE(ROUND(AVG(puntos), 2), 7) AS media_global
         FROM rendimiento_jornada WHERE puntos IS NOT NULL AND puntos > 0`
    );
    const REFERENCIA = mediaRes.media_global;

    const [todasJugadoras] = await pool.query(
        `SELECT pj.id_jugadora, j.valor_base
         FROM plantilla_jugadora pj
         JOIN jugadora j ON j.id_jugadora = pj.id_jugadora
         WHERE pj.id_liga = (SELECT id_liga FROM liga LIMIT 1)`
    );
    const [todasJornadas] = await pool.query(
        `SELECT id_jornada FROM jornada ORDER BY numero ASC`
    );

    for (const jug of todasJugadoras) {
        const suelo = Math.round(jug.valor_base * 0.5);
        let valorAcumulado = jug.valor_base;

        const [rendimientos] = await pool.query(
            `SELECT id_jornada, puntos FROM rendimiento_jornada WHERE id_jugadora = ?`,
            [jug.id_jugadora]
        );
        const rendimientoMap = new Map(rendimientos.map(r => [r.id_jornada, r.puntos]));

        for (const { id_jornada } of todasJornadas) {
            const puntos = rendimientoMap.get(id_jornada) ?? 0;
            const multiplicador = 1 + FACTOR * (puntos - REFERENCIA) / REFERENCIA;
            valorAcumulado = Math.max(suelo, Math.round(valorAcumulado * multiplicador));
        }

        await pool.query(
            `UPDATE plantilla_jugadora SET valor = ? WHERE id_jugadora = ?`,
            [valorAcumulado, jug.id_jugadora]
        );
    }

    await pool.query(
        `UPDATE plantilla p
         JOIN (
             SELECT pj.id_plantilla, SUM(pj.valor) AS nuevo_valor
             FROM plantilla_jugadora pj WHERE pj.id_plantilla IS NOT NULL
             GROUP BY pj.id_plantilla
         ) resumen ON resumen.id_plantilla = p.id_plantilla
         SET p.valor_equipo = resumen.nuevo_valor`
    );
}

async function resolverPujasLibres(fechaNotif, fechaStr) {
    const [ligasConPujas] = await pool.query(
        `SELECT DISTINCT id_liga FROM puja WHERE estado = 'pendiente' AND id_vendedor IS NULL`
    );

    for (const { id_liga } of ligasConPujas) {
        const [pujaGanadoras] = await pool.query(
            `SELECT p.id_entry, p.id_comprador, p.montante, p.id_puja,
                    j.apodo, j.id_jugadora, j.imagen AS foto_jugadora,
                    pj.valor AS valor_jugadora,
                    u.nombre_usuario AS nombre_comprador,
                    u.foto_perfil_url AS avatar_comprador
             FROM puja p
             JOIN plantilla_jugadora pj ON p.id_entry = pj.id_entry
             JOIN jugadora j ON pj.id_jugadora = j.id_jugadora
             JOIN usuario u ON p.id_comprador = u.id_usuario
             WHERE p.id_liga = ? AND p.estado = 'pendiente'
               AND p.id_vendedor IS NULL AND pj.id_plantilla IS NULL
               AND p.montante = (
                   SELECT MAX(p2.montante) FROM puja p2
                   WHERE p2.id_entry = p.id_entry AND p2.estado = 'pendiente'
                     AND p2.id_vendedor IS NULL
               )`,
            [id_liga]
        );

        const [usuariosLiga] = await pool.query(
            `SELECT id_usuario FROM usuario WHERE id_liga = ?`, [id_liga]
        );

        for (const ganadora of pujaGanadoras) {
            const { id_entry, id_comprador, montante, id_puja,
                    apodo, id_jugadora, foto_jugadora,
                    valor_jugadora, nombre_comprador, avatar_comprador } = ganadora;

            let connection;
            try {
                connection = await pool.getConnection();
                await connection.beginTransaction();

                const [[plantillaGanador]] = await connection.query(
                    `SELECT id_plantilla FROM plantilla WHERE id_usuario = ? AND id_liga = ?`,
                    [id_comprador, id_liga]
                );

                await connection.query(
                    `UPDATE plantilla_jugadora SET id_plantilla = ?, clausula = ?, es_titular_default = 0
                     WHERE id_entry = ?`,
                    [plantillaGanador.id_plantilla, Math.round(valor_jugadora), id_entry]
                );
                await connection.query(
                    `UPDATE plantilla SET n_jugadoras = n_jugadoras + 1, valor_equipo = valor_equipo + ?
                     WHERE id_usuario = ? AND id_liga = ?`,
                    [valor_jugadora, id_comprador, id_liga]
                );
                await connection.query(
                    `UPDATE puja SET estado = 'aceptada', resuelta_en = ? WHERE id_puja = ?`,
                    [fechaNotif, id_puja]
                );

                // Pujas perdedoras
                const [pujasPerdedoras] = await connection.query(
                    `SELECT id_puja, id_comprador, montante FROM puja
                     WHERE id_entry = ? AND estado = 'pendiente' AND id_puja != ?`,
                    [id_entry, id_puja]
                );
                for (const perdedora of pujasPerdedoras) {
                    await connection.query(
                        `UPDATE puja SET estado = 'retirada', resuelta_en = ? WHERE id_puja = ?`,
                        [fechaNotif, perdedora.id_puja]
                    );
                    await connection.query(
                        `UPDATE plantilla SET presupuesto = presupuesto + ?
                         WHERE id_usuario = ? AND id_liga = ?`,
                        [perdedora.montante, perdedora.id_comprador, id_liga]
                    );
                    await connection.query(
                        `INSERT INTO notificacion (id_usuario, tipo, payload, creada_en)
                         VALUES (?, 'puja_superada', ?, ?)`,
                        [perdedora.id_comprador, JSON.stringify({
                            titulo: 'Puja perdida',
                            mensaje: `No has conseguido fichar a ${apodo}. Se han devuelto ${perdedora.montante.toLocaleString()}€.`,
                            id_jugadora, fotoJugadora: foto_jugadora
                        }), fechaNotif]
                    );
                }

                // Notificación al ganador
                await connection.query(
                    `INSERT INTO notificacion (id_usuario, tipo, payload, creada_en)
                     VALUES (?, 'oferta_aceptada', ?, ?)`,
                    [id_comprador, JSON.stringify({
                        titulo: '¡Fichaje completado!',
                        mensaje: `Has fichado a ${apodo} por ${montante.toLocaleString()}€.`,
                        id_jugadora, fotoJugadora: foto_jugadora
                    }), fechaNotif]
                );

                // Notificación pública
                await Promise.all(usuariosLiga.map(u =>
                    connection.query(
                        `INSERT INTO notificacion (id_usuario, tipo, payload, creada_en)
                         VALUES (?, 'venta', ?, ?)`,
                        [u.id_usuario, JSON.stringify({
                            titulo: 'Nuevo fichaje en la liga',
                            comprador: nombre_comprador,
                            avatarComprador: avatar_comprador,
                            jugadora: apodo,
                            fotoJugadora: foto_jugadora,
                            montante,
                            mensaje: `${nombre_comprador} ha fichado a ${apodo} por ${montante.toLocaleString()}€`
                        }), fechaNotif]
                    )
                ));

                await connection.commit();
            } catch (err) {
                if (connection) await connection.rollback();
                console.error(`Error resolviendo puja para ${apodo}:`, err);
            } finally {
                if (connection) connection.release();
            }
        }

        // Pujas sin resolver (jugadora ya tenía propietario): devolver dinero
        const [pujasSinResolver] = await pool.query(
            `SELECT p.id_puja, p.id_comprador, p.montante, j.apodo, j.id_jugadora
             FROM puja p
             JOIN plantilla_jugadora pj ON p.id_entry = pj.id_entry
             JOIN jugadora j ON pj.id_jugadora = j.id_jugadora
             WHERE p.id_liga = ? AND p.estado = 'pendiente' AND p.id_vendedor IS NULL`,
            [id_liga]
        );
        for (const puja of pujasSinResolver) {
            await pool.query(
                `UPDATE puja SET estado = 'expirada', resuelta_en = ? WHERE id_puja = ?`,
                [fechaNotif, puja.id_puja]
            );
            await pool.query(
                `UPDATE plantilla SET presupuesto = presupuesto + ?
                 WHERE id_usuario = ? AND id_liga = ?`,
                [puja.montante, puja.id_comprador, id_liga]
            );
            await pool.query(
                `INSERT INTO notificacion (id_usuario, tipo, payload, creada_en)
                 VALUES (?, 'oferta_expirada', ?, ?)`,
                [puja.id_comprador, JSON.stringify({
                    titulo: 'Puja expirada',
                    mensaje: `Tu puja por ${puja.apodo} ha expirado. Se han devuelto ${puja.montante.toLocaleString()}€.`,
                    id_jugadora: puja.id_jugadora
                }), fechaNotif]
            );
        }
    }
}

async function congelarAlineaciones(fechaStr) {
    // Jornada que se va a jugar (la que congelamos)
    const jornadaParaCongelar = await getJornadaParaAlinear(fechaStr);
    if (!jornadaParaCongelar) return;

    // Siguiente jornada (la que se pre-crea copiando titulares)
    const [[siguienteJornada]] = await pool.query(
        `SELECT id_jornada, numero FROM jornada
         WHERE f_inicio > (SELECT f_fin FROM jornada WHERE id_jornada = ?)
         ORDER BY f_inicio ASC LIMIT 1`,
        [jornadaParaCongelar.id_jornada]
    );

    const [plantillas] = await pool.query(
        `SELECT p.id_plantilla FROM plantilla p
         JOIN usuario u ON u.id_usuario = p.id_usuario
         WHERE u.id_liga IS NOT NULL`
    );

    for (const { id_plantilla } of plantillas) {

        // ── 1. Congelar la jornada actual ─────────────────────────────────────
        let id_alineacion;
        const [[existente]] = await pool.query(
            `SELECT id_alineacion FROM alineacion WHERE id_plantilla = ? AND id_jornada = ?`,
            [id_plantilla, jornadaParaCongelar.id_jornada]
        );

        if (existente) {
            id_alineacion = existente.id_alineacion;
            await pool.query(
                `DELETE FROM alineacion_item WHERE id_alineacion = ?`, [id_alineacion]
            );
        } else {
            const [res] = await pool.query(
                `INSERT INTO alineacion (id_plantilla, id_jornada) VALUES (?, ?)`,
                [id_plantilla, jornadaParaCongelar.id_jornada]
            );
            id_alineacion = res.insertId;
        }

        const [jugadoras] = await pool.query(
            `SELECT pj.id_entry, j.posicion, pj.es_titular_default
             FROM plantilla_jugadora pj
             JOIN jugadora j ON j.id_jugadora = pj.id_jugadora
             WHERE pj.id_plantilla = ?`,
            [id_plantilla]
        );

        for (const jug of jugadoras) {
            await pool.query(
                `INSERT INTO alineacion_item (id_alineacion, id_entry, posicion, es_titular)
                 VALUES (?, ?, ?, ?)`,
                [id_alineacion, jug.id_entry, jug.posicion, jug.es_titular_default]
            );
        }

        // ── 2. Pre-crear alineación de la siguiente jornada copiando titulares ──
        // Si el usuario no toca nada, jugará con las mismas jugadoras la próxima jornada
        if (siguienteJornada) {
            const [[existenteSig]] = await pool.query(
                `SELECT id_alineacion FROM alineacion WHERE id_plantilla = ? AND id_jornada = ?`,
                [id_plantilla, siguienteJornada.id_jornada]
            );

            let id_alineacion_sig;
            if (existenteSig) {
                // Ya existe (el usuario la había guardado manualmente): no sobreescribir
                continue;
            } else {
                const [resSig] = await pool.query(
                    `INSERT INTO alineacion (id_plantilla, id_jornada) VALUES (?, ?)`,
                    [id_plantilla, siguienteJornada.id_jornada]
                );
                id_alineacion_sig = resSig.insertId;
            }

            // Copiar exactamente los mismos items que acabamos de congelar
            for (const jug of jugadoras) {
                await pool.query(
                    `INSERT INTO alineacion_item (id_alineacion, id_entry, posicion, es_titular)
                     VALUES (?, ?, ?, ?)`,
                    [id_alineacion_sig, jug.id_entry, jug.posicion, jug.es_titular_default]
                );
            }
        }
    }
}

// ─── importarJornada ─────────────────────────────────────────────────────────
// Solo importa estructura y rendimiento bruto. Los puntos se calculan en nextDay.

const importarJornada = async (req, res) => {
    if (!req.file)
        return res.status(400).json({ message: 'No se ha enviado ningún fichero.' });

    let datos;
    try {
        datos = JSON.parse(req.file.buffer.toString('utf8'));
    } catch {
        return res.status(400).json({ message: 'El fichero no es un JSON válido.' });
    }

    if (!datos.jornada || !Array.isArray(datos.partidos))
        return res.status(400).json({ message: 'Formato incorrecto.' });

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const numeroJornada = datos.jornada;
        const fechas  = datos.partidos.map(p => new Date(p.fecha));
        const fInicio = new Date(Math.min(...fechas));
        const fFin    = new Date(Math.max(...fechas));
        fFin.setHours(23, 59, 59);

        const idJornada = await upsertJornada(connection, numeroJornada, fInicio, fFin);

        for (const partido of datos.partidos) {
            const idRival = await idClubPorNombre(connection, partido.rival);
            const idClub  = partido.id_club;
            const esLocal = partido.es_local;
            const idLocal = esLocal ? idClub  : idRival;
            const idVisit = esLocal ? idRival : idClub;
            const golesL  = esLocal ? partido.goles_favor  : partido.goles_contra;
            const golesV  = esLocal ? partido.goles_contra : partido.goles_favor;

            await connection.query(
                `INSERT INTO partido (id_jornada, id_local, id_visitante, fecha, goles_local, goles_visitante)
                 VALUES (?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                   goles_local = VALUES(goles_local), goles_visitante = VALUES(goles_visitante),
                   fecha = VALUES(fecha)`,
                [idJornada, idLocal, idVisit, new Date(partido.fecha), golesL, golesV]
            );

            for (const jug of partido.jugadoras) {
                if (jug.minutos === 0) continue;

                const porteriaCero = jug.goles_encajados_equipo === 0 ? 1 : 0;

                const [[anterior]] = await connection.query(
                    `SELECT goles, asistencias, porterias_cero, amarillas, rojas,
                            minutos_jugados, goles_encajados
                     FROM rendimiento_jornada WHERE id_jugadora = ? AND id_jornada = ?`,
                    [jug.id_jugadora, idJornada]
                );

                const diff = {
                    goles:          jug.goles              - (anterior?.goles           ?? 0),
                    asistencias:    jug.asistencias        - (anterior?.asistencias     ?? 0),
                    porteriaCero:   porteriaCero           - (anterior?.porterias_cero  ?? 0),
                    amarillas:      jug.amarillas          - (anterior?.amarillas       ?? 0),
                    rojas:          jug.rojas_directas     - (anterior?.rojas           ?? 0),
                    minutos:        jug.minutos            - (anterior?.minutos_jugados ?? 0),
                    golesEncajados: jug.goles_encajados_equipo - (anterior?.goles_encajados ?? 0),
                };

                // ── Puntos = NULL hasta que nextDay los calcule al día siguiente ──
                await connection.query(
                    `INSERT INTO rendimiento_jornada
                       (id_jugadora, id_jornada, goles, asistencias, porterias_cero,
                        amarillas, rojas, minutos_jugados, goles_encajados, puntos, valoracion)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
                     ON DUPLICATE KEY UPDATE
                       goles = VALUES(goles), asistencias = VALUES(asistencias),
                       porterias_cero = VALUES(porterias_cero), amarillas = VALUES(amarillas),
                       rojas = VALUES(rojas), minutos_jugados = VALUES(minutos_jugados),
                       goles_encajados = VALUES(goles_encajados),
                       puntos = NULL,
                       valoracion = VALUES(valoracion)`,
                    [
                        jug.id_jugadora, idJornada,
                        jug.goles, jug.asistencias, porteriaCero,
                        jug.amarillas, jug.rojas_directas, jug.minutos,
                        jug.goles_encajados_equipo,
                        jug.rating > 0 ? jug.rating : null,
                    ]
                );

                // Acumulados en jugadora (estadísticas históricas, independientes de puntos)
                await connection.query(
                    `UPDATE jugadora SET
                        goles_total           = goles_total           + ?,
                        asistencias_total     = asistencias_total     + ?,
                        porterias_cero        = porterias_cero        + ?,
                        amarillas_total       = amarillas_total       + ?,
                        rojas_total           = rojas_total           + ?,
                        minutos_total         = minutos_total         + ?,
                        goles_encajados_total = goles_encajados_total + ?
                     WHERE id_jugadora = ?`,
                    [diff.goles, diff.asistencias, diff.porteriaCero,
                     diff.amarillas, diff.rojas, diff.minutos,
                     diff.golesEncajados, jug.id_jugadora]
                );
            }
        }

        await connection.commit();
        res.status(200).json({ message: `Jornada ${numeroJornada} importada correctamente.` });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al importar jornada:', error);
        res.status(500).json({ message: error.message || 'Error interno.' });
    } finally {
        if (connection) connection.release();
    }
};

// ─── calcularPuntosJornada (manual desde panel admin) ────────────────────────

const calcularPuntosJornada = async (req, res) => {
    const { numero } = req.params;
    if (!numero || isNaN(Number(numero)))
        return res.status(400).json({ message: 'El número de jornada debe ser un entero.' });

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [[jornada]] = await connection.query(
            'SELECT id_jornada FROM jornada WHERE numero = ?', [numero]
        );
        if (!jornada)
            return res.status(404).json({ message: `La jornada ${numero} no existe.` });

        const [rendimientos] = await connection.query(
            `SELECT rj.*, j.posicion FROM rendimiento_jornada rj
             JOIN jugadora j ON j.id_jugadora = rj.id_jugadora
             WHERE rj.id_jornada = ?`,
            [jornada.id_jornada]
        );
        if (rendimientos.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: `Sin rendimientos para la jornada ${numero}.` });
        }

        for (const rj of rendimientos) {
            const jugStats = {
                posicion: rj.posicion, minutos: rj.minutos_jugados,
                goles: rj.goles, asistencias: rj.asistencias,
                amarillas: rj.amarillas, rojas_directas: rj.rojas,
                penalti_fallado: 0, penalti_provocado: 0, penalti_cometido: 0,
                rating: 0, recuperaciones: 0, perdidas_posesion: 0,
                regates_completados: 0, disparos_a_puerta: 0, pases_clave: 0,
                despejes: 0, goles_propia: 0, paradas: 0,
                goles_encajados_equipo: rj.porterias_cero === 1 ? 0 : 1,
            };
            await connection.query(
                'UPDATE rendimiento_jornada SET puntos = ? WHERE id_jugadora = ? AND id_jornada = ?',
                [calcularPuntos(jugStats), rj.id_jugadora, jornada.id_jornada]
            );
        }

        await connection.commit();
        res.status(200).json({
            message: `Puntos de jornada ${numero} recalculados.`,
            jugadoras_actualizadas: rendimientos.length
        });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ message: 'Error interno.' });
    } finally {
        if (connection) connection.release();
    }
};

// ─── getMercadoEstado ─────────────────────────────────────────────────────────

const getMercadoEstado = async (req, res) => {
    try {
        const abierto = await calcularMercadoAbierto();
        const hoy = getVirtualDate().toISOString().split('T')[0];
        let mensaje = '', fechaProximoCambio = null;

        if (abierto) {
            const [[ultimoPartido]] = await pool.query(
                `SELECT MAX(DATE(fecha)) as ultima_fecha FROM partido WHERE DATE(fecha) <= ?`, [hoy]
            );
            const cierre = new Date(ultimoPartido.ultima_fecha);
            cierre.setDate(cierre.getDate() + 4);
            fechaProximoCambio = cierre.toISOString().split('T')[0];
            mensaje = `Mercado abierto hasta el ${fechaProximoCambio}`;
        } else {
            const [[proximoPartido]] = await pool.query(
                `SELECT MIN(DATE(fecha)) as proxima_fecha FROM partido WHERE DATE(fecha) > ?`, [hoy]
            );
            if (proximoPartido?.proxima_fecha) {
                const apertura = new Date(proximoPartido.proxima_fecha);
                apertura.setDate(apertura.getDate() + 1);
                fechaProximoCambio = apertura.toISOString().split('T')[0];
                mensaje = `Mercado cerrado. Abre el ${fechaProximoCambio}`;
            } else {
                mensaje = 'Mercado cerrado';
            }
        }

        res.json({ abierto, mensaje, fechaProximoCambio });
    } catch (error) {
        console.error('Error al obtener estado del mercado:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// ─── getCalendario ────────────────────────────────────────────────────────────

const getCalendario = async (req, res) => {
    const mes = parseInt(req.params.mes);
    const anyo = parseInt(req.params.anyo);
    try {
        const fechaVirtual = getVirtualDate();
        const hoyStr = fechaVirtual.toISOString().split('T')[0];
        const mesNum  = (mes  === 0) ? fechaVirtual.getMonth() + 1 : mes;
        const anyoNum = (anyo === 0) ? fechaVirtual.getFullYear()   : anyo;
        const primerDia   = `${anyoNum}-${String(mesNum).padStart(2,'0')}-01`;
        const ultimoDiaStr = new Date(anyoNum, mesNum, 0).toISOString().split('T')[0];

        const [partidos] = await pool.query(
            `SELECT p.id_partido, p.fecha, p.goles_local, p.goles_visitante,
                    cl.nombre AS nombre_local, cl.escudo_url AS logo_local,
                    cv.nombre AS nombre_visitante, cv.escudo_url AS logo_visitante,
                    j.numero AS numero_jornada
             FROM partido p
             JOIN club cl ON p.id_local = cl.id_club
             JOIN club cv ON p.id_visitante = cv.id_club
             JOIN jornada j ON p.id_jornada = j.id_jornada
             WHERE YEAR(p.fecha) = ? AND MONTH(p.fecha) = ?
             ORDER BY p.fecha ASC`,
            [anyoNum, mesNum]
        );

        const [jornadas] = await pool.query(
            `SELECT numero, f_inicio, f_fin FROM jornada
             WHERE (YEAR(f_inicio)=? AND MONTH(f_inicio)=?)
                OR (YEAR(f_fin)=?   AND MONTH(f_fin)=?)
                OR (f_inicio <= ? AND f_fin >= ?)
             ORDER BY numero ASC`,
            [anyoNum, mesNum, anyoNum, mesNum, primerDia, ultimoDiaStr]
        );

        const [todosPartidos] = await pool.query(
            `SELECT DATE(fecha) as fecha_partido FROM partido
             WHERE goles_local IS NOT NULL ORDER BY fecha ASC`
        );

        const ventanasMercado = [];
        for (let i = 0; i < todosPartidos.length; i++) {
            const actual   = todosPartidos[i];
            const siguiente = todosPartidos[i + 1];
            const esUltimo = !siguiente ||
                (new Date(siguiente.fecha_partido) - new Date(actual.fecha_partido)) > 86400000;
            if (esUltimo) {
                const abre   = new Date(actual.fecha_partido); abre.setDate(abre.getDate() + 1);
                const cierra = new Date(abre);                 cierra.setDate(cierra.getDate() + 3);
                if ((abre.getMonth()+1 === mesNum && abre.getFullYear() === anyoNum) ||
                    (cierra.getMonth()+1 === mesNum && cierra.getFullYear() === anyoNum)) {
                    ventanasMercado.push({
                        abre:   abre.toISOString().split('T')[0],
                        cierra: cierra.toISOString().split('T')[0]
                    });
                }
            }
        }

        res.json({ fechaVirtual: hoyStr, partidos, jornadas, ventanasMercado });
    } catch (error) {
        console.error('Error en getCalendario:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

module.exports = {
    getInitialData,
    getVirtualDate,
    calcularMercadoAbierto,
    getMercadoEstado,
    nextDay,
    upload,
    importarJornada,
    calcularPuntosJornada,
    getCalendario
};