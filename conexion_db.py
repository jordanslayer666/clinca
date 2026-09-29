import mysql.connector
from mysql.connector import Error

def conectar_db():
    """
    Establece y devuelve una conexión a la base de datos MySQL de Clínica Jordan.
    """
    try:
        conexion = mysql.connector.connect(
            host='localhost',
            database='citas_medicas_db',
            user='root',
            password='' # Cambia esto si tu usuario root de XAMPP tiene contraseña
        )
        if conexion.is_connected():
            print("=========================================")
            print("✅ Conexión exitosa a MySQL (Clínica Jordan)")
            print("=========================================")
            return conexion
    except Error as e:
        print("=========================================")
        print(f"❌ Error al conectar a MySQL: {e}")
        print("=========================================")
        return None

def obtener_resumen_clinica():
    """
    Función de ejemplo que extrae un resumen analítico de la clínica usando Python.
    """
    conexion = conectar_db()
    if not conexion:
        return

    try:
        cursor = conexion.cursor(dictionary=True)
        
        print("\n--- RESUMEN ANALÍTICO ---")
        
        # 1. Contar total de pacientes
        cursor.execute("SELECT COUNT(*) as total FROM pacientes")
        total_pacientes = cursor.fetchone()['total']
        print(f"Total Pacientes Registrados: {total_pacientes}")
        
        # 2. Contar total de doctores activos
        cursor.execute("SELECT COUNT(*) as total FROM doctores WHERE aprobado = 1")
        total_doctores = cursor.fetchone()['total']
        print(f"Total Doctores Activos: {total_doctores}")
        
        # 3. Listar próximas citas pendientes
        print("\n--- PRÓXIMAS 5 CITAS PENDIENTES ---")
        cursor.execute("""
            SELECT c.fecha_cita, c.hora_cita, p.nombre as paciente, d.nombre as doctor 
            FROM citas c
            JOIN pacientes p ON c.id_paciente = p.id
            JOIN doctores d ON c.id_doctor = d.id
            WHERE c.estado = 'pendiente'
            ORDER BY c.fecha_cita ASC, c.hora_cita ASC
            LIMIT 5
        """)
        citas = cursor.fetchall()
        
        if len(citas) == 0:
            print("No hay citas pendientes.")
        else:
            for cita in citas:
                print(f"📅 {cita['fecha_cita']} a las {cita['hora_cita']} | Dr. {cita['doctor']} -> Paciente: {cita['paciente']}")
        print("\n")
        
    except Error as e:
        print(f"Error ejecutando consultas: {e}")
    finally:
        if conexion.is_connected():
            cursor.close()
            conexion.close()
            print("🔒 Conexión a la base de datos cerrada.")

if __name__ == '__main__':
    # Al ejecutar este script directamente desde la terminal, 
    # correrá la función de resumen analítico.
    obtener_resumen_clinica()
