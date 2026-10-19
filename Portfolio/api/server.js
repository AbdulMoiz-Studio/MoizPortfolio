/**
 * Vercel Serverless Function Entrypoint: /api/server
 * Connects Vercel Serverless requests to the Express application
 */

const app = require('../server/index');

module.exports = (req, res) => {
  // Normalize matched path if provided by Vercel header or query param
  if (req.headers && req.headers['x-matched-path'] && req.headers['x-matched-path'].startsWith('/api/admin/')) {
    try {
      const parsed = new URL(req.url, 'http://localhost');
      req.url = req.headers['x-matched-path'] + (parsed.search || '');
    } catch (e) {
      req.url = req.headers['x-matched-path'];
    }
  } else if (!req.url.startsWith('/api/admin/')) {
    const match = (req.query && (req.query.match || req.query.action || req.query.slug)) || '';
    if (match) {
      try {
        const parsed = new URL(req.url, 'http://localhost');
        parsed.pathname = '/api/admin/' + match;
        parsed.searchParams.delete('match');
        parsed.searchParams.delete('action');
        parsed.searchParams.delete('slug');
        const qs = parsed.searchParams.toString();
        req.url = parsed.pathname + (qs ? '?' + qs : '');
      } catch (e) {
        req.url = '/api/admin/' + match;
      }
    }
  }
  return app(req, res);
};
