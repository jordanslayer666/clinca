# Diccionario de Lenguajes y Variables: Clínica Jordan

Este documento detalla los principales lenguajes de programación utilizados en el proyecto, junto con las variables más importantes de cada uno. Se explica **cómo** se implementan en el código y **por qué** se tomó la decisión de usarlas.

---

## 1. JavaScript (Frontend / Cliente)
*Lenguaje utilizado para darle interactividad a la página web sin recargarla.*

### Variable: `state` (Objeto Global)
- **Cómo se usa:** Se declara al principio de `app.js` como un objeto que contiene toda la información de la sesión actual (quién entró, qué pantalla está viendo). 
  *Ejemplo:* `if (state.isLoggedIn) { ... }`
- **Por qué se usa:** Para tener un "Cerebro Central". En lugar de tener que preguntarle al HTML si un usuario inició sesión, consultamos directamente esta variable en la memoria de la computadora, lo cual es instantáneo y seguro.

### Variable: `currentUser` (Objeto dentro de State)
- **Cómo se usa:** Almacena los datos del usuario que inició sesión (su ID, su nombre, su especialidad si es doctor).
  *Ejemplo:* `<h1>Dr. ${state.currentUser.nombre}</h1>`
- **Por qué se usa:** Para personalizar la experiencia del usuario. Gracias a esta variable, el sistema sabe exactamente a nombre de quién debe agendar una cita o qué nombre mostrar en la cabecera, sin tener que consultar la base de datos a cada segundo.

### Variable: `portal` (String)
- **Cómo se usa:** Guarda un texto que indica el rol del usuario (`'paciente'`, `'doctor'`, o `'admin'`).
  *Ejemplo:* `if (state.portal === 'admin') { mostrarMenuAdmin(); }`
- **Por qué se usa:** Sirve como un candado de seguridad visual. Asegura que la interfaz gráfica no le dibuje por error herramientas médicas a un paciente, o herramientas administrativas a un doctor.

### Variable: `citasHoy` (Array)
- **Cómo se usa:** Filtra una lista gigante de citas y se queda solo con las que coinciden con la fecha actual.
  *Ejemplo:* `const citasHoy = citas.filter(c => c.fecha === today);`
- **Por qué se usa:** Para no saturar al médico. En lugar de mostrarle al doctor todas sus citas históricas en el panel principal, esta variable aísla las del día actual para que el médico se enfoque en su trabajo inmediato.

---

## 2. CSS (Hojas de Estilo en Cascada)
*Lenguaje utilizado para pintar, decorar y posicionar los elementos en la pantalla.*

### Variable: `--primary-900` (Color Hexadecimal)
- **Cómo se usa:** Se define en la raíz (`:root`) del archivo `styles.css` y luego se llama en cualquier regla de estilo.
  *Ejemplo:* `background-color: var(--primary-900);`
- **Por qué se usa:** Centraliza el color principal de la marca (el azul oscuro de la barra lateral). Si mañana la clínica decide cambiar su logo a un tono morado, solo se cambia el código hexadecimal aquí y toda la plataforma se actualiza mágicamente.

### Variable: `--teal-500` (Color Hexadecimal)
- **Cómo se usa:** Se utiliza para botones de acción positiva, como "Agendar Cita".
  *Ejemplo:* `border-bottom: 2px solid var(--teal-500);`
- **Por qué se usa:** Psicología del color. El color verde/esmeralda transmite salud, éxito y limpieza, ideal para indicar que una cita fue completada o para incentivar la reserva de una nueva.

### Variable: `--sidebar-width` (Medida en Píxeles)
- **Cómo se usa:** Establece el ancho fijo del menú izquierdo.
  *Ejemplo:* `width: var(--sidebar-width);`
- **Por qué se usa:** Para que la barra lateral y el contenido principal (que debe empujarse a la derecha) estén siempre sincronizados matemáticamente. Si se necesita hacer la barra más ancha, se cambia este único número y la pantalla principal se ajusta automáticamente sin romperse.

---

## 3. Python y Flask (Backend / Servidor)
*Lenguaje utilizado para el servidor. Procesa la lógica de negocio, reglas de seguridad y conecta con la base de datos.*

### Variable: `app` (Instancia de Flask)
- **Cómo se usa:** Se crea al principio del archivo `app.py` y se usa para definir todas las "rutas" o URLs que el servidor escuchará.
  *Ejemplo:* `@app.route('/api/login', methods=['POST'])`
- **Por qué se usa:** Flask es un micro-framework ligero de Python. El objeto `app` actúa como un recepcionista que recibe todas las peticiones de internet y decide qué función debe ejecutarse (ej. si es `/api/login` manda al código de validación de usuarios).

### Variable: `db_config` (Diccionario de Configuración)
- **Cómo se usa:** Guarda los datos confidenciales de la base de datos (host, usuario, contraseña, nombre).
  *Ejemplo:* `mysql.connector.connect(**db_config)`
- **Por qué se usa:** Para evitar escribir la contraseña a mano docenas de veces a lo largo de las distintas funciones, y para facilitar el cambio rápido de entorno (ej. de desarrollo local a un servidor de producción).

### Variables: `request` y `jsonify` (Librerías de Flask)
- **Cómo se usa:** Extraen la información que el frontend manda y formatean la respuesta.
  *Ejemplo:* `data = request.get_json()` (extrae el correo y clave que el usuario escribió) y `return jsonify(user)` (devuelve el usuario en formato JSON).
- **Por qué se usa:** `request` interpreta de manera segura lo que envió la página web (usualmente JSON). `jsonify` garantiza que el diccionario de Python se empaquete en un estándar universal JSON que el navegador entienda correctamente, resolviendo problemas de incompatibilidad de lenguajes.

---

## 4. SQL (Lenguaje de Base de Datos MySQL)
*Lenguaje utilizado para consultar, guardar y estructurar la información permanente.*

### Variable/Columna: `id_paciente` (Llave Foránea / Foreign Key)
- **Cómo se usa:** En la tabla `citas`, en lugar de guardar el nombre del paciente, se guarda un número entero (ej. `5`) que apunta a la tabla de pacientes.
  *Ejemplo:* `FOREIGN KEY (id_paciente) REFERENCES pacientes(id)`
- **Por qué se usa:** Evita la duplicación de datos. Si un paciente tiene 100 citas y decide cambiar su número de teléfono, solo editamos el perfil del paciente una vez, y las 100 citas reflejarán el nuevo teléfono automáticamente gracias a este enlace numérico.

### Variable/Columna: `estado` (Cadena de Texto Limitada)
- **Cómo se usa:** Guarda el ciclo de vida de la cita clínica. Puede valer `'pendiente'`, `'confirmada'`, `'completada'` o `'cancelada'`.
  *Ejemplo:* `WHERE estado = 'pendiente'`
- **Por qué se usa:** Funciona como un "semáforo" para el código. Permite que el panel del doctor dibuje bolitas rojas, naranjas o verdes dependiendo de la palabra exacta almacenada, y evita que se agenden citas encima de horas ya 'confirmadas'.

### Variable/Columna: `created_at` (Marca de Tiempo / Timestamp)
- **Cómo se usa:** Una columna que se llena sola con la fecha y hora exacta del reloj del servidor cuando se inserta un nuevo renglón.
  *Ejemplo:* `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- **Por qué se usa:** Para auditoría pura. Le permite al administrador ver una tabla y decir: "Este doctor se registró el 22 de Septiembre de 2026 a las 14:00". Es esencial para saber cuándo sucedieron los eventos sin tener que confiar en la fecha de la computadora del usuario.
