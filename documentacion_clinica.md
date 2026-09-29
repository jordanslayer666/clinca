# Documentación Técnica y de Código: Clínica Jordan

Este documento proporciona una visión detallada de la arquitectura técnica, las decisiones de diseño y una explicación profunda del código fuente (dividido por lenguajes y tecnologías) implementadas en la aplicación de gestión de **Clínica Jordan**.

---

## 1. Arquitectura General de la Aplicación

La aplicación se diseñó siguiendo el patrón **Single Page Application (SPA)**. Esto significa que el navegador carga una sola página HTML (`index.html`), y todo el contenido se actualiza dinámicamente mediante JavaScript sin necesidad de recargar la página.

**Tecnologías Clave:**
- **Frontend**: HTML5, CSS3 nativo, JavaScript (Vanilla JS).
- **Backend**: Python con Flask.
- **Base de Datos**: MySQL.

---

## 2. Frontend: Estructura HTML (`index.html`)

El archivo HTML actúa únicamente como un "esqueleto" o contenedor vacío que será rellenado por JavaScript.

### ¿Por qué se estructuró así?
- **El contenedor principal (`#mainContent`)**: Hay un div central con el id `mainContent`. Todo el HTML dinámico (como el panel del doctor o del paciente) se inyecta directamente aquí. Se usó esta variable/id porque facilita que JavaScript encuentre exactamente dónde colocar la interfaz gráfica.
- **Modales (`#modalContainer`, `#modalOverlay`)**: Se dejaron elementos predefinidos ocultos para los modales. Esto permite que el sistema de ventanas emergentes (para ver el perfil o una cita) sea global y siempre esté listo para ser llamado, ahorrando recursos del navegador.
- **Íconos**: Se enlazó la librería de **FontAwesome** en la cabecera (head) para no tener que cargar archivos locales pesados de imágenes y usar íconos vectoriales livianos (ej: `<i class="fa-solid fa-user"></i>`).

---

## 3. Estilos y Diseño: CSS (`styles.css`)

Se eligió no usar frameworks pesados (como Bootstrap) de forma estricta para mantener el control total del diseño y hacerlo lucir como una aplicación médica profesional y no como una plantilla genérica.

### Uso de Variables CSS (Custom Properties)
En la parte superior del archivo CSS, se definen variables globales dentro de `:root`:
```css
:root {
  --primary-900: #0c2340; /* Azul oscuro corporativo */
  --teal-500: #14b8a6;    /* Verde esmeralda para acciones primarias */
  --gray-100: #f4f7f6;    /* Gris muy claro para el fondo */
  --sidebar-width: 220px; /* Ancho estricto del menú lateral */
}
```
**¿Por qué se usaron estas variables?**
- **Consistencia**: Si el cliente quiere cambiar el "color primario" de azul a rojo, solo hay que cambiar la variable `--primary-900` una vez, y toda la app cambiará instantáneamente.
- **Psicología del color médico**: Se usó el color esmeralda (`--teal`) para los botones de "Agendar" porque transmite salud, limpieza y confianza.

### Patrón BEM Simplificado
Se usó una nomenclatura basada en bloques (ej. `dash-stat-card__title`).
- Esto evita que los estilos "choquen" entre sí. Si creamos un "título" para una tarjeta, no arruinará el "título" del menú de navegación.

---

## 4. Lógica del Cliente: JavaScript (`app.js`)

Aquí reside el "cerebro" del lado del usuario. 

