/**
 * Vercel Serverless Function: GET /api/export
 */
const app = require('../server/index');

module.exports = (req, res) => {
  req.url = '/api/admin/export';
  return app(req, res);
};
