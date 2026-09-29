USE citas_medicas_db;

-- 1. Modificar pacientes para agregar estado
ALTER TABLE pacientes 
ADD COLUMN estado ENUM('pendiente', 'activo', 'rechazado') NOT NULL DEFAULT 'pendiente' AFTER fecha_registro;

-- (Opcional, asegurar que los pacientes anteriores queden activos)
UPDATE pacientes SET estado = 'activo';

-- 2. Modificar doctores (la columna 'estado' ya existe, pero aseguramos los nuevos tipos)
ALTER TABLE doctores
MODIFY COLUMN estado ENUM('pendiente', 'activo', 'inactivo', 'rechazado') NOT NULL DEFAULT 'pendiente';

-- 3. Crear tabla de administradores
CREATE TABLE IF NOT EXISTS administradores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Crear el administrador por defecto
INSERT INTO administradores (nombre, correo, contrasena) VALUES
('Super Admin', 'admin@clinica.com', 'admin123')
ON DUPLICATE KEY UPDATE contrasena='admin123';
