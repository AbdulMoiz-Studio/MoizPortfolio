/**
 * Automated Test Suite for Contact Form Email Automation
 * Tests:
 * 1. Input validation & sanitization (XSS, header injection, length constraints)
 * 2. Honeypot spam defense
 * 3. In-memory IP rate limiting
 * 4. Email template generation (owner notification & visitor auto-reply)
 * 5. Serverless handler response codes (CORS, 405, 400, 429, 200)
 */

const assert = require('assert');
const { escapeHtml, sanitizeHeader, validateContactInput } = require('../api/lib/validator');
const { checkRateLimit, resetRateLimiter } = require('../api/lib/rateLimiter');
const { ownerEmail, visitorEmail } = require('../api/lib/emailTemplates');
const handler = require('../api/contact');

let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    failedTests++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    failedTests++;
  }
}

console.log('\n--- 1. Testing Input Validation & Sanitization ---');

runTest('escapeHtml should convert dangerous characters to HTML entities', () => {
  const unsafe = '<script>alert("xss & \'injection\'")</script>';
  const safe = escapeHtml(unsafe);
  assert.strictEqual(safe, '&lt;script&gt;alert(&quot;xss &amp; &#39;injection&#39;&quot;)&lt;/script&gt;');
});

runTest('sanitizeHeader should strip CR, LF, and null bytes', () => {
  const unsafe = "John Doe\r\nBcc: victim@example.com\n\0Injected";
  const safe = sanitizeHeader(unsafe);
  assert.strictEqual(safe, "John Doe Bcc: victim@example.com Injected");
  assert.strictEqual(safe.includes('\r'), false);
  assert.strictEqual(safe.includes('\n'), false);
});

runTest('validateContactInput accepts valid payload', () => {
  const result = validateContactInput({
    firstName: '  Sarah Connor  ',
    email: 'sarah@skynet.com',
    message: 'Hello, I need a modern Wix Studio redesign for my company.',
    website: ''
  });
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.isSpam, false);
  assert.strictEqual(result.data.firstName, 'Sarah Connor');
  assert.strictEqual(result.data.email, 'sarah@skynet.com');
});

runTest('validateContactInput rejects empty or missing fields', () => {
  const result = validateContactInput({});
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.errors.length, 3);
});

runTest('validateContactInput rejects invalid email format', () => {
  const result = validateContactInput({
    firstName: 'Alex',
    email: 'not-an-email@',
    message: 'I would like to hire you for a Wix project.'
  });
  assert.strictEqual(result.valid, false);
  assert(result.errors.some(e => e.includes('valid email')));
});

runTest('validateContactInput rejects short messages (<10 chars)', () => {
  const result = validateContactInput({
    firstName: 'Alex',
    email: 'alex@example.com',
    message: 'Short'
  });
  assert.strictEqual(result.valid, false);
  assert(result.errors.some(e => e.includes('at least 10 characters')));
});

runTest('validateContactInput detects honeypot and marks as spam', () => {
  const result = validateContactInput({
    firstName: 'Bot Name',
    email: 'bot@spam.com',
    message: 'Buy cheap watches now at our website.',
    website: 'http://spam-link.ru'
  });
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.isSpam, true);
});

console.log('\n--- 2. Testing In-Memory Rate Limiting ---');

runTest('Rate limiter allows 3 requests and blocks the 4th', () => {
  resetRateLimiter();
  const testIp = '198.51.100.1';

  const req1 = checkRateLimit(testIp, 3, 600000);
  assert.strictEqual(req1.allowed, true);
  assert.strictEqual(req1.remaining, 2);

  const req2 = checkRateLimit(testIp, 3, 600000);
  assert.strictEqual(req2.allowed, true);
  assert.strictEqual(req2.remaining, 1);

  const req3 = checkRateLimit(testIp, 3, 600000);
  assert.strictEqual(req3.allowed, true);
  assert.strictEqual(req3.remaining, 0);

  const req4 = checkRateLimit(testIp, 3, 600000);
  assert.strictEqual(req4.allowed, false);
  assert(req4.resetInSeconds > 0);

  // Different IP should still be allowed
  const diffIp = checkRateLimit('198.51.100.2', 3, 600000);
  assert.strictEqual(diffIp.allowed, true);
});

console.log('\n--- 3. Testing Email Template Output ---');

runTest('Owner email template contains required details and reply instruction', () => {
  const template = ownerEmail({
    firstName: 'Michael',
    email: 'michael@company.com',
    message: 'Need a Wix Studio revamp.\nWith responsive animations.',
    submittedAt: 'Sunday, October 4, 2026 at 2:00:00 AM'
  });

  assert.strictEqual(template.subject, 'New Project Inquiry from Michael');
  assert(template.text.includes('Michael'));
  assert(template.text.includes('michael@company.com'));
  assert(template.text.includes('Sunday, October 4, 2026 at 2:00:00 AM'));
  assert(template.text.includes('Reply to this email to respond directly to Michael.'));
  assert(template.html.includes('Reply to this email to respond directly to Michael.'));
  assert(template.html.includes('moizstudio.me contact form'));
});

