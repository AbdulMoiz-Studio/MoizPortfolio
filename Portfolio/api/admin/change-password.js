/**
 * Vercel Serverless Function: POST /api/admin/change-password
 */
const app = require('../../server/index');

module.exports = (req, res) => {
  return app(req, res);
};
