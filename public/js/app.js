/* ═══════════════════════════════════════════════════════════
   CLÍNICA JORDAN - SPA Application v2
   Con Login/Registro, Sidebar, Notificaciones, Consulta Mejorada
   ═══════════════════════════════════════════════════════════ */

// ── State ──────────────────────────────────────────────────
const state = {
  isLoggedIn: false,
  portal: null,       // 'paciente' | 'doctor'
  currentUser: null,   // user object from login
  currentView: 'inicio',
  // Wizard
  wizard: { step: 1, doctorId: null, date: null, time: null, motivo: '' },
  calendarMonth: new Date().getMonth(),
  calendarYear: new Date().getFullYear(),
  // Cache
  doctores: [],
  especialidades: [],
  notifications: [],
};

// ICD-10 codes (simplified list)
const ICD10_CODES = [
  'I10 - Hipertensión esencial (primaria)',
  'E11 - Diabetes mellitus tipo 2',
  'E12 - Diabetes mellitus tipo 2',
  'E13 - Banoide murao',
  'B14 - Hipertensión esencial (primaria)',
  'B15 - Hipertensión esencial (primaria)',
  'B21 - Dincess mellitus',
  'D21 - Dincess mellitus',
  'J06 - Infecciones agudas de vías respiratorias',
  'J20 - Bronquitis aguda',
  'M54 - Dorsalgia',
  'R51 - Cefalea',
  'K29 - Gastritis y duodenitis',
  'N39 - Infección de vías urinarias',
  'J45 - Asma',
  'L50 - Urticaria',
  'G43 - Migraña',
  'F41 - Trastornos de ansiedad',
  'R10 - Dolor abdominal',
  'J02 - Faringitis aguda',
];

// ── API Helpers ────────────────────────────────────────────
async function api(endpoint) {
  try {
    const res = await fetch(`/api/${endpoint}`);
    if (!res.ok) throw new Error(`Error ${res.status}`);
    return await res.json();
  } catch (err) { console.error('API:', err); showToast('Error de conexión', 'error'); return null; }
}

async function apiPost(endpoint, data) {
  try {
    const res = await fetch(`/api/${endpoint}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
    return json;
  } catch (err) { console.error('API:', err); showToast(err.message, 'error'); return null; }
}

async function apiPut(endpoint, data) {
  try {
    const res = await fetch(`/api/${endpoint}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    return await res.json();
  } catch (err) { console.error('API:', err); showToast('Error al actualizar', 'error'); return null; }
}

async function apiDelete(endpoint) {
  try {
    const res = await fetch(`/api/${endpoint}`, { method:'DELETE' });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    return await res.json();
  } catch (err) { console.error('API:', err); return null; }
}

// ── Toast ──────────────────────────────────────────────────
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const icons = { success:'fa-circle-check', error:'fa-circle-xmark', warning:'fa-triangle-exclamation' };
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<i class="fa-solid ${icons[type]} toast__icon"></i><span class="toast__message">${message}</span><button class="toast__close" onclick="this.parentElement.remove()">&times;</button>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ── Modal ──────────────────────────────────────────────────
function openModal(title, bodyHTML) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHTML;
  document.getElementById('modalOverlay').classList.add('open');
}
function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });

// ═══════════════════════════════════════════════════════════
// AUTH: LOGIN / REGISTER
// ═══════════════════════════════════════════════════════════
function renderAuthScreen() {
  const authScreen = document.getElementById('authScreen');
  authScreen.className = 'auth-split-layout row g-0 w-100';
  authScreen.style.display = 'flex';
  document.getElementById('appShell').style.display = 'none';
  renderLoginForm();
}

function renderLoginForm() {
  const container = document.getElementById('authScreen');
  container.innerHTML = `
    <div class="col-md-5 col-lg-6 d-none d-md-block auth-split-bg"></div>
    <div class="col-12 col-md-7 col-lg-6 auth-split-form-container">
      <div style="max-width: 400px; width: 100%; margin: 0 auto;">
        <h2 class="auth-split-title">Sign In</h2>
        <div class="auth-error" id="authError"></div>
        
        <div class="role-selection mb-4">
          <div class="role-card active" data-role="paciente" id="rolePatient">
            <i class="fa-solid fa-user"></i>
            <span>Paciente</span>
          </div>
          <div class="role-card" data-role="doctor" id="roleDoctor">
            <i class="fa-solid fa-user-doctor"></i>
            <span>Doctor</span>
          </div>
          <div class="role-card" data-role="admin" id="roleAdmin">
            <i class="fa-solid fa-shield-halved"></i>
            <span>Admin</span>
          </div>
        </div>

        <form id="loginForm">
          <div class="form-group position-relative mb-4">
            <label class="auth-material-label">Email</label>
            <input type="email" class="form-control auth-material-input" id="loginEmail" placeholder="tucorreo@ejemplo.com" required>
            <i class="fa-solid fa-check auth-check-icon d-none" id="loginEmailCheck"></i>
          </div>
          <div class="form-group position-relative mb-4">
            <label class="auth-material-label">Password</label>
            <input type="password" class="form-control auth-material-input" id="loginPassword" placeholder="••••••••" required>
          </div>
          
          <div class="d-flex align-items-center mt-5">
            <button type="submit" class="auth-btn-gradient">
              Sign In
            </button>
            <a href="#" id="goToRegister" class="auth-link">Sign up &rarr;</a>
          </div>
        </form>
        <p class="mt-4 text-muted" style="font-size:0.75rem;">Demo: usa correo de los datos de ejemplo, contraseña: 123456</p>
      </div>
    </div>
  `;

  let selectedRole = 'paciente';
  
  document.querySelectorAll('.role-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.role-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedRole = card.dataset.role;
    });
  });

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const correo = document.getElementById('loginEmail').value;
    const contrasena = document.getElementById('loginPassword').value;
    
    const result = await apiPost('login', { correo, contrasena, tipo: selectedRole });
    if (result && result.usuario) {
      state.isLoggedIn = true;
      state.portal = result.tipo;
      state.currentUser = result.usuario;
      enterApp();
    } else {
      const errEl = document.getElementById('authError');
      errEl.textContent = result?.error || 'Correo o contraseña incorrectos';
      errEl.classList.add('show');
    }
  });

  document.getElementById('goToRegister').addEventListener('click', (e) => {
    e.preventDefault();
    renderRegisterForm();
  });
}

async function renderRegisterForm() {
  const especialidades = await api('especialidades');
  const hospitales = await api('hospitales');
  
  const container = document.getElementById('authScreen');
  container.innerHTML = `
    <div class="col-md-5 col-lg-6 d-none d-md-block auth-split-bg"></div>
    <div class="col-12 col-md-7 col-lg-6 auth-split-form-container" style="padding-top:2rem; padding-bottom:2rem; overflow-y:auto;">
      <div style="max-width: 400px; width: 100%; margin: 0 auto;">
        <h2 class="auth-split-title">Sign Up</h2>
        <div class="auth-error" id="authError"></div>
        <div class="role-selection mb-4">
          <div class="role-card active" data-role="paciente" id="rolePatient">
            <i class="fa-solid fa-user"></i>
            <span>Paciente</span>
          </div>
          <div class="role-card" data-role="doctor" id="roleDoctor">
            <i class="fa-solid fa-user-doctor"></i>
            <span>Doctor</span>
          </div>
        </div>
        
        <form id="registerForm">
          <div class="row">
            <div class="col-6 mb-3 position-relative">
              <label class="auth-material-label">Nombre</label>
              <input type="text" class="form-control auth-material-input" id="regNombre" required>
            </div>
            <div class="col-6 mb-3 position-relative">
              <label class="auth-material-label">Apellido</label>
              <input type="text" class="form-control auth-material-input" id="regApellido" required>
            </div>
          </div>
          <div class="mb-3 position-relative">
            <label class="auth-material-label">Email</label>
            <input type="email" class="form-control auth-material-input" id="regEmail" required>
          </div>
          <div class="row">
            <div class="col-6 mb-3 position-relative">
              <label class="auth-material-label">Teléfono</label>
              <input type="tel" class="form-control auth-material-input" id="regTelefono" required>
            </div>
            <div class="col-6 mb-3 position-relative">
              <label class="auth-material-label">Password</label>
              <input type="password" class="form-control auth-material-input" id="regPassword" minlength="6" required>
            </div>
          </div>

          <!-- Patient-only fields -->
          <div id="patientFields">
            <div class="row">
              <div class="col-6 mb-3 position-relative">
                <label class="auth-material-label">F. Nacimiento</label>
                <input type="date" class="form-control auth-material-input" id="regFechaNac">
              </div>
              <div class="col-6 mb-3 position-relative">
                <label class="auth-material-label">Género</label>
                <select class="form-control auth-material-input" id="regGenero">
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>
            <div class="mb-3 position-relative">
              <label class="auth-material-label">Dirección</label>
              <input type="text" class="form-control auth-material-input" id="regDireccion">
            </div>
          </div>

          <!-- Doctor-only fields -->
          <div id="doctorFields" style="display:none">
            <div class="mb-3 position-relative">
              <label class="auth-material-label">Especialidad</label>
              <select class="form-control auth-material-input" id="regEspecialidad">
                ${(especialidades || []).map(e => `<option value="${e.id}">${e.nombre}</option>`).join('')}
              </select>
            </div>
            <div class="mb-3 position-relative">
              <label class="auth-material-label">Hospital</label>
              <select class="form-control auth-material-input" id="regHospital">
                ${(hospitales || []).map(h => `<option value="${h.id}">${h.nombre}</option>`).join('')}
              </select>
            </div>
          </div>
          
          <div class="form-check mt-3 mb-4">
            <input class="form-check-input" type="checkbox" id="termsCheck" required>
            <label class="form-check-label text-muted" for="termsCheck" style="font-size:0.8rem">
              I agree to the <strong>Terms of User</strong>
            </label>
          </div>

          <div class="d-flex align-items-center mt-3">
            <button type="submit" class="auth-btn-gradient">
              Sign Up
            </button>
            <a href="#" id="goToLogin" class="auth-link">Sign in &rarr;</a>
          </div>
        </form>
      </div>
    </div>
  `;

  let selectedRole = 'paciente';

  document.querySelectorAll('.role-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.role-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedRole = card.dataset.role;
      document.getElementById('patientFields').style.display = selectedRole === 'paciente' ? '' : 'none';
      document.getElementById('doctorFields').style.display = selectedRole === 'doctor' ? '' : 'none';
    });
  });

  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const base = {
      nombre: document.getElementById('regNombre').value,
      apellido: document.getElementById('regApellido').value,
      correo: document.getElementById('regEmail').value,
      telefono: document.getElementById('regTelefono').value,
      contrasena: document.getElementById('regPassword').value,
    };

    let result;
    if (selectedRole === 'paciente') {
      result = await apiPost('registro/paciente', {
        ...base,
        fecha_nacimiento: document.getElementById('regFechaNac').value || '2000-01-01',
        genero: document.getElementById('regGenero').value,
        direccion: document.getElementById('regDireccion').value,
      });
    } else {
      result = await apiPost('registro/doctor', {
        ...base,
        id_especialidad: document.getElementById('regEspecialidad').value,
        id_hospital: document.getElementById('regHospital').value,
      });
    }

    if (result && (result.message || result.usuario)) {
      showToast('¡Cuenta creada! Pendiente de aprobación por el administrador.', 'success');
      setTimeout(() => {
        renderLoginForm();
      }, 2500);
    } else {
      const errEl = document.getElementById('authError');
      errEl.textContent = result?.error || 'Error al crear la cuenta';
      errEl.classList.add('show');
    }
  });

  document.getElementById('goToLogin').addEventListener('click', (e) => {
    e.preventDefault();
    renderLoginForm();
  });
}

