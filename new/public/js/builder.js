// Resume Builder Logic
class ResumeBuilder {
  constructor() {
    this.data = {
      title: '',
      photo: null,
      personal: {
        name: '',
        professionalTitle: '',
        email: '',
        phone: '',
        location: '',
        bio: '',
        dateOfBirth: '',
        gender: '',
        religion: '',
        hobbies: '',
        objective: '',
        currentAddress: '',
        permanentAddress: ''
      },
      education: [],
      experience: [],
      skills: [],
      languages: [],
      projects: [],
      certifications: [],
      template: 'seema',
      theme: 'light'
    };
    this.educationCount = 0;
    this.experienceCount = 0;
    this.currentResumeId = null;
    this.token = localStorage.getItem('token');
    this.init();
  }

  init() {
    if (!this.token) {
      flashToast('You have to log in first.', 'error');
      window.location.href = '/login';
      return;
    }
    
    this.setupEventListeners();
    this.setupModalListeners();
    this.setupTemplateListeners();
    this.loadResumeFromUrl();
    this.addFirstEducation();
    this.addFirstExperience();
    this.updateUserAvatar();
    this.applyTemplateFieldVisibility(this.data.template);
    this.generatePreview();
  }

  async updateUserAvatar() {
    try {
      const response = await fetch('/api/me', {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        flashToast('You have to log in first.', 'error');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        console.error('Failed to fetch user profile');
        return;
      }

      const data = await response.json();
      const name = data.name || 'User';
      const initial = name.trim()[0] || 'U';
      const avatarElement = document.getElementById('userAvatar');
      if (avatarElement) {
        avatarElement.textContent = initial.toUpperCase();
      }
    } catch (error) {
      console.error('Error updating user avatar:', error);
    }
  }

  getEl(...ids) {
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) return el;
    }
    return null;
  }

  on(ids, event, handler) {
    const targetIds = Array.isArray(ids) ? ids : [ids];
    const el = this.getEl(...targetIds);
    if (!el) return null;
    el.addEventListener(event, handler);
    return el;
  }

  clearFieldError(errorId, inputElement) {
    const errorElement = this.getEl(errorId);
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.classList.remove('show');
    }
    if (inputElement) {
      inputElement.setAttribute('aria-invalid', 'false');
    }
  }

  showFieldError(errorId, inputElement, message) {
    const errorElement = this.getEl(errorId);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.add('show');
    }
    if (inputElement) {
      inputElement.setAttribute('aria-invalid', 'true');
    }
  }

  validateResumeFields() {
    const requiredFields = [
      { element: this.getEl('fullName'), message: 'Full name is required.' },
      { element: this.getEl('email'), message: 'Email is required.' },
      { element: this.getEl('phone'), message: 'Phone number is required.' },
      { element: this.getEl('location'), message: 'Location is required.' },
      { element: this.getEl('dateOfBirth'), message: 'Date of birth is required.' },
      { element: this.getEl('gender'), message: 'Gender is required.' },
      { element: this.getEl('objective'), message: 'Career objective is required.' },
      { element: this.getEl('currentAddress'), message: 'Current address is required.' }
    ];

    let firstInvalid = null;
    let isValid = true;

    requiredFields.forEach(({ element, message }) => {
      if (!element) return;
      if (!this.isFieldVisible(element)) {
        element.setCustomValidity('');
        return;
      }
      const value = element.value.trim();
      if (!value) {
        isValid = false;
        element.setCustomValidity(message);
        if (!firstInvalid) firstInvalid = element;
      } else {
        element.setCustomValidity('');
      }
    });

    const emailInput = this.getEl('email');
    if (emailInput && this.isFieldVisible(emailInput)) {
      const emailValue = emailInput.value.trim();
      if (!emailValue) {
        isValid = false;
        emailInput.setCustomValidity('Email is required.');
        this.showFieldError('emailError', emailInput, 'Email is required.');
        if (!firstInvalid) firstInvalid = emailInput;
      } else if (!emailInput.checkValidity()) {
        isValid = false;
        emailInput.setCustomValidity('Please enter a valid email address.');
        this.showFieldError('emailError', emailInput, 'Please enter a valid email address.');
        if (!firstInvalid) firstInvalid = emailInput;
      } else {
        emailInput.setCustomValidity('');
        this.clearFieldError('emailError', emailInput);
      }
    } else if (emailInput) {
      emailInput.setCustomValidity('');
      this.clearFieldError('emailError', emailInput);
    }

    const phoneInput = this.getEl('phone');
    if (phoneInput && this.isFieldVisible(phoneInput)) {
      const phoneValue = phoneInput.value.trim();
      const phonePattern = /^[0-9+()\-\s]{7,20}$/;
      if (!phoneValue) {
        isValid = false;
        phoneInput.setCustomValidity('Phone number is required.');
        this.showFieldError('phoneError', phoneInput, 'Phone number is required.');
        if (!firstInvalid) firstInvalid = phoneInput;
      } else if (!phonePattern.test(phoneValue)) {
        isValid = false;
        phoneInput.setCustomValidity('Enter a valid phone number.');
        this.showFieldError('phoneError', phoneInput, 'Enter a valid phone number.');
        if (!firstInvalid) firstInvalid = phoneInput;
      } else {
        phoneInput.setCustomValidity('');
        this.clearFieldError('phoneError', phoneInput);
      }
    } else if (phoneInput) {
      phoneInput.setCustomValidity('');
      this.clearFieldError('phoneError', phoneInput);
    }

    if (!isValid && firstInvalid) {
      firstInvalid.reportValidity();
      firstInvalid.focus();
    }

    return isValid;
  }

  setupEventListeners() {
    // Photo Upload
    this.on(['profilePhoto', 'photoUpload'], 'change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.data.photo = e.target.result;
          const photoPreview = this.getEl('photoPreview');
          if (photoPreview) {
            photoPreview.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">`;
          }
          
          const resumePhoto = this.getEl('resumePhotoDisplay');
          const photoContainer = this.getEl('resumePhotoContainer');
          if (resumePhoto && photoContainer) {
              resumePhoto.src = this.data.photo;
              photoContainer.classList.remove('hidden');
          }
        };
        reader.readAsDataURL(file);
      }
    });

    // Personal Info
    this.on('fullName', 'input', (e) => {
      this.data.personal.name = e.target.value;
      this.updatePreview('resumeName', e.target.value || 'Your Name');
    });

    this.on('professionalTitle', 'input', (e) => {
      this.data.personal.professionalTitle = e.target.value;
      this.generatePreview();
    });

    this.on('email', 'input', (e) => {
      this.data.personal.email = e.target.value;
      this.updatePreview('resumeEmail', e.target.value || 'email@example.com');
    });

    this.on('phone', 'input', (e) => {
      this.data.personal.phone = e.target.value;
      this.updatePreview('resumePhone', e.target.value || '+1 (555) 123-4567');
    });

    const validationIds = ['fullName', 'email', 'phone', 'location', 'dateOfBirth', 'gender', 'objective', 'currentAddress'];
    validationIds.forEach((fieldId) => {
      const field = this.getEl(fieldId);
      if (!field) return;

      field.addEventListener('input', () => {
        field.setCustomValidity('');
        if (fieldId === 'email') {
          this.clearFieldError('emailError', field);
        }
        if (fieldId === 'phone') {
          this.clearFieldError('phoneError', field);
        }
      });

      field.addEventListener('blur', () => {
        if (fieldId === 'email' || fieldId === 'phone') {
          this.validateResumeFields();
        }
      });
    });

    this.on('location', 'input', (e) => {
      this.data.personal.location = e.target.value;
      this.updatePreview('resumeLocation', e.target.value || 'Location');
    });

    this.on(['professionalSummary', 'bio'], 'input', (e) => {
      this.data.personal.bio = e.target.value;
      this.updatePreview('resumeBio', e.target.value || 'Your professional summary will appear here.');
      this.toggleSection('bioSection', !!e.target.value);
    });

    // Additional personal fields
    const personalFieldMap = {
      professionalTitle: 'professionalTitle',
      dateOfBirth: 'dateOfBirth',
      gender: 'gender',
      religion: 'religion',
      hobbies: 'hobbies',
      objective: 'objective',
      currentAddress: 'currentAddress',
      permanentAddress: 'permanentAddress'
    };
    Object.keys(personalFieldMap).forEach((inputId) => {
      this.on(inputId, 'input', (e) => {
        this.data.personal[personalFieldMap[inputId]] = e.target.value;
        this.generatePreview();
      });
      this.on(inputId, 'change', (e) => {
        this.data.personal[personalFieldMap[inputId]] = e.target.value;
        this.generatePreview();
      });
    });

    // Skills
    this.on(['skillsInput', 'skillInput'], 'input', (e) => {
      const skills = e.target.value.split(',').map(s => s.trim()).filter(s => s);
      this.data.skills = skills;
      this.renderSkillsPreview();
      this.toggleSection('skillsSection', skills.length > 0);
    });

    // Add buttons
    this.on('addEducation', 'click', () => this.addEducation());
    this.on('addExperience', 'click', () => this.addExperience());
    this.on('addLanguage', 'click', () => this.addTemplateEntry('languageTemplate', 'languagesList'));
    this.on('addProject', 'click', () => this.addTemplateEntry('projectTemplate', 'projectsList'));
    this.on('addCertification', 'click', () => this.addTemplateEntry('certificationTemplate', 'certificationsList'));

    this.bindSupplementaryListListeners(this.getEl('languagesList'));
    this.bindSupplementaryListListeners(this.getEl('projectsList'));
    this.bindSupplementaryListListeners(this.getEl('certificationsList'));

    this.on('removePhoto', 'click', () => {
      this.data.photo = null;
      const photoPreview = this.getEl('photoPreview');
      if (photoPreview) {
        photoPreview.innerHTML = '<i class="fas fa-user-circle"></i><img id="profilePhotoImg" style="display: none;" alt="Profile Photo">';
      }
      const photoInput = this.getEl('profilePhoto', 'photoUpload');
      if (photoInput) {
        photoInput.value = '';
      }
      const removeBtn = this.getEl('removePhoto');
      if (removeBtn) {
        removeBtn.style.display = 'none';
      }
    });

    // Navbar Actions
    this.on('saveBtn', 'click', async () => {
      await this.saveToDatabase();
    });

    this.on('resetBtn', 'click', () => {
      const resetModal = this.getEl('resetModal');
      if (resetModal) {
        resetModal.classList.add('active');
      }
    });

    // Mobile navbar menu
    this.on('mobileMenuToggle', 'click', (e) => {
      e.stopPropagation();
      const mobileMenu = this.getEl('mobileNavDropdown');
      if (mobileMenu) {
        mobileMenu.classList.toggle('active');
      }
    });

    const schedulePreviewFit = () => {
      requestAnimationFrame(() => this.fitPreviewToSidebar());
      setTimeout(() => this.fitPreviewToSidebar(), 120);
    };

    const syncMobilePanelVisibility = () => {
      const isMobile = window.matchMedia('(max-width: 992px)').matches;
      const formPanel = this.getEl('formPanel');
      const templateSidebar = this.getEl('templateSidebar');
      const previewSidebar = this.getEl('previewSidebar');
      const formBtn = this.getEl('mobileFormBtn');
      const templatesBtn = this.getEl('mobileTemplatesBtn');
      const previewBtn = this.getEl('mobilePreviewSectionBtn');

      if (!formPanel || !templateSidebar || !previewSidebar || !formBtn || !templatesBtn || !previewBtn) {
        return;
      }

      const clearMobilePanelState = () => {
        formPanel.classList.remove('mobile-panel-hidden', 'mobile-panel-fullscreen');
        templateSidebar.classList.remove('mobile-panel-hidden', 'mobile-panel-fullscreen');
        previewSidebar.classList.remove('mobile-panel-hidden', 'mobile-panel-fullscreen');
      };

      if (!isMobile) {
        clearMobilePanelState();
        formBtn.classList.remove('active');
        templatesBtn.classList.remove('active');
        previewBtn.classList.remove('active');
        schedulePreviewFit();
        return;
      }

      // Default mobile state: show the resume form full-screen.
      formPanel.classList.remove('mobile-panel-hidden');
      formPanel.classList.add('mobile-panel-fullscreen');
      templateSidebar.classList.add('mobile-panel-hidden');
      previewSidebar.classList.add('mobile-panel-hidden');
      templateSidebar.classList.remove('mobile-panel-fullscreen');
      previewSidebar.classList.remove('mobile-panel-fullscreen');
      formBtn.classList.add('active');
      templatesBtn.classList.remove('active');
      previewBtn.classList.remove('active');
    };

    this.on('mobileFormBtn', 'click', () => {
      const formPanel = this.getEl('formPanel');
      const templateSidebar = this.getEl('templateSidebar');
      const previewSidebar = this.getEl('previewSidebar');
      const formBtn = this.getEl('mobileFormBtn');
      const templatesBtn = this.getEl('mobileTemplatesBtn');
      const previewBtn = this.getEl('mobilePreviewSectionBtn');
      if (!formPanel || !templateSidebar || !previewSidebar || !formBtn || !templatesBtn || !previewBtn) return;

      formPanel.classList.remove('mobile-panel-hidden');
      formPanel.classList.add('mobile-panel-fullscreen');
      templateSidebar.classList.add('mobile-panel-hidden');
      previewSidebar.classList.add('mobile-panel-hidden');
      templateSidebar.classList.remove('mobile-panel-fullscreen');
      previewSidebar.classList.remove('mobile-panel-fullscreen');
      formBtn.classList.add('active');
      templatesBtn.classList.remove('active');
      previewBtn.classList.remove('active');
      formPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });

      const mobileMenu = this.getEl('mobileNavDropdown');
      if (mobileMenu) mobileMenu.classList.remove('active');
    });

    this.on('mobileTemplatesBtn', 'click', () => {
      const formPanel = this.getEl('formPanel');
      const templateSidebar = this.getEl('templateSidebar');
      const previewSidebar = this.getEl('previewSidebar');
      const formBtn = this.getEl('mobileFormBtn');
      const templatesBtn = this.getEl('mobileTemplatesBtn');
      const previewBtn = this.getEl('mobilePreviewSectionBtn');
      if (!formPanel || !templateSidebar || !previewSidebar || !formBtn || !templatesBtn || !previewBtn) return;

      const isVisible = templateSidebar.classList.contains('mobile-panel-hidden');
      formPanel.classList.add('mobile-panel-hidden');
      formPanel.classList.remove('mobile-panel-fullscreen');
      templateSidebar.classList.toggle('mobile-panel-hidden', !isVisible);
      templateSidebar.classList.toggle('mobile-panel-fullscreen', isVisible);
      previewSidebar.classList.add('mobile-panel-hidden');
      previewSidebar.classList.remove('mobile-panel-fullscreen');
      formBtn.classList.remove('active');
      templatesBtn.classList.toggle('active', isVisible);
      previewBtn.classList.remove('active');

      if (isVisible) {
        templateSidebar.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      const mobileMenu = this.getEl('mobileNavDropdown');
      if (mobileMenu) mobileMenu.classList.remove('active');
    });

    this.on('mobilePreviewSectionBtn', 'click', () => {
      const formPanel = this.getEl('formPanel');
      const templateSidebar = this.getEl('templateSidebar');
      const previewSidebar = this.getEl('previewSidebar');
      const formBtn = this.getEl('mobileFormBtn');
      const templatesBtn = this.getEl('mobileTemplatesBtn');
      const previewBtn = this.getEl('mobilePreviewSectionBtn');
      if (!formPanel || !templateSidebar || !previewSidebar || !formBtn || !templatesBtn || !previewBtn) return;

      const isVisible = previewSidebar.classList.contains('mobile-panel-hidden');
      formPanel.classList.add('mobile-panel-hidden');
      formPanel.classList.remove('mobile-panel-fullscreen');
      templateSidebar.classList.add('mobile-panel-hidden');
      templateSidebar.classList.remove('mobile-panel-fullscreen');
      previewSidebar.classList.toggle('mobile-panel-hidden', !isVisible);
      previewSidebar.classList.toggle('mobile-panel-fullscreen', isVisible);
      formBtn.classList.remove('active');
      templatesBtn.classList.remove('active');
      previewBtn.classList.toggle('active', isVisible);

      if (isVisible) {
        previewSidebar.scrollIntoView({ behavior: 'smooth', block: 'start' });
        schedulePreviewFit();
      }

      const mobileMenu = this.getEl('mobileNavDropdown');
      if (mobileMenu) mobileMenu.classList.remove('active');
    });

    window.addEventListener('resize', () => {
      syncMobilePanelVisibility();
      schedulePreviewFit();
    });
    window.addEventListener('orientationchange', schedulePreviewFit);
    syncMobilePanelVisibility();

    this.on('mobileSaveBtn', 'click', async () => {
      await this.saveToDatabase();
      const mobileMenu = this.getEl('mobileNavDropdown');
      if (mobileMenu) mobileMenu.classList.remove('active');
    });

    this.on('mobileExportPdfBtn', 'click', () => {
      this.exportAsPdf();
      const mobileMenu = this.getEl('mobileNavDropdown');
      if (mobileMenu) mobileMenu.classList.remove('active');
    });

    this.on('mobileResetBtn', 'click', () => {
      this.getEl('resetBtn')?.click();
      const mobileMenu = this.getEl('mobileNavDropdown');
      if (mobileMenu) mobileMenu.classList.remove('active');
    });

    // Toggle Theme
    const themeToggle = document.querySelector('.theme-toggle');
    const mobileThemeBtn = this.getEl('mobileThemeBtn');
    const applyTheme = () => {
      const isDark = document.body.classList.contains('dark-mode');
      const themeIcon = document.querySelector('.theme-toggle i');
      if (themeIcon) {
        themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
      }
      if (mobileThemeBtn) {
        mobileThemeBtn.innerHTML = `${isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>'} Toggle Theme`;
      }
      this.data.theme = isDark ? 'dark' : 'light';
    };

    const toggleTheme = () => {
      document.body.classList.toggle('dark-mode');
      applyTheme();
    };

    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }

    if (mobileThemeBtn) {
      mobileThemeBtn.addEventListener('click', () => {
        toggleTheme();
        const mobileMenu = this.getEl('mobileNavDropdown');
        if (mobileMenu) mobileMenu.classList.remove('active');
      });
      applyTheme();
    }

    // Export Dropdown
    this.on('exportBtn', 'click', (e) => {
        e.stopPropagation();
        const dropdown = this.getEl('exportDropdown');
        if (dropdown) dropdown.classList.toggle('show');
    });

    this.on('exportPdfNav', 'click', (e) => {
      e.preventDefault();
      this.exportAsPdf();
    });

    document.addEventListener('click', () => {
        const dropdown = document.getElementById('exportDropdown');
        if (dropdown) dropdown.classList.remove('show');
      const mobileMenu = document.getElementById('mobileNavDropdown');
      if (mobileMenu) mobileMenu.classList.remove('active');
    });
  }

  setupTemplateListeners() {
    const allowedTemplates = new Set(['seema', 'lorna', 'richard']);
    const templates = document.querySelectorAll('.template-item');
    templates.forEach(t => {
      if (!allowedTemplates.has(t.dataset.template)) {
        t.style.display = 'none';
        return;
      }

      t.addEventListener('click', () => {
        // Remove active class
        templates.forEach(i => i.classList.remove('active'));
        // Add active to current
        t.classList.add('active');
        
        const templateName = t.dataset.template;
        this.data.template = templateName;
        this.applyTemplateFieldVisibility(templateName);

        // Re-render dynamic preview with selected template.
        this.generatePreview();
      });
    });

    // Categories
    const categories = document.querySelectorAll('.category-btn');
    categories.forEach(c => {
      c.addEventListener('click', () => {
        categories.forEach(i => i.classList.remove('active'));
        c.classList.add('active');
        
        const cat = c.dataset.category;
        document.querySelectorAll('.template-item').forEach(item => {
          if (!allowedTemplates.has(item.dataset.template)) {
            item.style.display = 'none';
            return;
          }
          if (cat === 'all' || item.dataset.category === cat) {
            item.style.display = 'block';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  }

  isFieldVisible(element) {
    if (!element) return false;
    if (element.closest('.template-field-hidden')) return false;

    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }

  setBlockVisibility(block, visible) {
    if (!block) return;

    block.classList.toggle('template-field-hidden', !visible);

    const controls = block.matches('input, select, textarea, button')
      ? [block]
      : Array.from(block.querySelectorAll('input, select, textarea, button'));

    controls.forEach((control) => {
      if (!Object.prototype.hasOwnProperty.call(control.dataset, 'originalRequired')) {
        control.dataset.originalRequired = control.required ? 'true' : 'false';
      }

      if (!visible) {
        control.required = false;
        control.disabled = true;
        if (typeof control.setCustomValidity === 'function') {
          control.setCustomValidity('');
        }
      } else {
        control.disabled = false;
        control.required = control.dataset.originalRequired === 'true';
      }
    });
  }

  setInputVisibility(fieldId, visible) {
    const field = this.getEl(fieldId);
    if (!field) return;
    const wrapper = field.closest('.form-floating, .form-group') || field;
    this.setBlockVisibility(wrapper, visible);
  }

  applyTemplateFieldVisibility(templateName = this.data.template || 'seema') {
    const isLorna = templateName === 'lorna';
    const isRichard = templateName === 'richard';
    const needsPhotoLayout = isLorna || isRichard;

    const profilePhotoSection = document.querySelector('.profile-photo-section');
    this.setBlockVisibility(profilePhotoSection, needsPhotoLayout);

    // Hide personal fields that are not used by current template previews.
    ['gender', 'religion', 'hobbies', 'objective', 'currentAddress', 'permanentAddress'].forEach((id) => {
      this.setInputVisibility(id, false);
    });

    // Seema supports DOB; Lorna layout omits it.
    this.setInputVisibility('dateOfBirth', !isLorna && !isRichard);

    // Seema uses these as references/awards; Lorna does not display them.
    this.setBlockVisibility(this.getEl('projects'), !isLorna);
    this.setBlockVisibility(this.getEl('certifications'), !isLorna && !isRichard);
  }

  setupModalListeners() {
    // User Avatar Dropdown
    this.on('userAvatar', 'click', () => {
      const dropdown = document.getElementById('userDropdown');
      if (dropdown) {
        dropdown.classList.toggle('show');
      }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.user-menu')) {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
          dropdown.classList.remove('show');
        }
      }
    });

    // Preview Modal
    this.on('previewBtn', 'click', () => {
      this.generatePreview();
      const modal = this.getEl('previewModal');
      const fullPreview = this.getEl('fullResumePreview');
      const sourcePreview = this.getEl('resumePreview');
      if (!modal || !fullPreview || !sourcePreview) return;

      fullPreview.innerHTML = sourcePreview.innerHTML;
      modal.classList.add('active');
    });

    this.on('closePreviewModal', 'click', () => {
      const modal = this.getEl('previewModal');
      if (modal) {
        modal.classList.remove('active');
      }
    });

    this.on('editResumeBtn', 'click', () => {
      const modal = this.getEl('previewModal');
      if (modal) {
        modal.classList.remove('active');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    this.on('exportBtnModal', 'click', () => {
      this.exportAsPdf();
    });

    // Wizard Modal
    this.on('openWizardBtn', 'click', () => {
        const wizardModal = this.getEl('templateWizardModal', 'wizardModal');
        if (wizardModal) wizardModal.classList.add('active');
    });

    this.on('closeWizardModal', 'click', () => {
      const wizardModal = this.getEl('templateWizardModal', 'wizardModal');
      if (wizardModal) wizardModal.classList.remove('active');
    });

    const logoutModal = this.getEl('logoutModal');
    const openLogoutModal = (event) => {
      if (event) {
        event.preventDefault();
      }
      if (logoutModal) {
        logoutModal.classList.add('active');
      }
    };

    const closeLogoutModal = () => {
      if (logoutModal) {
        logoutModal.classList.remove('active');
      }
    };

    const confirmLogout = () => {
      localStorage.removeItem('token');
      window.location.href = '/logout';
    };

    this.on('logoutBtn', 'click', openLogoutModal);
    this.on('mobileLogoutBtn', 'click', openLogoutModal);
    this.on('closeLogoutModal', 'click', closeLogoutModal);
    this.on('cancelLogoutBtn', 'click', closeLogoutModal);
    this.on('confirmLogoutBtn', 'click', confirmLogout);

    if (logoutModal) {
      logoutModal.addEventListener('click', (event) => {
        if (event.target === logoutModal) {
          closeLogoutModal();
        }
      });
    }

    const resetModal = this.getEl('resetModal');
    const closeResetModal = () => {
      if (resetModal) {
        resetModal.classList.remove('active');
      }
    };

    const confirmReset = () => {
      this.data = {
        title: '',
        photo: null,
        personal: {
          name: '', professionalTitle: '', email: '', phone: '', location: '', bio: '',
          dateOfBirth: '', gender: '', religion: '', hobbies: '',
          objective: '', currentAddress: '', permanentAddress: ''
        },
        education: [],
        experience: [],
        skills: [],
        languages: [],
        projects: [],
        certifications: [],
        template: 'seema',
        theme: 'light'
      };
      this.currentResumeId = null;
      closeResetModal();

      const photoPreview = this.getEl('photoPreview');
      if (photoPreview) {
        photoPreview.innerHTML = '<i class="fas fa-user-circle"></i><img id="profilePhotoImg" style="display: none;" alt="Profile Photo">';
      }
      const photoInput = this.getEl('profilePhoto', 'photoUpload');
      if (photoInput) {
        photoInput.value = '';
      }
      const removeBtn = this.getEl('removePhoto');
      if (removeBtn) {
        removeBtn.style.display = 'none';
      }

      window.history.replaceState({}, '', '/builder');
      this.hydrateForm();
      this.addFirstEducation();
      this.addFirstExperience();
      this.applyTemplateFieldVisibility(this.data.template);
      this.generatePreview();
      showToast('All data has been reset.', 'success');
    };

    this.on('closeResetModal', 'click', closeResetModal);
    this.on('cancelResetBtn', 'click', closeResetModal);
    this.on('confirmResetBtn', 'click', confirmReset);

    if (resetModal) {
      resetModal.addEventListener('click', (event) => {
        if (event.target === resetModal) {
          closeResetModal();
        }
      });
    }

    this.setupWizardHandlers();

    // Close Modals on outside click
    window.onclick = (event) => {
      if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
        event.target.style.display = 'none';
      }
    };

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        const logoutModal = this.getEl('logoutModal');
        if (logoutModal) {
          logoutModal.classList.remove('active');
        }
        const resetModal = this.getEl('resetModal');
        if (resetModal) {
          resetModal.classList.remove('active');
        }
      }
    });
  }

  addTemplateEntry(templateId, listId) {
    const template = this.getEl(templateId);
    const list = this.getEl(listId);
    if (!template || !list) return;

    const clone = template.content.cloneNode(true);
    list.appendChild(clone);

    // Keep supplemental sections (language/project/certification) in sync.
    this.bindSupplementaryListListeners(list);
    this.updateSupplementaryData();
    this.generatePreview();
  }

  bindSupplementaryListListeners(list) {
    if (!list || list.dataset.bound === 'true') return;

    list.addEventListener('input', () => {
      this.updateSupplementaryData();
      this.generatePreview();
    });
    list.addEventListener('change', () => {
      this.updateSupplementaryData();
      this.generatePreview();
    });
    list.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.delete-entry');
      if (deleteBtn) {
        e.preventDefault();
        const entry = deleteBtn.closest('.entry-item');
        if (entry) {
          entry.remove();
          this.updateSupplementaryData();
          this.generatePreview();
        }
      }
    });

    list.dataset.bound = 'true';
  }

  updateSupplementaryData() {
    const languagesList = this.getEl('languagesList');
    const projectsList = this.getEl('projectsList');
    const certificationsList = this.getEl('certificationsList');

    this.data.languages = Array.from(languagesList?.querySelectorAll('.entry-item') || []).map((entry) => ({
      name: entry.querySelector('.language-name')?.value?.trim() || '',
      proficiency: entry.querySelector('.proficiency')?.value?.trim() || ''
    })).filter((item) => item.name || item.proficiency);

    this.data.projects = Array.from(projectsList?.querySelectorAll('.entry-item') || []).map((entry) => ({
      name: entry.querySelector('.project-title')?.value?.trim() || '',
      links: entry.querySelector('.project-url')?.value?.trim() || '',
      description: entry.querySelector('.project-description')?.value?.trim() || ''
    })).filter((item) => item.name || item.links || item.description);

    this.data.certifications = Array.from(certificationsList?.querySelectorAll('.entry-item') || []).map((entry) => ({
      name: entry.querySelector('.cert-name')?.value?.trim() || '',
      issuer: entry.querySelector('.issuer')?.value?.trim() || '',
      date: entry.querySelector('.issue-date')?.value?.trim() || '',
      expiryDate: entry.querySelector('.expiry-date')?.value?.trim() || '',
      credentialId: entry.querySelector('.credential-id')?.value?.trim() || ''
    })).filter((item) => item.name || item.issuer || item.date || item.expiryDate || item.credentialId);
  }

  setupWizardHandlers() {
    const steps = Array.from(document.querySelectorAll('.wizard-step'));
    const nextBtn = this.getEl('wizardNext');
    const prevBtn = this.getEl('wizardPrev');
    if (!steps.length || !nextBtn || !prevBtn) return;

    let currentStep = 0;
    const showStep = (index) => {
      steps.forEach((step, i) => step.classList.toggle('active', i === index));
      prevBtn.style.display = index === 0 ? 'none' : 'inline-flex';
      nextBtn.innerHTML = index === steps.length - 1 ? 'Apply <i class="fas fa-check"></i>' : 'Next <i class="fas fa-arrow-right"></i>';
    };

    showStep(0);

    prevBtn.addEventListener('click', () => {
      if (currentStep > 0) {
        currentStep -= 1;
        showStep(currentStep);
      }
    });

    nextBtn.addEventListener('click', () => {
      if (currentStep < steps.length - 1) {
        currentStep += 1;
        showStep(currentStep);
      } else {
        const wizardModal = this.getEl('templateWizardModal', 'wizardModal');
        if (wizardModal) wizardModal.classList.remove('active');
      }
    });
  }

  async markDownload() {
    if (!this.currentResumeId || !this.token) return;

    try {
      await fetch(`/api/resumes/${this.currentResumeId}/download`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
    } catch (error) {
      console.error('Failed to update download count:', error);
    }
  }

  buildExportSnapshot() {
    // Ensure all current form values are reflected in state before snapshot.
    this.updateEducation();
    this.updateExperience();
    this.updateSupplementaryData();
    this.generatePreview();

    const sourcePreview = this.getEl('resumePreview');
    if (!sourcePreview) return null;

    // Export from an off-DOM clone without scroll/height constraints.
    const exportRoot = document.createElement('div');
    exportRoot.style.background = '#ffffff';
    exportRoot.style.color = '#111827';
    exportRoot.style.width = '794px';
    exportRoot.style.maxWidth = '100%';
    exportRoot.style.padding = '24px';
    exportRoot.style.boxSizing = 'border-box';
    exportRoot.style.overflow = 'visible';
    exportRoot.style.maxHeight = 'none';
    exportRoot.style.height = 'auto';

    exportRoot.innerHTML = sourcePreview.innerHTML;
    return exportRoot;
  }

  inlineComputedStyles(rootElement) {
    if (!rootElement) return;

    const applyStyles = (node) => {
      if (!(node instanceof HTMLElement)) return;

      const computed = window.getComputedStyle(node);
      const inline = Array.from(computed)
        .map((prop) => `${prop}:${computed.getPropertyValue(prop)};`)
        .join(' ');

      node.setAttribute('style', inline);

      // Keep images correctly sized in Word output.
      if (node.tagName === 'IMG') {
        const rect = node.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          node.style.width = `${Math.round(rect.width)}px`;
          node.style.height = `${Math.round(rect.height)}px`;
          node.style.objectFit = computed.objectFit || 'cover';
        }
      }

      Array.from(node.children).forEach((child) => applyStyles(child));
    };

    applyStyles(rootElement);
  }

  exportAsPdf() {
    if (!this.validateResumeFields()) {
      return;
    }

    const exportSnapshot = this.buildExportSnapshot();
    if (!exportSnapshot) return;

    if (typeof html2pdf === 'undefined') {
      showToast('PDF library is still loading. Please try again.', 'error');
      return;
    }

    const title = (this.data.title || this.getAutoResumeTitle() || 'resume')
      .toLowerCase().replace(/[^a-z0-9]+/g, '_');

    html2pdf().set({
      margin: 0.5,
      filename: `${title}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }).from(exportSnapshot).save().then(() => {
      this.markDownload();
    }).catch((error) => {
      console.error('PDF export failed:', error);
      showToast('Failed to export PDF. Please try again.', 'error');
    });
  }


  addEducation() {
    const id = this.educationCount++;
    const html = `
      <div class="entry-item" data-id="${id}">
        <button type="button" class="btn-icon delete entry-delete-btn" onclick="builder.removeEducation(${id})" title="Remove education">
          <i class="fas fa-trash"></i>
        </button>
        <div class="form-group">
          <label data-translate="School/University">School/University</label>
          <input type="text" placeholder="Harvard University" data-edu-field="school" data-id="${id}" class="edu-input" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label data-translate="Degree">Degree</label>
            <input type="text" placeholder="Bachelor of Science" data-edu-field="degree" data-id="${id}" class="edu-input" />
          </div>
          <div class="form-group">
            <label data-translate="Field of Study">Field of Study</label>
            <input type="text" placeholder="Computer Science" data-edu-field="field" data-id="${id}" class="edu-input" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label data-translate="Start Year">Start Year</label>
            <input type="number" placeholder="2018" data-edu-field="startYear" data-id="${id}" class="edu-input" />
          </div>
          <div class="form-group">
            <label data-translate="End Year">End Year</label>
            <input type="number" placeholder="2022" data-edu-field="endYear" data-id="${id}" class="edu-input" />
          </div>
        </div>
      </div>
    `;

    const container = this.getEl('educationList');
    if (!container) return;
    container.insertAdjacentHTML('beforeend', html);

    const inputs = container.querySelectorAll(`[data-id="${id}"]`);
    inputs.forEach(input => {
      input.addEventListener('input', () => this.updateEducation());
    });
  }

  addExperience() {
    const id = this.experienceCount++;
    const html = `
      <div class="entry-item" data-id="${id}">
        <button type="button" class="btn-icon delete entry-delete-btn" onclick="builder.removeExperience(${id})" title="Remove experience">
          <i class="fas fa-trash"></i>
        </button>
        <div class="form-group">
          <label data-translate="Job Title">Job Title</label>
          <input type="text" placeholder="Software Engineer" data-exp-field="title" data-id="${id}" class="exp-input" />
        </div>
        <div class="form-group">
          <label data-translate="Company">Company</label>
          <input type="text" placeholder="Tech Company Inc." data-exp-field="company" data-id="${id}" class="exp-input" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label data-translate="Start Date">Start Date</label>
            <input type="month" data-exp-field="startDate" data-id="${id}" class="exp-input" />
          </div>
          <div class="form-group">
            <label data-translate="End Date">End Date</label>
            <input type="month" data-exp-field="endDate" data-id="${id}" class="exp-input" />
          </div>
        </div>
        <div class="form-group">
          <label data-translate="Description">Description</label>
          <textarea placeholder="Describe your responsibilities and achievements..." data-exp-field="description" data-id="${id}" class="exp-input" rows="3"></textarea>
        </div>
      </div>
    `;

    const container = this.getEl('workExperienceList', 'experienceList');
    if (!container) return;
    container.insertAdjacentHTML('beforeend', html);

    const inputs = container.querySelectorAll(`[data-id="${id}"]`);
    inputs.forEach(input => {
      input.addEventListener('input', () => this.updateExperience());
    });
  }

  addFirstEducation() {
    const list = this.getEl('educationList');
    if (list && list.children.length === 0) {
      this.addEducation();
    }
  }

  addFirstExperience() {
    const list = this.getEl('workExperienceList', 'experienceList');
    if (list && list.children.length === 0) {
      this.addExperience();
    }
  }

  removeEducation(id) {
    document.querySelector(`[data-id="${id}"]`)?.remove();
    this.data.education = this.data.education.filter(e => e.id !== id);
    this.updateEducationPreview();
  }

  removeExperience(id) {
    document.querySelector(`[data-id="${id}"]`)?.remove();
    this.data.experience = this.data.experience.filter(e => e.id !== id);
    this.updateExperiencePreview();
  }

  updateEducation() {
    const items = document.querySelectorAll('#educationList .entry-item');
    this.data.education = [];

    items.forEach((item, idx) => {
      const inputs = item.querySelectorAll('input');
      this.data.education.push({
        id: idx,
        school: inputs[0].value,
        degree: inputs[1].value,
        field: inputs[2].value,
        startYear: inputs[3].value,
        endYear: inputs[4].value
      });
    });

    this.updateEducationPreview();
  }

  updateExperience() {
    const items = document.querySelectorAll('#workExperienceList .entry-item, #experienceList .entry-item');
    this.data.experience = [];

    items.forEach((item, idx) => {
      const inputs = item.querySelectorAll('input, textarea');
      this.data.experience.push({
        id: idx,
        title: inputs[0].value,
        company: inputs[1].value,
        startDate: inputs[2].value,
        endDate: inputs[3].value,
        description: inputs[4].value
      });
    });

    this.generatePreview();
  }

  updateEducationPreview() {
    this.generatePreview();
  }

  updateExperiencePreview() {
    this.generatePreview();
  }

  generatePreview() {
    this.updateSupplementaryData();

    const preview = this.getEl('resumePreview');
    if (!preview) return;
    preview.innerHTML = '';
    preview.setAttribute('data-template', this.data.template || 'seema');
    const previewCanvas = document.createElement('div');
    previewCanvas.className = 'preview-canvas';
    preview.appendChild(previewCanvas);

    const template = this.data.template || 'seema';
    const title = this.data.title || this.getAutoResumeTitle();
    const fullName = this.data.personal.name || 'Your Name';
    const professionalTitle = this.data.personal.professionalTitle || '';
    const initials = fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'CV';

    // Add resume title at the top
    const titleElement = document.createElement('div');
    titleElement.style.cssText = 'font-size:18px; font-weight:700; color:#111827; margin-bottom:16px; padding:10px 0; border-bottom:2px solid #e5e7eb;';
    titleElement.textContent = title;
    previewCanvas.appendChild(titleElement);
    const summaryText = this.data.personal.objective || this.data.personal.bio || 'Add a short professional summary.';
    const sectionTitle = (label) => `<h3 style="margin: 0 0 14px; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; color: #111827;">${label}</h3>`;
    const stack = (items, fallback) => items.length ? items.join('') : fallback;
    const skillsList = stack((this.data.skills || []).map(skill => `<li style="margin: 0 0 10px 18px; color: #374151;">${skill}</li>`), '<li style="margin: 0 0 10px 18px; color: #9ca3af;">Add skills</li>');
    const languagesList = stack((this.data.languages || []).map(lang => `<li style="margin: 0 0 10px 18px; color: #374151;">${lang.name || 'Language'}${lang.proficiency ? ` <span style="color:#9ca3af;">(${lang.proficiency})</span>` : ''}</li>`), '<li style="margin: 0 0 10px 18px; color: #9ca3af;">Add languages</li>');
    const awardsList = stack((this.data.certifications || []).map(cert => `<li style="margin: 0 0 10px 18px; color: #374151;">${cert.name || 'Award'}${cert.issuer ? `<span style="color:#9ca3af;"> - ${cert.issuer}</span>` : ''}</li>`), '<li style="margin: 0 0 10px 18px; color: #9ca3af;">Add awards</li>');
    const referencesList = stack((this.data.projects || []).map(proj => `<div style="margin-bottom: 14px;"><strong style="display:block; color:#111827;">${proj.name || 'Reference'}</strong>${proj.description ? `<div style="font-size:13px; color:#6b7280; line-height:1.45;">${proj.description}</div>` : ''}</div>`), '<div style="color:#9ca3af; font-size:13px;">Add references</div>');

    const sectionBlock = (titleText, innerHtml, extraStyle = '') => {
      const block = document.createElement('section');
      block.className = 'resume-section';
      block.style.cssText = `${extraStyle} background: transparent;`;
      block.innerHTML = `${sectionTitle(titleText)}${innerHtml}`;
      return block;
    };

    const buildExperienceItems = (compact = false) => stack((this.data.experience || []).map(exp => compact
      ? `<div style="margin-bottom: 16px;"><div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap;"><div><strong style="color:#111827;">${exp.title || 'Job Title'}</strong><div style="font-size:13px; color:#6b7280;">${exp.company || 'Company'}</div></div><div style="font-size:12px; color:#9ca3af; white-space:nowrap;">${exp.startDate || 'Start'} - ${exp.endDate || 'Present'}</div></div><p style="margin:8px 0 0; font-size:13px; color:#4b5563; line-height:1.55;">${exp.description || ''}</p></div>`
      : `<div style="margin-bottom: 18px;"><div style="display:grid; grid-template-columns: 120px 1fr; gap: 14px; align-items:start;"><div style="font-size:12px; color:#9ca3af;">${exp.startDate || 'Start'} - ${exp.endDate || 'Present'}</div><div><strong style="color:#111827; display:block;">${exp.title || 'Job Title'}</strong><div style="font-size:13px; color:#6b7280; margin:2px 0 8px;">${exp.company || 'Company'}</div><div style="font-size:13px; color:#4b5563; line-height:1.55;">${exp.description || ''}</div></div></div></div>`
    ), '<div style="color:#9ca3af; font-size:13px;">Add experience entries</div>');

    const buildEducationItems = (compact = false) => stack((this.data.education || []).map(edu => compact
      ? `<div style="margin-bottom: 16px;"><div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap;"><div><strong style="color:#111827;">${edu.degree || 'Degree'}</strong><div style="font-size:13px; color:#6b7280;">${edu.school || 'School'}</div></div><div style="font-size:12px; color:#9ca3af; white-space:nowrap;">${edu.startYear || 'Start'} - ${edu.endYear || 'End'}</div></div>${edu.field ? `<div style="margin-top:6px; font-size:13px; color:#4b5563;">${edu.field}</div>` : ''}</div>`
      : `<div style="margin-bottom: 16px;"><div style="display:grid; grid-template-columns: 120px 1fr; gap: 14px; align-items:start;"><div style="font-size:12px; color:#9ca3af;">${edu.startYear || 'Start'} - ${edu.endYear || 'End'}</div><div><strong style="color:#111827; display:block;">${edu.degree || 'Degree'}</strong><div style="font-size:13px; color:#6b7280; margin:2px 0 8px;">${edu.school || 'School'}</div>${edu.field ? `<div style="font-size:13px; color:#4b5563;">${edu.field}</div>` : ''}</div></div></div>`
    ), '<div style="color:#9ca3af; font-size:13px;">Add education entries</div>');

    const contactBlock = `
      <div style="display:grid; gap:10px; font-size:13px; color:#374151; line-height:1.5;">
        ${this.data.personal.email ? `<div><i class="fas fa-envelope" style="width:16px; color:#6b7280;"></i> ${this.data.personal.email}</div>` : ''}
        ${this.data.personal.phone ? `<div><i class="fas fa-phone" style="width:16px; color:#6b7280;"></i> ${this.data.personal.phone}</div>` : ''}
        ${this.data.personal.location ? `<div><i class="fas fa-map-marker-alt" style="width:16px; color:#6b7280;"></i> ${this.data.personal.location}</div>` : ''}
      </div>
    `;

    if (template === 'richard') {
      const richardSkillsList = skillsList
        .replace(/color:\s*#374151;/g, 'color:#e2e8f0;')
        .replace(/color:\s*#9ca3af;/g, 'color:#cbd5e1;');
      const richardLanguagesList = languagesList
        .replace(/color:\s*#374151;/g, 'color:#e2e8f0;')
        .replace(/color:\s*#9ca3af;/g, 'color:#cbd5e1;');

      const educationCompact = stack((this.data.education || []).map((edu) => `
        <div style="margin-bottom:12px;">
          <div style="font-size:11px; color:#e2e8f0; font-weight:700;">${edu.startYear || 'Start'} - ${edu.endYear || 'End'}</div>
          <div style="font-size:12px; color:#ffffff; font-weight:700; margin-top:2px;">${edu.school || 'School'}</div>
          <div style="font-size:11px; color:#cbd5e1; margin-top:2px;">${edu.degree || 'Degree'}</div>
        </div>
      `), '<div style="font-size:12px; color:#cbd5e1;">Add education entries</div>');

      const references = (this.data.projects || []).slice(0, 2);
      const referencesHtml = references.length
        ? references.map((proj) => `
          <div style="border:1px solid #cbd5e1; padding:10px 12px; border-radius:4px;">
            <div style="font-size:13px; color:#0f172a; font-weight:700;">${proj.name || 'Reference'}</div>
            <div style="font-size:11px; color:#475569; margin-top:4px;">${proj.description || 'Professional reference available on request.'}</div>
            <div style="font-size:11px; color:#64748b; margin-top:6px;">Phone: ${this.data.personal.phone || 'Not provided'}</div>
            <div style="font-size:11px; color:#64748b;">Email: ${this.data.personal.email || 'Not provided'}</div>
          </div>
        `).join('')
        : '<div style="font-size:12px; color:#94a3b8;">Add project entries to generate references</div>';

      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'display:grid; grid-template-columns: 240px 1fr; margin:0 -20px -20px -20px; min-height:980px;';

      const left = document.createElement('aside');
      left.style.cssText = 'background:#153a57; color:#fff; padding:26px 18px; display:grid; align-content:start; gap:20px;';
      left.innerHTML = `
        <div style="display:flex; justify-content:center;">
          <div style="width:120px; height:120px; border-radius:50%; overflow:hidden; border:4px solid rgba(255,255,255,0.9); background:#e2e8f0; display:flex; align-items:center; justify-content:center; color:#0f172a; font-weight:800; font-size:36px;">
            ${this.data.photo ? `<img src="${this.data.photo}" alt="Profile Photo" style="width:100%; height:100%; object-fit:cover;">` : initials}
          </div>
        </div>
        <div>
          <div style="font-size:28px; font-weight:800; line-height:0.98; letter-spacing:0.02em;">${fullName.toUpperCase()}</div>
          ${professionalTitle ? `<div style="margin-top:6px; font-size:12px; letter-spacing:0.14em; text-transform:uppercase; color:#cbd5e1;">${professionalTitle}</div>` : ''}
        </div>
        <div>
          ${sectionTitle('CONTACT').replace('color: #111827;', 'color:#ffffff;')}
          <div style="height:1px; background:rgba(255,255,255,0.45); margin:6px 0 10px;"></div>
          <div style="display:grid; gap:8px; font-size:12px; color:#e2e8f0; line-height:1.45;">
            ${this.data.personal.phone ? `<div><i class="fas fa-phone" style="width:14px;"></i> ${this.data.personal.phone}</div>` : ''}
            ${this.data.personal.email ? `<div><i class="fas fa-envelope" style="width:14px;"></i> ${this.data.personal.email}</div>` : ''}
            ${this.data.personal.location ? `<div><i class="fas fa-map-marker-alt" style="width:14px;"></i> ${this.data.personal.location}</div>` : ''}
          </div>
        </div>
        <div>
          ${sectionTitle('EDUCATION').replace('color: #111827;', 'color:#ffffff;')}
          <div style="height:1px; background:rgba(255,255,255,0.45); margin:6px 0 10px;"></div>
          ${educationCompact}
        </div>
        <div>
          ${sectionTitle('SKILLS').replace('color: #111827;', 'color:#ffffff;')}
          <div style="height:1px; background:rgba(255,255,255,0.45); margin:6px 0 10px;"></div>
          <ul style="margin:0; padding-left:18px; color:#e2e8f0; font-size:12px; line-height:1.6;">${richardSkillsList}</ul>
        </div>
        <div>
          ${sectionTitle('LANGUAGES').replace('color: #111827;', 'color:#ffffff;')}
          <div style="height:1px; background:rgba(255,255,255,0.45); margin:6px 0 10px;"></div>
          <ul style="margin:0; padding-left:18px; color:#e2e8f0; font-size:12px; line-height:1.6;">${richardLanguagesList}</ul>
        </div>
      `;

      const right = document.createElement('main');
      right.style.cssText = 'padding:24px 26px 28px; background:#f8fafc; display:grid; align-content:start; gap:18px;';
      right.innerHTML = `
        <div style="border-bottom:1px solid #cbd5e1; padding-bottom:12px;">
          <div style="display:flex; justify-content:space-between; gap:16px; align-items:flex-start; flex-wrap:wrap;">
            <div>
              <div style="font-size:46px; font-weight:800; line-height:0.95; color:#0f172a; letter-spacing:0.03em;">${fullName.toUpperCase()}</div>
              ${professionalTitle ? `<div style="font-size:16px; color:#475569; margin-top:8px; letter-spacing:0.04em; text-transform:uppercase;">${professionalTitle}</div>` : ''}
            </div>
            <div style="display:grid; gap:6px; font-size:12px; color:#334155; min-width:230px;">
              ${this.data.personal.phone ? `<div><i class="fas fa-phone" style="width:14px;"></i> ${this.data.personal.phone}</div>` : ''}
              ${this.data.personal.email ? `<div><i class="fas fa-envelope" style="width:14px;"></i> ${this.data.personal.email}</div>` : ''}
              ${this.data.personal.location ? `<div><i class="fas fa-map-marker-alt" style="width:14px;"></i> ${this.data.personal.location}</div>` : ''}
              ${this.data.personal.dateOfBirth ? `<div><i class="fas fa-globe" style="width:14px;"></i> ${new Date(this.data.personal.dateOfBirth).toLocaleDateString()}</div>` : ''}
            </div>
          </div>
        </div>
        <div>
          ${sectionTitle('PROFILE')}
          <div style="border-top:1px solid #94a3b8; margin:6px 0 10px;"></div>
          <div style="font-size:13px; color:#334155; line-height:1.75;">${summaryText}</div>
        </div>
        <div>
          ${sectionTitle('WORK EXPERIENCE')}
          <div style="border-top:1px solid #94a3b8; margin:6px 0 10px;"></div>
          ${buildExperienceItems(false)}
        </div>
        <div>
          ${sectionTitle('REFERENCE')}
          <div style="border-top:1px solid #94a3b8; margin:6px 0 10px;"></div>
          <div style="display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:10px;">${referencesHtml}</div>
        </div>
      `;

      wrapper.appendChild(left);
      wrapper.appendChild(right);
      previewCanvas.appendChild(wrapper);
      this.fitPreviewToSidebar();
      return;
    }

    if (template === 'lorna') {
      const header = document.createElement('div');
      header.style.cssText = 'display:flex; align-items:center; gap:22px; background:#bdbdbd; color:#111827; padding:26px 28px; margin:-20px -20px 24px -20px; border-radius:8px 8px 0 0;';
      header.innerHTML = `
        <div style="width:102px; height:102px; border-radius:50%; overflow:hidden; flex:0 0 auto; background:#ececec; border:4px solid rgba(255,255,255,0.85); box-shadow:0 8px 18px rgba(0,0,0,0.08);">
          ${this.data.photo ? `<img src="${this.data.photo}" alt="Profile Photo" style="width:100%; height:100%; object-fit:cover;">` : ''}
        </div>
        <div style="min-width:0; flex:1; text-align:left;">
          <div style="font-size:12px; letter-spacing:0.2em; text-transform:uppercase; color:#374151; margin-bottom:8px;">Resume</div>
          <h1 style="margin:0; font-size:42px; line-height:0.95; font-weight:800; letter-spacing:0.02em;">${fullName.toUpperCase()}</h1>
          ${professionalTitle ? `<div style="margin-top:8px; font-size:13px; letter-spacing:0.24em; text-transform:uppercase; color:#374151; font-weight:600;">${professionalTitle}</div>` : ''}
        </div>
      `;
      previewCanvas.appendChild(header);

      const grid = document.createElement('div');
      grid.style.cssText = 'display:grid; grid-template-columns: 1fr 1.65fr; gap:24px; align-items:start;';
      previewCanvas.appendChild(grid);

      const left = document.createElement('aside');
      left.style.cssText = 'display:grid; gap:22px;';
      left.innerHTML = `
        <div style="background:#f4f4f4; padding:16px 18px; border-radius:2px;">
          ${sectionTitle('PERSONAL PROFILE')}
          <div style="font-size:13px; color:#4b5563; line-height:1.7;">${summaryText}</div>
        </div>
        <div style="background:#f4f4f4; padding:16px 18px; border-radius:2px;">
          ${sectionTitle('CONTACT DETAILS')}
          ${contactBlock}
        </div>
        <div style="background:#f4f4f4; padding:16px 18px; border-radius:2px;">
          ${sectionTitle('SKILLS AND EXPERTISE')}
          <ul style="margin:0; padding-left:18px;">${skillsList}</ul>
        </div>
        <div style="background:#f4f4f4; padding:16px 18px; border-radius:2px;">
          ${sectionTitle('LANGUAGES')}
          <ul style="margin:0; padding-left:18px;">${languagesList}</ul>
        </div>
      `;

      const right = document.createElement('main');
      right.style.cssText = 'display:grid; gap:24px;';
      right.innerHTML = `
        <div>
          ${sectionTitle('EDUCATIONAL HISTORY')}
          <div style="border-top:1px solid #bdbdbd; margin-bottom:16px;"></div>
          ${buildEducationItems(false)}
        </div>
        <div>
          ${sectionTitle('WORK EXPERIENCE')}
          <div style="border-top:1px solid #bdbdbd; margin-bottom:16px;"></div>
          ${buildExperienceItems(false)}
        </div>
      `;

      grid.appendChild(left);
      grid.appendChild(right);
      this.fitPreviewToSidebar();
      return;
    }

    const header = document.createElement('div');
    header.style.cssText = 'display:flex; justify-content:space-between; align-items:flex-start; gap:20px; padding:0 0 18px; margin:0 0 18px; border-bottom:1px solid #e5e7eb;';
    header.innerHTML = `
      <div style="min-width:0;">
        <div style="font-size:42px; line-height:0.92; font-weight:800; letter-spacing:0.05em;">${fullName.toUpperCase()}</div>
        ${professionalTitle ? `<div style="margin-top:8px; font-size:32px; color:#4b5563; font-weight:500; letter-spacing:0.01em;">${professionalTitle}</div>` : ''}
      </div>
      <div style="display:grid; gap:8px; font-size:13px; color:#374151; line-height:1.45; min-width:220px; justify-items:start;">
        ${this.data.personal.phone ? `<div><i class="fas fa-phone" style="width:16px; color:#111827;"></i> ${this.data.personal.phone}</div>` : ''}
        ${this.data.personal.email ? `<div><i class="fas fa-envelope" style="width:16px; color:#111827;"></i> ${this.data.personal.email}</div>` : ''}
        ${this.data.personal.location ? `<div><i class="fas fa-map-marker-alt" style="width:16px; color:#111827;"></i> ${this.data.personal.location}</div>` : ''}
        ${this.data.personal.dateOfBirth ? `<div><i class="fas fa-globe" style="width:16px; color:#111827;"></i> ${new Date(this.data.personal.dateOfBirth).toLocaleDateString()}</div>` : ''}
      </div>
    `;
    previewCanvas.appendChild(header);

    // Add SUMMARY section
    const summaryBox = document.createElement('div');
    summaryBox.style.cssText = 'background:#f3f4f6; padding:16px; margin:0 0 24px 0; border-radius:2px; text-align:center;';
    summaryBox.innerHTML = `
      <div style="font-size:13px; font-weight:800; letter-spacing:0.12em; text-transform:uppercase; color:#111827; margin-bottom:14px; padding-bottom:12px; border-bottom:2px solid #e5e7eb;">SUMMARY</div>
      <div style="font-size:13px; color:#4b5563; line-height:1.7; text-align:left;">${summaryText}</div>
    `;
    previewCanvas.appendChild(summaryBox);

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid; grid-template-columns: 280px 1fr; gap:24px; align-items:start;';
    previewCanvas.appendChild(grid);

    const sidebar = document.createElement('aside');
    sidebar.style.cssText = 'display:grid; gap:18px; background:#f4f4f4; padding:18px; border-radius:2px;';
    sidebar.innerHTML = `
      <div>
        ${sectionTitle('SKILL')}
        <div style="border-top:1px solid #bdbdbd; margin-bottom:14px;"></div>
        <ul style="margin:0; padding-left:18px;">${skillsList}</ul>
      </div>
      <div>
        ${sectionTitle('LANGUAGE')}
        <div style="border-top:1px solid #bdbdbd; margin-bottom:14px;"></div>
        <ul style="margin:0; padding-left:18px;">${languagesList}</ul>
      </div>
      <div>
        ${sectionTitle('AWARDS')}
        <div style="border-top:1px solid #bdbdbd; margin-bottom:14px;"></div>
        <ul style="margin:0; padding-left:18px;">${awardsList}</ul>
      </div>
    `;

    const main = document.createElement('main');
    main.style.cssText = 'display:grid; gap:22px;';
    main.innerHTML = `
      <div>
        ${sectionTitle('EXPERIENCE')}
        <div style="border-top:1px solid #bdbdbd; margin-bottom:16px;"></div>
        ${buildExperienceItems(true)}
      </div>
      <div>
        ${sectionTitle('EDUCATION')}
        <div style="border-top:1px solid #bdbdbd; margin-bottom:16px;"></div>
        ${buildEducationItems(true)}
      </div>
      <div>
        ${sectionTitle('REFERENCES')}
        <div style="border-top:1px solid #bdbdbd; margin-bottom:16px;"></div>
        ${referencesList}
      </div>
    `;

    grid.appendChild(sidebar);
    grid.appendChild(main);
    this.fitPreviewToSidebar();
  }

  fitPreviewToSidebar() {
    const preview = this.getEl('resumePreview');
    const canvas = preview?.querySelector('.preview-canvas');
    if (!preview || !canvas) return;

    requestAnimationFrame(() => {
      preview.classList.remove('preview-fit-active');
      preview.style.removeProperty('--preview-scale');
      preview.style.removeProperty('height');

      const availableWidth = preview.clientWidth - 2;
      const requiredWidth = Math.max(canvas.offsetWidth, canvas.scrollWidth);
      const requiredHeight = canvas.scrollHeight;

      if (!availableWidth || !requiredWidth || !requiredHeight) {
        return;
      }

      const scale = Math.max(0.3, Math.min(1, availableWidth / requiredWidth));

      preview.style.setProperty('--preview-scale', `${scale}`);

      if (scale < 1) {
        preview.classList.add('preview-fit-active');
      }
    });
  }

  renderSkillsPreview() {
    this.generatePreview();
  }

  updateLanguagesPreview() {
    this.generatePreview();
  }

  updateProjectsPreview() {
    this.generatePreview();
  }

  updateCertificationsPreview() {
    this.generatePreview();
  }

  updatePreview(elementId, value) {
    this.generatePreview();
  }

  syncFormToPreview() {
    this.generatePreview();
  }

  toggleSection(sectionId, show) {
    const section = document.getElementById(sectionId);
    if (section) {
      section.style.display = show ? 'block' : 'none';
    }
  }

  selectTemplate(name) {
      const templateItem = document.querySelector(`.template-item[data-template="${name}"]`);
      if(templateItem) {
        templateItem.click();
      }
      const wizardModal = this.getEl('templateWizardModal', 'wizardModal');
      if (wizardModal) {
        wizardModal.classList.remove('active');
        wizardModal.style.display = 'none';
      }
  }

  async saveToDatabase() {
    if (!this.validateResumeFields()) {
      return;
    }

    this.updateSupplementaryData();

    const title = this.data.title || this.getAutoResumeTitle();
    this.data.title = title;
    
    try {
      const method = this.currentResumeId ? 'PUT' : 'POST';
      const url = this.currentResumeId 
        ? `/api/resumes/${this.currentResumeId}` 
        : '/api/resumes';

      const payload = {
        title: this.data.title,
        data: this.data
      };
      const payloadText = JSON.stringify(payload);
      const payloadBytes = new Blob([payloadText]).size;
      const maxSafePayloadBytes = 24 * 1024 * 1024;

      if (payloadBytes > maxSafePayloadBytes) {
        showToast('Resume data is too large to save. Please reduce image size or remove some content.', 'error');
        return;
      }
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: payloadText
      });
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        showToast('Session expired. Please log in again.', 'error');
        window.location.href = '/login';
        return;
      }

      if (response.status === 413) {
        let message = 'Resume data is too large. Please reduce image size or remove some content.';
        try {
          const errBody = await response.json();
          if (errBody && errBody.message) message = errBody.message;
        } catch (_) {
          // Keep fallback message if response is not JSON.
        }
        throw new Error(message);
      }
      
      if (!response.ok) {
        throw new Error('Failed to save resume');
      }
      
      const result = await response.json();
      
      if (!this.currentResumeId && result.resume && result.resume.id) {
        this.currentResumeId = result.resume.id;
        window.history.replaceState({}, '', `/builder?resume=${this.currentResumeId}`);
      }
      
      showToast('Resume saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving resume:', error);
      showToast(error.message || 'Failed to save resume. Please try again.', 'error');
    }
  }
  
  async loadResumeFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const resumeId = urlParams.get('resume');
    const templateName = urlParams.get('template');
    
    if (resumeId) {
      this.currentResumeId = resumeId;
      await this.loadResumeFromDatabase(resumeId);
    }

    if (templateName) {
      this.selectTemplate(templateName);
    }
  }
  
  async loadResumeFromDatabase(resumeId) {
    try {
      const response = await fetch(`/api/resumes/${resumeId}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        showToast('Session expired. Please log in again.', 'error');
        window.location.href = '/login';
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to load resume');
      }
      
      const result = await response.json();
      
      if (result.resume && result.resume.data) {
        this.data = result.resume.data;
        this.hydrateForm();
      }
    } catch (error) {
      console.error('Error loading resume:', error);
      showToast('Failed to load resume.', 'error');
    }
  }
  
  hydrateForm() {
    this.data.personal = {
      name: '', professionalTitle: '', email: '', phone: '', location: '', bio: '',
      dateOfBirth: '', gender: '', religion: '', hobbies: '',
      objective: '', currentAddress: '', permanentAddress: '',
      ...(this.data.personal || {})
    };
    this.data.languages = Array.isArray(this.data.languages) ? this.data.languages : [];
    this.data.projects = Array.isArray(this.data.projects) ? this.data.projects : [];
    this.data.certifications = Array.isArray(this.data.certifications) ? this.data.certifications : [];

    // Rehydrate fields
    if (document.getElementById('fullName')) document.getElementById('fullName').value = this.data.personal.name || '';
    if (document.getElementById('professionalTitle')) document.getElementById('professionalTitle').value = this.data.personal.professionalTitle || '';
    if (document.getElementById('email')) document.getElementById('email').value = this.data.personal.email || '';
    if (document.getElementById('phone')) document.getElementById('phone').value = this.data.personal.phone || '';
    if (document.getElementById('location')) document.getElementById('location').value = this.data.personal.location || '';
    if (document.getElementById('dateOfBirth')) document.getElementById('dateOfBirth').value = this.data.personal.dateOfBirth || '';
    if (document.getElementById('gender')) document.getElementById('gender').value = this.data.personal.gender || '';
    if (document.getElementById('religion')) document.getElementById('religion').value = this.data.personal.religion || '';
    if (document.getElementById('hobbies')) document.getElementById('hobbies').value = this.data.personal.hobbies || '';
    if (document.getElementById('objective')) document.getElementById('objective').value = this.data.personal.objective || '';
    if (document.getElementById('currentAddress')) document.getElementById('currentAddress').value = this.data.personal.currentAddress || '';
    if (document.getElementById('permanentAddress')) document.getElementById('permanentAddress').value = this.data.personal.permanentAddress || '';
    if (this.getEl('bio', 'professionalSummary')) this.getEl('bio', 'professionalSummary').value = this.data.personal.bio || '';
    if (this.getEl('skillsInput', 'skillInput')) this.getEl('skillsInput', 'skillInput').value = this.data.skills.join(', ');

    const languagesList = this.getEl('languagesList');
    if (languagesList) {
      languagesList.innerHTML = '';
      this.data.languages.forEach((lang) => {
        this.addTemplateEntry('languageTemplate', 'languagesList');
        const last = languagesList.lastElementChild;
        if (!last) return;
        const nameInput = last.querySelector('.language-name');
        const proficiencyInput = last.querySelector('.proficiency');
        if (nameInput) nameInput.value = lang.name || '';
        if (proficiencyInput) proficiencyInput.value = lang.proficiency || '';
      });
    }

    const projectsList = this.getEl('projectsList');
    if (projectsList) {
      projectsList.innerHTML = '';
      this.data.projects.forEach((proj) => {
        this.addTemplateEntry('projectTemplate', 'projectsList');
        const last = projectsList.lastElementChild;
        if (!last) return;
        const titleInput = last.querySelector('.project-title');
        const urlInput = last.querySelector('.project-url');
        const descInput = last.querySelector('.project-description');
        if (titleInput) titleInput.value = proj.name || '';
        if (urlInput) urlInput.value = proj.links || '';
        if (descInput) descInput.value = proj.description || '';
      });
    }

    const certificationsList = this.getEl('certificationsList');
    if (certificationsList) {
      certificationsList.innerHTML = '';
      this.data.certifications.forEach((cert) => {
        this.addTemplateEntry('certificationTemplate', 'certificationsList');
        const last = certificationsList.lastElementChild;
        if (!last) return;
        const nameInput = last.querySelector('.cert-name');
        const issuerInput = last.querySelector('.issuer');
        const issueInput = last.querySelector('.issue-date');
        const expiryInput = last.querySelector('.expiry-date');
        const credInput = last.querySelector('.credential-id');
        if (nameInput) nameInput.value = cert.name || '';
        if (issuerInput) issuerInput.value = cert.issuer || '';
        if (issueInput) issueInput.value = cert.date || '';
        if (expiryInput) expiryInput.value = cert.expiryDate || '';
        if (credInput) credInput.value = cert.credentialId || '';
      });
    }
    
    this.updatePreview('resumeName', this.data.personal.name || 'Your Name');
    this.updatePreview('resumeEmail', this.data.personal.email || 'email@example.com');
    this.updatePreview('resumePhone', this.data.personal.phone || '+1 (555) 123-4567');
    this.updatePreview('resumeLocation', this.data.personal.location || 'Location');
    this.updatePreview('resumeBio', this.data.personal.bio || 'Your professional summary will appear here.');
    
    this.updateSupplementaryData();
    this.renderSkillsPreview();
    
    // Select template if saved
    if(this.data.template) {
      this.selectTemplate(this.data.template);
    }

    this.applyTemplateFieldVisibility(this.data.template || 'seema');
    
    // Theme
    if(this.data.theme === 'dark') {
      document.body.classList.add('dark-mode');
      const icon = document.querySelector('.theme-toggle i');
      if (icon) icon.className = 'fas fa-sun';
    }
  }

  getAutoResumeTitle() {
    const name = (this.data.personal?.name || '').trim();
    const role = (this.data.personal?.professionalTitle || '').trim();

    if (name && role) {
      return `${name} - ${role}`;
    }

    if (name) {
      return `${name} Resume`;
    }

    if (role) {
      return `${role} Resume`;
    }

    return 'Professional Resume';
  }
}

// Initialize on page load
let builder;
document.addEventListener('DOMContentLoaded', () => {
  builder = new ResumeBuilder();
});