-- ============================================================
-- MIGRACIÓN: Agregar sistema de autenticación y campos extra
-- Ejecutar DESPUÉS del script principal citas_medicas_db.sql
-- ============================================================

USE citas_medicas_db;

-- Agregar contraseña a pacientes
ALTER TABLE pacientes 
ADD COLUMN contrasena VARCHAR(255) NOT NULL DEFAULT '123456' AFTER correo;

-- Agregar contraseña a doctores  
ALTER TABLE doctores 
ADD COLUMN contrasena VARCHAR(255) NOT NULL DEFAULT '123456' AFTER correo;

-- Agregar campo diagnostico y tratamiento a citas
ALTER TABLE citas
ADD COLUMN diagnostico TEXT AFTER motivo_consulta,
ADD COLUMN tratamiento TEXT AFTER diagnostico;

-- ============================================================
-- TABLA: PRESCRIPCIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS prescripciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_cita INT NOT NULL,
    medicamento VARCHAR(150) NOT NULL,
    dosis VARCHAR(100) NOT NULL,
    frecuencia VARCHAR(100) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_prescripcion_cita
        FOREIGN KEY (id_cita) REFERENCES citas(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: NOTIFICACIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('paciente', 'doctor') NOT NULL,
    id_usuario INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT,
    leida TINYINT(1) DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DATOS DE PRUEBA EXTRA
-- ============================================================

-- Prescripciones de ejemplo
INSERT INTO prescripciones (id_cita, medicamento, dosis, frecuencia) VALUES
(1, 'Paracetamol', '500mg', 'Cada 8 horas'),
(1, 'Ibuprofeno', '400mg', 'Cada 12 horas'),
(3, 'Amoxicilina', '250mg', 'Cada 8 horas por 7 días');

-- Notificaciones de ejemplo
INSERT INTO notificaciones (tipo, id_usuario, titulo, mensaje) VALUES
('paciente', 1, 'Cita confirmada', 'Su cita del 5 de septiembre ha sido confirmada.'),
('paciente', 1, 'Recordatorio', 'Tiene una cita mañana a las 9:00 AM.'),
('paciente', 2, 'Nueva cita programada', 'Su cita de cardiología ha sido registrada.'),
('doctor', 1, 'Nuevo paciente', 'Ana Pérez ha agendado una cita para el 5 de septiembre.'),
('doctor', 2, 'Cita cancelada', 'Un paciente ha cancelado su cita del viernes.');

-- Actualizar contraseñas de ejemplo
UPDATE pacientes SET contrasena = '123456';
UPDATE doctores SET contrasena = '123456';
