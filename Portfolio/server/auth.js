/**
 * Authentication & Security Manager (auth.js)
 * Implements:
 * - Bcrypt password verification & hashing
 * - Session cookies (httpOnly, sameSite, secure)
 * - Rate limiting & 15-minute temporary lockout after 5 failed attempts
 * - CSRF token generation & validation
 * - Server-side route protection middleware
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../data/db');

// In-memory session store, blacklist & rate limiter
const activeSessions = new Map();
const revokedTokens = new Set();
const loginAttempts = new Map(); // ip/user -> { count, lockoutUntil }

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const SESSION_SECRET = process.env.SESSION_SECRET || 'moiz_studio_portfolio_secure_session_salt_8483_live_production';

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a cryptographically signed, stateless session token
 */
function createSessionToken(payload) {
  const json = JSON.stringify(payload);
  const data = Buffer.from(json, 'utf8').toString('base64url');
  const hmac = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${hmac}`;
}

/**
 * Verify a cryptographically signed session token
 */
function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || revokedTokens.has(token)) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  try {
    const expectedHmac = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
    if (sig.length !== expectedHmac.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedHmac))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (!payload || !payload.expiresAt || payload.expiresAt < Date.now()) {
      return null;
    }
    return payload;
  } catch (e) {
    return null;
  }
}

function getClientIdentifier(req) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  return String(ip).split(',')[0].trim();
}

/**
 * Check if IP is currently locked out
 */
function isLockedOut(identifier) {
  const record = loginAttempts.get(identifier);
  if (!record) return false;
  if (record.lockoutUntil && record.lockoutUntil > Date.now()) {
    const remainingMins = Math.ceil((record.lockoutUntil - Date.now()) / 60000);
    return `Too many failed login attempts. Locked out for ${remainingMins} more minute(s).`;
  }
  if (record.lockoutUntil && record.lockoutUntil <= Date.now()) {
    loginAttempts.delete(identifier);
  }
  return false;
}

/**
 * Record a failed login attempt
 */
function recordFailedAttempt(identifier) {
  const record = loginAttempts.get(identifier) || { count: 0, lockoutUntil: null };
  record.count += 1;
  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
  }
  loginAttempts.set(identifier, record);
  return record;
}

/**
 * Reset failed attempts upon successful login
 */
function resetAttempts(identifier) {
  loginAttempts.delete(identifier);
}

/**
 * Authenticate login credentials
 */
async function login(username, password, clientIp) {
  const lockoutMsg = isLockedOut(clientIp);
  if (lockoutMsg) {
    return { success: false, status: 429, message: lockoutMsg };
  }

  const content = db.readContent();
  const admin = content.admin;

  if (admin.username !== username) {
    const record = recordFailedAttempt(clientIp);
    const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - record.count);
    return {
      success: false,
      status: 401,
      message: `Invalid username or password. (${remaining} attempts remaining before temporary lockout)`
    };
  }

  const match = await bcrypt.compare(password, admin.passwordHash);
  if (!match) {
    const record = recordFailedAttempt(clientIp);
    const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - record.count);
    return {
      success: false,
      status: 401,
      message: `Invalid username or password. (${remaining} attempts remaining before temporary lockout)`
    };
  }

  // Login successful
  resetAttempts(clientIp);

  const csrfToken = generateToken();
  const expiresAt = Date.now() + SESSION_TTL_MS;

  const sessionPayload = {
    username: admin.username,
    csrfToken,
    expiresAt,
    v: admin.tokenVersion || 1,
    nonce: generateToken()
  };

  const sessionId = createSessionToken(sessionPayload);
  activeSessions.set(sessionId, sessionPayload);

  // Update last login in db safely
  try {
    admin.lastLogin = new Date().toISOString();
    await db.saveContent(content);
  } catch (err) {
    console.warn('[DB Warning] Could not persist lastLogin on read-only system:', err.message);
  }

  return {
    success: true,
    sessionId,
    csrfToken,
    expiresAt,
    isDefaultCredentials: admin.isDefaultCredentials,
    username: admin.username
  };
}

/**
 * Logout session
 */
function logout(sessionId) {
  if (sessionId) {
    revokedTokens.add(sessionId);
    activeSessions.delete(sessionId);
    return true;
  }
  return false;
}

/**
 * Invalidate all sessions (for password changes)
 */
function invalidateAllSessions() {
  activeSessions.clear();
}

/**
 * Express Middleware: Validate Admin Session
 */
function requireAdmin(req, res, next) {
  const sessionId = req.cookies && req.cookies.admin_session;
  if (!sessionId || revokedTokens.has(sessionId)) {
    return res.status(401).json({ error: 'Unauthorized: No active admin session found.' });
  }

  // 1. Check in-memory session (fast path)
  let session = activeSessions.get(sessionId);

  // 2. Stateless cryptographic token verification (for serverless instances)
  if (!session) {
    session = verifySessionToken(sessionId);
    if (session) {
      activeSessions.set(sessionId, session);
    }
  }

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized: Session invalid or expired.' });
  }

  if (session.expiresAt < Date.now()) {
    activeSessions.delete(sessionId);
    return res.status(401).json({ error: 'Unauthorized: Session has expired. Please log in again.' });
  }

  // Validate admin still exists and token version matches
  try {
    const content = db.readContent();
    if (content.admin.username !== session.username) {
      activeSessions.delete(sessionId);
      return res.status(401).json({ error: 'Unauthorized: User account changed.' });
    }
    if (content.admin.tokenVersion && session.v && content.admin.tokenVersion !== session.v) {
      activeSessions.delete(sessionId);
      return res.status(401).json({ error: 'Unauthorized: Password was changed. Please log in again.' });
    }
  } catch (e) {
    // If db read has warning, continue with cryptographically verified token
  }

  req.adminSession = session;
  req.adminSessionId = sessionId;

  // CSRF verification for state-changing requests (POST, PUT, DELETE, PATCH)
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const submittedCsrf = req.headers['x-csrf-token'] || (req.body && req.body._csrf);
    if (!submittedCsrf || submittedCsrf !== session.csrfToken) {
      return res.status(403).json({ error: 'CSRF token validation failed. Request rejected.' });
    }
  }

  next();
}

/**
 * Change admin credentials
 */
async function changeCredentials(currentPassword, newUsername, newPassword) {
  const content = db.readContent();
  const admin = content.admin;

  const match = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!match) {
    throw new Error('Current password does not match.');
  }

  if (newPassword && newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters long.');
  }

  if (newUsername && newUsername.trim().length < 3) {
    throw new Error('Username must be at least 3 characters long.');
  }

  if (newUsername) {
    admin.username = newUsername.trim();
  }

  if (newPassword) {
    const hash = await bcrypt.hash(newPassword, 12);
    admin.passwordHash = hash;
  }

  admin.isDefaultCredentials = false;
  admin.tokenVersion = (admin.tokenVersion || 1) + 1;
  await db.saveContent(content);

  // Invalidate all existing sessions for security
  invalidateAllSessions();

  return { username: admin.username };
}

module.exports = {
  login,
  logout,
  invalidateAllSessions,
  requireAdmin,
  changeCredentials,
  getClientIdentifier,
  isLockedOut
};
