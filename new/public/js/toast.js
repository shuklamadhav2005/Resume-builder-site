(() => {
  const TOAST_CONTAINER_ID = 'toastContainer';
  const FLASH_TOAST_KEY = 'resumeBuilder:flashToast';

  function ensureToastContainer() {
    let container = document.getElementById(TOAST_CONTAINER_ID);
    if (container) {
      return container;
    }

    container = document.createElement('div');
    container.id = TOAST_CONTAINER_ID;
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
    return container;
  }

  function getToastContent(type, message) {
    if (type === 'error') {
      return {
        icon: 'fa-circle-xmark',
        title: 'Something went wrong',
        message
      };
    }

    return {
      icon: 'fa-circle-check',
      title: 'Success',
      message
    };
  }

  function showToast(message, type = 'success', duration = 3200) {
    if (!message) {
      return;
    }

    const container = ensureToastContainer();
    const toast = document.createElement('div');
    const safeType = type === 'error' ? 'error' : 'success';
    const content = getToastContent(safeType, message);

    toast.className = `toast toast-${safeType}`;
    toast.setAttribute('role', safeType === 'error' ? 'alert' : 'status');
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'toast-icon';
    iconWrapper.setAttribute('aria-hidden', 'true');

    const icon = document.createElement('i');
    icon.className = `fas ${content.icon}`;
    iconWrapper.appendChild(icon);

    const body = document.createElement('div');
    body.className = 'toast-body';

    const title = document.createElement('p');
    title.className = 'toast-title';
    title.textContent = content.title;

    const messageNode = document.createElement('p');
    messageNode.className = 'toast-message';
    messageNode.textContent = content.message;

    body.appendChild(title);
    body.appendChild(messageNode);

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'toast-close';
    closeButton.setAttribute('aria-label', 'Dismiss notification');

    const closeIcon = document.createElement('i');
    closeIcon.className = 'fas fa-xmark';
    closeButton.appendChild(closeIcon);

    toast.appendChild(iconWrapper);
    toast.appendChild(body);
    toast.appendChild(closeButton);

    const closeToast = () => {
      if (toast.classList.contains('toast-hide')) {
        return;
      }

      toast.classList.add('toast-hide');
      window.setTimeout(() => {
        toast.remove();
      }, 220);
    };

    closeButton.addEventListener('click', closeToast);
    container.appendChild(toast);

    window.setTimeout(closeToast, duration);
  }

  function flashToast(message, type = 'success', duration = 3200) {
    if (!message) {
      return;
    }

    sessionStorage.setItem(FLASH_TOAST_KEY, JSON.stringify({
      message,
      type,
      duration
    }));
  }

  function showFlashToast() {
    const rawValue = sessionStorage.getItem(FLASH_TOAST_KEY);
    if (!rawValue) {
      return;
    }

    sessionStorage.removeItem(FLASH_TOAST_KEY);

    try {
      const payload = JSON.parse(rawValue);
      if (payload && payload.message) {
        showToast(payload.message, payload.type, payload.duration);
      }
    } catch (error) {
      console.error('Failed to read flash toast:', error);
    }
  }

  window.showToast = showToast;
  window.flashToast = flashToast;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showFlashToast, { once: true });
  } else {
    showFlashToast();
  }
})();