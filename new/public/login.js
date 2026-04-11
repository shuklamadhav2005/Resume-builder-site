document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const forgotRequestForm = document.getElementById('forgotRequestForm');
  const resetPasswordForm = document.getElementById('resetPasswordForm');
  const forgotEmailInput = document.getElementById('forgot-email');
  const sendOtpButton = document.getElementById('sendOtpBtn');
  const verifyOtpButton = document.getElementById('verifyOtpBtn');
  const resendOtpButton = document.getElementById('resendOtpBtn');
  const passwordModalOverlay = document.getElementById('passwordModalOverlay');
  const passwordModalForm = document.getElementById('passwordModalForm');
  const modalResetPasswordButton = document.getElementById('modalResetPasswordBtn');
  const modalCancelButton = document.getElementById('modalCancelBtn');
  const resetOtpInput = document.getElementById('reset-otp');
  const modalNewPasswordInput = document.getElementById('modal-new-password');
  const modalConfirmPasswordInput = document.getElementById('modal-confirm-password');

  let otpVerified = false;

  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(String(email || '').trim());
  }

  function showError(element, message) {
    if (!element) {
      showToast(message, 'error');
      return;
    }

    element.textContent = message;
    element.classList.add('show');
    setTimeout(() => {
      element.classList.remove('show');
    }, 4000);
  }

  function setLoading(button, isLoading, label) {
    if (!button) {
      return;
    }

    if (isLoading) {
      button.dataset.originalLabel = button.textContent;
      button.innerHTML = '<span class="spinner"></span>' + label;
      button.disabled = true;
      return;
    }

    button.disabled = false;
    button.textContent = button.dataset.originalLabel || label;
  }

  function validatePassword(password) {
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }

    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }

    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }

    return '';
  }

  async function requestOtp(email) {
    const response = await fetch('/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send OTP');
    }

    return data;
  }

  async function resetPassword(email, otp, newPassword) {
    const response = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to reset password');
    }

    return data;
  }

  async function verifyOtp(email, otp) {
    const response = await fetch('/api/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to verify OTP');
    }

    return data;
  }

  function openPasswordModal() {
    if (!passwordModalOverlay) {
      return;
    }

    passwordModalOverlay.classList.add('active');
    passwordModalOverlay.setAttribute('aria-hidden', 'false');
    if (modalNewPasswordInput) {
      modalNewPasswordInput.focus();
    }
  }

  function closePasswordModal(resetVerification = false) {
    if (!passwordModalOverlay) {
      return;
    }

    passwordModalOverlay.classList.remove('active');
    passwordModalOverlay.setAttribute('aria-hidden', 'true');

    if (modalNewPasswordInput) {
      modalNewPasswordInput.value = '';
    }
    if (modalConfirmPasswordInput) {
      modalConfirmPasswordInput.value = '';
    }

    if (resetVerification) {
      otpVerified = false;
      if (resetOtpInput) {
        resetOtpInput.disabled = false;
      }
    }
  }

  if (resetPasswordForm) {
    resetPasswordForm.classList.remove('active');
  }
  closePasswordModal();

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const errorBox = document.getElementById('errorMessage');

      if (!validateEmail(email)) {
        showError(errorBox, 'Please enter a valid email address');
        return;
      }

      if (!password) {
        showError(errorBox, 'Please enter your password');
        return;
      }

      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
          showToast(data.message || 'Login failed', 'error');
          return;
        }

        localStorage.setItem('token', data.token);
        flashToast('Successfully logged in.', 'success');
        window.location.href = '/dashboard';
      } catch (error) {
        showToast('Connection error. Please try again.', 'error');
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('fullname').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;

      if (name.length < 2) {
        showToast('Name must be at least 2 characters', 'error');
        return;
      }

      if (!validateEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
      }

      if (password.length < 8) {
        showToast('Password must be at least 8 characters', 'error');
        return;
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        showToast(passwordError, 'error');
        return;
      }

      if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }

      try {
        const registerResponse = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });

        const registerData = await registerResponse.json();

        if (!registerResponse.ok) {
          showToast(registerData.message || 'Registration failed', 'error');
          return;
        }

        if (registerData.mailWarning) {
          showToast(registerData.mailWarning, 'error');
        } else {
          showToast('Account created successfully. Welcome email sent.', 'success');
        }

        const loginResponse = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const loginData = await loginResponse.json();

        if (!loginResponse.ok) {
          flashToast('Account created. Please login manually.', 'success');
          window.location.reload();
          return;
        }

        localStorage.setItem('token', loginData.token);
        flashToast('Successfully logged in.', 'success');
        window.location.href = '/dashboard';
      } catch (error) {
        showToast('Connection error. Please try again.', 'error');
      }
    });
  }

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
    });
  }

  if (forgotRequestForm) {
    forgotRequestForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = forgotEmailInput ? forgotEmailInput.value.trim() : '';
      if (!validateEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
      }

      setLoading(sendOtpButton, true, 'Sending OTP...');

      try {
        const data = await requestOtp(email);
        showToast(data.message || 'OTP sent to your email', 'success');
        otpVerified = false;
        if (resetPasswordForm) {
          resetPasswordForm.classList.add('active');
        }
        closePasswordModal();
        if (resetOtpInput) {
          resetOtpInput.disabled = false;
          resetOtpInput.value = '';
          resetOtpInput.focus();
        }
      } catch (error) {
        showToast(error.message || 'Failed to send OTP', 'error');
      } finally {
        setLoading(sendOtpButton, false, 'Send OTP');
      }
    });
  }

  if (verifyOtpButton) {
    verifyOtpButton.addEventListener('click', async () => {
      const email = forgotEmailInput ? forgotEmailInput.value.trim() : '';
      const otp = resetOtpInput ? resetOtpInput.value.trim() : '';

      if (!validateEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
      }

      if (!/^\d{6}$/.test(otp)) {
        showToast('OTP must be 6 digits', 'error');
        return;
      }

      setLoading(verifyOtpButton, true, 'Verifying...');

      try {
        const data = await verifyOtp(email, otp);
        otpVerified = true;
        showToast(data.message || 'OTP verified', 'success');
        if (resetOtpInput) {
          resetOtpInput.disabled = true;
        }
        openPasswordModal();
      } catch (error) {
        otpVerified = false;
        showToast(error.message || 'Invalid OTP', 'error');
      } finally {
        setLoading(verifyOtpButton, false, 'Verify OTP');
      }
    });
  }

  if (resendOtpButton) {
    resendOtpButton.addEventListener('click', async () => {
      const email = forgotEmailInput ? forgotEmailInput.value.trim() : '';
      if (!validateEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
      }

      setLoading(resendOtpButton, true, 'Resending...');

      try {
        const data = await requestOtp(email);
        otpVerified = false;
        showToast(data.message || 'OTP sent to your email', 'success');
        closePasswordModal();
        if (resetOtpInput) {
          resetOtpInput.disabled = false;
          resetOtpInput.value = '';
          resetOtpInput.focus();
        }
      } catch (error) {
        showToast(error.message || 'Failed to resend OTP', 'error');
      } finally {
        setLoading(resendOtpButton, false, 'Resend OTP');
      }
    });
  }

  if (modalCancelButton) {
    modalCancelButton.addEventListener('click', () => {
      closePasswordModal(true);
      showToast('OTP verification cancelled. Please verify OTP again.', 'error');
    });
  }

  if (passwordModalOverlay) {
    passwordModalOverlay.addEventListener('click', (event) => {
      if (event.target === passwordModalOverlay) {
        closePasswordModal(true);
      }
    });
  }

  if (passwordModalForm) {
    passwordModalForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = forgotEmailInput ? forgotEmailInput.value.trim() : '';
      const otp = resetOtpInput ? resetOtpInput.value.trim() : '';
      const newPassword = modalNewPasswordInput ? modalNewPasswordInput.value : '';
      const confirmPassword = modalConfirmPasswordInput ? modalConfirmPasswordInput.value : '';

      if (!validateEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
      }

      if (!/^\d{6}$/.test(otp)) {
        showToast('OTP must be 6 digits', 'error');
        return;
      }

      if (!otpVerified) {
        showToast('Please verify OTP first', 'error');
        return;
      }

      const passwordError = validatePassword(newPassword);
      if (passwordError) {
        showToast(passwordError, 'error');
        return;
      }

      if (newPassword !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }

      setLoading(modalResetPasswordButton, true, 'Resetting...');

      try {
        const data = await resetPassword(email, otp, newPassword);
        flashToast(data.message || 'Password reset successful. Please login.', 'success');
        if (resetPasswordForm) {
          resetPasswordForm.classList.remove('active');
        }
        otpVerified = false;
        closePasswordModal();
        if (resetOtpInput) {
          resetOtpInput.disabled = false;
          resetOtpInput.value = '';
        }
        window.location.href = '/login';
      } catch (error) {
        showToast(error.message || 'Failed to reset password', 'error');
      } finally {
        setLoading(modalResetPasswordButton, false, 'Reset Password');
      }
    });
  }
});
