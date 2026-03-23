const pool = require('../db');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { calcularPuntos } = require('./calcularPuntos');

const pathFecha = path.join(__dirname, '../data/config_liga.json');

const upload = multer({ storage: multer.memoryStorage() });


// ─── Helpers internos ────────────────────────────────────────────────────────

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
        'SELECT id_jornada FROM jornada WHERE numero = ?',
        [numero]
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
        'SELECT id_club FROM club WHERE nombre = ?',
        [nombre]
    );
    if (rows.length === 0)
        throw new Error(`Club "${nombre}" no encontrado en la base de datos.`);
    return rows[0].id_club;
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
        const fechaNotif = getFechaVirtualConHoraReal();

        // ── Cambio de estado del mercado ──────────────────────────────────
        if (estadoAntes !== estadoDespues) {
            const tipo = estadoDespues ? 'inicio_traspasos' : 'fin_traspasos';
            const mensaje = estadoDespues
                ? '¡El mercado de fichajes está abierto! Tienes 3 días para realizar traspasos.'
                : 'El mercado de fichajes ha cerrado. ¡Suerte en la próxima jornada!';

            const payload = JSON.stringify({ mensaje });

            const [usuarios] = await pool.query(
                `SELECT id_usuario FROM usuario WHERE id_liga IS NOT NULL`
            );

            const queries = usuarios.map(u =>
                pool.query(
                    'INSERT INTO notificacion (id_usuario, tipo, payload, creada_en) VALUES (?, ?, ?, ?)',
                    [u.id_usuario, tipo, payload, fechaNotif]
                )
            );
            await Promise.all(queries);
        }

        // ── Expirar pujas de jornadas anteriores ──────────────────────────
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
                 ORDER BY jor.f_fin ASC
                 LIMIT 1
             )`,
            [nuevaFechaStr]
        );

        for (const puja of pujasPendientes) {
            // expirada
            await pool.query(
                `UPDATE puja SET estado = 'expirada', resuelta_en = ? WHERE id_puja = ?`,
                [fechaNotif, puja.id_puja]
            );

            // eliminar oferta_nueva
            await pool.query(
                `DELETE FROM notificacion 
                WHERE id_usuario = ? 
                AND tipo = 'nueva_oferta'
                AND JSON_UNQUOTE(JSON_EXTRACT(payload, '$.id_puja')) = ?`,
                [puja.id_vendedor, String(puja.id_puja)]
            );

            // comprador
            const payloadComp = JSON.stringify({
                titulo: 'Oferta expirada',
                mensaje: `Tu oferta por ${puja.apodo} ha expirado al comenzar una nueva jornada.`
            });
            await pool.query(
                `INSERT INTO notificacion (id_usuario, tipo, payload, creada_en) 
                 VALUES (?, 'oferta_expirada', ?, ?)`,
                [puja.id_comprador, payloadComp, fechaNotif]
            );

            // vendedor
            const payloadVend = JSON.stringify({
                titulo: 'Oferta expirada',
                mensaje: `La oferta por ${puja.apodo} ha expirado al comenzar una nueva jornada.`
            });
            await pool.query(
                `INSERT INTO notificacion (id_usuario, tipo, payload, creada_en) 
                 VALUES (?, 'oferta_expirada', ?, ?)`,
                [puja.id_vendedor, payloadVend, fechaNotif]
            );
        }

        res.json({
            message: "Tiempo avanzado",
            nuevaFecha: nuevaFechaStr,
            mercadoAbierto: estadoDespues
        });

        // ── Notificaciones de resultados de partidos ──────────────────────
const [partidosHoy] = await pool.query(
    `SELECT 
        p.id_partido, p.goles_local, p.goles_visitante,
        cl.nombre AS nombre_local, cl.escudo_url AS logo_local,
        cv.nombre AS nombre_visitante, cv.escudo_url AS logo_visitante
     FROM partido p
     JOIN club cl ON p.id_local = cl.id_club
     JOIN club cv ON p.id_visitante = cv.id_club
     WHERE DATE(p.fecha) = ?
     AND p.goles_local IS NOT NULL
     AND p.goles_visitante IS NOT NULL`,
    [nuevaFechaStr]
);

if (partidosHoy.length > 0) {
    const [usuariosLiga] = await pool.query(
        `SELECT id_usuario FROM usuario WHERE id_liga IS NOT NULL`
    );

    for (const partido of partidosHoy) {
        const payloadResultado = JSON.stringify({
            nombreLocal:      partido.nombre_local,
            logoLocal:        partido.logo_local,
            golesLocal:       partido.goles_local,
            nombreVisitante:  partido.nombre_visitante,
            logoVisitante:    partido.logo_visitante,
            golesVisitante:   partido.goles_visitante,
            mensaje: `${partido.nombre_local} ${partido.goles_local} - ${partido.goles_visitante} ${partido.nombre_visitante}`
        });

        const queries = usuariosLiga.map(u =>
            pool.query(
                `INSERT INTO notificacion (id_usuario, tipo, payload, creada_en) 
                 VALUES (?, 'resultado', ?, ?)`,
                [u.id_usuario, payloadResultado, fechaNotif]
            )
        );
        await Promise.all(queries);
    }
}

    } catch (error) {
        res.status(500).json({ error: "No se pudo avanzar el tiempo" });
    }
};

// ─── importarJornada ─────────────────────────────────────────────────────────

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
        return res.status(400).json({ message: 'Formato incorrecto. El JSON debe tener { jornada, partidos: [...] }' });

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const numeroJornada = datos.jornada;

        // 1. JORNADA
        const fechas  = datos.partidos.map(p => new Date(p.fecha));
        const fInicio = new Date(Math.min(...fechas));
        const fFin    = new Date(Math.max(...fechas));
        fFin.setHours(23, 59, 59);

        const idJornada = await upsertJornada(connection, numeroJornada, fInicio, fFin);

        // 2. PARTIDOS + RENDIMIENTO
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
                   goles_local     = VALUES(goles_local),
                   goles_visitante = VALUES(goles_visitante),
                   fecha           = VALUES(fecha)`,
                [idJornada, idLocal, idVisit, new Date(partido.fecha), golesL, golesV]
            );

            // 3. RENDIMIENTO_JORNADA + ACUMULADOS EN JUGADORA
            for (const jug of partido.jugadoras) {
                if (jug.minutos === 0) continue;

                const puntos       = calcularPuntos(jug);
                const porteriaCero = jug.goles_encajados_equipo === 0 ? 1 : 0;

                const [[anterior]] = await connection.query(
                    `SELECT goles, asistencias, porterias_cero, amarillas, rojas,
                            minutos_jugados, goles_encajados
                     FROM rendimiento_jornada
                     WHERE id_jugadora = ? AND id_jornada = ?`,
                    [jug.id_jugadora, idJornada]
                );

                const diff = {
                    goles:          jug.goles                  - (anterior?.goles           ?? 0),
                    asistencias:    jug.asistencias             - (anterior?.asistencias     ?? 0),
                    porteriaCero:   porteriaCero                - (anterior?.porterias_cero  ?? 0),
                    amarillas:      jug.amarillas               - (anterior?.amarillas       ?? 0),
                    rojas:          jug.rojas_directas          - (anterior?.rojas           ?? 0),
                    minutos:        jug.minutos                 - (anterior?.minutos_jugados ?? 0),
                    golesEncajados: jug.goles_encajados_equipo  - (anterior?.goles_encajados ?? 0),
                };

                await connection.query(
                    `INSERT INTO rendimiento_jornada
                       (id_jugadora, id_jornada, goles, asistencias, porterias_cero,
                        amarillas, rojas, minutos_jugados, goles_encajados, puntos, valoracion)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                       goles           = VALUES(goles),
                       asistencias     = VALUES(asistencias),
                       porterias_cero  = VALUES(porterias_cero),
                       amarillas       = VALUES(amarillas),
                       rojas           = VALUES(rojas),
                       minutos_jugados = VALUES(minutos_jugados),
                       goles_encajados = VALUES(goles_encajados),
                       puntos          = VALUES(puntos),
                       valoracion      = VALUES(valoracion)`,
                    [
                        jug.id_jugadora, idJornada,
                        jug.goles, jug.asistencias, porteriaCero,
                        jug.amarillas, jug.rojas_directas, jug.minutos,
                        jug.goles_encajados_equipo, puntos,
                        jug.rating > 0 ? jug.rating : null,
                    ]
                );

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
                    [
                        diff.goles, diff.asistencias, diff.porteriaCero,
                        diff.amarillas, diff.rojas, diff.minutos,
                        diff.golesEncajados, jug.id_jugadora,
                    ]
                );
            }
        }

        // ── Actualizar valores si el mercado está cerrado ──────────────────
        const mercadoAbierto = await calcularMercadoAbierto();
        const mercadoCerrado = !mercadoAbierto;

        if (mercadoCerrado) {
            const FACTOR = 0.08;

            const [[mediaRes]] = await connection.query(
                `SELECT COALESCE(ROUND(AVG(puntos), 2), 7) AS media_global FROM rendimiento_jornada`
            );
            const REFERENCIA = mediaRes.media_global;

            const [todasJugadoras] = await connection.query(
                `SELECT pj.id_jugadora, j.valor_base
                 FROM plantilla_jugadora pj
                 JOIN jugadora j ON j.id_jugadora = pj.id_jugadora
                 WHERE pj.id_liga = (SELECT id_liga FROM liga LIMIT 1)`
            );

            const [todasJornadas] = await connection.query(
                `SELECT id_jornada, numero FROM jornada ORDER BY numero ASC`
            );

            for (const jug of todasJugadoras) {
                const suelo = Math.round(jug.valor_base * 0.5);
                let valorAcumulado = jug.valor_base;

                const [rendimientos] = await connection.query(
                    `SELECT rj.id_jornada, rj.puntos FROM rendimiento_jornada rj WHERE rj.id_jugadora = ?`,
                    [jug.id_jugadora]
                );

                const rendimientoMap = new Map(rendimientos.map(r => [r.id_jornada, r.puntos]));

                for (const jornada of todasJornadas) {
                    const puntos = rendimientoMap.has(jornada.id_jornada)
                        ? rendimientoMap.get(jornada.id_jornada)
                        : 0;
                    const multiplicador = 1 + FACTOR * (puntos - REFERENCIA) / REFERENCIA;
                    valorAcumulado = Math.max(suelo, Math.round(valorAcumulado * multiplicador));
                }

                await connection.query(
                    `UPDATE plantilla_jugadora SET valor = ? WHERE id_jugadora = ?`,
                    [valorAcumulado, jug.id_jugadora]
                );
            }

            await connection.query(
                `UPDATE plantilla p
                 JOIN (
                     SELECT pj.id_plantilla, SUM(pj.valor) AS nuevo_valor
                     FROM plantilla_jugadora pj
                     WHERE pj.id_plantilla IS NOT NULL
                     GROUP BY pj.id_plantilla
                 ) resumen ON resumen.id_plantilla = p.id_plantilla
                 SET p.valor_equipo = resumen.nuevo_valor`
            );
        }

        await connection.commit();
        res.status(200).json({ message: `Jornada ${numeroJornada} importada correctamente.` });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al importar jornada:', error);
        res.status(500).json({ message: error.message || 'Error interno al importar la jornada.' });
    } finally {
        if (connection) connection.release();
    }
};


