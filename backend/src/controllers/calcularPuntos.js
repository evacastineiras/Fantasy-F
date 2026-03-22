/**
 * calcularPuntos.js
 * Calcula los puntos fantasy de una jugadora a partir de sus stats de jornada.
 *
 * @param {Object} j  - Objeto jugadora tal como viene del JSON de jornada
 * @returns {number}  - Puntos totales (puede ser negativo)
 */

function calcularPuntos(j) {
  let pts = 0;

  // ─────────────────────────────────────────
  // COMUNES
  // ─────────────────────────────────────────

  // Participación
  if (j.minutos > 0) {
    pts += 1;
    if (j.minutos > 60) pts += 1; // +1 extra si supera 60'
  }

  // Asistencias: +3 cada una
  pts += j.asistencias * 3;

  // Tarjetas
  // - Amarilla directa: -1 por cada una
  // - Roja directa: -3 (no acumula amarillas)
  // - Dos amarillas = roja: solo se cuentan las 2 amarillas (-2), NO la roja directa
  if (j.rojas_directas > 0) {
    pts -= 3 * j.rojas_directas;
  } else {
    pts -= j.amarillas * 1;
  }

  // Penaltis
  pts -= j.penalti_fallado  * 2;  // fallar penalti: -2
  pts += j.penalti_provocado * 2; // provocar penalti a favor: +2
  pts -= j.penalti_cometido  * 1; // cometer penalti: -1

  // Valoración → escala al rango [-x, +4]
  // Rating viene de 0 a 10. Máximo 4 pts (rating=10), negativo si < 5
  pts += calcularPuntosRating(j.rating);

  // Acciones de juego
  pts += Math.floor(j.recuperaciones        / 4);  // +1 cada 4 recuperaciones
  pts -= Math.floor(j.perdidas_posesion     / 7);  // -1 cada 7 pérdidas
  pts += Math.floor(j.regates_completados   / 3);  // +1 cada 3 regates
  pts += Math.floor(j.disparos_a_puerta     / 2);  // +1 cada 2 disparos a puerta
  pts += Math.floor(j.pases_clave           / 2);  // +1 cada 2 pases clave
  pts += Math.floor(j.despejes              / 5);  // +1 cada 5 despejes

  // Gol en propia puerta: -4
  pts -= j.goles_propia * 4;

  // ─────────────────────────────────────────
  // ESPECÍFICO POR POSICIÓN
  // ─────────────────────────────────────────
  const pos = j.posicion;

  if (pos === 'POR') {
    pts += j.goles * 7;

    // Portería a cero con más de 60' jugados
    if (j.goles_encajados_equipo === 0 && j.minutos > 60) pts += 4;

    pts += Math.floor(j.paradas / 2); // +1 cada 2 paradas
    pts -= j.goles_encajados_equipo;  // -1 por cada gol encajado
  }

  if (pos === 'DEF') {
    pts += j.goles * 6;

    if (j.goles_encajados_equipo === 0 && j.minutos > 60) pts += 4;

    // -1 por cada 2 goles encajados
    pts -= Math.floor(j.goles_encajados_equipo / 2);
  }

  if (pos === 'MED') {
    pts += j.goles * 5;

    if (j.goles_encajados_equipo === 0 && j.minutos > 60) pts += 2;

    // -1 por cada 3 goles encajados
    pts -= Math.floor(j.goles_encajados_equipo / 3);
  }

  if (pos === 'DEL') {
    pts += j.goles * 4;

    if (j.goles_encajados_equipo === 0 && j.minutos > 60) pts += 1;

    // -1 por cada 3 goles encajados
    pts -= Math.floor(j.goles_encajados_equipo / 3);
  }

  return pts;
}

/**
 * Convierte el rating (0–10) en puntos fantasy.
 *
 * Escala:
 *   rating 10   → +4 pts
 *   rating 7    →  0 pts  (punto neutro entre 5 y 10)
 *   rating 5    →  0 pts  (umbral, ni suma ni resta)
 *   rating < 5  → negativo
 *
 * Fórmula lineal partida:
 *   - Si rating >= 5:  pts = (rating - 5) * (4 / 5)   → [0, 4]
 *   - Si rating < 5:   pts = (rating - 5) * (4 / 5)   → continúa negativo
 *
 * Redondeamos al entero más cercano.
 */
function calcularPuntosRating(rating) {
  if (rating === 0) return 0; // Sin rating (jugó muy pocos minutos, rating=0.0)
  const raw = (rating - 5) * (4 / 5);
  return Math.round(raw);
}

module.exports = { calcularPuntos };
