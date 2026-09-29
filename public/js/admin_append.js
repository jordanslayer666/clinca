async function renderAdminDashboard(container) {
  container.innerHTML = `<div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Cargando usuarios pendientes...</div>`;
  
  const pendientes = await api('admin/pendientes') || [];
  
  container.innerHTML = `
    <div class="view-header">
      <h2>Aprobación de Usuarios</h2>
      <p>Gestión de doctores y pacientes pendientes de activación.</p>
    </div>
    
    <div class="card">
      <div class="card__header">
        <h3>Cuentas Pendientes (${pendientes.length})</h3>
      </div>
      <div class="card__body" style="padding: 0;">
        ${pendientes.length === 0 ? '<div class="empty-state">No hay usuarios pendientes de aprobación.</div>' : ''}
        ${pendientes.length > 0 ? `
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Fecha de Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${pendientes.map(u => `
                <tr>
                  <td><span class="badge badge--${u.tipo === 'doctor' ? 'primary' : 'secondary'}">${u.tipo.toUpperCase()}</span></td>
                  <td>${u.nombre} ${u.apellido}</td>
                  <td>${u.correo}</td>
                  <td>${new Date(u.fecha).toLocaleDateString()}</td>
                  <td>
                    <button class="btn btn--sm btn--primary" onclick="aprobarUsuario('${u.tipo}', ${u.id})"><i class="fa-solid fa-check"></i> Aprobar</button>
                    <button class="btn btn--sm btn--danger" onclick="rechazarUsuario('${u.tipo}', ${u.id})"><i class="fa-solid fa-xmark"></i> Rechazar</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
      </div>
    </div>
  `;
}

window.aprobarUsuario = async (tipo, id) => {
  if (!confirm('¿Seguro que deseas aprobar a este usuario?')) return;
  const result = await apiPost(`admin/aprobar/${tipo}/${id}`, {}, 'PUT');
  if (result && result.success) {
    showToast('Usuario aprobado correctamente', 'success');
    renderAdminDashboard(document.getElementById('mainContent'));
  }
};

window.rechazarUsuario = async (tipo, id) => {
  if (!confirm('¿Seguro que deseas rechazar a este usuario?')) return;
  const result = await apiPost(`admin/rechazar/${tipo}/${id}`, {}, 'PUT');
  if (result && result.success) {
    showToast('Usuario rechazado', 'success');
    renderAdminDashboard(document.getElementById('mainContent'));
  }
};
