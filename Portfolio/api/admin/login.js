/**
 * Vercel Serverless Function: POST /api/admin/login
 */
const app = require('../../server/index');

module.exports = (req, res) => {
  req.url = '/api/admin/login';
  return app(req, res);
};
