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
-- Insert en club
-- =====================

INSERT INTO club (id_club, nombre, escudo_url) VALUES
(1, 'Athletic Club de Bilbao', 'assets/escudos/athletic.png'),
(2, 'Atlético de Madrid', 'assets/escudos/atletico.png'),
(3, 'Real Betis Balompié', 'assets/escudos/betis.png'),
(4, 'RC Deportivo de La Coruña', 'assets/escudos/deportivo.png'),
(5, 'SD Eibar', 'assets/escudos/eibar.png'),
(6, 'RCD Espanyol', 'assets/escudos/espanyol.png'),
(7, 'FC Barcelona', 'assets/escudos/barcelona.png'),
(8, 'Granada CF', 'assets/escudos/granada.png'),
(9, 'Levante UD', 'assets/escudos/levante.png'),
(10, 'FC Levante Badalona', 'assets/escudos/levantebadalona.png'),
(11, 'Madrid CFF', 'assets/escudos/madridcff.png'),
(12, 'Real Madrid CF', 'assets/escudos/realmadrid.png'),
(13, 'Real Sociedad', 'assets/escudos/realsociedad.png'),
(14, 'Sevilla FC', 'assets/escudos/sevilla.png'),
(15, 'UDG Tenerife', 'assets/escudos/tenerife.png'),
(16, 'Valencia CF', 'assets/escudos/valencia.png');

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
  apodo				VARCHAR(60),
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
  id_club           INT UNSIGNED NULL,
  imagen_carta      VARCHAR(255) NULL,
  imagen            VARCHAR(255) NULL,
  FOREIGN KEY (id_club) REFERENCES club(id_club) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================
-- Insert en Jugadora (Real)
-- =====================
INSERT INTO jugadora (id_jugadora, nombre, apellidos, apodo, fnacimiento, altura, 
    pierna_buena, posicion, valor_base, reputacion, id_club, 
    imagen_carta, imagen) VALUES 