// ═══════════════════════════════════════════════════════════
// APP ENTRY
// ═══════════════════════════════════════════════════════════
function enterApp() {
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('appShell').style.display = '';
  
  setupLayout();
  setupNavigation();
  loadNotifications();
  
  state.currentView = state.portal === 'paciente' ? 'inicio' : (state.portal === 'admin' ? 'admin' : 'doctor');
  renderCurrentView();
}

function setupLayout() {
  const header = document.getElementById('mainHeader');
  const main = document.getElementById('mainContent');
  const sidebar = document.getElementById('sidebar');

  if (state.portal === 'paciente') {
    // Patient: sidebar layout
    sidebar.classList.remove('hidden');
    header.classList.add('with-sidebar');
    main.classList.add('with-sidebar');
    header.querySelector('.header__brand').style.display = 'none';
    
    // Sidebar user info
    document.getElementById('sidebarUser').innerHTML = `
      <div class="sidebar__user-info">
        <div class="sidebar__user-avatar"><i class="fa-solid fa-user"></i></div>
        <div>
          <div class="sidebar__user-name">${state.currentUser.nombre} ${state.currentUser.apellido}</div>
          <div class="sidebar__user-role">Paciente</div>
        </div>
      </div>
      <button class="sidebar__logout" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión</button>
    `;
  } else if (state.portal === 'doctor') {
    // Doctor: top nav layout
    sidebar.classList.add('hidden');
    header.classList.remove('with-sidebar');
    main.classList.remove('with-sidebar');
    header.querySelector('.header__brand').style.display = 'flex';
  } else {
    // Admin: top nav layout
    sidebar.classList.add('hidden');
    header.classList.remove('with-sidebar');
    main.classList.remove('with-sidebar');
    header.querySelector('.header__brand').style.display = 'flex';
  }

  document.getElementById('currentUserName').textContent = 
    state.portal === 'doctor' 
      ? `Dr. ${state.currentUser.nombre} ${state.currentUser.apellido}` 
      : (state.portal === 'admin' ? state.currentUser.nombre : `${state.currentUser.nombre} ${state.currentUser.apellido}`);
}

function setupNavigation() {
  if (state.portal === 'paciente') {
    // Sidebar nav
    const sidebarNav = document.getElementById('sidebarNav');
    sidebarNav.innerHTML = `
      <div class="sidebar-link active" data-view="inicio"><i class="fa-solid fa-house"></i> Inicio</div>
      <div class="sidebar-link" data-view="agendar"><i class="fa-solid fa-calendar-plus"></i> Citas</div>
      <div class="sidebar-link" data-view="historial"><i class="fa-solid fa-clock-rotate-left"></i> Historial</div>
      <div class="sidebar-link" data-view="notificaciones"><i class="fa-solid fa-bell"></i> Notificaciones</div>
    `;
    sidebarNav.querySelectorAll('.sidebar-link').forEach(link => {
      link.addEventListener('click', () => navigateTo(link.dataset.view));
    });
    
    // Hide top nav for patient (sidebar handles it)
    document.getElementById('mainNav').innerHTML = '';
  } else if (state.portal === 'doctor') {
    // Top nav for doctor
    const nav = document.getElementById('mainNav');
    nav.innerHTML = `
      <a href="#" class="nav-link active" data-view="doctor"><i class="fa-solid fa-chart-line"></i> Dashboard</a>
      <a href="#" class="nav-link" data-view="consulta"><i class="fa-solid fa-notes-medical"></i> Consulta</a>
      <a href="#" class="nav-link" data-view="horarios"><i class="fa-solid fa-calendar"></i> Horarios</a>
    `;
    nav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => { e.preventDefault(); navigateTo(link.dataset.view); });
    });
  } else if (state.portal === 'admin') {
    // Top nav for admin
    const nav = document.getElementById('mainNav');
    nav.innerHTML = `
      <a href="#" class="nav-link active" data-view="admin"><i class="fa-solid fa-shield-halved"></i> Aprobaciones</a>
    `;
    nav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => { e.preventDefault(); navigateTo(link.dataset.view); });
    });
  }
}

// ── Notifications ──────────────────────────────────────────
async function loadNotifications() {
  if (state.portal === 'admin') return; // admin no tiene notificaciones de sistema
  const notifs = await api(`notificaciones/${state.portal}/${state.currentUser.id}`);
  state.notifications = notifs || [];
  
  const unread = state.notifications.filter(n => !n.leida).length;
  const badge = document.getElementById('notifBadge');
  if (unread > 0) {
    badge.textContent = unread;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

document.getElementById('notifBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  const panel = document.getElementById('notifPanel');
  panel.classList.toggle('open');
  renderNotifPanel();
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.notif-panel') && !e.target.closest('.header__notif-btn')) {
    document.getElementById('notifPanel').classList.remove('open');
  }
});

document.getElementById('markAllRead').addEventListener('click', async () => {
  await apiPut(`notificaciones/leer-todas/${state.portal}/${state.currentUser.id}`, {});
  await loadNotifications();
  renderNotifPanel();
  showToast('Notificaciones marcadas como leídas');
});

function renderNotifPanel() {
  const list = document.getElementById('notifList');
  if (!state.notifications.length) {
    list.innerHTML = '<div class="empty-state" style="padding:24px"><p>Sin notificaciones</p></div>';
    return;
  }
  list.innerHTML = state.notifications.map(n => `
    <div class="notif-item ${n.leida ? '' : 'unread'}" onclick="markNotifRead(${n.id})">
      <div class="notif-item__title">${n.titulo}</div>
      <div class="notif-item__message">${n.mensaje || ''}</div>
      <div class="notif-item__time">${timeAgo(n.fecha_creacion)}</div>
    </div>
  `).join('');
}

async function markNotifRead(id) {
  await apiPut(`notificaciones/${id}/leer`, {});
  await loadNotifications();
  renderNotifPanel();
}

// ── Logout ─────────────────────────────────────────────────
function logout() {
  state.isLoggedIn = false;
  state.portal = null;
  state.currentUser = null;
  state.wizard = { step:1, doctorId:null, date:null, time:null, motivo:'' };
  closeModal();
  renderAuthScreen();
}

// ── User menu logout ───────────────────────────────────────
document.getElementById('userMenu').addEventListener('click', () => {
  const isDoctor = state.portal === 'doctor';
  const isAdmin = state.portal === 'admin';
  const nombre = state.currentUser.nombre || '';
  const apellido = state.currentUser.apellido || '';
  const nombreCompleto = isDoctor ? `Dr. ${nombre} ${apellido}`.trim() : `${nombre} ${apellido}`.trim();
  const icono = isDoctor ? 'user-doctor' : (isAdmin ? 'shield-halved' : 'user');
  const rol = isDoctor ? (state.currentUser.especialidad || 'Doctor') : (isAdmin ? 'Administrador' : 'Paciente');
  
  openModal('Mi Perfil', `
    <div style="text-align:center;padding:12px">
      <div style="width:64px;height:64px;background:var(--primary-100);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:1.8rem;color:var(--primary-500)">
        <i class="fa-solid fa-${icono}"></i>
      </div>
      <h3>${nombreCompleto}</h3>
      <p style="color:var(--gray-500);font-size:0.85rem">${state.currentUser.correo}</p>
      <p style="color:var(--teal-600);font-size:0.8rem;font-weight:600;margin-top:4px">
        ${rol}${state.currentUser.hospital ? ' · ' + state.currentUser.hospital : ''}
      </p>
      <button class="btn btn--danger btn--block" style="margin-top:20px" onclick="closeModal();logout()">
        <i class="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
      </button>
    </div>
  `);
});

// ── Router ─────────────────────────────────────────────────
function navigateTo(view) {
  state.currentView = view;
  
  // Update nav active states
  document.querySelectorAll('.nav-link, .sidebar-link').forEach(l => l.classList.remove('active'));
  const activeLink = document.querySelector(`.nav-link[data-view="${view}"], .sidebar-link[data-view="${view}"]`);
  if (activeLink) activeLink.classList.add('active');
  
  renderCurrentView();
}

