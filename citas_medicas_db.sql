-- ============================================================
-- BASE DE DATOS: SISTEMA DE CITAS MÉDICAS
-- Compatible con MySQL Workbench y phpMyAdmin
-- ============================================================

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS citas_medicas_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE citas_medicas_db;

-- ============================================================
-- TABLA 1: HOSPITALES
-- ============================================================
CREATE TABLE hospitales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    correo VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA 2: ESPECIALIDADES
-- ============================================================
CREATE TABLE especialidades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA 3: DOCTORES
-- ============================================================
CREATE TABLE doctores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    apellido VARCHAR(80) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    id_especialidad INT NOT NULL,
    id_hospital INT NOT NULL,
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_doctor_especialidad
        FOREIGN KEY (id_especialidad) REFERENCES especialidades(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_doctor_hospital
        FOREIGN KEY (id_hospital) REFERENCES hospitales(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA 4: PACIENTES
-- ============================================================
CREATE TABLE pacientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    apellido VARCHAR(80) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    genero ENUM('masculino', 'femenino', 'otro') NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(20) NOT NULL,
    direccion VARCHAR(255),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA 5: HORARIOS DISPONIBLES
-- ============================================================
CREATE TABLE horarios_disponibles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_doctor INT NOT NULL,
    dia_semana ENUM('Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo') NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    disponible TINYINT(1) DEFAULT 1 COMMENT '1 = disponible, 0 = no disponible',
    CONSTRAINT fk_horario_doctor
        FOREIGN KEY (id_doctor) REFERENCES doctores(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_horario CHECK (hora_fin > hora_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA 6: CITAS
-- ============================================================
CREATE TABLE citas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_paciente INT NOT NULL,
    id_doctor INT NOT NULL,
    id_hospital INT NOT NULL,
    fecha_cita DATE NOT NULL,
    hora_cita TIME NOT NULL,
    motivo_consulta TEXT,
    estado ENUM('pendiente','confirmada','cancelada','completada') DEFAULT 'pendiente',
    notas TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cita_paciente
        FOREIGN KEY (id_paciente) REFERENCES pacientes(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_cita_doctor
        FOREIGN KEY (id_doctor) REFERENCES doctores(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_cita_hospital
        FOREIGN KEY (id_hospital) REFERENCES hospitales(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DATOS DE EJEMPLO
-- ============================================================

-- Hospitales
INSERT INTO hospitales (nombre, direccion, telefono, correo) VALUES
('Hospital Central San José', 'Av. Principal #123, Centro', '555-100-2000', 'contacto@hospitalsanjose.com'),
('Clínica Santa María', 'Calle 5 de Mayo #456, Col. Reforma', '555-200-3000', 'info@clinicasantamaria.com'),
('Hospital Regional del Norte', 'Blvd. Norte #789, Zona Industrial', '555-300-4000', 'atencion@hospitalregional.com');

-- Especialidades
INSERT INTO especialidades (nombre, descripcion) VALUES
('Medicina General', 'Atención médica primaria y consultas generales'),
('Cardiología', 'Diagnóstico y tratamiento de enfermedades del corazón'),
('Pediatría', 'Atención médica para niños y adolescentes'),
('Dermatología', 'Tratamiento de enfermedades de la piel'),
('Traumatología', 'Atención de lesiones del sistema musculoesquelético');

-- Doctores
INSERT INTO doctores (nombre, apellido, correo, telefono, id_especialidad, id_hospital, estado) VALUES
('Carlos', 'Ramírez López', 'carlos.ramirez@hospital.com', '555-111-0001', 1, 1, 'activo'),
('María', 'González Torres', 'maria.gonzalez@hospital.com', '555-111-0002', 2, 1, 'activo'),
('Juan', 'Hernández Díaz', 'juan.hernandez@hospital.com', '555-111-0003', 3, 2, 'activo'),
('Laura', 'Martínez Ruiz', 'laura.martinez@hospital.com', '555-111-0004', 4, 3, 'activo');

-- Pacientes
INSERT INTO pacientes (nombre, apellido, fecha_nacimiento, genero, correo, telefono, direccion) VALUES
('Ana', 'Pérez Sánchez', '1990-05-15', 'femenino', 'ana.perez@correo.com', '555-222-0001', 'Calle Flores #10'),
('Roberto', 'López García', '1985-11-20', 'masculino', 'roberto.lopez@correo.com', '555-222-0002', 'Av. Insurgentes #200'),
('Sofía', 'Torres Mendoza', '2000-03-08', 'femenino', 'sofia.torres@correo.com', '555-222-0003', 'Col. Del Valle #55');

-- Horarios disponibles
INSERT INTO horarios_disponibles (id_doctor, dia_semana, hora_inicio, hora_fin, disponible) VALUES
-- Dr. Carlos Ramírez
(1, 'Lunes', '08:00:00', '14:00:00', 1),
(1, 'Miércoles', '08:00:00', '14:00:00', 1),
(1, 'Viernes', '09:00:00', '13:00:00', 1),
-- Dra. María González
(2, 'Martes', '10:00:00', '16:00:00', 1),
(2, 'Jueves', '10:00:00', '16:00:00', 1),
-- Dr. Juan Hernández
(3, 'Lunes', '14:00:00', '20:00:00', 1),
(3, 'Martes', '14:00:00', '20:00:00', 1),
(3, 'Viernes', '08:00:00', '12:00:00', 1),
-- Dra. Laura Martínez
(4, 'Miércoles', '09:00:00', '15:00:00', 1),
(4, 'Sábado', '08:00:00', '12:00:00', 1);

-- Citas
INSERT INTO citas (id_paciente, id_doctor, id_hospital, fecha_cita, hora_cita, motivo_consulta, estado) VALUES
(1, 1, 1, '2026-09-05', '09:00:00', 'Consulta general - dolor de cabeza frecuente', 'confirmada'),
(2, 2, 1, '2026-09-06', '11:00:00', 'Revisión cardiológica de rutina', 'pendiente'),
(3, 3, 2, '2026-09-05', '15:00:00', 'Control pediátrico anual', 'confirmada'),
(1, 4, 3, '2026-09-10', '10:00:00', 'Evaluación de erupción cutánea', 'pendiente'),
(2, 1, 1, '2026-09-12', '08:30:00', 'Seguimiento de tratamiento previo', 'pendiente');

-- ============================================================
-- VISTAS
-- ============================================================

-- VISTA PARA PACIENTES: Ver doctores disponibles con horarios y hospital
CREATE OR REPLACE VIEW vista_doctores_disponibles AS
SELECT
    d.id AS id_doctor,
    CONCAT(d.nombre, ' ', d.apellido) AS doctor,
    e.nombre AS especialidad,
    h.nombre AS hospital,
    h.direccion AS direccion_hospital,
    h.telefono AS telefono_hospital,
    hd.dia_semana,
    TIME_FORMAT(hd.hora_inicio, '%h:%i %p') AS hora_inicio,
    TIME_FORMAT(hd.hora_fin, '%h:%i %p') AS hora_fin
FROM doctores d
INNER JOIN especialidades e ON d.id_especialidad = e.id
INNER JOIN hospitales h ON d.id_hospital = h.id
INNER JOIN horarios_disponibles hd ON d.id = hd.id_doctor
WHERE d.estado = 'activo'
  AND hd.disponible = 1
ORDER BY e.nombre, d.apellido, hd.dia_semana;

-- VISTA PARA DOCTORES: Ver sus citas con información del paciente y hospital
CREATE OR REPLACE VIEW vista_citas_doctor AS
SELECT
    d.id AS id_doctor,
    CONCAT(d.nombre, ' ', d.apellido) AS doctor,
    e.nombre AS especialidad,
    c.id AS id_cita,
    c.fecha_cita,
    TIME_FORMAT(c.hora_cita, '%h:%i %p') AS hora_cita,
    CONCAT(p.nombre, ' ', p.apellido) AS paciente,
    p.telefono AS telefono_paciente,
    p.correo AS correo_paciente,
    h.nombre AS hospital,
    c.motivo_consulta,
    c.estado,
    c.notas
FROM citas c
INNER JOIN doctores d ON c.id_doctor = d.id
INNER JOIN pacientes p ON c.id_paciente = p.id
INNER JOIN hospitales h ON c.id_hospital = h.id
INNER JOIN especialidades e ON d.id_especialidad = e.id
ORDER BY c.fecha_cita, c.hora_cita;

-- ============================================================
-- CONSULTAS DE PRUEBA (descomenta para probar)
-- ============================================================

-- Ver todos los doctores disponibles (vista del paciente)
-- SELECT * FROM vista_doctores_disponibles;

-- Ver las citas de un doctor específico (vista del doctor)
-- SELECT * FROM vista_citas_doctor WHERE id_doctor = 1;

-- Ver citas pendientes
-- SELECT * FROM vista_citas_doctor WHERE estado = 'pendiente';
