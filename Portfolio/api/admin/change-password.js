/**
 * Vercel Serverless Function: POST /api/admin/change-password
 */
const app = require('../../server/index');

module.exports = (req, res) => {
  req.url = '/api/admin/change-password';
  return app(req, res);
};