function renderCurrentView() {
  const main = document.getElementById('mainContent');
  main.style.opacity = '0';
  setTimeout(() => {
    switch(state.currentView) {
      case 'inicio': renderInicio(main); break;
      case 'agendar': renderAgendar(main); break;
      case 'historial': renderHistorial(main); break;
      case 'notificaciones': renderNotificaciones(main); break;
      case 'doctor': renderDoctor(main); break;
      case 'consulta': renderConsulta(main); break;
      case 'horarios': renderHorarios(main); break;
      case 'admin': renderAdminDashboard(main); break;
      default: renderInicio(main);
    }
    main.style.opacity = '1';
    main.style.transition = 'opacity 0.25s ease';
  }, 150);
}

// ═══════════════════════════════════════════════════════════
// VIEW: INICIO PACIENTE
// ═══════════════════════════════════════════════════════════
async function renderInicio(container) {
  const p = state.currentUser;
  const citas = await api(`citas?paciente=${p.id}`);
  const stats = await api('stats');
  const prescripciones = await api(`prescripciones/paciente/${p.id}`);

  const today = new Date().toISOString().split('T')[0];
  const upcoming = citas?.filter(c => c.fecha_cita >= today && c.estado !== 'cancelada')
    .sort((a, b) => a.fecha_cita.localeCompare(b.fecha_cita))[0];

  container.innerHTML = `
    <div style="max-width:1100px;margin:0 auto;padding:10px;">
      <h1 style="font-size:1.5rem;font-weight:700;margin-bottom:20px;color:var(--gray-800)">Inicio</h1>

      ${upcoming ? `
      <div class="next-appointment-card">
        <div class="next-appt__badge"><i class="fa-solid fa-bell"></i> Siguiente Cita</div>
        <div class="next-appt__content">
          <div class="next-appt__doctor">
            <div class="next-appt__avatar"><i class="fa-solid fa-user-doctor"></i></div>
            <div class="next-appt__info">
              <h3>Dr. ${upcoming.doctor_nombre}</h3>
              <p>${upcoming.especialidad}</p>
              <p class="appt-date"><i class="fa-solid fa-calendar"></i> Fecha: ${formatDate(upcoming.fecha_cita)}</p>
              <p class="appt-time"><i class="fa-solid fa-clock"></i> Hora: ${formatTime(upcoming.hora_cita)}</p>
            </div>
          </div>
          <div class="next-appt__details">
            <div class="status-badge">${capitalizeStatus(upcoming.estado)}</div>
            <p>${upcoming.hospital_nombre}</p>
          </div>
        </div>
        <div class="next-appt__actions">
          <button class="dash-btn-teal" onclick="showCitaDetail(${upcoming.id})"><i class="fa-solid fa-eye"></i> Ver Detalles de la Cita</button>
        </div>
      </div>
      ` : `
      <div class="card" style="margin-bottom:20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border-radius:12px;">
        <div class="card__body dash-empty-state" style="padding:60px 20px;">
          <div class="dash-empty-state__icon"><i class="fa-solid fa-calendar-xmark" style="color:#d1d5db; font-size:3.5rem;"></i></div>
          <h3 style="color:#4b5563; font-weight:500; font-size:1.1rem; margin:16px 0 24px;">No tienes citas programadas</h3>
          <button class="dash-btn-teal" onclick="navigateTo('agendar')">
            <i class="fa-solid fa-calendar-plus"></i> Agendar Nueva Cita
          </button>
        </div>
      </div>
      `}

      <div style="display:flex;justify-content:flex-end;margin-bottom:20px">
        <button class="dash-btn-teal" onclick="navigateTo('agendar')">
          <i class="fa-solid fa-calendar-plus"></i> Agendar Nueva Cita
        </button>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
        <div class="card" style="box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border-radius:12px;">
          <div class="card__header" style="border-bottom:none; padding-bottom:0;">
            <h3 style="font-size:1rem;"><i class="fa-solid fa-flask-vial"></i> Resultados Recientes</h3>
          </div>
          <div class="card__body" style="border-top:1px solid #f3f4f6; margin-top:16px; min-height: 120px;">
            ${citas?.filter(c => c.estado === 'completada').slice(0, 3).map(c => `
              <div class="quick-link" onclick="showCitaDetail(${c.id})">
                <i class="fa-solid fa-file-medical"></i>
                <span>${c.motivo_consulta || 'Consulta'} - ${formatDateShort(c.fecha_cita)}</span>
              </div>
            `).join('') || '<p style="color:var(--gray-400);font-size:0.9rem;padding:8px 0;">Sin resultados recientes</p>'}
          </div>
        </div>
        <div class="card" style="box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border-radius:12px;">
          <div class="card__header" style="border-bottom:none; padding-bottom:0;">
            <h3 style="font-size:1rem;"><i class="fa-solid fa-pills"></i> Prescripciones</h3>
          </div>
          <div class="card__body" style="border-top:1px solid #f3f4f6; margin-top:16px; min-height: 120px;">
            ${prescripciones?.slice(0, 4).map(p => `
              <div class="quick-link">
                <i class="fa-solid fa-capsules"></i>
                <span>${p.medicamento}</span>
                <span style="margin-left:auto;font-size:0.75rem;color:var(--gray-400)">${p.dosis}</span>
              </div>
            `).join('') || '<p style="color:var(--gray-400);font-size:0.9rem;padding:8px 0;">Sin prescripciones</p>'}
          </div>
        </div>
      </div>
    </div>
  `;
}

function showCitaDetail(citaId) {
  fetch('/api/citas').then(r => r.json()).then(citas => {
    const c = citas.find(ci => ci.id === citaId);
    if (!c) return;
    openModal('Detalle de Cita', `
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="summary-item"><span class="summary-item__label">Doctor</span><span class="summary-item__value">Dr. ${c.doctor_nombre}</span></div>
        <div class="summary-item"><span class="summary-item__label">Especialidad</span><span class="summary-item__value">${c.especialidad}</span></div>
        <div class="summary-item"><span class="summary-item__label">Hospital</span><span class="summary-item__value">${c.hospital_nombre}</span></div>
        <div class="summary-item"><span class="summary-item__label">Fecha</span><span class="summary-item__value">${formatDate(c.fecha_cita)}</span></div>
        <div class="summary-item"><span class="summary-item__label">Hora</span><span class="summary-item__value">${formatTime(c.hora_cita)}</span></div>
        <div class="summary-item"><span class="summary-item__label">Motivo</span><span class="summary-item__value">${c.motivo_consulta || 'No especificado'}</span></div>
        ${c.diagnostico ? `<div class="summary-item"><span class="summary-item__label">Diagnóstico</span><span class="summary-item__value">${c.diagnostico}</span></div>` : ''}
        <div class="summary-item"><span class="summary-item__label">Estado</span><span class="badge badge--${c.estado}">${capitalizeStatus(c.estado)}</span></div>
        ${c.estado === 'pendiente' ? `<button class="btn btn--danger btn--block" onclick="cancelarCita(${c.id})" style="margin-top:12px"><i class="fa-solid fa-xmark"></i> Cancelar Cita</button>` : ''}
      </div>
    `);
  });
}

async function cancelarCita(id) {
  const result = await apiPut(`citas/${id}`, { estado: 'cancelada' });
  if (result) { showToast('Cita cancelada', 'warning'); closeModal(); renderCurrentView(); }
}

// ═══════════════════════════════════════════════════════════
// VIEW: AGENDAR CITA (same wizard as before)
// ═══════════════════════════════════════════════════════════
async function renderAgendar(container) {
  const especialidades = await api('especialidades');
  const doctores = await api('doctores');
  state.especialidades = especialidades || [];
  state.doctores = doctores || [];

  container.innerHTML = `
    <div style="max-width:1100px;margin:0 auto">
      <h1 style="font-size:1.5rem;font-weight:700;margin-bottom:24px"><i class="fa-solid fa-calendar-plus"></i> Agendar Nueva Cita</h1>
      <div class="wizard-steps">
        <div class="wizard-step ${state.wizard.step >= 1 ? (state.wizard.step > 1 ? 'completed' : 'active') : ''}" data-step="1"><span class="wizard-step__number">1</span> Seleccionar Doctor</div>
        <div class="wizard-step ${state.wizard.step >= 2 ? (state.wizard.step > 2 ? 'completed' : 'active') : ''}" data-step="2"><span class="wizard-step__number">2</span> Fecha y Hora</div>
        <div class="wizard-step ${state.wizard.step >= 3 ? 'active' : ''}" data-step="3"><span class="wizard-step__number">3</span> Confirmación</div>
      </div>
      <div id="wizardContent"></div>
    </div>
  `;
  renderWizardStep();
}

function renderWizardStep() {
  const wc = document.getElementById('wizardContent');
  if (!wc) return;
  switch(state.wizard.step) {
    case 1: renderWizardStep1(wc); break;
    case 2: renderWizardStep2(wc); break;
    case 3: renderWizardStep3(wc); break;
  }
}

function renderWizardStep1(container) {
  container.innerHTML = `
    <div class="filter-bar">
      <label class="form-label" style="margin:0;white-space:nowrap">Filtrar por especialidad:</label>
      <select class="form-select" id="filterEspecialidad">
        <option value="">Todas las especialidades</option>
        ${state.especialidades.map(e => `<option value="${e.id}">${e.nombre}</option>`).join('')}
      </select>
    </div>
    <div class="doctors-grid" id="doctorsGrid">${renderDoctorCards(state.doctores)}</div>
  `;
  document.getElementById('filterEspecialidad').addEventListener('change', (e) => {
    const filtered = e.target.value ? state.doctores.filter(d => d.id_especialidad == e.target.value) : state.doctores;
    document.getElementById('doctorsGrid').innerHTML = renderDoctorCards(filtered);
    attachDoctorCardEvents();
  });
  attachDoctorCardEvents();
}