-- Barcelona
-- 1. Aitana Bonmatí
(
    701, 'Aitana', 'Bonmatí Conca', 'Aitana', '1998-01-18', 162, 
    'derecha', 'MED', 9100000, 91, 7, 
    'assets/jugadoras/cartas/FCBarcelona/AitanaBonmati.png', 'assets/jugadoras/caras/FCBarcelona/aitana.png'
),
-- 2. Alexia Putellas
(
    702, 'Alexia', 'Putellas Segura', 'Alexia', '1994-02-04', 173, 
    'izquierda', 'MED', 9000000, 90, 7, 
    'assets/jugadoras/cartas/FCBarcelona/AlexiaPutellas.png', 'assets/jugadoras/caras/FCBarcelona/alexia.png'
),
-- 3. Cata Coll
(
    703, 'Catalina', 'Coll Lluch', 'Cata Coll', '2001-04-23', 178, 
    'derecha', 'POR', 8200000, 82, 7, 
    'assets/jugadoras/cartas/FCBarcelona/cataColl.png', 'assets/jugadoras/caras/FCBarcelona/catacoll.png'
),
-- 4. Claudia Pina
(
    704, 'Claudia', 'Pina Medina', 'Pina', '2001-08-12', 160, 
    'derecha', 'DEL', 8600000, 86, 7, 
    'assets/jugadoras/cartas/FCBarcelona/ClaudiaPina.png', 'assets/jugadoras/caras/FCBarcelona/pina.png'
),
-- 5. Ellie Roebuck
(
    705, 'Ellie', 'Roebuck', 'Roebuck', '1999-09-23', 174, 
    'derecha', 'POR', 8000000, 80, 7, 
    'assets/jugadoras/cartas/FCBarcelona/ellieRoebuck.png', 'assets/jugadoras/caras/FCBarcelona/roebuck.png'
),
-- 6. Ingrid Engen
(
    706, 'Ingrid', 'Syrstad Engen', 'Engen', '1998-04-29', 177, 
    'derecha', 'MED', 8400000, 84, 7, 
    'assets/jugadoras/cartas/FCBarcelona/engen.png', 'assets/jugadoras/caras/FCBarcelona/engen.png'
),
-- 7. Esmee Brugts
(
    707, 'Esmee', 'Brugts', 'Brugts', '2003-07-28', 170, 
    'izquierda', 'DEL', 8300000, 83, 7, 
    'assets/jugadoras/cartas/FCBarcelona/esmeebrugts.png', 'assets/jugadoras/caras/FCBarcelona/esmee.png'
),
-- 8. Ewa Pajor 
(
    708, 'Ewa', 'Pajor', 'Pajor', '1996-12-03', 167, 
    'derecha', 'DEL', 8700000, 87, 7, 
    'assets/jugadoras/cartas/FCBarcelona/EwaPajor.png', 'assets/jugadoras/caras/FCBarcelona/pajor.png'
),
-- 9. Fridolina Rolfö
(
    709, 'Fridolina', 'Rolfö', 'Rolfö', '1993-11-24', 178, 
    'izquierda', 'DEF', 8800000, 88, 7, 
    'assets/jugadoras/cartas/FCBarcelona/FridolinaRolfo.png', 'assets/jugadoras/caras/FCBarcelona/rolfo.png'
),
-- 10. Gemma Font
(
    710, 'Gemma', 'Font Rodríguez', 'Gemma Font', '1999-10-23', 172, 
    'derecha', 'POR', 7500000, 75, 7, 
    'assets/jugadoras/cartas/FCBarcelona/GemmaFont.png', 'assets/jugadoras/caras/FCBarcelona/gemma.png'
),
-- 11. Caroline Graham Hansen
(
    711, 'Caroline Graham', 'Hansen', 'Hansen', '1995-02-18', 173, 
    'derecha', 'DEL', 8900000, 89, 7, 
    'assets/jugadoras/cartas/FCBarcelona/grahamHansen.png', 'assets/jugadoras/caras/FCBarcelona/hansen.png'
),
-- 12. Irene Paredes
(
    712, 'Irene', 'Paredes Hernández', 'Paredes', '1991-07-04', 176, 
    'derecha', 'DEF', 8700000, 87, 7, 
    'assets/jugadoras/cartas/FCBarcelona/ireneParedes.png', 'assets/jugadoras/caras/FCBarcelona/paredes.png'
),
-- 13. Jana Fernández
(
    713, 'Jana', 'Fernández Velasco', 'Jana', '2002-02-18', 165, 
    'derecha', 'DEF', 7800000, 78, 7, 
    'assets/jugadoras/cartas/FCBarcelona/JanaFernandez.png', 'assets/jugadoras/caras/FCBarcelona/jana.png'
),
-- 14. Keira Walsh
(
    714, 'Keira', 'Walsh', 'Walsh', '1997-04-08', 167, 
    'derecha', 'MED', 8500000, 85, 7, 
    'assets/jugadoras/cartas/FCBarcelona/KeiraWalsh.png', 'assets/jugadoras/caras/FCBarcelona/walsh.png'
),
-- 15. Kika Nazareth (Nueva)
(
    715, 'Francisca', 'Ribeiro Nazareth', 'Kika Nazareth', '2002-11-17', 168, 
    'derecha', 'MED', 8100000, 81, 7, 
    'assets/jugadoras/cartas/FCBarcelona/kikaNazareth.png', 'assets/jugadoras/caras/FCBarcelona/kika.png'
),
-- 16. Mapi León
(
    716, 'María Pilar', 'León Cebrián', 'Mapi León', '1995-06-13', 169, 
    'izquierda', 'DEF', 8500000, 85, 7, 
    'assets/jugadoras/cartas/FCBarcelona/mapileon.png', 'assets/jugadoras/caras/FCBarcelona/mapi.png'
),
-- 17. Marta Torrejón
(
    717, 'Marta', 'Torrejón Moya', 'Torrejón', '1990-02-27', 170, 
    'derecha', 'DEF', 8300000, 83, 7, 
    'assets/jugadoras/cartas/FCBarcelona/MartaTorrejon.png', 'assets/jugadoras/caras/FCBarcelona/torrejon.png'
),
-- 18. Martina Fernández
(
    718, 'Martina', 'Fernández', 'Martina Fernández', '2004-10-26', 167, 
    'derecha', 'DEF', 7700000, 77, 7, 
    'assets/jugadoras/cartas/FCBarcelona/MartinaFernandez.png', 'assets/jugadoras/caras/FCBarcelona/martina.png'
),
-- 19. Ona Batlle
(
    719, 'Ona', 'Batlle Pascual', 'Ona Batlle', '1999-06-10', 167, 
    'derecha', 'DEF', 8600000, 86, 7, 
    'assets/jugadoras/cartas/FCBarcelona/onaBatlle.png', 'assets/jugadoras/caras/FCBarcelona/ona.png'
),
-- 20. Patri Guijarro
(
    720, 'Patricia', 'Guijarro Gutiérrez', 'Patri Guijarro', '1998-05-17', 168, 
    'derecha', 'MED', 8900000, 89, 7, 
    'assets/jugadoras/cartas/FCBarcelona/PatriGuijarro.png', 'assets/jugadoras/caras/FCBarcelona/patri.png'
),
-- 21. Salma Paralluelo
(
    721, 'Salma', 'Paralluelo Ayingono', 'Salma Paralluelo', '2003-11-13', 170, 
    'izquierda', 'DEL', 8800000, 88, 7, 
    'assets/jugadoras/cartas/FCBarcelona/SalmaParalluelo.png', 'assets/jugadoras/caras/FCBarcelona/salma.png'
),
-- 22. Vicky López
(
    722, 'Victoria', 'López Serrano', 'Vicky López', '2006-07-26', 164, 
    'derecha', 'MED', 7900000, 79, 7, 
    'assets/jugadoras/cartas/FCBarcelona/VickyLopez.png', 'assets/jugadoras/caras/FCBarcelona/vicky.png'
),

