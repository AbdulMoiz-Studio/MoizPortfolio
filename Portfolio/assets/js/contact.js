/**
 * Client-Side Contact Form Handler
 * Manages form interception, client-side validation, loading states, and accessible UI feedback.
 */

(function () {
  'use strict';

  function initContactForm() {
    const contactContainer = document.getElementById('contact-form');
    if (!contactContainer) return;

    const form = contactContainer.querySelector('form');
    if (!form) return;

    const firstNameInput = form.querySelector('input[name="firstName"]') || form.querySelector('input[type="text"]:not([name="website"])');
    const emailInput = form.querySelector('input[name="email"]') || form.querySelector('input[type="email"]');
    const messageInput = form.querySelector('textarea[name="message"]') || form.querySelector('textarea');
    const honeypotInput = form.querySelector('input[name="website"]');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Create or locate status container
    let statusEl = form.querySelector('#contact-status');
    if (!statusEl) {
      statusEl = document.createElement('div');
      statusEl.id = 'contact-status';
      statusEl.className = 'contact-status-msg tw-mt-4 text-center';
      statusEl.setAttribute('aria-live', 'polite');
      statusEl.style.display = 'none';

      // Insert right after button container
      const btnContainer = submitBtn ? submitBtn.closest('.contact-button') : null;
      if (btnContainer && btnContainer.parentNode) {
        btnContainer.parentNode.appendChild(statusEl);
      } else {
        form.appendChild(statusEl);
      }
    }

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function showStatus(message, isSuccess = true) {
      statusEl.style.display = 'block';
      statusEl.innerHTML = `
        <div style="
          padding: 14px 18px;
          border-radius: 8px;
          font-size: 14px;
          line-height: 1.5;
          margin-top: 16px;
          text-align: center;
          font-weight: 500;
          background-color: ${isSuccess ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'};
          color: ${isSuccess ? '#4ade80' : '#f87171'};
          border: 1px solid ${isSuccess ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
        ">
          ${message}
        </div>
      `;
    }

    function clearStatus() {
      statusEl.style.display = 'none';
      statusEl.innerHTML = '';
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      clearStatus();

      const firstName = firstNameInput ? firstNameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const message = messageInput ? messageInput.value.trim() : '';
      const website = honeypotInput ? honeypotInput.value.trim() : '';

      // Client-Side Validation
      if (!firstName || firstName.length < 1 || firstName.length > 60) {
        showStatus('Please enter your first name (1-60 characters).', false);
        if (firstNameInput) firstNameInput.focus();
        return;
      }

      if (!email || email.length > 254 || !EMAIL_REGEX.test(email)) {
        showStatus('Please enter a valid email address.', false);
        if (emailInput) emailInput.focus();
        return;
      }

      if (!message || message.length < 10) {
        showStatus('Please enter a message of at least 10 characters.', false);
        if (messageInput) messageInput.focus();
        return;
      }

      if (message.length > 2000) {
        showStatus('Message cannot exceed 2000 characters.', false);
        if (messageInput) messageInput.focus();
        return;
      }

      // UI Loading State
      const originalBtnHtml = submitBtn ? submitBtn.innerHTML : 'SEND A MESSAGE';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
        submitBtn.style.cursor = 'not-allowed';
        submitBtn.innerHTML = `
          <span style="display: inline-flex; align-items: center; gap: 8px;">
            <svg style="animation: spin 1s linear infinite; width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-opacity="0.3"></circle>
              <path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor"></path>
            </svg>
            Sending...
          </span>
        `;
      }

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            firstName,
            email,
            message,
            website
          })
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && data.success) {
          showStatus(
            data.message || 'Thanks! Your message has been sent. Check your inbox for a confirmation.',
            true
          );
          form.reset();
        } else {
          const fallbackError = 'Could not send your message right now. Please message directly on <a href="https://api.whatsapp.com/send?phone=923098828483" target="_blank" rel="noopener noreferrer" style="color: #FF5A1F; font-weight: bold; text-decoration: underline;">WhatsApp</a> or email <a href="mailto:contactwithabdulmoiz@gmail.com" style="color: #FF5A1F; font-weight: bold; text-decoration: underline;">contactwithabdulmoiz@gmail.com</a>.';
          showStatus(data.error || fallbackError, false);
        }
      } catch (err) {
        console.error('[Contact Form Request Error]', err);
        showStatus(
          'Network connection error. Please check your internet or reach out directly on <a href="https://api.whatsapp.com/send?phone=923098828483" target="_blank" rel="noopener noreferrer" style="color: #FF5A1F; font-weight: bold; text-decoration: underline;">WhatsApp</a> or email <a href="mailto:contactwithabdulmoiz@gmail.com" style="color: #FF5A1F; font-weight: bold; text-decoration: underline;">contactwithabdulmoiz@gmail.com</a>.',
          false
        );
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.style.opacity = '1';
          submitBtn.style.cursor = 'pointer';
          submitBtn.innerHTML = originalBtnHtml;
        }
      }
    });
  }

  // Add keyframe for spinner if not present
  if (!document.getElementById('contact-spinner-style')) {
    const style = document.createElement('style');
    style.id = 'contact-spinner-style';
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactForm);
  } else {
    initContactForm();
  }
})();
