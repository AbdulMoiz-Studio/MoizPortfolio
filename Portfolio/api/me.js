/**
 * Vercel Serverless Function: GET /api/me (and /api/admin/me)
 */
const app = require('../server/index');

module.exports = (req, res) => {
  req.url = '/api/admin/me';
  return app(req, res);
};
