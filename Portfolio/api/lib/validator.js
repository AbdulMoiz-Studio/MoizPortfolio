/**
 * Input Validation & Sanitization Module
 * Protects against XSS, HTML injection, Email Header Injection, and malformed inputs.
 */

/**
 * Escape HTML special characters to prevent HTML/XSS injection in emails
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Strip CR, LF, and null characters to prevent Email Header Injection
 * @param {string} str
 * @returns {string}
 */
function sanitizeHeader(str) {
  if (!str) return '';
  return String(str)
    .replace(/[\r\n\0]+/g, ' ')
    .trim();
}

/**
 * Strict RFC 5322 compliant email regex
 * Max length 254 chars per RFC 5321
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Validate Contact Form Payload
 * @param {Object} data
 * @param {any} data.firstName
 * @param {any} data.email
 * @param {any} data.message
 * @param {any} [data.website]
 * @returns {{ valid: boolean, errors: string[], isSpam: boolean, data: { firstName: string, email: string, message: string } }}
 */
function validateContactInput(data = {}) {
  const errors = [];

  // Check honeypot: if filled, mark as spam (silent success return)
  if (data.website && String(data.website).trim().length > 0) {
    return {
      valid: false,
      isSpam: true,
      errors: [],
      data: { firstName: '', email: '', message: '' }
    };
  }

  // 1. firstName: 1-60 chars
  const rawFirstName = typeof data.firstName === 'string' ? data.firstName.trim() : '';
  const firstName = sanitizeHeader(rawFirstName);
  if (!firstName) {
    errors.push('First Name is required.');
  } else if (firstName.length < 1 || firstName.length > 60) {
    errors.push('First Name must be between 1 and 60 characters.');
  }

  // 2. email: valid format, max 254 chars
  const rawEmail = typeof data.email === 'string' ? data.email.trim() : '';
  const email = sanitizeHeader(rawEmail);
  if (!email) {
    errors.push('Email Address is required.');
  } else if (email.length > 254) {
    errors.push('Email Address cannot exceed 254 characters.');
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push('Please provide a valid email address.');
  }

  // 3. message: 10-2000 chars
  const message = typeof data.message === 'string' ? data.message.trim() : '';
  if (!message) {
    errors.push('Message is required.');
  } else if (message.length < 10) {
    errors.push('Message must be at least 10 characters long.');
  } else if (message.length > 2000) {
    errors.push('Message cannot exceed 2000 characters.');
  }

  return {
    valid: errors.length === 0,
    isSpam: false,
    errors,
    data: {
      firstName,
      email,
      message
    }
  };
}

module.exports = {
  escapeHtml,
  sanitizeHeader,
  validateContactInput
};
