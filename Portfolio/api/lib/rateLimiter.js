/**
 * In-Memory IP Rate Limiter
 * Limits submissions to max 3 per 10 minutes per IP.
 */

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 3;

// Map: IP => array of timestamp numbers
const ipSubmissions = new Map();

/**
 * Clean up timestamps older than the window
 */
function cleanup() {
  const now = Date.now();
  for (const [ip, timestamps] of ipSubmissions.entries()) {
    const valid = timestamps.filter(t => now - t < WINDOW_MS);
    if (valid.length === 0) {
      ipSubmissions.delete(ip);
    } else {
      ipSubmissions.set(ip, valid);
    }
  }
}

// Periodically run cleanup every 5 minutes (unref so process can exit cleanly)
const timer = setInterval(cleanup, 5 * 60 * 1000);
if (timer.unref) timer.unref();

/**
 * Check if the given IP is allowed to submit
 * @param {string} ip
 * @returns {{ allowed: boolean, remaining: number, resetInSeconds: number }}
 */
function checkRateLimit(ip = '127.0.0.1') {
  const now = Date.now();
  const timestamps = (ipSubmissions.get(ip) || []).filter(t => now - t < WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS) {
    const oldest = timestamps[0];
    const resetInSeconds = Math.ceil((oldest + WINDOW_MS - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.max(resetInSeconds, 1)
    };
  }

  timestamps.push(now);
  ipSubmissions.set(ip, timestamps);

  return {
    allowed: true,
    remaining: MAX_REQUESTS - timestamps.length,
    resetInSeconds: Math.ceil(WINDOW_MS / 1000)
  };
}

function resetRateLimiter() {
  ipSubmissions.clear();
}

module.exports = {
  checkRateLimit,
  resetRateLimiter
};