function renderDoctorCards(doctores) {
  if (!doctores.length) return '<div class="empty-state"><h3>No hay doctores disponibles</h3></div>';
  return doctores.map(d => `
    <div class="doctor-card ${state.wizard.doctorId === d.id ? 'selected' : ''}" data-id="${d.id}">
      <div class="doctor-card__avatar"><i class="fa-solid fa-user-doctor"></i></div>
      <div class="doctor-card__info">
        <h4>Dr. ${d.nombre} ${d.apellido}</h4>
        <p>${d.especialidad}</p>
        <p style="color:var(--gray-400);font-size:0.7rem">${d.hospital}</p>
      </div>
      <div class="doctor-card__actions">
        <span class="badge badge--available"><i class="fa-solid fa-circle" style="font-size:6px"></i> Disponible</span>
        <button class="btn btn--primary btn--sm">Elegir</button>
      </div>
    </div>
  `).join('');
}

function attachDoctorCardEvents() {
  document.querySelectorAll('.doctor-card').forEach(card => {
    card.addEventListener('click', () => {
      state.wizard.doctorId = parseInt(card.dataset.id);
      state.wizard.step = 2;
      renderAgendar(document.getElementById('mainContent'));
    });
  });
}

async function renderWizardStep2(container) {
  const doctor = state.doctores.find(d => d.id === state.wizard.doctorId);
  const horarios = await api(`doctores/${state.wizard.doctorId}/horarios`);

  container.innerHTML = `
    <div class="wizard-body">
      <div>
        <div class="calendar-widget" id="calendarWidget">${renderCalendar(horarios)}</div>
        <div class="time-slots" id="timeSlotsContainer">
          <h4>Selecciona un horario</h4>
          <p style="color:var(--gray-400);font-size:0.85rem">Primero selecciona una fecha en el calendario</p>
        </div>
      </div>
      <div class="appointment-summary">
        <h3><i class="fa-solid fa-clipboard-list"></i> Resumen de Cita</h3>
        <div class="summary-item"><span class="summary-item__label">Doctor</span><span class="summary-item__value">Dr. ${doctor?.nombre} ${doctor?.apellido}</span></div>
        <div class="summary-item"><span class="summary-item__label">Especialidad</span><span class="summary-item__value">${doctor?.especialidad||''}</span></div>
        <div class="summary-item"><span class="summary-item__label">Hospital</span><span class="summary-item__value">${doctor?.hospital||''}</span></div>
        <div class="summary-item"><span class="summary-item__label">Fecha</span><span class="summary-item__value" id="summaryDate">${state.wizard.date ? formatDate(state.wizard.date) : 'Por seleccionar'}</span></div>
        <div class="summary-item"><span class="summary-item__label">Hora</span><span class="summary-item__value" id="summaryTime">${state.wizard.time || 'Por seleccionar'}</span></div>
        <div class="form-group" style="margin-top:16px">
          <label class="form-label">Motivo de consulta</label>
          <textarea class="form-textarea" id="motivoConsulta" placeholder="Describe brevemente el motivo..." rows="3">${state.wizard.motivo}</textarea>
        </div>
        <div style="display:flex;gap:8px;margin-top:16px">
          <button class="btn btn--outline" onclick="state.wizard.step=1;renderAgendar(document.getElementById('mainContent'))"><i class="fa-solid fa-arrow-left"></i> Atrás</button>
          <button class="btn btn--primary" style="flex:1" id="btnConfirmar" ${!state.wizard.date||!state.wizard.time?'disabled style="opacity:0.5;pointer-events:none;flex:1"':'style="flex:1"'}>Confirmar <i class="fa-solid fa-arrow-right"></i></button>
        </div>
      </div>
    </div>
  `;
  attachCalendarEvents(horarios);
  document.getElementById('btnConfirmar')?.addEventListener('click', () => {
    state.wizard.motivo = document.getElementById('motivoConsulta')?.value || '';
    state.wizard.step = 3;
    renderAgendar(document.getElementById('mainContent'));
  });
}

