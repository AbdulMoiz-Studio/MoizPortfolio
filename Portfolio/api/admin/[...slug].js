/**
 * Vercel Serverless Function: /api/admin/* (catch-all route)
 * Routes all admin dashboard API calls (login, me, content, projects, media, inbox) to Express
 */

const app = require('../../server/index');

function normalizeAdminUrl(req) {
  if (req.headers && req.headers['x-matched-path'] && req.headers['x-matched-path'].startsWith('/api/admin/')) {
    try {
      const parsed = new URL(req.url, 'http://localhost');
      req.url = req.headers['x-matched-path'] + (parsed.search || '');
      return;
    } catch (e) {
      req.url = req.headers['x-matched-path'];
      return;
    }
  }

  if (req.url && req.url.startsWith('/api/admin/') && !req.url.includes('[...slug]')) {
    return;
  }

  const slug = (req.query && (req.query.slug || req.query.match || req.query.action)) || '';
  const subPath = Array.isArray(slug) ? slug.join('/') : String(slug);

  if (subPath) {
    try {
      const parsed = new URL(req.url, 'http://localhost');
      parsed.pathname = '/api/admin/' + subPath;
      parsed.searchParams.delete('slug');
      parsed.searchParams.delete('match');
      parsed.searchParams.delete('action');
      const qs = parsed.searchParams.toString();
      req.url = parsed.pathname + (qs ? '?' + qs : '');
    } catch (e) {
      req.url = '/api/admin/' + subPath;
    }
  } else {
    req.url = '/api/admin';
  }
}

module.exports = (req, res) => {
  normalizeAdminUrl(req);
  return app(req, res);
};