// ─── calcularPuntosJornada ────────────────────────────────────────────────────

const calcularPuntosJornada = async (req, res) => {
    const { numero } = req.params;

    if (!numero || isNaN(Number(numero)))
        return res.status(400).json({ message: 'El número de jornada debe ser un entero.' });

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [[jornada]] = await connection.query(
            'SELECT id_jornada FROM jornada WHERE numero = ?',
            [numero]
        );

        if (!jornada)
            return res.status(404).json({ message: `La jornada ${numero} no existe en la base de datos.` });

        const [rendimientos] = await connection.query(
            `SELECT rj.*, j.posicion
             FROM rendimiento_jornada rj
             JOIN jugadora j ON j.id_jugadora = rj.id_jugadora
             WHERE rj.id_jornada = ?`,
            [jornada.id_jornada]
        );

        if (rendimientos.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: `La jornada ${numero} no tiene rendimientos registrados.` });
        }

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
                rating:                 0,
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

            await connection.query(
                'UPDATE rendimiento_jornada SET puntos = ? WHERE id_jugadora = ? AND id_jornada = ?',
                [calcularPuntos(jugStats), rj.id_jugadora, jornada.id_jornada]
            );
        }

        await connection.commit();
        res.status(200).json({
            message: `Puntos de jornada ${numero} recalculados correctamente.`,
            jugadoras_actualizadas: rendimientos.length,
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al recalcular puntos:', error);
        res.status(500).json({ message: 'Error interno al recalcular los puntos.' });
    } finally {
        if (connection) connection.release();
    }
};

