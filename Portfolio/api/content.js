/**
 * Vercel Serverless Function: GET /api/content (and GET/PUT /api/admin/content)
 * Returns public portfolio data, or full authenticated admin content if called from CMS
 */
const app = require('../server/index');

module.exports = (req, res) => {
  if (req.method !== 'GET' || req.headers['x-csrf-token'] || req.url.includes('admin')) {
    req.url = '/api/admin/content';
  } else {
    req.url = '/api/content';
  }
  return app(req, res);
};