### Gestión de Estado (`state`)
Se definió un objeto global llamado `state`:
```javascript
const state = {
  isLoggedIn: false,
  currentUser: null,
  portal: null, // Puede ser 'paciente', 'doctor', o 'admin'
  currentView: 'inicio', // La pantalla actual que ve el usuario
  // ...
};
```
**¿Por qué se usan estas variables?**
- `isLoggedIn` y `currentUser`: Previenen que alguien entre al sistema sin contraseña. En todas las funciones, el sistema lee `state.currentUser.id` para saber quién está pidiendo datos.
- `portal`: Define las reglas de seguridad. Si `state.portal === 'paciente'`, el sistema oculta inmediatamente el panel administrativo y los botones médicos.
- **Fuente única de verdad**: En lugar de guardar datos escondidos en el HTML, todo se guarda en este objeto en memoria. Es mucho más seguro y rápido.

### Renderizado Dinámico
Funciones como `renderPaciente(container)` y `renderDoctor(container)` usan **Template Literals** (las comillas invertidas `` ` ``).
- **¿Por qué?**: Permite escribir HTML de múltiples líneas y mezclarlo directamente con variables de JavaScript (ej. `<h2>Bienvenido ${state.currentUser.nombre}</h2>`). Es el mismo principio que usa React por debajo, pero sin necesidad de librerías extra.

### Manejo de la API de manera Asíncrona
Se crearon funciones envoltorio (`api`, `apiPost`) que utilizan `fetch` y `async/await`.
- **¿Por qué `async/await`?**: Para que el código no se bloquee mientras espera que el servidor de Python responda. La interfaz de usuario sigue funcionando y mostrando animaciones mientras carga la información de fondo.

---

## 5. Lógica del Servidor: Python y Flask (`app.py`)

El servidor actúa estrictamente como una API REST. Solo sirve la aplicación HTML principal y luego envía o recibe datos en formato JSON. Se migró recientemente a Python para mayor robustez en ciencia de datos y analítica en el futuro.

### Variables del Servidor
```python
from flask import Flask, request, jsonify, send_from_directory
import mysql.connector
```
- **`Flask`**: El framework utilizado para crear el servidor web y manejar las rutas (`@app.route`).
- **`mysql.connector`**: La librería oficial para establecer conexión con MySQL y ejecutar consultas.

### Función de Conexión a Base de Datos (`query_db`)
Se creó una función reutilizable `query_db(sql, params)`:
- **¿Por qué se usó esta función centralizada?**: Para evitar escribir el código de apertura y cierre de la conexión (`conn.close()`) en las más de 20 rutas diferentes. También maneja automáticamente la inyección de parámetros (`%s`) para evitar ataques de inyección SQL.

### Servir Archivos Estáticos
```python
app = Flask(__name__, static_folder='public')
```
- **¿Por qué se usó esta configuración?**: Le dice a Python que cualquier archivo HTML, CSS o imagen que se solicite, debe buscarlo dentro de la carpeta `public`.

---

## 6. Base de Datos: MySQL y SQL

La base de datos se normalizó para asegurar la integridad de la clínica médica.

### Uso de Claves Foráneas (Foreign Keys)
Variables y tablas como `citas` no guardan el nombre del paciente, sino su `id_paciente`.
```sql
id_paciente INT,
FOREIGN KEY (id_paciente) REFERENCES pacientes(id)
```
- **¿Por qué?**: Si un paciente se casa y cambia su apellido, el apellido se actualiza en un solo lugar (la tabla `pacientes`). Todas las `citas` mostrarán automáticamente el nuevo nombre gracias a que están vinculadas por el `ID`.

### Campos de Auditoría
- **`created_at` (Timestamp)**: Toda tabla incluye un `created_at DEFAULT CURRENT_TIMESTAMP`. Esto se usó porque los administradores necesitan saber exactamente qué día y a qué hora se registró un nuevo médico para aprobar su cuenta.

### Roles y Seguridad
No existe una tabla "usuarios" genérica. Los datos médicos de los pacientes son distintos a los de los doctores.
- Se separaron en tablas físicas (`pacientes`, `doctores`, `administradores`). Esto facilita la seguridad SQL; es matemáticamente imposible que un paciente inicie sesión en el portal de doctores porque la base de datos consulta tablas físicamente distintas.
