document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const usersTableBody = document.getElementById('usersTableBody');
  const resumesTableBody = document.getElementById('resumesTableBody');
  const usersEmpty = document.getElementById('usersEmpty');
  const resumesEmpty = document.getElementById('resumesEmpty');
  const adminIdentity = document.getElementById('adminIdentity');
  const statUsers = document.getElementById('statUsers');
  const statAdmins = document.getElementById('statAdmins');
  const statResumes = document.getElementById('statResumes');
  const statDownloads = document.getElementById('statDownloads');
  const refreshBtn = document.getElementById('refreshBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (!token) {
    window.location.replace('/login');
    return;
  }

  function formatDate(value) {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  async function apiFetch(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.replace('/login');
      return null;
    }

    return response;
  }

  async function loadIdentity() {
    const response = await apiFetch('/api/me');
    if (!response) {
      return null;
    }

    const data = await response.json();
    if (data.role !== 'admin') {
      flashToast('Admin access required.', 'error');
      window.location.replace('/dashboard');
      return null;
    }

    adminIdentity.textContent = `${data.name} · ${data.email}`;
    return data;
  }

  async function loadSummary() {
    const response = await apiFetch('/api/admin/summary');
    if (!response || !response.ok) {
      showToast('Failed to load summary.', 'error');
      return;
    }

    const data = await response.json();
    statUsers.textContent = String(data.users ?? 0);
    statAdmins.textContent = String(data.admins ?? 0);
    statResumes.textContent = String(data.resumes ?? 0);
    statDownloads.textContent = String(data.downloads ?? 0);
  }

  function renderUsers(users) {
    usersTableBody.innerHTML = '';
    usersEmpty.hidden = users.length > 0;

    if (!users.length) {
      return;
    }

    users.forEach((user) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td data-label="Name">
          <strong>${user.name || 'Unnamed user'}</strong><br>
          <small>${formatDate(user.createdAt)}</small>
        </td>
        <td data-label="Email">${user.email || '-'}</td>
        <td data-label="Role">
          <label class="role-switch" title="Toggle user role">
            <input type="checkbox" data-action="toggle-role" data-id="${user.id}" ${user.role === 'admin' ? 'checked' : ''} aria-label="Toggle admin role for ${user.name || 'user'}">
            <span class="role-switch-track" aria-hidden="true">
              <span class="role-switch-thumb"></span>
            </span>
            <span class="role-switch-text">${user.role === 'admin' ? 'Admin' : 'User'}</span>
          </label>
        </td>
        <td data-label="Actions">
          <div class="table-actions">
            <button class="btn btn-danger" data-action="delete-user" data-id="${user.id}" type="button">Delete</button>
          </div>
        </td>
      `;
      usersTableBody.appendChild(row);
    });
  }

  function renderResumes(resumes) {
    resumesTableBody.innerHTML = '';
    resumesEmpty.hidden = resumes.length > 0;

    if (!resumes.length) {
      return;
    }

    resumes.forEach((resume) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td data-label="Title">
          <strong>${resume.title || 'Untitled resume'}</strong><br>
          <small>Updated ${formatDate(resume.updatedAt)}</small>
        </td>
        <td data-label="Owner">
          ${resume.ownerName || '-'}<br>
          <small>${resume.ownerEmail || '-'}</small>
        </td>
        <td data-label="Downloads">${resume.downloads ?? 0}</td>
        <td data-label="Actions">
          <div class="table-actions">
            <button class="btn btn-danger" data-action="delete-resume" data-id="${resume.id}" type="button">Delete</button>
          </div>
        </td>
      `;
      resumesTableBody.appendChild(row);
    });
  }

  async function loadUsers() {
    const response = await apiFetch('/api/admin/users');
    if (!response || !response.ok) {
      showToast('Failed to load users.', 'error');
      return [];
    }

    const data = await response.json();
    return data.users || [];
  }

  async function loadResumes() {
    const response = await apiFetch('/api/admin/resumes');
    if (!response || !response.ok) {
      showToast('Failed to load resumes.', 'error');
      return [];
    }

    const data = await response.json();
    return data.resumes || [];
  }

  async function updateUserRole(userId, role) {
    const response = await apiFetch(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });

    if (!response || !response.ok) {
      const data = response ? await response.json().catch(() => ({})) : {};
      throw new Error(data.message || 'Failed to update user role');
    }
  }

  async function deleteUser(userId) {
    const response = await apiFetch(`/api/admin/users/${userId}`, {
      method: 'DELETE'
    });

    if (!response || !response.ok) {
      const data = response ? await response.json().catch(() => ({})) : {};
      throw new Error(data.message || 'Failed to delete user');
    }
  }

  async function deleteResume(resumeId) {
    const response = await apiFetch(`/api/admin/resumes/${resumeId}`, {
      method: 'DELETE'
    });

    if (!response || !response.ok) {
      const data = response ? await response.json().catch(() => ({})) : {};
      throw new Error(data.message || 'Failed to delete resume');
    }
  }

  async function refreshData() {
    const identity = await loadIdentity();
    if (!identity) {
      return;
    }

    await loadSummary();
    const [users, resumes] = await Promise.all([loadUsers(), loadResumes()]);
    renderUsers(users);
    renderResumes(resumes);
  }

  usersTableBody.addEventListener('change', async (event) => {
    const input = event.target.closest('input[data-action="toggle-role"]');
    if (!input) {
      return;
    }

    const id = input.dataset.id;
    const nextRole = input.checked ? 'admin' : 'user';
    const row = input.closest('tr');
    const text = row?.querySelector('.role-switch-text');
    const previousChecked = !input.checked;

    try {
      showToast('Updating role...', 'success');
      await updateUserRole(id, nextRole);
      if (text) {
        text.textContent = nextRole === 'admin' ? 'Admin' : 'User';
      }
      flashToast('User role updated.', 'success');
    } catch (error) {
      input.checked = previousChecked;
      if (text) {
        text.textContent = previousChecked ? 'Admin' : 'User';
      }
      showToast(error.message || 'Action failed.', 'error');
    }
  });

  usersTableBody.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action="delete-user"]');
    if (!button) {
      return;
    }

    const id = button.dataset.id;

    try {
      button.disabled = true;
      showToast('Deleting user...', 'success');
      await deleteUser(id);
      flashToast('User deleted.', 'success');
      await refreshData();
    } catch (error) {
      showToast(error.message || 'Failed to delete user.', 'error');
    } finally {
      button.disabled = false;
    }
  });

  resumesTableBody.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) {
      return;
    }

    const id = button.dataset.id;

    try {
      button.disabled = true;
      showToast('Deleting resume...', 'success');
      await deleteResume(id);
      flashToast('Resume deleted.', 'success');
      await refreshData();
    } catch (error) {
      showToast(error.message || 'Failed to delete resume.', 'error');
    } finally {
      button.disabled = false;
    }
  });

  refreshBtn?.addEventListener('click', refreshData);
  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('token');
    flashToast('Logged out successfully.', 'success');
    window.location.href = '/login';
  });

  refreshData();
});