const calcularMercadoAbierto = async () => {
    const fechaVirtual = getVirtualDate();
    const hoy = fechaVirtual.toISOString().split('T')[0];

    //si hay partido se cierra
    const [partidosHoy] = await pool.query(
        `SELECT COUNT(*) as total FROM partido 
         WHERE DATE(fecha) = ?`,
        [hoy]
    );
    if (partidosHoy[0].total > 0) return false;

    
    const [[ultimoPartido]] = await pool.query(
        `SELECT MAX(DATE(fecha)) as ultima_fecha FROM partido 
         WHERE DATE(fecha) <= ?`,
        [hoy]
    );

    if (!ultimoPartido?.ultima_fecha) return false;

    // abrimos después del último partido
    const apertura = new Date(ultimoPartido.ultima_fecha);
    apertura.setDate(apertura.getDate() + 1);

    // cerramos a los 3 días
    const cierre = new Date(apertura);
    cierre.setDate(cierre.getDate() + 3);

    const fechaHoy = new Date(hoy);
    return fechaHoy >= apertura && fechaHoy < cierre;
};

// ─── getMercadoEstado ─────────────────────────────────────────────────────────

const getMercadoEstado = async (req, res) => {
    try {
        const abierto = await calcularMercadoAbierto();

        const fechaVirtual = getVirtualDate();
        const hoy = fechaVirtual.toISOString().split('T')[0];

       
        let mensaje = '';
        let fechaProximoCambio = null;

        if (abierto) {
            const [[ultimoPartido]] = await pool.query(
                `SELECT MAX(DATE(fecha)) as ultima_fecha FROM partido WHERE DATE(fecha) <= ?`,
                [hoy]
            );
            const apertura = new Date(ultimoPartido.ultima_fecha);
            apertura.setDate(apertura.getDate() + 1);
            const cierre = new Date(apertura);
            cierre.setDate(cierre.getDate() + 3);
            fechaProximoCambio = cierre.toISOString().split('T')[0];
            mensaje = `Mercado abierto hasta el ${fechaProximoCambio}`;
        } else {
            
            const [[proximoPartido]] = await pool.query(
                `SELECT MIN(DATE(fecha)) as proxima_fecha FROM partido WHERE DATE(fecha) > ?`,
                [hoy]
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

//______________getCalendario__________________
const getCalendario = async (req, res) => {

    const mes = parseInt(req.params.mes);
    const anyo = parseInt(req.params.anyo);

   
    try {
        const fechaVirtual = getVirtualDate();
        const hoyStr = fechaVirtual.toISOString().split('T')[0];

        let mesNum, anyoNum;
        
        if(mes == 0 && anyo == 0)
    {
        mesNum = fechaVirtual.getMonth() + 1;
        anyoNum = fechaVirtual.getFullYear();
    } else{
        mesNum = mes;
        anyoNum = anyo;
    }
    

        const primerDia = `${anyoNum}-${String(mesNum).padStart(2, '0')}-01`;
        const ultimoDia = new Date(anyoNum, mesNum, 0); // día 0 del mes siguiente = último del actual
        const ultimoDiaStr = ultimoDia.toISOString().split('T')[0];

        const [partidos] = await pool.query(
            `SELECT 
                p.id_partido, p.fecha, p.goles_local, p.goles_visitante,
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
            `SELECT numero, f_inicio, f_fin
             FROM jornada
             WHERE (YEAR(f_inicio) = ? AND MONTH(f_inicio) = ?)
                OR (YEAR(f_fin) = ? AND MONTH(f_fin) = ?)
                OR (f_inicio <= ? AND f_fin >= ?)
             ORDER BY numero ASC`,
            [anyoNum, mesNum, anyoNum, mesNum, primerDia, ultimoDiaStr]
        );

   
        const [todosPartidos] = await pool.query(
            `SELECT DATE(fecha) as fecha_partido FROM partido 
             WHERE goles_local IS NOT NULL
             ORDER BY fecha ASC`
        );

        const ventanasMercado = [];
        for (let i = 0; i < todosPartidos.length; i++) {
            const actual = todosPartidos[i];
            const siguiente = todosPartidos[i + 1];
            const esUltimoDelGrupo = !siguiente || 
                (new Date(siguiente.fecha_partido) - new Date(actual.fecha_partido)) > 86400000;

            if (esUltimoDelGrupo) {
                const abre = new Date(actual.fecha_partido);
                abre.setDate(abre.getDate() + 1);
                const cierra = new Date(abre);
                cierra.setDate(cierra.getDate() + 3);

                if ((abre.getMonth() + 1 === mesNum && abre.getFullYear() === anyoNum) ||
                    (cierra.getMonth() + 1 === mesNum && cierra.getFullYear() === anyoNum)) {
                    ventanasMercado.push({
                        abre: abre.toISOString().split('T')[0],
                        cierra: cierra.toISOString().split('T')[0]
                    });
                }
            }
        }

        res.json({
            fechaVirtual: hoyStr,
            partidos,
            jornadas,
            ventanasMercado
        });

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