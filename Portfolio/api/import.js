/**
 * Vercel Serverless Function: POST /api/import
 */
const app = require('../server/index');

module.exports = (req, res) => {
  req.url = '/api/admin/import';
  return app(req, res);
};
