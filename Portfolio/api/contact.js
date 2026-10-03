/**
 * Vercel Serverless Function: POST /api/contact
 * Handles contact form submissions, validation, rate limiting, and dual email notifications.
 */

const { validateContactInput } = require('./lib/validator');
const { checkRateLimit } = require('./lib/rateLimiter');
const { sendOwnerNotification, sendVisitorAutoReply } = require('./lib/mailer');

/**
 * Configure CORS headers
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @returns {boolean} Whether the origin is allowed
 */
function handleCors(req, res) {
  const allowedOrigin = (process.env.ALLOWED_ORIGIN || 'https://moizstudio.me').trim().replace(/\/$/, '');
  const requestOrigin = (req.headers.origin || '').trim().replace(/\/$/, '');

  const isLocalDev = Boolean(
    requestOrigin && (
      requestOrigin.startsWith('http://localhost') ||
      requestOrigin.startsWith('http://127.0.0.1')
    )
  );

  const isAllowed = !requestOrigin || requestOrigin === allowedOrigin || isLocalDev;

  if (isAllowed && requestOrigin) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  } else if (!requestOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  return isAllowed;
}

/**
 * Extract Client IP
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || '127.0.0.1';
}

/**
 * Main Serverless Handler
 */
module.exports = async function handler(req, res) {
  // 1. Handle CORS
  const isOriginAllowed = handleCors(req, res);

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Reject non-allowed origins
  if (!isOriginAllowed) {
    return res.status(403).json({ error: 'Origin not allowed by CORS policy.' });
  }

  // 2. Enforce POST method
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed. Only POST is supported.' });
  }

  // 3. Rate Limiting (max 3 submissions per IP per 10 minutes)
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: `Too many submissions. Please wait ${Math.ceil(rateLimit.resetInSeconds / 60)} minute(s) before trying again, or reach out on WhatsApp.`
    });
  }

  // 4. Parse JSON body
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON payload received.' });
    }
  }

  // 5. Validate input & check honeypot
  const validation = validateContactInput(body || {});

  // Silent success on honeypot trigger (anti-bot)
  if (validation.isSpam) {
    console.log('[Contact Form] Honeypot triggered. Silently discarded spam submission from IP:', clientIp);
    return res.status(200).json({
      success: true,
      message: 'Thanks! Your message has been sent. Check your inbox for a confirmation.'
    });
  }

  if (!validation.valid) {
    return res.status(400).json({ error: validation.errors.join(' ') });
  }

  const { firstName, email, message } = validation.data;

  // 6. Format Pakistan Standard Time (Asia/Karachi)
  let submittedAt;
  try {
    submittedAt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Karachi',
      dateStyle: 'full',
      timeStyle: 'medium'
    }).format(new Date());
  } catch {
    submittedAt = new Date().toUTCString();
  }

  // 7. Send Emails
  try {
    // Step 7A: Send Owner Notification
    await sendOwnerNotification({
      firstName,
      email,
      message,
      submittedAt
    });

    console.log(`[Contact Form] Owner notification successfully sent for inquiry from: ${email.slice(0, 3)}***@***`);

    // Step 7B: Send Visitor Auto-Reply
    try {
      await sendVisitorAutoReply({
        firstName,
        email,
        message
      });
      console.log(`[Contact Form] Visitor auto-reply sent to: ${email.slice(0, 3)}***@***`);
    } catch (autoReplyError) {
      // If auto-reply fails, log warning but still return success to the visitor
      console.warn('[Contact Form Warning] Visitor auto-reply failed:', autoReplyError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Thanks! Your message has been sent. Check your inbox for a confirmation.'
    });
  } catch (ownerEmailError) {
    console.error('[Contact Form Error] Failed to send owner email notification:', ownerEmailError.message);

    return res.status(500).json({
      error: 'We could not send your message due to a server error. Please try again or reach out on WhatsApp: (+92) 3098828483 or email contactwithabdulmoiz@gmail.com.'
    });
  }
};