-- Real Madrid

-- 1. Alba Redondo 
(
    1201, 'Alba', 'Redondo Ferrer', 'Alba Redondo', '1996-08-27', 168, 
    'derecha', 'DEL', 7800000, 78, 12, 
    'assets/jugadoras/cartas/RealMadrid/albaredondo.png', 'assets/jugadoras/caras/RealMadrid/redondo.png'
),
-- 2. Antonia Silva (DEF)
(
    1202, 'Antonia', 'Silva', 'Antonia', '1994-04-26', 171, 
    'derecha', 'DEF', 7500000, 75, 12, 
    'assets/jugadoras/cartas/RealMadrid/AntoniaSilva.png', 'assets/jugadoras/caras/RealMadrid/antonia.png'
),
-- 3. Athenea del Castillo (DEL)
(
    1203, 'Athenea', 'del Castillo Beivide', 'Athenea', '2000-10-24', 160, 
    'derecha', 'DEL', 8400000, 84, 12, 
    'assets/jugadoras/cartas/RealMadrid/AtheneaDelCastillo.png', 'assets/jugadoras/caras/RealMadrid/athenea.png'
),
-- 4. Carla Camacho (DEL)
(
    1204, 'Carla', 'Camacho Carrillo', 'Carla Camacho', '2005-05-02', 173, 
    'derecha', 'DEL', 7200000, 72, 12, 
    'assets/jugadoras/cartas/RealMadrid/CarlaCamacho.png', 'assets/jugadoras/caras/RealMadrid/camacho.png'
),
-- 5. Caroline Møller (DEL)
(
    1205, 'Caroline', 'Møller Hansen', 'Møller', '1998-12-19', 170, 
    'derecha', 'DEL', 8100000, 81, 12, 
    'assets/jugadoras/cartas/RealMadrid/CarolineMoller.png', 'assets/jugadoras/caras/RealMadrid/carolinemoller.png'
),
-- 6. Caroline Weir (MED)
(
    1206, 'Caroline', 'Weir', 'Weir', '1995-06-20', 165, 
    'izquierda', 'MED', 8500000, 85, 12, 
    'assets/jugadoras/cartas/RealMadrid/CarolineWeir.png', 'assets/jugadoras/caras/RealMadrid/weir.png'
),
-- 7. Eva Navarro (DEL)
(
    1207, 'Eva', 'Navarro García', 'Eva Navarro', '2000-01-27', 169, 
    'derecha', 'DEL', 7900000, 79, 12, 
    'assets/jugadoras/cartas/RealMadrid/EvaNavarro.png', 'assets/jugadoras/caras/RealMadrid/evanavarro.png'
),
-- 8. Filippa Angeldahl (MED)
(
    1208, 'Filippa', 'Angeldahl', 'Angeldahl', '1997-07-14', 170, 
    'derecha', 'MED', 8000000, 80, 12, 
    'assets/jugadoras/cartas/RealMadrid/FilippaAngeldahl.png', 'assets/jugadoras/caras/RealMadrid/filippa.png'
),
-- 9. Linda Caicedo (DEL)
(
    1209, 'Linda', 'Caicedo', 'Linda Caicedo', '2005-02-22', 165, 
    'derecha', 'DEL', 8600000, 86, 12, 
    'assets/jugadoras/cartas/RealMadrid/lindaCaicedo.png', 'assets/jugadoras/caras/RealMadrid/caicedo.png'
),
-- 10. Maëlle Lakrar (DEF)
(
    1210, 'Maëlle', 'Lakrar', 'Lakrar', '2000-05-25', 176, 
    'derecha', 'DEF', 7900000, 79, 12, 
    'assets/jugadoras/cartas/RealMadrid/MaelleLakrar.png', 'assets/jugadoras/caras/RealMadrid/lakrar.png'
),
-- 11. Maite Oroz (MED)
(
    1211, 'Maite', 'Oroz Areta', 'Maite Oroz', '1998-03-25', 163, 
    'derecha', 'MED', 7700000, 77, 12, 
    'assets/jugadoras/cartas/RealMadrid/MaiteOroz.png', 'assets/jugadoras/caras/RealMadrid/maiteoroz.png'
),
-- 12. María Méndez (DEF)
(
    1212, 'María', 'Méndez', 'María Méndez', '2001-04-10', 168, 
    'derecha', 'DEF', 7600000, 76, 12, 
    'assets/jugadoras/cartas/RealMadrid/MariaMendez.png', 'assets/jugadoras/caras/RealMadrid/mariamendez.png'
),
-- 13. Melanie Leupolz (MED)
(
    1213, 'Melanie', 'Leupolz', 'Leupolz', '1994-04-14', 173, 
    'derecha', 'MED', 8200000, 82, 12, 
    'assets/jugadoras/cartas/RealMadrid/MelanieLeupolz.png', 'assets/jugadoras/caras/RealMadrid/leupolz.png'
),
-- 14. Misa Rodríguez (POR)
(
    1214, 'María Isabel', 'Rodríguez Rivero', 'Misa', '1999-07-22', 170, 
    'derecha', 'POR', 8300000, 83, 12, 
    'assets/jugadoras/cartas/RealMadrid/MisaRodriguez.png', 'assets/jugadoras/caras/RealMadrid/misa.png'
),
-- 15. Mylène Chavas (POR)
(
    1215, 'Mylène', 'Chavas', 'Chavas', '1998-01-07', 180, 
    'derecha', 'POR', 7700000, 77, 12, 
    'assets/jugadoras/cartas/RealMadrid/MyleneChavas.png', 'assets/jugadoras/caras/RealMadrid/chavas.png'
),
-- 16. Naomi Feller (DEL)
(
    1216, 'Naomi', 'Feller', 'Feller', '2001-11-06', 170, 
    'derecha', 'DEL', 8000000, 80, 12, 
    'assets/jugadoras/cartas/RealMadrid/NaomiFeller.png', 'assets/jugadoras/caras/RealMadrid/feller.png'
),
-- 17. Oihane Hernández (DEF)
(
    1217, 'Oihane', 'Hernández Zurbano', 'Oihane', '2000-05-04', 165, 
    'derecha', 'DEF', 7900000, 79, 12, 
    'assets/jugadoras/cartas/RealMadrid/OihaneHernandez.png', 'assets/jugadoras/caras/RealMadrid/oihane.png'
),
-- 18. Olga Carmona (DEF)
(
    1218, 'Olga', 'Carmona García', 'Olga', '2000-06-27', 160, 
    'izquierda', 'DEF', 8400000, 84, 12, 
    'assets/jugadoras/cartas/RealMadrid/OlgaCarmona.png', 'assets/jugadoras/caras/RealMadrid/olga.png'
),
-- 19. Rocío Gálvez (DEF)
(
    1219, 'Rocío', 'Gálvez Luna', 'Rocío', '1997-04-15', 174, 
    'derecha', 'DEF', 7800000, 78, 12, 
    'assets/jugadoras/cartas/RealMadrid/RocioGalvez.png', 'assets/jugadoras/caras/RealMadrid/rociogalvez.png'
),
-- 20. Sandie Toletti (MED)
(
    1220, 'Sandie', 'Toletti', 'Toletti', '1995-07-13', 165, 
    'derecha', 'MED', 8300000, 83, 12, 
    'assets/jugadoras/cartas/RealMadrid/SandieToletti.png', 'assets/jugadoras/caras/RealMadrid/toletti.png'
),
-- 21. Sheila García (DEL)
(
    1221, 'Sheila', 'García Gómez', 'Sheila', '1999-07-15', 166, 
    'derecha', 'DEL', 7700000, 77, 12, 
    'assets/jugadoras/cartas/RealMadrid/SheilaGarcia.png', 'assets/jugadoras/caras/RealMadrid/sheila.png'
),
-- 22. Signe Bruun (DEL)
(
    1222, 'Signe', 'Bruun', 'Bruun', '1998-04-06', 178, 
    'derecha', 'DEL', 7600000, 76, 12, 
    'assets/jugadoras/cartas/RealMadrid/SigneBruun.png', 'assets/jugadoras/caras/RealMadrid/bruun.png'
),
-- 23. Teresa Abelleira (MED)
(
    1223, 'Teresa', 'Abelleira Dueñas', 'Tere Abelleira', '2000-01-09', 165, 
    'derecha', 'MED', 8400000, 84, 12, 
    'assets/jugadoras/cartas/RealMadrid/teresaAbelleira.png', 'assets/jugadoras/caras/RealMadrid/tereabelleira.png'
),
-- 24. Yasmim Ribeiro (DEF)
(
    1224, 'Yasmim', 'Ribeiro', 'Yasmim', '1996-10-26', 164, 
    'izquierda', 'DEF', 7500000, 75, 12, 
    'assets/jugadoras/cartas/RealMadrid/yasmimRibeiro.png', 'assets/jugadoras/caras/RealMadrid/yasmim.png'
);

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
