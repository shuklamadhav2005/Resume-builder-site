// Dashboard control center for resumes
document.addEventListener('DOMContentLoaded', () => {
  const resumeList = document.getElementById('resumeList');
  const emptyState = document.getElementById('emptyState');
  const resumeCount = document.getElementById('resumeCount');
  const statsResumes = document.getElementById('statsResumes');
  const statsDownloads = document.getElementById('statsDownloads');
  const statsLastEdited = document.getElementById('statsLastEdited');
  const accountName = document.getElementById('accountName');
  const accountEmail = document.getElementById('accountEmail');
  const accountAvatar = document.getElementById('accountAvatar');
  const userAvatar = document.getElementById('userAvatar');
  const userDropdown = document.getElementById('userDropdown');
  const adminPanelBtn = document.getElementById('adminPanelBtn');
  const mobileAdminPanelBtn = document.getElementById('mobileAdminPanelBtn');
  const themeToggle = document.getElementById('themeToggle');
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileNavDropdown = document.getElementById('mobileNavDropdown');
  const mobileThemeToggle = document.getElementById('mobileThemeToggle');
  const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
  const token = localStorage.getItem('token');

  if (!token) {
    flashToast('You have to log in first.', 'error');
    window.location.href = '/login';
    return;
  }

  async function loadResumes() {
    try {
      const response = await fetch('/api/resumes', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        flashToast('You have to log in first.', 'error');
        window.location.href = '/login';
        return [];
      }

      if (!response.ok) {
        console.error('Failed to load resumes:', response.status);
        return [];
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        return data;
      }
      return data.resumes || [];
    } catch (error) {
      console.error('Error loading resumes:', error);
      return [];
    }
  }

  async function deleteResume(resumeId) {
    try {
      const response = await fetch(`/api/resumes/${resumeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete resume');
      }

      return true;
    } catch (error) {
      console.error('Error deleting resume:', error);
      return false;
    }
  }

  function formatDate(value) {
    if (!value) {
      return '-';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function getLastEdited(list) {
    if (!list.length) {
      return '-';
    }
    const sorted = [...list].sort((a, b) => new Date(b.lastEdited) - new Date(a.lastEdited));
    return formatDate(sorted[0].lastEdited);
  }

  function renderResumes(list) {
    resumeList.innerHTML = '';

    if (!list.length) {
      emptyState.style.display = 'block';
      resumeCount.textContent = '0 total';
      statsResumes.textContent = '0';
      statsDownloads.textContent = '0';
      statsLastEdited.textContent = '-';
      return;
    }

    emptyState.style.display = 'none';
    list.forEach((resume) => {
      const card = document.createElement('article');
      card.className = 'resume-card';
      const title = resume.title || 'Untitled Resume';
      const previewName = resume.previewName || title;
      const previewPhoto = resume.previewPhoto || '';
      const shortId = resume.id.substring(resume.id.length - 6);
      card.innerHTML = `
        <div class="resume-preview-tile">
          ${previewPhoto ? `<img class="resume-preview-image" src="${previewPhoto}" alt="${title} preview">` : `<div class="resume-preview-fallback"><span>${title.trim().charAt(0).toUpperCase()}</span></div>`}
          <div class="resume-preview-overlay">
            <span>${previewName}</span>
          </div>
        </div>
        <div class="resume-card-header">
          <h3>${title}</h3>
          <span class="resume-card-id">#${shortId}</span>
        </div>
        <p class="resume-card-subtitle">${previewName}</p>
        <div class="resume-meta">
          <span><i class="fas fa-clock"></i> Last edited: ${formatDate(resume.lastEdited)}</span>
          <span><i class="fas fa-download"></i> Downloads: ${resume.downloads}</span>
        </div>
        <div class="resume-actions">
          <a class="btn-action" href="/builder?resume=${resume.id}"><i class="fas fa-pen"></i> Edit</a>
          <button class="btn-action" data-action="preview" data-id="${resume.id}"><i class="fas fa-eye"></i> Preview</button>
          <button class="btn-action" data-action="share" data-id="${resume.id}"><i class="fas fa-share-alt"></i> Share</button>
          <button class="btn-action btn-danger" data-action="delete" data-id="${resume.id}"><i class="fas fa-trash"></i> Delete</button>
        </div>
      `;
      resumeList.appendChild(card);
    });

    resumeCount.textContent = `${list.length} total`;
    statsResumes.textContent = String(list.length);
    statsDownloads.textContent = String(list.reduce((sum, item) => sum + (item.downloads || 0), 0));
    statsLastEdited.textContent = getLastEdited(list);
  }

  async function updateAccountInfo() {
    try {
      const response = await fetch('/api/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        console.error('Unauthorized - redirecting to login');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch profile:', response.status, errorText);
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      console.log('Fetched user data:', data);
      const name = data.name || 'User';
      const email = data.email || 'user@example.com';
      const role = data.role || 'user';

      accountName.textContent = name;
      accountEmail.textContent = email;
      const initial = name.trim()[0] || 'U';
      accountAvatar.textContent = initial.toUpperCase();
      userAvatar.textContent = initial.toUpperCase();

      if (adminPanelBtn) {
        adminPanelBtn.style.display = role === 'admin' ? 'inline-flex' : 'none';
      }

      if (mobileAdminPanelBtn) {
        mobileAdminPanelBtn.style.display = role === 'admin' ? 'inline-flex' : 'none';
      }
    } catch (error) {
      console.error('Error updating account info:', error);
      accountName.textContent = 'User';
      accountEmail.textContent = 'user@example.com';
      accountAvatar.textContent = 'U';
      userAvatar.textContent = 'U';

      if (adminPanelBtn) {
        adminPanelBtn.style.display = 'none';
      }

      if (mobileAdminPanelBtn) {
        mobileAdminPanelBtn.style.display = 'none';
      }
    }
  }

  function copyShareLink(resumeId) {
    const shareUrl = `${window.location.origin}/builder?resume=${resumeId}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('Share link copied to clipboard.', 'success');
      }).catch(() => {
        showToast(`Copy this link manually: ${shareUrl}`, 'error', 5000);
      });
    } else {
      showToast(`Copy this link manually: ${shareUrl}`, 'error', 5000);
    }
  }

  function attachActions() {
    resumeList.addEventListener('click', async (event) => {
      const button = event.target.closest('button');
      if (!button) {
        return;
      }

      const action = button.getAttribute('data-action');
      const resumeId = button.getAttribute('data-id');

      if (action === 'delete') {
        showToast('Deleting resume...', 'success');
        const success = await deleteResume(resumeId);
        if (success) {
          showToast('Resume deleted successfully.', 'success');
          const resumes = await loadResumes();
          renderResumes(resumes);
        } else {
          showToast('Failed to delete resume. Please try again.', 'error');
        }
      }

      if (action === 'preview') {
        showToast('Preview will open in the builder for now.', 'success');
        window.location.href = `/builder?resume=${resumeId}`;
      }

      if (action === 'share') {
        copyShareLink(resumeId);
      }
    });
  }

  function setupTheme() {
    if (!themeToggle && !mobileThemeToggle) {
      return;
    }

    const htmlElement = document.documentElement;
    const setThemeIcon = (isDark) => {
      if (themeToggle) {
        themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
      }
      if (mobileThemeToggle) {
        mobileThemeToggle.innerHTML = `${isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>'} Toggle Theme`;
      }
    };

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      htmlElement.classList.add('dark-mode');
    }
    setThemeIcon(htmlElement.classList.contains('dark-mode'));

    const toggleTheme = () => {
      htmlElement.classList.toggle('dark-mode');
      const isDark = htmlElement.classList.contains('dark-mode');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      setThemeIcon(isDark);
    };

    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }
    if (mobileThemeToggle) {
      mobileThemeToggle.addEventListener('click', () => {
        toggleTheme();
        if (mobileNavDropdown) {
          mobileNavDropdown.classList.remove('active');
        }
      });
    }
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (event) => {
      event.preventDefault();
      localStorage.removeItem('token');
      flashToast('Logged out successfully.', 'success');
      window.location.href = '/login';
    });
  }

  const logoutBtnNav = document.getElementById('logoutBtnNav');
  if (logoutBtnNav) {
    logoutBtnNav.addEventListener('click', (event) => {
      event.preventDefault();
      localStorage.removeItem('token');
      flashToast('Logged out successfully.', 'success');
      window.location.href = '/login';
    });
  }

  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener('click', (event) => {
      event.preventDefault();
      localStorage.removeItem('token');
      flashToast('Logged out successfully.', 'success');
      window.location.href = '/login';
    });
  }

  if (mobileMenuToggle && mobileNavDropdown) {
    mobileMenuToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      mobileNavDropdown.classList.toggle('active');
    });
  }

  const avatarButton = document.getElementById('userAvatar');
  if (avatarButton) {
    avatarButton.addEventListener('click', () => {
      if (userDropdown) {
        userDropdown.classList.toggle('active');
      }
    });
  }

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.user-menu') && userDropdown) {
      userDropdown.classList.remove('active');
    }

    if (
      mobileNavDropdown &&
      mobileNavDropdown.classList.contains('active') &&
      !event.target.closest('.mobile-nav')
    ) {
      mobileNavDropdown.classList.remove('active');
    }
  });

  async function init() {
    const resumes = await loadResumes();
    renderResumes(resumes);
    attachActions();
    updateAccountInfo();
    setupTheme();
  }

  init();
});