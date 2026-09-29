from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import os

app = Flask(__name__, static_folder='public', static_url_path='')
CORS(app)

# ── Configuración de Conexión ──────────────────────────────
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'citas_medicas_db'
}

def get_db_connection():
    try:
        conn = mysql.connector.connect(**db_config)
        return conn
    except Error as e:
        print(f"Error conectando a MySQL: {e}")
        return None

def query_db(sql, params=(), one=False):
    conn = get_db_connection()
    if not conn:
        raise Exception("No se pudo conectar a la base de datos")
    
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(sql, params)
        if sql.strip().upper().startswith("SELECT"):
            result = cursor.fetchall()
            return (result[0] if result else None) if one else result
        else:
            conn.commit()
            return cursor.lastrowid
    finally:
        cursor.close()
        conn.close()

# ═══════════════════════════════════════════════════════════
# SERVIR FRONTEND
# ═══════════════════════════════════════════════════════════
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

# ═══════════════════════════════════════════════════════════
# AUTH ROUTES
# ═══════════════════════════════════════════════════════════
@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        correo = data.get('correo')
        contrasena = data.get('contrasena')
        tipo = data.get('tipo')

        if tipo == 'admin':
            row = query_db('SELECT id, nombre, correo FROM administradores WHERE correo = %s AND contrasena = %s', (correo, contrasena), one=True)
            if not row: return jsonify({'error': 'Credenciales inválidas'}), 401
            return jsonify({'tipo': 'admin', 'usuario': row})

        if tipo == 'paciente':
            row = query_db('SELECT id, nombre, apellido, correo, telefono, fecha_nacimiento, genero, direccion, estado FROM pacientes WHERE correo = %s AND contrasena = %s', (correo, contrasena), one=True)
            if not row: return jsonify({'error': 'Credenciales inválidas'}), 401
            if row['estado'] == 'pendiente': return jsonify({'error': 'Cuenta pendiente de aprobación'}), 403
            if row['estado'] == 'rechazado': return jsonify({'error': 'Esta cuenta ha sido rechazada'}), 403
            if row.get('fecha_nacimiento'): row['fecha_nacimiento'] = str(row['fecha_nacimiento'])
            return jsonify({'tipo': 'paciente', 'usuario': row})

        if tipo == 'doctor':
            row = query_db("""
                SELECT d.id, d.nombre, d.apellido, d.correo, d.telefono, d.estado,
                       e.nombre AS especialidad, d.id_especialidad, d.id_hospital,
                       h.nombre AS hospital
                FROM doctores d
                JOIN especialidades e ON d.id_especialidad = e.id
                JOIN hospitales h ON d.id_hospital = h.id
                WHERE d.correo = %s AND d.contrasena = %s
            """, (correo, contrasena), one=True)
            if not row: return jsonify({'error': 'Credenciales inválidas'}), 401
            if row['estado'] == 'pendiente': return jsonify({'error': 'Cuenta pendiente de aprobación'}), 403
            if row['estado'] == 'rechazado': return jsonify({'error': 'Esta cuenta ha sido rechazada'}), 403
            return jsonify({'tipo': 'doctor', 'usuario': row})

        return jsonify({'error': 'Tipo de usuario no válido'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/registro/paciente', methods=['POST'])
def registro_paciente():
    try:
        data = request.get_json()
        existing = query_db('SELECT id FROM pacientes WHERE correo = %s', (data['correo'],), one=True)
        if existing: return jsonify({'error': 'El correo ya está registrado'}), 400
        
        insert_id = query_db(
            """INSERT INTO pacientes (nombre, apellido, fecha_nacimiento, genero, correo, contrasena, telefono, direccion, estado)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'pendiente')""",
            (data['nombre'], data['apellido'], data['fecha_nacimiento'], data['genero'], data['correo'], data['contrasena'], data.get('telefono'), data.get('direccion'))
        )
        
        user = query_db('SELECT id, nombre, apellido, correo, telefono, fecha_nacimiento, genero, direccion, estado FROM pacientes WHERE id = %s', (insert_id,), one=True)
        if user and user.get('fecha_nacimiento'): user['fecha_nacimiento'] = str(user['fecha_nacimiento'])
        
        query_db('INSERT INTO notificaciones (tipo, id_usuario, titulo, mensaje) VALUES (%s, %s, %s, %s)',
                 ('paciente', insert_id, 'Bienvenido a Clínica Jordan', 'Tu cuenta ha sido creada exitosamente. ¡Agenda tu primera cita!'))
        
        return jsonify({'tipo': 'paciente', 'usuario': user, 'message': 'Registro exitoso'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/registro/doctor', methods=['POST'])
def registro_doctor():
    try:
        data = request.get_json()
        existing = query_db('SELECT id FROM doctores WHERE correo = %s', (data['correo'],), one=True)
        if existing: return jsonify({'error': 'El correo ya está registrado'}), 400
        
        insert_id = query_db(
            """INSERT INTO doctores (nombre, apellido, correo, contrasena, telefono, id_especialidad, id_hospital, estado)
               VALUES (%s, %s, %s, %s, %s, %s, %s, 'pendiente')""",
            (data['nombre'], data['apellido'], data['correo'], data['contrasena'], data.get('telefono'), data['id_especialidad'], data['id_hospital'])
        )
        
        user = query_db("""
            SELECT d.id, d.nombre, d.apellido, d.correo, d.telefono, d.estado,
                   e.nombre AS especialidad, d.id_especialidad, d.id_hospital,
                   h.nombre AS hospital
            FROM doctores d
            JOIN especialidades e ON d.id_especialidad = e.id
            JOIN hospitales h ON d.id_hospital = h.id
            WHERE d.id = %s
        """, (insert_id,), one=True)
        
        query_db('INSERT INTO notificaciones (tipo, id_usuario, titulo, mensaje) VALUES (%s, %s, %s, %s)',
                 ('doctor', insert_id, 'Bienvenido al equipo', 'Tu perfil de doctor ha sido creado. Configura tus horarios de atención.'))
        
        return jsonify({'tipo': 'doctor', 'usuario': user, 'message': 'Registro exitoso'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ═══════════════════════════════════════════════════════════
# ADMIN ROUTES
# ═══════════════════════════════════════════════════════════
@app.route('/api/admin/pendientes', methods=['GET'])
def admin_pendientes():
    try:
        pacientes = query_db("SELECT id, nombre, apellido, correo, genero, 'paciente' AS tipo, estado, fecha_registro AS fecha FROM pacientes WHERE estado = 'pendiente'")
        doctores = query_db("""
            SELECT d.id, d.nombre, d.apellido, d.correo, 'doctor' AS tipo, d.estado, d.created_at AS fecha, e.nombre AS especialidad
            FROM doctores d
            LEFT JOIN especialidades e ON d.id_especialidad = e.id
            WHERE d.estado = 'pendiente'
        """)
        for p in pacientes:
            if p.get('fecha'): p['fecha'] = str(p['fecha'])
        for d in doctores:
            if d.get('fecha'): d['fecha'] = str(d['fecha'])
        return jsonify(pacientes + doctores)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/aprobar/<tipo>/<int:id>', methods=['PUT'])
def admin_aprobar(tipo, id):
    table = 'pacientes' if tipo == 'paciente' else 'doctores'
    query_db(f"UPDATE {table} SET estado = 'activo' WHERE id = %s", (id,))
    return jsonify({'success': True, 'message': 'Usuario aprobado'})

@app.route('/api/admin/rechazar/<tipo>/<int:id>', methods=['PUT'])
def admin_rechazar(tipo, id):
    table = 'pacientes' if tipo == 'paciente' else 'doctores'
    query_db(f"UPDATE {table} SET estado = 'rechazado' WHERE id = %s", (id,))
    return jsonify({'success': True, 'message': 'Usuario rechazado'})

@app.route('/api/admin/todos', methods=['GET'])
def admin_todos():
    pacientes = query_db("SELECT id, nombre, apellido, correo, telefono, estado, genero, fecha_registro FROM pacientes ORDER BY fecha_registro DESC")
    doctores = query_db("""
        SELECT d.id, d.nombre, d.apellido, d.correo, d.telefono, d.estado,
               e.nombre AS especialidad, h.nombre AS hospital
        FROM doctores d
        LEFT JOIN especialidades e ON d.id_especialidad = e.id
        LEFT JOIN hospitales h ON d.id_hospital = h.id
        ORDER BY d.id DESC
    """)
    for p in pacientes:
        if p.get('fecha_registro'): p['fecha_registro'] = str(p['fecha_registro'])
    return jsonify({'pacientes': pacientes, 'doctores': doctores})

# ═══════════════════════════════════════════════════════════
# DATA ROUTES
# ═══════════════════════════════════════════════════════════
@app.route('/api/hospitales', methods=['GET'])
def get_hospitales():
    return jsonify(query_db('SELECT * FROM hospitales'))

@app.route('/api/especialidades', methods=['GET'])
def get_especialidades():
    return jsonify(query_db('SELECT * FROM especialidades'))

@app.route('/api/doctores', methods=['GET'])
def get_doctores():
    especialidad = request.args.get('especialidad')
    sql = """
        SELECT d.id, d.nombre, d.apellido, d.correo, d.telefono, d.id_especialidad, d.id_hospital, d.estado,
               e.nombre AS especialidad, h.nombre AS hospital, h.direccion AS direccion_hospital
        FROM doctores d
        JOIN especialidades e ON d.id_especialidad = e.id
        JOIN hospitales h ON d.id_hospital = h.id
        WHERE d.estado = 'activo'
    """
    params = []
    if especialidad:
        sql += " AND d.id_especialidad = %s"
        params.append(especialidad)
    sql += " ORDER BY d.apellido"
    return jsonify(query_db(sql, tuple(params)))

@app.route('/api/doctores/<int:id>', methods=['GET'])
def get_doctor(id):
    row = query_db("""
        SELECT d.id, d.nombre, d.apellido, d.correo, d.telefono, d.id_especialidad, d.id_hospital, d.estado,
               e.nombre AS especialidad, h.nombre AS hospital
        FROM doctores d
        JOIN especialidades e ON d.id_especialidad = e.id
        JOIN hospitales h ON d.id_hospital = h.id
        WHERE d.id = %s
    """, (id,), one=True)
    return jsonify(row)

@app.route('/api/doctores/<int:id>/horarios', methods=['GET'])
def get_horarios(id):
    rows = query_db('SELECT * FROM horarios_disponibles WHERE id_doctor = %s AND disponible = 1', (id,))
    for r in rows:
        if r.get('hora_inicio'): r['hora_inicio'] = str(r['hora_inicio'])
        if r.get('hora_fin'): r['hora_fin'] = str(r['hora_fin'])
    return jsonify(rows)

@app.route('/api/doctores/<int:id>/horarios', methods=['POST'])
def add_horario(id):
    data = request.get_json()
    insert_id = query_db(
        'INSERT INTO horarios_disponibles (id_doctor, dia_semana, hora_inicio, hora_fin, disponible) VALUES (%s, %s, %s, %s, 1)',
        (id, data['dia_semana'], data['hora_inicio'], data['hora_fin'])
    )
    return jsonify({'id': insert_id, 'message': 'Horario agregado'})

@app.route('/api/doctores-disponibles', methods=['GET'])
def doctores_disponibles():
    rows = query_db("""
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
        WHERE d.estado = 'activo' AND hd.disponible = 1
        ORDER BY e.nombre, d.apellido
    """)
    return jsonify(rows)

@app.route('/api/pacientes', methods=['GET'])
def get_pacientes():
    rows = query_db('SELECT id, nombre, apellido, fecha_nacimiento, genero, correo, telefono, direccion, fecha_registro FROM pacientes ORDER BY apellido')
    for r in rows:
        if r.get('fecha_nacimiento'): r['fecha_nacimiento'] = str(r['fecha_nacimiento'])
        if r.get('fecha_registro'): r['fecha_registro'] = str(r['fecha_registro'])
    return jsonify(rows)

# ═══════════════════════════════════════════════════════════
# CITAS
# ═══════════════════════════════════════════════════════════
@app.route('/api/citas', methods=['GET'])
def get_citas():
    paciente = request.args.get('paciente')
    doctor = request.args.get('doctor')
    estado = request.args.get('estado')
    fecha = request.args.get('fecha')
    
    sql = """
        SELECT c.*,
            CONCAT(p.nombre, ' ', p.apellido) AS paciente_nombre,
            p.telefono AS paciente_telefono,
            p.correo AS paciente_correo,
            p.fecha_nacimiento AS paciente_nacimiento,
            p.genero AS paciente_genero,
            CONCAT(d.nombre, ' ', d.apellido) AS doctor_nombre,
            e.nombre AS especialidad,
            h.nombre AS hospital_nombre,
            h.direccion AS hospital_direccion
        FROM citas c
        JOIN pacientes p ON c.id_paciente = p.id
        JOIN doctores d ON c.id_doctor = d.id
        JOIN especialidades e ON d.id_especialidad = e.id
        JOIN hospitales h ON c.id_hospital = h.id
        WHERE 1=1
    """
    params = []
    if paciente:
        sql += " AND c.id_paciente = %s"
        params.append(paciente)
    if doctor:
        sql += " AND c.id_doctor = %s"
        params.append(doctor)
    if estado:
        sql += " AND c.estado = %s"
        params.append(estado)
    if fecha:
        sql += " AND c.fecha_cita = %s"
        params.append(fecha)
    
    sql += " ORDER BY c.fecha_cita DESC, c.hora_cita ASC"
    
    rows = query_db(sql, tuple(params))
    for r in rows:
        if r.get('fecha_cita'): r['fecha_cita'] = str(r['fecha_cita'])
        if r.get('hora_cita'): r['hora_cita'] = str(r['hora_cita'])
        if r.get('paciente_nacimiento'): r['paciente_nacimiento'] = str(r['paciente_nacimiento'])
        if r.get('created_at'): r['created_at'] = str(r['created_at'])
    return jsonify(rows)

@app.route('/api/citas', methods=['POST'])
def add_cita():
    try:
        data = request.get_json()
        insert_id = query_db(
            """INSERT INTO citas (id_paciente, id_doctor, id_hospital, fecha_cita, hora_cita, motivo_consulta, estado)
               VALUES (%s, %s, %s, %s, %s, %s, 'pendiente')""",
            (data['id_paciente'], data['id_doctor'], data['id_hospital'], data['fecha_cita'], data['hora_cita'], data.get('motivo_consulta'))
        )
        
        # Notificar al doctor
        query_db('INSERT INTO notificaciones (tipo, id_usuario, titulo, mensaje) VALUES (%s, %s, %s, %s)',
                 ('doctor', data['id_doctor'], 'Nueva cita solicitada', f"Tienes una nueva cita para el {data['fecha_cita']} a las {data['hora_cita']}"))
                 
        return jsonify({'id': insert_id, 'message': 'Cita creada exitosamente'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/citas/<int:id>', methods=['PUT'])
def update_cita(id):
    try:
        data = request.get_json()
        fields = []
        params = []
        for key in ['estado', 'notas', 'diagnostico', 'tratamiento']:
            if key in data:
                fields.append(f"{key} = %s")
                params.append(data[key])
        
        if not fields:
            return jsonify({'success': False, 'message': 'Nada que actualizar'})
        
        params.append(id)
        sql = f"UPDATE citas SET {', '.join(fields)} WHERE id = %s"
        query_db(sql, tuple(params))
        
        # Si se completó o canceló, notificar
        if data.get('estado') in ['confirmada', 'completada', 'cancelada']:
            cita = query_db('SELECT id_paciente, id_doctor, fecha_cita FROM citas WHERE id = %s', (id,), one=True)
            if cita:
                query_db('INSERT INTO notificaciones (tipo, id_usuario, titulo, mensaje) VALUES (%s, %s, %s, %s)',
                         ('paciente', cita['id_paciente'], 'Actualización de cita', f"Tu cita del {cita['fecha_cita']} fue {data['estado']}"))

        return jsonify({'success': True, 'message': 'Cita actualizada'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/citas-doctor/<int:id>', methods=['GET'])
def get_citas_doctor(id):
    rows = query_db("""
        SELECT
            c.id AS id_cita,
            c.fecha_cita,
            TIME_FORMAT(c.hora_cita, '%h:%i %p') AS hora_cita,
            c.hora_cita AS hora_raw,
            CONCAT(p.nombre, ' ', p.apellido) AS paciente,
            p.id AS id_paciente,
            p.telefono AS telefono_paciente,
            p.correo AS correo_paciente,
            p.fecha_nacimiento,
            p.genero,
            h.nombre AS hospital,
            e.nombre AS especialidad,
            c.motivo_consulta,
            c.diagnostico,
            c.tratamiento,
            c.estado,
            c.notas
        FROM citas c
        JOIN doctores d ON c.id_doctor = d.id
        JOIN pacientes p ON c.id_paciente = p.id
        JOIN hospitales h ON c.id_hospital = h.id
        JOIN especialidades e ON d.id_especialidad = e.id
        WHERE d.id = %s
        ORDER BY c.fecha_cita ASC, c.hora_cita ASC
    """, (id,))
    for r in rows:
        if r.get('fecha_cita'): r['fecha_cita'] = str(r['fecha_cita'])
        if r.get('fecha_nacimiento'): r['fecha_nacimiento'] = str(r['fecha_nacimiento'])
        if r.get('hora_raw'): r['hora_raw'] = str(r['hora_raw'])
    return jsonify(rows)

# ═══════════════════════════════════════════════════════════
# PRESCRIPCIONES Y NOTIFICACIONES
# ═══════════════════════════════════════════════════════════
@app.route('/api/prescripciones', methods=['POST'])
def add_prescripcion():
    try:
        data = request.get_json()
        insert_id = query_db(
            'INSERT INTO prescripciones (id_cita, medicamento, dosis, frecuencia) VALUES (%s, %s, %s, %s)',
            (data['id_cita'], data['medicamento'], data['dosis'], data['frecuencia'])
        )
        return jsonify({'id': insert_id, 'message': 'Prescripción agregada'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/prescripciones/<int:id>', methods=['DELETE'])
def delete_prescripcion(id):
    query_db('DELETE FROM prescripciones WHERE id = %s', (id,))
    return jsonify({'success': True})

@app.route('/api/notificaciones/<tipo>/<int:id>', methods=['GET'])
def get_notificaciones(tipo, id):
    rows = query_db("SELECT * FROM notificaciones WHERE tipo = %s AND id_usuario = %s ORDER BY fecha_creacion DESC", (tipo, id))
    for r in rows:
        if r.get('fecha_creacion'): r['fecha_creacion'] = str(r['fecha_creacion'])
    return jsonify(rows)

@app.route('/api/notificaciones/<int:id>/leer', methods=['PUT'])
def leer_notificacion_unica(id):
    query_db("UPDATE notificaciones SET leida = 1 WHERE id = %s", (id,))
    return jsonify({'success': True})

@app.route('/api/notificaciones/leer-todas/<tipo>/<int:id>', methods=['PUT'])
def leer_notificaciones_todas(tipo, id):
    query_db("UPDATE notificaciones SET leida = 1 WHERE tipo = %s AND id_usuario = %s", (tipo, id))
    return jsonify({'success': True})


if __name__ == '__main__':
    print("=========================================")
    print("🚀 Iniciando Servidor Python Flask (PORT 3000)")
    print("🌐 Disponible en http://localhost:3000")
    print("=========================================")
    app.run(port=3000, debug=True)