function renderCalendar(horarios) {
  const year=state.calendarYear,month=state.calendarMonth;
  const today=new Date(),firstDay=new Date(year,month,1),lastDay=new Date(year,month+1,0);
  const startDay=firstDay.getDay();
  const monthNames=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const dayNames=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const diaMap={'Lunes':1,'Martes':2,'Miércoles':3,'Jueves':4,'Viernes':5,'Sábado':6,'Domingo':0};
  const availableDays=new Set();
  horarios?.forEach(h=>{if(diaMap[h.dia_semana]!==undefined)availableDays.add(diaMap[h.dia_semana])});
  let html=dayNames.map(d=>`<div class="calendar__day-name">${d}</div>`).join('');
  const prevLast=new Date(year,month,0).getDate();
  for(let i=startDay-1;i>=0;i--)html+=`<div class="calendar__day calendar__day--other-month">${prevLast-i}</div>`;
  for(let day=1;day<=lastDay.getDate();day++){
    const date=new Date(year,month,day),dow=date.getDay();
    const ds=`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const isToday=date.toDateString()===today.toDateString();
    const isPast=date<new Date(today.getFullYear(),today.getMonth(),today.getDate());
    const isAvail=availableDays.has(dow)&&!isPast;
    const isSel=state.wizard.date===ds;
    let cls='calendar__day';
    if(isToday)cls+=' calendar__day--today';if(isSel)cls+=' calendar__day--selected';if(!isAvail)cls+=' calendar__day--disabled';
    html+=`<div class="${cls}" data-date="${ds}">${day}</div>`;
  }
  const total=startDay+lastDay.getDate(),rem=7-(total%7);
  if(rem<7)for(let i=1;i<=rem;i++)html+=`<div class="calendar__day calendar__day--other-month">${i}</div>`;
  return `<div class="calendar__header"><button id="calPrev"><i class="fa-solid fa-chevron-left"></i></button><h4>${monthNames[month]} ${year}</h4><button id="calNext"><i class="fa-solid fa-chevron-right"></i></button></div><div class="calendar__grid">${html}</div>`;
}

function attachCalendarEvents(horarios) {
  document.getElementById('calPrev')?.addEventListener('click',()=>{state.calendarMonth--;if(state.calendarMonth<0){state.calendarMonth=11;state.calendarYear--}document.getElementById('calendarWidget').innerHTML=renderCalendar(horarios);attachCalendarEvents(horarios)});
  document.getElementById('calNext')?.addEventListener('click',()=>{state.calendarMonth++;if(state.calendarMonth>11){state.calendarMonth=0;state.calendarYear++}document.getElementById('calendarWidget').innerHTML=renderCalendar(horarios);attachCalendarEvents(horarios)});
  document.querySelectorAll('.calendar__day:not(.calendar__day--disabled):not(.calendar__day--other-month)').forEach(day=>{
    day.addEventListener('click',()=>{
      const ds=day.dataset.date;if(!ds)return;
      state.wizard.date=ds;state.wizard.time=null;
      document.querySelectorAll('.calendar__day').forEach(d=>d.classList.remove('calendar__day--selected'));
      day.classList.add('calendar__day--selected');
      const sd=document.getElementById('summaryDate');if(sd)sd.textContent=formatDate(ds);
      const dow=new Date(ds).getDay();
      const dayNameMap={0:'Domingo',1:'Lunes',2:'Martes',3:'Miércoles',4:'Jueves',5:'Viernes',6:'Sábado'};
      renderTimeSlots(horarios?.filter(h=>h.dia_semana===dayNameMap[dow])||[]);
    });
  });
}

function renderTimeSlots(horarios) {
  const container=document.getElementById('timeSlotsContainer');
  if(!container||!horarios.length){if(container)container.innerHTML='<h4>No hay horarios para esta fecha</h4>';return;}
  const slots=[];
  horarios.forEach(h=>{const[sH,sM]=h.hora_inicio.split(':').map(Number);const[eH,eM]=h.hora_fin.split(':').map(Number);let cH=sH,cM=sM;while(cH<eH||(cH===eH&&cM<eM)){slots.push(`${String(cH).padStart(2,'0')}:${String(cM).padStart(2,'0')}`);cM+=30;if(cM>=60){cH++;cM=0}}});
  container.innerHTML=`<h4 style="margin-top:16px">Horarios disponibles</h4><div class="time-slots__grid">${slots.map(s=>`<div class="time-slot ${state.wizard.time===s?'selected':''}" data-time="${s}">${formatTimeSlot(s)}</div>`).join('')}</div>`;
  container.querySelectorAll('.time-slot').forEach(slot=>{
    slot.addEventListener('click',()=>{
      state.wizard.time=slot.dataset.time;
      container.querySelectorAll('.time-slot').forEach(s=>s.classList.remove('selected'));
      slot.classList.add('selected');
      const st=document.getElementById('summaryTime');if(st)st.textContent=formatTimeSlot(slot.dataset.time);
      const btn=document.getElementById('btnConfirmar');if(btn){btn.style.opacity='1';btn.style.pointerEvents='auto';btn.disabled=false}
    });
  });
}

async function renderWizardStep3(container) {
  const doctor=state.doctores.find(d=>d.id===state.wizard.doctorId);
  container.innerHTML=`
    <div style="max-width:600px;margin:0 auto">
      <div class="card card--elevated"><div class="card__body">
        <div class="confirmation-view"><div class="confirmation-icon"><i class="fa-solid fa-calendar-check"></i></div><h2>Confirmar tu Cita</h2><p>Revisa los detalles antes de confirmar</p></div>
        <div style="padding:0 20px 20px;display:flex;flex-direction:column;gap:8px">
          <div class="summary-item"><span class="summary-item__label">Paciente</span><span class="summary-item__value">${state.currentUser.nombre} ${state.currentUser.apellido}</span></div>
          <div class="summary-item"><span class="summary-item__label">Doctor</span><span class="summary-item__value">Dr. ${doctor?.nombre} ${doctor?.apellido}</span></div>
          <div class="summary-item"><span class="summary-item__label">Especialidad</span><span class="summary-item__value">${doctor?.especialidad}</span></div>
          <div class="summary-item"><span class="summary-item__label">Hospital</span><span class="summary-item__value">${doctor?.hospital}</span></div>
          <div class="summary-item"><span class="summary-item__label">Fecha</span><span class="summary-item__value">${formatDate(state.wizard.date)}</span></div>
          <div class="summary-item"><span class="summary-item__label">Hora</span><span class="summary-item__value">${formatTimeSlot(state.wizard.time)}</span></div>
          <div class="summary-item"><span class="summary-item__label">Motivo</span><span class="summary-item__value">${state.wizard.motivo||'No especificado'}</span></div>
        </div>
        <div style="padding:0 20px 20px;display:flex;gap:8px">
          <button class="btn btn--outline" onclick="state.wizard.step=2;renderAgendar(document.getElementById('mainContent'))"><i class="fa-solid fa-arrow-left"></i> Modificar</button>
          <button class="btn btn--primary btn--lg" style="flex:1" id="btnCrearCita"><i class="fa-solid fa-check"></i> Confirmar Cita</button>
        </div>
      </div></div>
    </div>`;
  document.getElementById('btnCrearCita').addEventListener('click',async()=>{
    const doctor=state.doctores.find(d=>d.id===state.wizard.doctorId);
    const result=await apiPost('citas',{id_paciente:state.currentUser.id,id_doctor:state.wizard.doctorId,id_hospital:doctor.id_hospital,fecha_cita:state.wizard.date,hora_cita:state.wizard.time+':00',motivo_consulta:state.wizard.motivo});
    if(result){
      showToast('¡Cita agendada exitosamente!','success');
      state.wizard={step:1,doctorId:null,date:null,time:null,motivo:''};
      loadNotifications();
      document.getElementById('wizardContent').innerHTML=`<div class="confirmation-view"><div class="confirmation-icon" style="background:#dcfce7"><i class="fa-solid fa-circle-check" style="color:#16a34a"></i></div><h2>¡Cita Agendada!</h2><p>Tu cita ha sido registrada exitosamente.</p><div style="display:flex;gap:12px;justify-content:center;margin-top:20px"><button class="btn btn--outline" onclick="navigateTo('inicio')"><i class="fa-solid fa-house"></i> Ir al Inicio</button><button class="btn btn--primary" onclick="state.wizard={step:1,doctorId:null,date:null,time:null,motivo:''};navigateTo('agendar')"><i class="fa-solid fa-plus"></i> Agendar Otra</button></div></div>`;
    }
  });
}

// ═══════════════════════════════════════════════════════════
// VIEW: HISTORIAL
// ═══════════════════════════════════════════════════════════
async function renderHistorial(container) {
  const citas = await api(`citas?paciente=${state.currentUser.id}`);
  container.innerHTML = `
    <div style="max-width:900px;margin:0 auto">
      <div class="view-historial__header">
        <div>
          <h1><i class="fa-solid fa-clock-rotate-left"></i> Historial Médico</h1>
          <p style="color:var(--gray-500);font-size:0.875rem">Paciente: ${state.currentUser.nombre} ${state.currentUser.apellido}</p>
        </div>
        <button class="btn btn--secondary"><i class="fa-solid fa-file-pdf"></i> Descargar PDF</button>
      </div>
      ${citas?.length ? `<div class="timeline">${citas.sort((a,b)=>b.fecha_cita.localeCompare(a.fecha_cita)).map(c=>`
        <div class="timeline-item">
          <div class="timeline-item__dot timeline-item__dot--${c.estado}"></div>
          <div class="timeline-item__date">${formatDate(c.fecha_cita)}</div>
          <div class="timeline-item__card">
            <h4>${c.diagnostico||c.motivo_consulta||'Consulta médica'}</h4>
            ${c.diagnostico?`<p><strong>Diagnóstico Primario:</strong> ${c.diagnostico}</p>`:''}
            <p><span class="doctor-name"><i class="fa-solid fa-user-doctor"></i> Dr. ${c.doctor_nombre}</span></p>
            ${c.notas?`<p><strong>Notas:</strong> ${c.notas}</p>`:''}
            <div style="margin-top:8px"><span class="badge badge--${c.estado}">${capitalizeStatus(c.estado)}</span></div>
          </div>
        </div>
      `).join('')}</div>` : `<div class="empty-state" style="margin-top:40px"><div class="empty-state__icon"><i class="fa-solid fa-folder-open"></i></div><h3>Sin historial médico</h3><p>Aún no tienes citas registradas.</p></div>`}
    </div>`;
}

// ═══════════════════════════════════════════════════════════
// VIEW: NOTIFICACIONES (Patient)
// ═══════════════════════════════════════════════════════════
async function renderNotificaciones(container) {
  await loadNotifications();
  container.innerHTML = `
    <div style="max-width:700px;margin:0 auto">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <h1 style="font-size:1.4rem;font-weight:700"><i class="fa-solid fa-bell"></i> Notificaciones</h1>
        <button class="btn btn--outline btn--sm" onclick="markAllNotifs()"><i class="fa-solid fa-check-double"></i> Marcar todas leídas</button>
      </div>
      ${state.notifications.length ? state.notifications.map(n => `
        <div class="card" style="margin-bottom:8px;${n.leida?'':'border-left:3px solid var(--primary-500)'}">
          <div class="card__body" style="padding:14px 20px;display:flex;gap:12px;align-items:flex-start">
            <div style="width:36px;height:36px;background:${n.leida?'var(--gray-100)':'var(--primary-100)'};border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <i class="fa-solid fa-bell" style="color:${n.leida?'var(--gray-400)':'var(--primary-500)'}"></i>
            </div>
            <div style="flex:1">
              <div style="font-weight:600;font-size:0.9rem;color:var(--gray-800)">${n.titulo}</div>
              <div style="font-size:0.8rem;color:var(--gray-500);margin-top:2px">${n.mensaje||''}</div>
              <div style="font-size:0.7rem;color:var(--gray-400);margin-top:4px">${timeAgo(n.fecha_creacion)}</div>
            </div>
          </div>
        </div>
      `).join('') : '<div class="empty-state"><div class="empty-state__icon"><i class="fa-solid fa-bell-slash"></i></div><h3>Sin notificaciones</h3></div>'}
    </div>`;
}

async function markAllNotifs() {
  await apiPut(`notificaciones/leer-todas/${state.portal}/${state.currentUser.id}`, {});
  await loadNotifications();
  renderNotificaciones(document.getElementById('mainContent'));
  showToast('Todas las notificaciones marcadas como leídas');
}

// ═══════════════════════════════════════════════════════════
// VIEW: DOCTOR DASHBOARD
// ═══════════════════════════════════════════════════════════
async function renderDoctor(container) {
  const doctor = state.currentUser;
  const citas = await api(`citas-doctor/${doctor.id}`);
  const today = new Date().toISOString().split('T')[0];
  const citasHoy = citas?.filter(c => c.fecha_cita.startsWith(today)) || [];
  
  const pendientes = citas?.filter(c => c.estado === 'pendiente') || [];
  const completadas = citas?.filter(c => c.estado === 'completada') || [];
  const canceladas = citas?.filter(c => c.estado === 'cancelada') || [];
  const pacientesUnicos = new Set(citas?.map(c => c.id_paciente)).size;

  container.innerHTML = `
    <div style="max-width:1200px;margin:0 auto;padding:10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
        <h1 style="font-size:1.5rem;font-weight:700;color:var(--gray-800)">Dashboard Médico</h1>
        <div class="status-toggle" style="background:var(--white); padding:8px 16px; border-radius:24px; box-shadow:var(--shadow-sm); border:1px solid var(--gray-200);">
          <div class="status-toggle__switch active" id="statusSwitch"></div>
          <span class="status-toggle__label" style="font-size:0.85rem; font-weight:600;">Disponible para consultas</span>
        </div>
      </div>

      <div class="dash-card-grid">
        <!-- Tarjeta 1 -->
        <div class="dash-stat-card">
          <div class="dash-stat-card__title">Total Citas</div>
          <div class="dash-stat-card__value">
            ${citas?.length || 0}
            <i class="fa-solid fa-users" style="margin-left:auto; color:#14b8a6;"></i>
          </div>
          <div class="dash-stat-card__progress-bar"><div class="dash-stat-card__progress-fill" style="width:100%;background:#14b8a6;"></div></div>
          <div class="dash-stat-card__subtitle">Historial completo</div>
        </div>
        
        <!-- Tarjeta 2 -->
        <div class="dash-stat-card">
          <div class="dash-stat-card__title">Citas Hoy</div>
          <div class="dash-stat-card__value">
            ${citasHoy.length}
            <i class="fa-solid fa-calendar-day" style="margin-left:auto; color:#3b82f6;"></i>
          </div>
          <div class="dash-stat-card__progress-bar"><div class="dash-stat-card__progress-fill" style="width:${Math.min(citasHoy.length * 10, 100)}%;background:#3b82f6;"></div></div>
          <div class="dash-stat-card__subtitle">${formatDate(today)}</div>
        </div>

        <!-- Tarjeta 3 -->
        <div class="dash-stat-card">
          <div class="dash-stat-card__title">Pacientes Únicos</div>
          <div class="dash-stat-card__value">
            ${pacientesUnicos}
            <i class="fa-solid fa-hospital-user" style="margin-left:auto; color:#8b5cf6;"></i>
          </div>
          <div class="dash-stat-card__progress-bar"><div class="dash-stat-card__progress-fill" style="width:75%;background:#8b5cf6;"></div></div>
          <div class="dash-stat-card__subtitle">En tu base de datos</div>
        </div>

        <!-- Tarjeta 4 -->
        <div class="dash-stat-card">
          <div class="dash-stat-card__title">Pendientes</div>
          <div class="dash-stat-card__value">
            ${pendientes.length}
            <i class="fa-solid fa-clock" style="margin-left:auto; color:#f59e0b;"></i>
          </div>
          <div class="dash-stat-card__progress-bar"><div class="dash-stat-card__progress-fill" style="width:${Math.min(pendientes.length * 20, 100)}%;background:#f59e0b;"></div></div>
          <div class="dash-stat-card__subtitle">Requieren confirmación</div>
        </div>

        <!-- Tarjeta 5 -->
        <div class="dash-stat-card">
          <div class="dash-stat-card__title">Completadas</div>
          <div class="dash-stat-card__value">
            ${completadas.length}
            <i class="fa-solid fa-check-double" style="margin-left:auto; color:#10b981;"></i>
          </div>
          <div class="dash-stat-card__progress-bar"><div class="dash-stat-card__progress-fill" style="width:60%;background:#10b981;"></div></div>
          <div class="dash-stat-card__subtitle">Tratamiento finalizado</div>
        </div>

        <!-- Tarjeta 6 -->
        <div class="dash-stat-card">
          <div class="dash-stat-card__title">Canceladas</div>
          <div class="dash-stat-card__value">
            ${canceladas.length}
            <i class="fa-solid fa-xmark" style="margin-left:auto; color:#ef4444;"></i>
          </div>
          <div class="dash-stat-card__progress-bar"><div class="dash-stat-card__progress-fill" style="width:${Math.min(canceladas.length * 10, 100)}%;background:#ef4444;"></div></div>
          <div class="dash-stat-card__subtitle">No asistieron o cancelaron</div>
        </div>
      </div>

      <!-- Sección Inferior: Próximas citas como lista/tabla -->
      <div class="card" style="box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border-radius:12px;">
        <div class="card__header" style="background:#fff; border-bottom:1px solid #f3f4f6;">
          <h3 style="font-size:1.1rem; color:#374151;">Gestión de Próximas Citas</h3>
          <div class="queue-search" style="margin:0;"><input type="text" class="form-input" placeholder="Buscar paciente..." id="queueSearch" style="padding:6px 12px; font-size:0.85rem; width:200px;"></div>
        </div>
        <div class="card__body" style="padding:0;">
          <div class="queue-list" id="queueList" style="padding:10px;">
            ${citas?.filter(c => c.estado !== 'completada' && c.estado !== 'cancelada')
               .sort((a,b) => a.fecha_cita.localeCompare(b.fecha_cita) || (a.hora_raw||'').localeCompare(b.hora_raw||''))
               .slice(0, 10).map(c => `
              <div class="queue-item" onclick="showDoctorCitaDetail(${c.id_cita})" style="border:1px solid #f3f4f6; border-radius:8px; margin-bottom:8px; display:flex; align-items:center; padding:12px 16px; cursor:pointer; transition:all 0.2s;">
                <div class="queue-item__dot queue-item__dot--${c.estado}" style="margin-right:16px; width:10px; height:10px; border-radius:50%;"></div>
                <div style="flex:1;">
                  <div style="font-weight:600; color:#1f2937; font-size:0.95rem;">${c.paciente}</div>
                  <div style="font-size:0.8rem; color:#6b7280;">ID Paciente: ${c.id_paciente} | Motivo: ${c.motivo_consulta||'Consulta general'}</div>
                </div>
                <div style="text-align:right; margin-right:20px;">
                  <div style="font-weight:600; font-size:0.9rem; color:#374151;">${formatDateShort(c.fecha_cita)}</div>
                  <div style="font-size:0.8rem; color:#6b7280;"><i class="fa-solid fa-clock"></i> ${c.hora_cita}</div>
                </div>
                <span class="badge badge--${c.estado}" style="min-width:80px; text-align:center;">${capitalizeStatus(c.estado)}</span>
              </div>
            `).join('') || '<div class="dash-empty-state"><p>No tienes citas próximas</p></div>'}
          </div>
        </div>
      </div>
    </div>`;

  document.getElementById('queueSearch')?.addEventListener('input',(e)=>{
    const q=e.target.value.toLowerCase();
    document.querySelectorAll('.queue-item').forEach(item=>{
      item.style.display=item.textContent.toLowerCase().includes(q)?'':'none'
    })
  });
  
  document.getElementById('statusSwitch')?.addEventListener('click',function(){
    this.classList.toggle('active');
    const l=this.nextElementSibling;
    l.textContent=this.classList.contains('active')?'Disponible para consultas':'No disponible temporalmente';
    l.style.color=this.classList.contains('active')?'#10b981':'#ef4444'
  });
}

function showDoctorCitaDetail(citaId) {
  // Buscar en las citas ya cargadas en el contexto del doctor
  fetch(`/api/citas?doctor=${state.currentUser.id}`)
    .then(r => r.json())
    .then(citas => {
      const c = citas.find(ci => ci.id === citaId);
      if (!c) return;
      openModal(`Cita con ${c.paciente_nombre}`, `
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="summary-item"><span class="summary-item__label">Paciente</span><span class="summary-item__value">${c.paciente_nombre}</span></div>
          <div class="summary-item"><span class="summary-item__label">Teléfono</span><span class="summary-item__value">${c.paciente_telefono || '—'}</span></div>
          <div class="summary-item"><span class="summary-item__label">Hospital</span><span class="summary-item__value">${c.hospital_nombre}</span></div>
          <div class="summary-item"><span class="summary-item__label">Fecha</span><span class="summary-item__value">${formatDate(c.fecha_cita)}</span></div>
          <div class="summary-item"><span class="summary-item__label">Hora</span><span class="summary-item__value">${formatTime(c.hora_cita)}</span></div>
          <div class="summary-item"><span class="summary-item__label">Motivo</span><span class="summary-item__value">${c.motivo_consulta || 'No especificado'}</span></div>
          <div class="summary-item"><span class="summary-item__label">Estado</span><span class="badge badge--${c.estado}">${capitalizeStatus(c.estado)}</span></div>
          <div class="form-group" style="margin-top:8px"><label class="form-label">Notas del médico</label><textarea class="form-textarea" id="notasCita">${c.notas || ''}</textarea></div>
          <div style="display:flex;gap:8px">
            ${c.estado === 'pendiente' ? `<button class="btn btn--primary" style="flex:1" onclick="updateCitaStatus(${c.id},'confirmada')"><i class="fa-solid fa-check"></i> Confirmar</button>` : ''}
            ${c.estado !== 'completada' && c.estado !== 'cancelada' ? `
              <button class="btn btn--secondary" style="flex:1" onclick="completarCita(${c.id})"><i class="fa-solid fa-check-double"></i> Completar</button>
              <button class="btn btn--danger" onclick="updateCitaStatus(${c.id},'cancelada')"><i class="fa-solid fa-xmark"></i></button>
            ` : ''}
          </div>
        </div>`);
    });
}

async function updateCitaStatus(id,estado){const notas=document.getElementById('notasCita')?.value;const r=await apiPut(`citas/${id}`,{estado,notas});if(r){showToast(`Cita ${estado}`);closeModal();loadNotifications();renderCurrentView()}}
async function completarCita(id){const notas=document.getElementById('notasCita')?.value;const r=await apiPut(`citas/${id}`,{estado:'completada',notas});if(r){showToast('Cita completada','success');closeModal();renderCurrentView()}}

// ═══════════════════════════════════════════════════════════
// VIEW: CONSULTA DOCTOR (Enhanced with ICD-10, Prescriptions)
// ═══════════════════════════════════════════════════════════
async function renderConsulta(container) {
  const doctor = state.currentUser;
  const citas = await api(`citas-doctor/${doctor.id}`);
  const activeCita = citas?.filter(c => c.estado !== 'cancelada' && c.estado !== 'completada')[0];

  if (!activeCita) {
    container.innerHTML = `<div style="max-width:1200px;margin:0 auto"><div class="empty-state"><div class="empty-state__icon"><i class="fa-solid fa-stethoscope"></i></div><h3>Sin consultas activas</h3><p>No hay pacientes en espera.</p></div></div>`;
    return;
  }

  const paciente = await api(`pacientes/${activeCita.id_paciente}`);
  const prescripciones = await api(`prescripciones/${activeCita.id_cita}`);
  const pacienteCitas = citas?.filter(c => c.id_paciente === activeCita.id_paciente) || [];
  const edad = paciente ? calcularEdad(paciente.fecha_nacimiento) : '--';

  container.innerHTML = `
    <div style="max-width:1200px;margin:0 auto">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <h1 style="font-size:1.2rem;font-weight:700;color:var(--gray-800)">
          <i class="fa-solid fa-notes-medical"></i> Espacio de Consulta - ${formatDate(new Date().toISOString().split('T')[0])}
        </h1>
      </div>
      <div class="consulta-layout">
        <!-- LEFT: Patient Profile -->
        <div class="card patient-profile">
          <div class="patient-profile__header">
            <div class="patient-profile__avatar"><i class="fa-solid fa-user"></i></div>
            <div class="patient-profile__name">${activeCita.paciente}</div>
            <div class="patient-profile__detail">Edad: ${edad}</div>
            <div class="patient-profile__detail">DOB: ${paciente?formatDateShort(paciente.fecha_nacimiento):'--'}</div>
          </div>
          <div class="patient-vitals">
            <h4>Información</h4>
            <div class="vital-item"><span class="vital-item__label">Teléfono</span><span class="vital-item__value">${activeCita.telefono_paciente}</span></div>
            <div class="vital-item"><span class="vital-item__label">Correo</span><span class="vital-item__value" style="font-size:0.72rem">${activeCita.correo_paciente}</span></div>
            <div class="vital-item"><span class="vital-item__label">Género</span><span class="vital-item__value">${capitalize(paciente?.genero||'--')}</span></div>
          </div>
          <div class="past-history">
            <h4>Historial Previo</h4>
            ${pacienteCitas.slice(0,5).map((c,i)=>`
              <div class="past-history-item">
                <div class="past-history-item__dot ${i===0?'active':''}"></div>
                <div class="past-history-item__info">
                  <div class="past-history-item__date">${formatDateShort(c.fecha_cita)}</div>
                  <div class="past-history-item__title">${c.diagnostico||c.motivo_consulta||'Consulta'}</div>
                  <div class="past-history-item__desc">${c.notas||''}</div>
                </div>
              </div>
            `).join('')||'<p style="color:var(--gray-400);font-size:0.8rem">Sin historial previo</p>'}
          </div>
        </div>

        <!-- RIGHT: Workspace -->
        <div>
          <div class="workspace-grid">
            <!-- Consultation Notes -->
            <div class="card">
              <div class="card__header"><h3><i class="fa-solid fa-pen"></i> Notas de Consulta</h3></div>
              <div class="card__body">
                <textarea class="form-textarea" id="consultaNotas" placeholder="Escribe las notas de la consulta..." style="min-height:180px;border:none;padding:0">${activeCita.notas||''}</textarea>
              </div>
            </div>

            <!-- Clinical Diagnosis ICD-10 -->
            <div class="card">
              <div class="card__header"><h3><i class="fa-solid fa-stethoscope"></i> Diagnóstico Clínico (ICD-10)</h3></div>
              <div class="card__body">
                <div class="diagnosis-search">
                  <input type="text" class="form-input" id="icdSearch" placeholder="Buscar diagnóstico..." value="${activeCita.diagnostico||''}">
                  <div class="diagnosis-list" id="icdList">
                    ${ICD10_CODES.map(code=>`<div class="diagnosis-item" data-code="${code}">${code}</div>`).join('')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="workspace-grid" style="margin-top:16px">
            <!-- Treatment Plan -->
            <div class="card">
              <div class="card__header"><h3><i class="fa-solid fa-clipboard-list"></i> Plan de Tratamiento</h3></div>
              <div class="card__body">
                <textarea class="form-textarea" id="consultaTratamiento" placeholder="Escribir plan de tratamiento..." style="min-height:120px;border:none;padding:0">${activeCita.tratamiento||''}</textarea>
              </div>
            </div>

            <!-- Prescription Builder -->
            <div class="card">
              <div class="card__header"><h3><i class="fa-solid fa-pills"></i> Prescripciones</h3></div>
              <div class="card__body">
                <div class="prescription-form">
                  <input type="text" class="form-input" id="rxDrug" placeholder="Medicamento">
                  <input type="text" class="form-input" id="rxDose" placeholder="Dosis">
                  <input type="text" class="form-input" id="rxFreq" placeholder="Frecuencia">
                  <button class="btn btn--primary btn--sm" onclick="addPrescription(${activeCita.id_cita})"><i class="fa-solid fa-plus"></i> Add</button>
                </div>
                <div class="prescribed-meds">
                  <div class="prescribed-meds__header">Medicamentos prescritos</div>
                  <div id="medsList">
                    ${(prescripciones||[]).map(p=>`
                      <div class="med-item">
                        <span class="med-item__name">${p.medicamento}</span>
                        <span class="med-item__detail">${p.dosis} · ${p.frecuencia}</span>
                        <button class="med-item__remove" onclick="removePrescription(${p.id},${activeCita.id_cita})"><i class="fa-solid fa-trash"></i></button>
                      </div>
                    `).join('')||'<div class="med-item"><span style="color:var(--gray-400)">Sin prescripciones aún</span></div>'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action buttons -->
          <div style="display:flex;gap:8px;margin-top:16px;justify-content:flex-end">
            <button class="btn btn--outline" onclick="guardarConsulta(${activeCita.id_cita})"><i class="fa-solid fa-save"></i> Guardar</button>
            <button class="btn btn--primary" onclick="completarConsulta(${activeCita.id_cita})"><i class="fa-solid fa-check-double"></i> Completar Consulta</button>
          </div>
        </div>
      </div>
    </div>`;

  // ICD-10 search filter
  document.getElementById('icdSearch')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.diagnosis-item').forEach(item => {
      item.style.display = item.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
  document.querySelectorAll('.diagnosis-item').forEach(item => {
    item.addEventListener('click', () => {
      document.getElementById('icdSearch').value = item.dataset.code;
      document.querySelectorAll('.diagnosis-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
    });
  });
}

async function addPrescription(citaId) {
  const med=document.getElementById('rxDrug').value;
  const dose=document.getElementById('rxDose').value;
  const freq=document.getElementById('rxFreq').value;
  if(!med||!dose||!freq){showToast('Completa todos los campos','warning');return}
  const r=await apiPost('prescripciones',{id_cita:citaId,medicamento:med,dosis:dose,frecuencia:freq});
  if(r){showToast('Prescripción agregada');renderConsulta(document.getElementById('mainContent'))}
}

async function removePrescription(id,citaId) {
  await apiDelete(`prescripciones/${id}`);
  showToast('Prescripción eliminada','warning');
  renderConsulta(document.getElementById('mainContent'));
}

async function guardarConsulta(citaId) {
  const notas=document.getElementById('consultaNotas')?.value;
  const diagnostico=document.getElementById('icdSearch')?.value;
  const tratamiento=document.getElementById('consultaTratamiento')?.value;
  const r=await apiPut(`citas/${citaId}`,{notas,diagnostico,tratamiento});
  if(r)showToast('Consulta guardada','success');
}

async function completarConsulta(citaId) {
  const notas=document.getElementById('consultaNotas')?.value;
  const diagnostico=document.getElementById('icdSearch')?.value;
  const tratamiento=document.getElementById('consultaTratamiento')?.value;
  const r=await apiPut(`citas/${citaId}`,{estado:'completada',notas,diagnostico,tratamiento});
  if(r){showToast('Consulta completada','success');renderCurrentView()}
}

// ═══════════════════════════════════════════════════════════
// VIEW: HORARIOS DOCTOR
// ═══════════════════════════════════════════════════════════
async function renderHorarios(container) {
  const horarios = await api(`doctores/${state.currentUser.id}/horarios`);
  const dias = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

  container.innerHTML = `
    <div style="max-width:800px;margin:0 auto">
      <h1 style="font-size:1.4rem;font-weight:700;margin-bottom:20px"><i class="fa-solid fa-calendar"></i> Mis Horarios</h1>
      <div class="card" style="margin-bottom:20px">
        <div class="card__header"><h3><i class="fa-solid fa-plus"></i> Agregar Horario</h3></div>
        <div class="card__body">
          <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">
            <div class="form-group" style="margin:0;flex:1;min-width:140px">
              <label class="form-label">Día</label>
              <select class="form-select" id="newDia">${dias.map(d=>`<option value="${d}">${d}</option>`).join('')}</select>
            </div>
            <div class="form-group" style="margin:0;flex:1;min-width:120px">
              <label class="form-label">Hora inicio</label>
              <input type="time" class="form-input" id="newHoraInicio" value="08:00">
            </div>
            <div class="form-group" style="margin:0;flex:1;min-width:120px">
              <label class="form-label">Hora fin</label>
              <input type="time" class="form-input" id="newHoraFin" value="14:00">
            </div>
            <button class="btn btn--primary" onclick="addHorario()"><i class="fa-solid fa-plus"></i> Agregar</button>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card__header"><h3>Horarios Actuales</h3></div>
        <div class="card__body">
          ${horarios?.length ? horarios.map(h => `
            <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--gray-100)">
              <span class="badge badge--available">${h.dia_semana}</span>
              <span style="font-weight:600">${formatTimeSlot(h.hora_inicio)} - ${formatTimeSlot(h.hora_fin)}</span>
            </div>
          `).join('') : '<p style="color:var(--gray-400)">No tienes horarios configurados. Agrega tus horarios de atención.</p>'}
        </div>
      </div>
    </div>`;
}

async function addHorario() {
  const dia=document.getElementById('newDia').value;
  const inicio=document.getElementById('newHoraInicio').value;
  const fin=document.getElementById('newHoraFin').value;
  const r=await apiPost(`doctores/${state.currentUser.id}/horarios`,{dia_semana:dia,hora_inicio:inicio,hora_fin:fin});
  if(r){showToast('Horario agregado');renderHorarios(document.getElementById('mainContent'))}
}

// ═══════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════
function formatDate(ds){if(!ds)return'';const d=new Date(ds+'T00:00:00');const m=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];return`${d.getDate()} de ${m[d.getMonth()]}, ${d.getFullYear()}`}
function formatDateShort(ds){if(!ds)return'';const d=new Date(ds+'T00:00:00');return`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`}
function formatTime(ts){if(!ts)return'';const[h,m]=ts.split(':');const hr=parseInt(h);return`${hr%12||12}:${m} ${hr>=12?'PM':'AM'}`}
function formatTimeSlot(ts){if(!ts)return'';const[h,m]=ts.split(':');const hr=parseInt(h);return`${hr%12||12}:${m||'00'} ${hr>=12?'PM':'AM'}`}
function capitalizeStatus(s){return{pendiente:'Pendiente',confirmada:'Confirmada',cancelada:'Cancelada',completada:'Completada'}[s]||s}
function capitalize(s){return s?s.charAt(0).toUpperCase()+s.slice(1):''}
function calcularEdad(fn){const h=new Date(),n=new Date(fn);let e=h.getFullYear()-n.getFullYear();const m=h.getMonth()-n.getMonth();if(m<0||(m===0&&h.getDate()<n.getDate()))e--;return e}
function timeAgo(dateStr){if(!dateStr)return'';const now=new Date(),d=new Date(dateStr);const diff=Math.floor((now-d)/1000);if(diff<60)return'Hace un momento';if(diff<3600)return`Hace ${Math.floor(diff/60)} min`;if(diff<86400)return`Hace ${Math.floor(diff/3600)} horas`;return`Hace ${Math.floor(diff/86400)} días`}

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  renderAuthScreen();
});
  
async function renderAdminDashboard(container) {
  container.innerHTML = `
    <div class="d-flex align-items-center justify-content-center" style="min-height:200px">
      <div class="text-center text-muted">
        <i class="fa-solid fa-spinner fa-spin fa-2x mb-3"></i>
        <p>Cargando datos...</p>
      </div>
    </div>`;

  const [pendientes, todosData] = await Promise.all([
    api('admin/pendientes'),
    api('admin/todos')
  ]);

  const pend = pendientes || [];
  const todos = todosData || { doctores: [], pacientes: [] };
  const totalDoctores = todos.doctores?.length || 0;
  const totalPacientes = todos.pacientes?.length || 0;
  const totalActivos = [...(todos.doctores || []), ...(todos.pacientes || [])].filter(u => u.estado === 'activo').length;

  container.innerHTML = `
    <div class="admin-panel">
      <!-- Header del panel -->
      <div class="admin-panel__header d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h1 class="admin-panel__title">
            <i class="fa-solid fa-shield-halved me-2 text-primary-accent"></i>
            Panel de Administración
          </h1>
          <p class="admin-panel__subtitle">Clínica Jordan &mdash; Control de acceso y usuarios</p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <span class="admin-badge-live"><i class="fa-solid fa-circle-dot"></i> En vivo</span>
          <button class="btn-admin-refresh" onclick="renderAdminDashboard(document.getElementById('mainContent'))">
            <i class="fa-solid fa-rotate-right"></i> Actualizar
          </button>
        </div>
      </div>

      <!-- Métricas superiores -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3">
          <div class="admin-stat-card admin-stat-card--blue">
            <div class="admin-stat-card__icon"><i class="fa-solid fa-users"></i></div>
            <div class="admin-stat-card__body">
              <div class="admin-stat-card__value">${totalDoctores + totalPacientes}</div>
              <div class="admin-stat-card__label">Usuarios Total</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="admin-stat-card admin-stat-card--green">
            <div class="admin-stat-card__icon"><i class="fa-solid fa-circle-check"></i></div>
            <div class="admin-stat-card__body">
              <div class="admin-stat-card__value">${totalActivos}</div>
              <div class="admin-stat-card__label">Cuentas Activas</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="admin-stat-card admin-stat-card--amber">
            <div class="admin-stat-card__icon"><i class="fa-solid fa-hourglass-half"></i></div>
            <div class="admin-stat-card__body">
              <div class="admin-stat-card__value">${pend.length}</div>
              <div class="admin-stat-card__label">Pendientes</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="admin-stat-card admin-stat-card--purple">
            <div class="admin-stat-card__icon"><i class="fa-solid fa-user-doctor"></i></div>
            <div class="admin-stat-card__body">
              <div class="admin-stat-card__value">${totalDoctores}</div>
              <div class="admin-stat-card__label">Médicos Registrados</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla de aprobaciones -->
      <div class="admin-card mb-4">
        <div class="admin-card__header d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2">
            <i class="fa-solid fa-clock-rotate-left text-warning"></i>
            <h5 class="mb-0">Solicitudes Pendientes de Aprobación</h5>
            ${pend.length > 0 ? `<span class="admin-count-badge">${pend.length}</span>` : ''}
          </div>
          <div class="d-flex gap-2">
            <button class="btn-admin-action btn-admin-action--green" onclick="aprobarTodos()" ${pend.length === 0 ? 'disabled' : ''}>
              <i class="fa-solid fa-check-double"></i> Aprobar todos
            </button>
          </div>
        </div>
        <div class="admin-card__body p-0">
          ${pend.length === 0 ? `
            <div class="admin-empty-state">
              <i class="fa-solid fa-party-horn fa-2x mb-3"></i>
              <h6>Sin solicitudes pendientes</h6>
              <p>Todas las cuentas han sido revisadas.</p>
            </div>
          ` : `
            <div class="table-responsive">
              <table class="table admin-table mb-0">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Correo</th>
                    <th>Detalles</th>
                    <th>Registro</th>
                    <th class="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  ${pend.map(u => `
                    <tr>
                      <td>
                        <div class="d-flex align-items-center gap-2">
                          <div class="admin-user-avatar admin-user-avatar--${u.tipo === 'doctor' ? 'blue' : 'teal'}"><i class="fa-solid fa-${u.tipo === 'doctor' ? 'user-doctor' : 'user'}"></i></div>
                          <div>
                            <div class="fw-semibold">${u.nombre} ${u.apellido}</div>
                            <div class="text-muted small">#${u.id}</div>
                          </div>
                        </div>
                      </td>
                      <td><span class="admin-role-badge admin-role-badge--${u.tipo === 'doctor' ? 'blue' : 'teal'}">${u.tipo === 'doctor' ? '<i class="fa-solid fa-stethoscope"></i> Doctor' : '<i class="fa-solid fa-person"></i> Paciente'}</span></td>
                      <td><span class="text-muted">${u.correo}</span></td>
                      <td class="text-muted small">${u.tipo === 'doctor' ? (u.especialidad || '—') : (u.genero || '—')}</td>
                      <td class="text-muted small">${u.fecha ? new Date(u.fecha).toLocaleDateString('es-MX', {day:'2-digit',month:'short',year:'numeric'}) : '—'}</td>
                      <td class="text-end">
                        <button class="btn-admin-action btn-admin-action--green me-1" onclick="aprobarUsuario('${u.tipo}', ${u.id})">
                          <i class="fa-solid fa-check"></i> Aprobar
                        </button>
                        <button class="btn-admin-action btn-admin-action--red" onclick="rechazarUsuario('${u.tipo}', ${u.id})">
                          <i class="fa-solid fa-xmark"></i> Rechazar
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>

      <!-- Tabs de usuarios registrados -->
      <div class="admin-card">
        <div class="admin-card__header">
          <ul class="nav nav-tabs admin-nav-tabs border-0" role="tablist">
            <li class="nav-item" role="presentation">
              <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tabDoctores" type="button">
                <i class="fa-solid fa-user-doctor me-1"></i> Médicos (${totalDoctores})
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tabPacientes" type="button">
                <i class="fa-solid fa-user me-1"></i> Pacientes (${totalPacientes})
              </button>
            </li>
          </ul>
        </div>
        <div class="admin-card__body p-0">
          <div class="tab-content">
            <!-- Tab Doctores -->
            <div class="tab-pane fade show active" id="tabDoctores">
              ${todos.doctores?.length === 0 ? '<div class="admin-empty-state"><p>No hay médicos registrados.</p></div>' : `
              <div class="table-responsive">
                <table class="table admin-table mb-0">
                  <thead>
                    <tr><th>Médico</th><th>Especialidad</th><th>Hospital</th><th>Correo</th><th>Estado</th></tr>
                  </thead>
                  <tbody>
                    ${(todos.doctores || []).map(d => `
                      <tr>
                        <td>
                          <div class="d-flex align-items-center gap-2">
                            <div class="admin-user-avatar admin-user-avatar--blue"><i class="fa-solid fa-user-doctor"></i></div>
                            <span class="fw-semibold">Dr. ${d.nombre} ${d.apellido}</span>
                          </div>
                        </td>
                        <td class="text-muted">${d.especialidad || '—'}</td>
                        <td class="text-muted small">${d.hospital || '—'}</td>
                        <td class="text-muted small">${d.correo}</td>
                        <td><span class="admin-status-badge admin-status-badge--${d.estado}">${d.estado}</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>`}
            </div>
            <!-- Tab Pacientes -->
            <div class="tab-pane fade" id="tabPacientes">
              ${todos.pacientes?.length === 0 ? '<div class="admin-empty-state"><p>No hay pacientes registrados.</p></div>' : `
              <div class="table-responsive">
                <table class="table admin-table mb-0">
                  <thead>
                    <tr><th>Paciente</th><th>Correo</th><th>Teléfono</th><th>Estado</th></tr>
                  </thead>
                  <tbody>
                    ${(todos.pacientes || []).map(p => `
                      <tr>
                        <td>
                          <div class="d-flex align-items-center gap-2">
                            <div class="admin-user-avatar admin-user-avatar--teal"><i class="fa-solid fa-user"></i></div>
                            <span class="fw-semibold">${p.nombre} ${p.apellido}</span>
                          </div>
                        </td>
                        <td class="text-muted">${p.correo}</td>
                        <td class="text-muted small">${p.telefono || '—'}</td>
                        <td><span class="admin-status-badge admin-status-badge--${p.estado}">${p.estado}</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>`}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

window.aprobarUsuario = async (tipo, id) => {
  if (!confirm('¿Aprobar esta cuenta?')) return;
  const res = await fetch(`/api/admin/aprobar/${tipo}/${id}`, { method: 'PUT' });
  const result = await res.json();
  if (result && result.success) {
    showToast('✅ Usuario aprobado correctamente', 'success');
    renderAdminDashboard(document.getElementById('mainContent'));
  } else {
    showToast('Error al aprobar', 'error');
  }
};

window.rechazarUsuario = async (tipo, id) => {
  if (!confirm('¿Rechazar esta cuenta? Esta acción no se puede deshacer.')) return;
  const res = await fetch(`/api/admin/rechazar/${tipo}/${id}`, { method: 'PUT' });
  const result = await res.json();
  if (result && result.success) {
    showToast('Usuario rechazado', 'success');
    renderAdminDashboard(document.getElementById('mainContent'));
  } else {
    showToast('Error al rechazar', 'error');
  }
};

window.aprobarTodos = async () => {
  if (!confirm('¿Aprobar TODAS las solicitudes pendientes?')) return;
  const pendientes = await api('admin/pendientes') || [];
  await Promise.all(pendientes.map(u =>
    fetch(`/api/admin/aprobar/${u.tipo}/${u.id}`, { method: 'PUT' })
  ));
  showToast(`✅ ${pendientes.length} cuentas aprobadas`, 'success');
  renderAdminDashboard(document.getElementById('mainContent'));
};