runTest('Visitor auto-reply matches required copy and branding', () => {
  const template = visitorEmail({
    firstName: 'Sophia',
    message: 'Can you help redesign my site?'
  });

  assert.strictEqual(template.subject, 'Thanks for reaching out, Sophia!');
  assert(template.text.includes('Hi Sophia,'));
  assert(template.text.includes("Thank you for contacting Moiz Studio. I've received your message and will review it personally."));
  assert(template.text.includes('What happens next:'));
  assert(template.text.includes('1. I\'ll go through your requirements.'));
  assert(template.text.includes('2. I\'ll get back to you within 24 hours with my thoughts and next steps.'));
  assert(template.text.includes('"Can you help redesign my site?"'));
  assert(template.text.includes('Chat on WhatsApp: https://api.whatsapp.com/send?phone=923098828483'));
  assert(template.text.includes('https://www.moizstudio.me/work'));
  assert(template.text.includes('Wix Studio Expert & Web Designer'));

  // HTML checks
  assert(template.html.includes('#FF5A1F')); // Orange button & accents
  assert(template.html.includes('#25D366')); // WhatsApp brand green button
  assert(template.html.includes('Chat on WhatsApp')); // WhatsApp button copy
  assert(template.html.includes('final%20logo-header.png')); // Website header logo image
  assert(template.html.includes('Wix Studio Expert &bull; Web Designer &bull; Wix Velo')); // Subtitle
  assert(template.html.includes('max-width: 600px')); // 600px email layout
});

console.log('\n--- 4. Testing Serverless Handler Mock Invocations ---');

function createMockReq(options = {}) {
  return {
    method: options.method || 'POST',
    headers: {
      origin: options.origin || 'https://moizstudio.me',
      'x-forwarded-for': options.ip || '203.0.113.195',
      ...options.headers
    },
    body: options.body || {}
  };
}

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(key, value) {
      this.headers[key.toLowerCase()] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    end() {
      return this;
    }
  };
  return res;
}

(async () => {
  await runAsyncTest('Handler returns 204 for CORS OPTIONS preflight', async () => {
    const req = createMockReq({ method: 'OPTIONS' });
    const res = createMockRes();
    await handler(req, res);
    assert.strictEqual(res.statusCode, 204);
    assert.strictEqual(res.headers['access-control-allow-methods'], 'POST, OPTIONS');
  });

  await runAsyncTest('Handler allows https://www.moizstudio.me (with www)', async () => {
    const req = createMockReq({ method: 'OPTIONS', origin: 'https://www.moizstudio.me' });
    const res = createMockRes();
    await handler(req, res);
    assert.strictEqual(res.statusCode, 204);
    assert.strictEqual(res.headers['access-control-allow-origin'], 'https://www.moizstudio.me');
  });

  await runAsyncTest('Handler allows Vercel preview domains (*.vercel.app)', async () => {
    const req = createMockReq({ method: 'OPTIONS', origin: 'https://moiz-portfolio-test.vercel.app' });
    const res = createMockRes();
    await handler(req, res);
    assert.strictEqual(res.statusCode, 204);
    assert.strictEqual(res.headers['access-control-allow-origin'], 'https://moiz-portfolio-test.vercel.app');
  });

  await runAsyncTest('Handler allows null origin (local file preview / webview)', async () => {
    const req = createMockReq({ method: 'OPTIONS', origin: 'null' });
    const res = createMockRes();
    await handler(req, res);
    assert.strictEqual(res.statusCode, 204);
  });

  await runAsyncTest('Handler rejects unauthorized third-party origin with 403', async () => {
    const req = createMockReq({ method: 'POST', origin: 'https://malicious-site.example.com' });
    const res = createMockRes();
    await handler(req, res);
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body.error, 'Origin not allowed by CORS policy.');
  });

  await runAsyncTest('Handler rejects non-POST methods with 405', async () => {
    const req = createMockReq({ method: 'GET' });
    const res = createMockRes();
    await handler(req, res);
    assert.strictEqual(res.statusCode, 405);
    assert(res.body.error.includes('Method not allowed'));
  });

  await runAsyncTest('Handler rejects invalid payload with 400', async () => {
    const req = createMockReq({
      ip: '203.0.113.50',
      body: { firstName: '', email: 'invalid', message: 'hi' }
    });
    const res = createMockRes();
    await handler(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert(res.body.error.length > 0);
  });

  await runAsyncTest('Handler returns silent 200 success on honeypot trigger without sending email', async () => {
    const req = createMockReq({
      ip: '203.0.113.51',
      body: {
        firstName: 'Spammer',
        email: 'spam@bot.com',
        message: 'Spam payload here that is long enough',
        website: 'http://spam-link.com'
      }
    });
    const res = createMockRes();
    await handler(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
  });

  await runAsyncTest('Handler enforces 429 when rate limit is exceeded', async () => {
    const testIp = '203.0.113.99';
    // Consume 3 attempts with invalid body (still tracked by IP)
    for (let i = 0; i < 3; i++) {
      const req = createMockReq({ ip: testIp, body: { firstName: '' } });
      const res = createMockRes();
      await handler(req, res);
    }
    // 4th attempt should be blocked with 429
    const req4 = createMockReq({ ip: testIp, body: { firstName: 'Valid' } });
    const res4 = createMockRes();
    await handler(req4, res4);
    assert.strictEqual(res4.statusCode, 429);
    assert(res4.body.error.includes('Too many submissions'));
  });

  console.log(`\n========================================`);
  console.log(`Test Results: ${passedTests} passed, ${failedTests} failed`);
  console.log(`========================================\n`);

  if (failedTests > 0) {
    process.exit(1);
  }
})();
