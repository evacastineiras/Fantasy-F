DROP TRIGGER IF EXISTS trg_puja_after_update;
DROP TRIGGER IF EXISTS trg_puja_after_insert;
DROP VIEW IF EXISTS v_clasificacion_liga;

DROP TABLE IF EXISTS notificacion;
DROP TABLE IF EXISTS puja;
DROP TABLE IF EXISTS alineacion_item;
DROP TABLE IF EXISTS alineacion;
DROP TABLE IF EXISTS rendimiento_jornada;
DROP TABLE IF EXISTS partido;
DROP TABLE IF EXISTS jornada;
DROP TABLE IF EXISTS plantilla_jugadora;
DROP TABLE IF EXISTS jugadora;
DROP TABLE IF EXISTS plantilla;
DROP TABLE IF EXISTS club;
DROP TABLE IF EXISTS usuario;
DROP TABLE IF EXISTS liga;

USE fantasyf_db;
SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- =====================
-- LIGA
-- =====================
CREATE TABLE liga (
  id_liga       INT UNSIGNED PRIMARY KEY,
  nombre        VARCHAR(50) NOT NULL,
  creada_en     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================
-- USUARIO  
-- =====================
CREATE TABLE usuario (
  id_usuario        INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_liga           INT UNSIGNED NULL,
  nombre            VARCHAR(50) NOT NULL,
  nombre_usuario    VARCHAR(60) NOT NULL,
  email             VARCHAR(160) NOT NULL,
  password_hash     VARCHAR(100) NOT NULL,
  foto_perfil_url   VARCHAR(255) NULL,
  CONSTRAINT fk_usuario_liga FOREIGN KEY (id_liga) REFERENCES liga(id_liga)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  UNIQUE KEY uk_usuario_username (nombre_usuario),
  UNIQUE KEY uk_usuario_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =====================
-- CLUB (Real)
-- =====================

CREATE TABLE club (
  id_club       INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre        VARCHAR(60) NOT NULL,
  escudo_url    VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================
-- PLANTILLA  
-- =====================

CREATE TABLE plantilla (
  id_plantilla  INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_usuario    INT UNSIGNED NOT NULL,
  id_liga       INT UNSIGNED NOT NULL,
  presupuesto   INT UNSIGNED NOT NULL DEFAULT 0,
  valor_equipo  INT UNSIGNED NOT NULL DEFAULT 0,
  n_jugadoras   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_plantilla_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_plantilla_liga FOREIGN KEY (id_liga) REFERENCES liga(id_liga)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  UNIQUE KEY uk_plantilla_usuario_liga (id_usuario, id_liga)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =====================
-- JUGADORA (Real)
-- =====================
CREATE TABLE jugadora (
  id_jugadora       INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre            VARCHAR(60) NOT NULL,
  apellidos         VARCHAR(100),
  fnacimiento       DATE NULL,
  altura            SMALLINT UNSIGNED NULL,
  pierna_buena      ENUM('derecha','izquierda','ambas') NULL,
  posicion          ENUM('POR','DEF','MED','DEL') NOT NULL,
  valor_base        INT UNSIGNED DEFAULT 0,
  reputacion        TINYINT UNSIGNED DEFAULT 50,
  goles_total       SMALLINT UNSIGNED DEFAULT 0,
  porterias_cero    SMALLINT UNSIGNED DEFAULT 0,
  asistencias_total SMALLINT UNSIGNED DEFAULT 0,
  amarillas_total   TINYINT UNSIGNED DEFAULT 0,
  rojas_total       TINYINT UNSIGNED DEFAULT 0,
  minutos_total     SMALLINT UNSIGNED DEFAULT 0,
  id_plantilla      INT UNSIGNED NULL,
  id_club           INT UNSIGNED NULL,
  imagen_carta      VARCHAR(255) NULL,
  imagen            VARCHAR(255) NULL,
  FOREIGN KEY (id_plantilla) REFERENCES plantilla(id_plantilla) ON DELETE SET NULL,
  FOREIGN KEY (id_club) REFERENCES club(id_club) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



-- =====================
-- PLANTILLA_JUGADORA
-- =====================
CREATE TABLE plantilla_jugadora (
  id_entry      INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_plantilla  INT UNSIGNED NULL,
  id_liga       INT UNSIGNED NOT NULL,
  id_jugadora   INT UNSIGNED NOT NULL,
  clausula      INT UNSIGNED NOT NULL DEFAULT 0,
  valor         INT UNSIGNED NOT NULL DEFAULT 0,
  es_titular_default TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_pj_plantilla FOREIGN KEY (id_plantilla) REFERENCES plantilla(id_plantilla)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_pj_liga FOREIGN KEY (id_liga) REFERENCES liga(id_liga)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_pj_jugadora FOREIGN KEY (id_jugadora) REFERENCES jugadora(id_jugadora)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  UNIQUE KEY uk_unica_por_liga (id_liga, id_jugadora)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================
-- JORNADA
-- =====================
CREATE TABLE jornada (
  id_jornada   INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  numero       INT UNSIGNED NOT NULL,
  f_inicio     DATETIME NOT NULL,
  f_fin        DATETIME NOT NULL,
  UNIQUE KEY uk_jornada_numero (numero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================
-- PARTIDO
-- =====================

CREATE TABLE partido (
  id_partido    INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_jornada    INT UNSIGNED NOT NULL,
  id_local      INT UNSIGNED NOT NULL,
  id_visitante  INT UNSIGNED NOT NULL,
  fecha         DATETIME NOT NULL,
  goles_local   TINYINT UNSIGNED NULL,
  goles_visitante TINYINT UNSIGNED NULL,
  CONSTRAINT fk_partido_jornada FOREIGN KEY (id_jornada) REFERENCES jornada(id_jornada)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_partido_local FOREIGN KEY (id_local) REFERENCES club(id_club)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_partido_visitante FOREIGN KEY (id_visitante) REFERENCES club(id_club)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================
-- Rendimiento por jornada
-- =====================
CREATE TABLE rendimiento_jornada (
  id_jugadora       INT UNSIGNED NOT NULL,
  id_jornada        INT UNSIGNED NOT NULL,
  goles             SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  asistencias       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  porterias_cero    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  amarillas         SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  rojas             SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  minutos_jugados   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  puntos            SMALLINT NOT NULL DEFAULT 0,
  PRIMARY KEY (id_jugadora, id_jornada),
  CONSTRAINT fk_rj_jugadora FOREIGN KEY (id_jugadora) REFERENCES jugadora(id_jugadora)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_rj_jornada FOREIGN KEY (id_jornada) REFERENCES jornada(id_jornada)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================
-- Alineaciones por jornada
-- =====================
CREATE TABLE alineacion (
  id_alineacion INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_plantilla  INT UNSIGNED NOT NULL,
  id_jornada    INT UNSIGNED NOT NULL,
  CONSTRAINT fk_alin_plantilla FOREIGN KEY (id_plantilla) REFERENCES plantilla(id_plantilla)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_alin_jornada FOREIGN KEY (id_jornada) REFERENCES jornada(id_jornada)
    ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE KEY uk_alineacion_unica (id_plantilla, id_jornada)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE alineacion_item (
  id_item         INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_alineacion   INT UNSIGNED NOT NULL,
  id_entry        INT UNSIGNED NOT NULL,
  posicion        ENUM('POR','DEF','MED','DEL') NOT NULL,
  es_titular      TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_ai_alineacion FOREIGN KEY (id_alineacion) REFERENCES alineacion(id_alineacion)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_ai_entry FOREIGN KEY (id_entry) REFERENCES plantilla_jugadora(id_entry)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  UNIQUE KEY uk_ai_unico (id_alineacion, id_entry)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================
-- PUJA
-- =====================
CREATE TABLE puja (
  id_puja        INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_liga        INT UNSIGNED NOT NULL,
  id_entry       INT UNSIGNED NOT NULL,
  id_comprador   INT UNSIGNED NOT NULL,
  id_vendedor    INT UNSIGNED NOT NULL,
  montante       INT UNSIGNED NOT NULL,
  estado         ENUM('pendiente','aceptada','rechazada','retirada','expirada') NOT NULL DEFAULT 'pendiente',
  creada_en      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expira_en      DATETIME NULL,
  resuelta_en    DATETIME NULL,
  CONSTRAINT fk_puja_liga FOREIGN KEY (id_liga) REFERENCES liga(id_liga)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_puja_entry FOREIGN KEY (id_entry) REFERENCES plantilla_jugadora(id_entry)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_puja_comprador FOREIGN KEY (id_comprador) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_puja_vendedor FOREIGN KEY (id_vendedor) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================
-- NOTIFICACION
-- =====================
CREATE TABLE notificacion (
  id_notificacion INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_usuario      INT UNSIGNED NOT NULL,
  tipo            ENUM('puja_nueva','puja_aceptada','puja_rechazada','puja_expirada','sistema', 'venta', 'nuevo_en_liga') NOT NULL,
  payload         JSON NULL,
  leida           TINYINT(1) NOT NULL DEFAULT 0,
  creada_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Triggers de notificación para pujas
DELIMITER $$
CREATE TRIGGER trg_puja_after_insert
AFTER INSERT ON puja
FOR EACH ROW
BEGIN
  INSERT INTO notificacion (id_usuario, tipo, payload)
  VALUES (NEW.id_vendedor, 'puja_nueva', JSON_OBJECT('id_puja', NEW.id_puja, 'montante', NEW.montante));
END $$

CREATE TRIGGER trg_puja_after_update
AFTER UPDATE ON puja
FOR EACH ROW
BEGIN
  IF NEW.estado <> OLD.estado THEN
    CASE NEW.estado
      WHEN 'aceptada' THEN
        INSERT INTO notificacion (id_usuario, tipo, payload)
        VALUES (NEW.id_comprador, 'puja_aceptada', JSON_OBJECT('id_puja', NEW.id_puja));
      WHEN 'rechazada' THEN
        INSERT INTO notificacion (id_usuario, tipo, payload)
        VALUES (NEW.id_comprador, 'puja_rechazada', JSON_OBJECT('id_puja', NEW.id_puja));
      WHEN 'expirada' THEN
        INSERT INTO notificacion (id_usuario, tipo, payload)
        VALUES (NEW.id_comprador, 'puja_expirada', JSON_OBJECT('id_puja', NEW.id_puja));
    END CASE;
  END IF;
END $$
DELIMITER ;

-- =====================
-- VISTA de CLASIFICACION 
-- =====================
CREATE VIEW v_clasificacion_liga AS
SELECT u.id_liga, u.id_usuario, u.nombre_usuario,
       SUM(rj.puntos) AS puntos_totales
FROM usuario u
JOIN plantilla p ON p.id_usuario = u.id_usuario
JOIN plantilla_jugadora pj ON pj.id_plantilla = p.id_plantilla
JOIN rendimiento_jornada rj ON rj.id_jugadora = pj.id_jugadora
GROUP BY u.id_liga, u.id_usuario, u.nombre_usuario;
